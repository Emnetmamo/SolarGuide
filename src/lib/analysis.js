import { adjustedExpected, calibration, diagnose, forecast7, gapPct, riskIndicator, rollingAvg, statusFor } from "./solar";

/** One place where a project's readings become the numbers the screens show. */
export function analyse(project, design, readings) {
  const baseline = project?.baseline_kwh || design?.expected_daily_kwh || 0;
  const pr = design?.performance_ratio ?? 0.75;
  const rows = (readings ?? []).map((r) => ({
    date: r.date,
    actual: r.energy_kwh ?? null,
    expected: adjustedExpected(baseline, r.irradiance ?? null),
    irradiance: r.irradiance ?? null,
  }));
  const avg = rollingAvg(rows.map((r) => r.actual));
  const chart = rows.map((r, i) => ({ ...r, avg7: avg[i] }));

  const recent = rows.filter((r) => r.actual != null).slice(-14);
  const expSum = recent.reduce((s, r) => s + r.expected, 0);
  const actSum = recent.reduce((s, r) => s + r.actual, 0);
  const gap = recent.length >= 5 ? gapPct(expSum, actSum) : null;

  const findings = diagnose(rows);
  let status = statusFor(gap);
  if (findings.some((f) => f.type === "outage") && status !== "check") status = "check";

  const missing = rows.filter((r) => r.actual == null).length;
  const anomalies = rows.filter((r) => r.actual != null && r.expected > 0 && r.actual < 0.6 * r.expected).length;
  const last = rows.length ? rows[rows.length - 1] : null;

  return {
    rows,
    chart,
    baseline,
    pr,
    gap,
    status,
    findings,
    missing,
    days: rows.length,
    validDays: recent.length,
    comparisonFrom: recent.length ? recent[0].date : null,
    comparisonTo: recent.length ? recent[recent.length - 1].date : null,
    expectedSum: Math.round(expSum * 10) / 10,
    actualSum: Math.round(actSum * 10) / 10,
    lastReading: [...rows].reverse().find((r) => r.actual != null) ?? null,
    forecast: last ? forecast7(rows.map((r) => r.actual), baseline, last.date) : [],
    calibration: calibration(rows),
    risk: riskIndicator(gap, anomalies, rows.length),
    anomalies,
  };
}

/** Dashboard cards: real projects (from the database) plus the generated demo projects. */
export function buildCards(projects, designs, readings, demos) {
  const designFor = (id) => (designs ?? []).find((d) => d.project_id === id) ?? null;
  const readingsFor = (id) => (readings ?? []).filter((r) => r.project_id === id);
  return (projects ?? []).map((p) => ({ project: p, design: designFor(p.id), a: analyse(p, designFor(p.id), readingsFor(p.id)), isDemo: false }))
    .concat((demos ?? []).map((b) => ({ project: b.project, design: b.design, a: analyse(b.project, b.design, b.readings), isDemo: true })));
}