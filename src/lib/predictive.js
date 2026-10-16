// Predictive layer for the post-installation phase: current health, failure risk and a learned
// power model. Pure functions — the server computes the real fleet with them and the browser
// reuses the exact same maths for the synthetic demo fleet, so both always agree.
import { ACTION_SEVERITY, adjustedExpected, clamp, diagnose, riskIndicator, round } from "./solar";

export const PREDICTIVE_VERSION = "fleet-model v0.1 (prototype)";
export const HEALTH_WINDOW = 30; // days a site's current health is scored over
export const MIN_SCORED_DAYS = 5; // fewer days than this and a site is not scored at all
export const ANOMALY_RATIO = 0.6; // a day this far below expectation counts as an anomaly
export const HIGH_RISK = 60; // risk index at or above this is shown as high risk
const MIN_TRAINING_ROWS = 12; // a fit below this many days is never shown

const mean = (values) => values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);

/** One site's current numbers, from its own daily readings. Never invents a value it cannot support. */
export function siteHealth(project, design, readings, isDemo = false) {
  const baseline = project?.baseline_kwh || design?.expected_daily_kwh || 0;
  const rows = (readings ?? [])
    .filter((r) => r.energy_kwh != null)
    .map((r) => ({ date: r.date, actual: r.energy_kwh, expected: adjustedExpected(baseline, r.irradiance ?? null) }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const window = rows.slice(-HEALTH_WINDOW);
  const expectedSum = window.reduce((s, r) => s + r.expected, 0);
  const actualSum = window.reduce((s, r) => s + r.actual, 0);
  const ratio = expectedSum > 0 ? actualSum / expectedSum : null;
  const scored = window.length >= MIN_SCORED_DAYS && baseline > 0 && ratio != null;

  const anomalies = window.filter((r) => r.expected > 0 && r.actual < ANOMALY_RATIO * r.expected).length;
  const outages = window.filter((r) => r.expected > 0 && r.actual < 0.1 * r.expected).length;
  const gap = scored ? round((1 - ratio) * 100, 1) : null;
  const health = scored ? Math.round(clamp(ratio * 100, 0, 100)) : null;
  const risk = scored ? riskIndicator(gap, anomalies, window.length) : null;

  // Reuse the app's own rule-based detector: it already turns a reading history into a possible cause.
  const finding = diagnose(rows)[0] ?? null;
  const action = finding?.action ?? (scored && ratio < 0.8 ? "Schedule maintenance" : "Monitor");

  return {
    id: project.id,
    name: project.name,
    region: project.region ?? "",
    isDemo,
    kwp: design?.pv_kwp ?? null,
    baseline: round(baseline, 2),
    days: window.length,
    totalDays: rows.length,
    lastDate: rows.length ? rows[rows.length - 1].date : null,
    health,
    gap,
    risk,
    anomalies,
    outages,
    actualSum: round(actualSum, 1),
    expectedSum: round(expectedSum, 1),
    action,
    severity: ACTION_SEVERITY[action] ?? "info",
    findingTitle: finding?.title ?? null,
    evidence: finding?.evidence ?? null,
    confirm: finding?.confirm ?? null,
  };
}

function trainSamples(readings, baseline) {
  return (readings ?? [])
    .filter((r) => r.energy_kwh != null && r.irradiance != null)
    .map((r) => ({ baseline, irradiance: r.irradiance, temp: r.temp ?? null, y: r.energy_kwh }));
}

/** Gaussian elimination with partial pivoting. Returns null when the system has no unique solution. */
function solve(matrix, vector) {
  const n = vector.length;
  const a = matrix.map((row, i) => [...row, vector[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
    if (Math.abs(a[pivot][col]) < 1e-9) return null;
    [a[col], a[pivot]] = [a[pivot], a[col]];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = a[r][col] / a[col][col];
      for (let c = col; c <= n; c++) a[r][c] -= f * a[col][c];
    }
  }
  // After full elimination each row holds x_i = a[i][n] / a[i][i].
  return a.map((row, i) => row[n] / row[i]);
}

/** Rounded share of the predictive weight each input carries, always summing to 100. */
function featureShares(inputs, beta, sd, total) {
  const raw = inputs.map((_f, j) => ((Math.abs(beta[j + 1]) * sd(j + 1)) / total) * 100);
  const shares = raw.map((v) => Math.round(v));
  const drift = 100 - shares.reduce((a, b) => a + b, 0);
  if (drift !== 0 && shares.length) shares[raw.indexOf(Math.max(...raw))] += drift;
  return inputs.map((f, j) => ({ name: f.name, value: shares[j] }));
}

/**
 * Least-squares fit of daily energy against site size, irradiance and temperature.
 * A fit is only reported when it has enough days and a physically sensible sunlight response.
 */
export function powerModel(samples, opts = {}) {
  const rows = (samples ?? []).filter((s) => s.y != null && s.irradiance != null);
  const base = { ok: false, n: rows.length, need: MIN_TRAINING_ROWS, includesDemo: !!opts.includesDemo, points: [], features: [] };
  if (rows.length < MIN_TRAINING_ROWS) return { ...base, reason: "not-enough-records" };

  // Only inputs that actually vary are used: a single site has one fixed size, which would make the
  // fit singular, and sunlight has to vary for a model to mean anything at all.
  const spread = (get) => {
    const col = rows.map(get);
    const m = mean(col);
    return Math.sqrt(mean(col.map((v) => (v - m) ** 2)));
  };
  const corr = (a, b) => {
    const ma = mean(a);
    const mb = mean(b);
    const da = Math.sqrt(mean(a.map((v) => (v - ma) ** 2)));
    const db = Math.sqrt(mean(b.map((v) => (v - mb) ** 2)));
    if (da < 1e-9 || db < 1e-9) return 0;
    return mean(a.map((v, i) => (v - ma) * (b[i] - mb))) / (da * db);
  };
  if (spread((s) => s.irradiance) < 1e-6) return { ...base, reason: "no-signal" };

  const inputs = [{ name: "Sunlight", get: (s) => s.irradiance, sun: true }];
  if (spread((s) => s.baseline ?? 0) > 1e-6) inputs.unshift({ name: "Site size", get: (s) => s.baseline ?? 0 });
  // Temperature is only kept when it carries information sunlight does not: the two are often
  // strongly correlated (cloudy days are dimmer and cooler alike), which would destabilise the fit.
  const temps = rows.map((s) => s.temp ?? 0);
  if (spread((s) => s.temp ?? 0) > 1e-6 && Math.abs(corr(rows.map((s) => s.irradiance), temps)) < 0.9) {
    inputs.push({ name: "Temperature", get: (s) => s.temp ?? 0 });
  }
  const sunAt = inputs.findIndex((f) => f.sun) + 1;

  const X = rows.map((s) => [1, ...inputs.map((f) => f.get(s))]);
  const y = rows.map((s) => s.y);
  const k = inputs.length + 1;
  const xtx = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => X.reduce((s, row) => s + row[i] * row[j], 0)));
  const xty = Array.from({ length: k }, (_, i) => X.reduce((s, row, r) => s + row[i] * y[r], 0));
  const beta = solve(xtx, xty);
  // The sunlight response must be positive: below zero means the data does not support a model yet.
  if (!beta || !(beta[sunAt] > 1e-6)) return { ...base, reason: "no-signal" };

  const predicted = X.map((row) => row.reduce((s, v, i) => s + v * beta[i], 0));
  const yMean = mean(y);
  const ssTot = y.reduce((s, v) => s + (v - yMean) ** 2, 0);
  const ssRes = y.reduce((s, v, i) => s + (v - predicted[i]) ** 2, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  const mae = mean(y.map((v, i) => Math.abs(v - predicted[i])));

  const sd = (j) => {
    const col = X.map((row) => row[j]);
    const m = mean(col);
    return Math.sqrt(mean(col.map((v) => (v - m) ** 2)));
  };
  const total = inputs.reduce((a, _f, j) => a + Math.abs(beta[j + 1]) * sd(j + 1), 0) || 1;

  return {
    ok: true,
    n: rows.length,
    r2: round(r2, 3),
    mae: round(mae, 2),
    includesDemo: !!opts.includesDemo,
    features: featureShares(inputs, beta, sd, total),
    points: rows.map((s, i) => ({ actual: round(s.y, 2), predicted: round(predicted[i], 2) })).slice(-300),
  };
}

/** Every fleet figure the overview module shows, from the per-site numbers. */
export function overviewOf(sites) {
  const scored = sites.filter((s) => s.health != null);
  const days = scored.reduce((s, x) => s + x.days, 0);
  const energy = sites.reduce((s, x) => s + x.actualSum, 0);
  return {
    sites: sites.length,
    demoCount: sites.filter((s) => s.isDemo).length,
    scored: scored.length,
    days,
    health: days ? Math.round(scored.reduce((s, x) => s + x.health * x.days, 0) / days) : null,
    anomalies: sites.reduce((s, x) => s + x.anomalies, 0),
    highRisk: sites.filter((s) => s.risk != null && s.risk >= HIGH_RISK).length,
    lowest: scored.length ? Math.min(...scored.map((s) => s.health)) : null,
    below80: scored.filter((s) => s.health < 80).length,
    below60: scored.filter((s) => s.health < 60).length,
    energyKwh: Math.round(energy),
    avgDaily: days ? round(energy / days, 1) : null,
  };
}

/** The real fleet: server-side over the account's own projects. */
export function buildFleet(bundles) {
  const sites = [];
  const samples = [];
  for (const b of bundles ?? []) {
    const site = siteHealth(b.project, b.design, b.readings, !!b.isDemo);
    sites.push(site);
    if (!b.isDemo) samples.push(...trainSamples(b.readings, site.baseline));
  }
  return { sites, overview: overviewOf(sites), model: powerModel(samples), version: PREDICTIVE_VERSION };
}

/** Adds the synthetic demo fleet, and only falls back to its records when real data cannot support a model. */
export function withDemoFleet(fleet, demoBundles) {
  if (!demoBundles?.length) return { ...fleet, demoCount: 0 };
  const demoSites = demoBundles.map((b) => siteHealth(b.project, b.design, b.readings, true));
  const sites = [...fleet.sites, ...demoSites];
  const model = fleet.model.ok
    ? fleet.model
    : powerModel(demoBundles.flatMap((b) => trainSamples(b.readings, b.project?.baseline_kwh || b.design?.expected_daily_kwh || 0)), { includesDemo: true });
  return { ...fleet, sites, demoCount: demoSites.length, overview: overviewOf(sites), model };
}