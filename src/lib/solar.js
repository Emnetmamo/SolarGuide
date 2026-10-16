// Core SolarGuide calculations. Pure functions — also covered by src/test/solar.test.js.

export const DEFAULT_PR = 0.75;
export const MODEL_VERSION = "rules-v0.1 (prototype)";
export const VISION_VERSION = "vision-check v0.1 (prototype)";

export function round(n, d = 1) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

export function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

/** expected_daily_kWh = system_kWp × peak_sun_hours × performance_ratio */
export function expectedDailyKwh(kwp, psh, pr = DEFAULT_PR) {
  if (psh == null || Number.isNaN(psh)) return null;
  if (kwp < 0 || psh < 0 || pr < 0 || pr > 1) throw new Error("Inputs must be non-negative and PR between 0 and 1");
  return round(kwp * psh * pr, 2);
}

/** Percent below expected. Positive = shortfall. null when expected ≤ 0. */
export function gapPct(expected, actual) {
  if (!(expected > 0)) return null;
  return round(((expected - actual) / expected) * 100, 1);
}

export const DEFAULT_THRESHOLDS = { low: 10, check: 20 };

export function statusFor(gap, t = DEFAULT_THRESHOLDS) {
  if (gap == null) return "unknown";
  if (gap >= t.check) return "check";
  if (gap >= t.low) return "low";
  return "ok";
}

export const STATUS_LABEL = {
  ok: "Matches design",
  low: "A bit low",
  check: "Needs a check",
  unknown: "Not enough data",
};

export const STATUS_PLAIN = {
  ok: "Your system is producing about what we expected for this weather.",
  low: "Your system is producing a little less than expected. Keep an eye on it.",
  check: "Your system is producing clearly less than expected, or a drop repeated. Worth looking into safely.",
  unknown: "We need at least five days of readings before we can compare.",
};

/** watts × qty × hours ÷ 1000 */
export function applianceKwh(a) {
  return (a.watts * a.qty * a.hours) / 1000;
}

export function dailyLoadKwh(list) {
  return round((list ?? []).reduce((s, a) => s + applianceKwh(a), 0), 2);
}

/** kWp needed to cover a daily load. */
export function recommendKwp(loadKwh, psh, pr = DEFAULT_PR) {
  if (!(psh > 0) || !(pr > 0)) return 0;
  return Math.ceil((loadKwh / (psh * pr)) * 10) / 10;
}

/** Fallback monthly peak sun hours (approximate, equatorial highlands). Used when the resource API is unreachable. */
export const FALLBACK_PSH = [5.0, 5.1, 4.8, 4.4, 4.5, 4.9, 5.2, 5.3, 5.2, 4.9, 4.6, 4.8];

export const SHADE_FACTOR = { none: 1, some: 0.88, heavy: 0.7 };

export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Daily and monthly expected energy as a range, reflecting resource and system uncertainty. */
export function expectedRanges(kwp, monthlyPsh, pr = DEFAULT_PR, shade = "none") {
  const f = SHADE_FACTOR[shade] ?? 1;
  const daily = expectedDailyKwh(kwp, monthlyPsh?.[0] ?? 5, pr) ?? 0;
  const monthly = DAYS_IN_MONTH.map((days, i) => round(kwp * (monthlyPsh?.[i] ?? 5) * pr * f * days, 0));
  const usable = monthly.filter((m) => m > 0);
  return {
    daily: round(daily * f, 2),
    daily_min: round(daily * f * 0.85, 2),
    daily_max: round(daily * f * 1.12, 2),
    monthly,
    monthly_min: usable.length ? Math.min(...usable) : 0,
    monthly_max: usable.length ? Math.max(...usable) : 0,
    annual: round(monthly.reduce((a, b) => a + b, 0) * f, 0),
  };
}

export function rollingAvg(values, window = 7) {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1).filter((v) => v != null);
    return slice.length ? round(slice.reduce((a, b) => a + b, 0) / slice.length, 2) : null;
  });
}

/** Weather-adjusted expected: scale the baseline by the day's irradiance versus typical. */
export function adjustedExpected(baseline, irradiance, typicalIrr = 5) {
  if (irradiance == null || !(baseline > 0)) return baseline;
  return round(baseline * clamp(irradiance / typicalIrr, 0.2, 1.3), 2);
}

/** Correction factor from 7–28 valid days. Excludes outage (near-zero) days. */
export function calibration(rows) {
  const valid = rows.filter((r) => r.actual != null && r.expected > 0 && r.actual > 0.1 * r.expected).slice(-28);
  if (valid.length < 7) return { factor: null, days: valid.length };
  const f = valid.reduce((s, r) => s + r.actual, 0) / valid.reduce((s, r) => s + r.expected, 0);
  return { factor: round(f, 3), days: valid.length };
}

/** Rough 7-day baseline-trend forecast with an uncertainty band. Not a guarantee. */
export function forecast7(recent, baseline, startDate) {
  const vals = (recent ?? []).filter((v) => v != null).slice(-14);
  const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : baseline;
  const sd = vals.length > 1 ? Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / (vals.length - 1)) : baseline * 0.2;
  const level = round(0.6 * mean + 0.4 * baseline, 1);
  const out = [];
  const d0 = new Date(startDate + "T00:00:00Z").getTime();
  for (let i = 1; i <= 7; i++) {
    out.push({
      date: new Date(d0 + i * 864e5).toISOString().slice(0, 10),
      mid: level,
      low: round(Math.max(0, level - sd), 1),
      high: round(level + sd, 1),
    });
  }
  return out;
}

export const ACTION_SEVERITY = {
  Monitor: "info",
  "Schedule maintenance": "watch",
  "Inspect soon": "attention",
  "Urgent qualified inspection": "attention",
};

/** Rule-based possible-cause detection. Hypotheses only — never a diagnosis. */
export function diagnose(rows) {
  const out = [];
  const valid = rows.filter((r) => r.actual != null && r.expected > 0);
  if (valid.length < 7) return out;

  const outages = valid.filter((r) => r.actual < 0.1 * r.expected);
  if (outages.length >= 1) {
    out.push({
      type: "outage",
      title: "Possible inverter outage",
      evidence: `${outages.length} day(s) with near-zero output while sunlight was expected (for example ${outages[0].date}).`,
      confirm: "Check the inverter display for an error code or a dark screen on those days — do not open the unit.",
      action: outages.length >= 3 ? "Urgent qualified inspection" : "Inspect soon",
    });
  }

  const clean = valid.filter((r) => r.actual >= 0.1 * r.expected);
  const ratio = clean.map((r) => r.actual / r.expected);
  if (ratio.length >= 14) {
    const first = avg(ratio.slice(0, 7));
    const last = avg(ratio.slice(-7));
    if (first - last > 0.08) {
      out.push({
        type: "dust",
        title: "Gradual decline — may be related to dust or soiling",
        evidence: `Output fell from ${Math.round(first * 100)}% to ${Math.round(last * 100)}% of the weather-adjusted expectation across the period, without a matching weather change.`,
        confirm: "If output recovers after rain or safe cleaning, soiling was likely a factor.",
        action: "Schedule maintenance",
      });
    } else if (first < 0.82 && last < 0.82) {
      out.push({
        type: "install",
        title: "Consistently below design since the start",
        evidence: `Output has stayed around ${Math.round(avg(ratio) * 100)}% of expected from day one.`,
        confirm: "Ask your installer to re-check string voltages, shading and the original sizing assumptions.",
        action: "Inspect soon",
      });
    }
  }
  return out;
}

function avg(a) {
  return a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
}

/** Transparent bounded risk indicator (0–100). Not a validated failure probability. */
export function riskIndicator(gap, anomalyDays, totalDays) {
  const g = clamp(gap ?? 0, 0, 50) / 50;
  const a = totalDays ? Math.min(1, (anomalyDays / Math.max(1, totalDays)) * 5) : 0;
  return Math.round(100 * (0.7 * g + 0.3 * a));
}