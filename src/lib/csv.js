// CSV reading: validation, templates and export. Pure — no browser APIs except downloadText.

export const ALLOWED_DAILY = ["date", "energy_kwh", "irradiance", "temperature", "notes"];

export const DAILY_TEMPLATE = [
  "date,energy_kwh,irradiance,temperature,notes",
  "2026-10-01,11.2,5.1,24,clear day",
  "2026-10-02,10.4,4.8,25,",
  "2026-10-03,6.1,3.2,23,cloudy",
].join("\n");

export const GENERATION_TEMPLATE = [
  "DATE_TIME,PLANT_ID,SOURCE_KEY,DC_POWER,AC_POWER,DAILY_YIELD,TOTAL_YIELD",
  "01-10-2026 00:15,1,1BY6WEcLGwk7PHq,0,0,0,6259559",
  "01-10-2026 06:15,1,1BY6WEcLGwk7PHq,1.42,1.38,0.35,6259560",
  "01-10-2026 12:15,1,1BY6WEcLGwk7PHq,7.86,7.6,4.31,6259564",
  "01-10-2026 18:15,1,1BY6WEcLGwk7PHq,0.4,0.38,11.2,6259571",
].join("\n");

export const WEATHER_TEMPLATE = [
  "DATE_TIME,PLANT_ID,AMBIENT_TEMPERATURE,MODULE_TEMPERATURE,IRRADIATION",
  "01-10-2026 00:15,1,22.4,20.1,0",
  "01-10-2026 12:15,1,27.9,41.2,0.72",
  "01-10-2026 18:15,1,25.1,29.4,0.11",
].join("\n");

export const UNITS_NOTE = {
  daily: "date = YYYY-MM-DD · energy_kwh = kWh produced that day · irradiance = kWh/m²/day · temperature = °C.",
  generation:
    "DATE_TIME = DD-MM-YYYY HH:MM (15-minute stamps) · DC_POWER / AC_POWER = instant power in kW · DAILY_YIELD = kWh so far that day · TOTAL_YIELD = kWh since commissioning.",
  weather: "DATE_TIME = DD-MM-YYYY HH:MM (15-minute stamps) · temperatures in °C · IRRADIATION = instant irradiance in kW/m².",
};

function splitLine(line) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') quoted = !quoted;
    else if (c === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim().replace(/^"|"$/g, ""));
}

function lines(text) {
  return String(text ?? "")
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim());
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Daily readings CSV — needs at least `date` and `energy_kwh`. */
export function parseDailyCsv(text) {
  const errors = [];
  const warnings = [];
  const rows = [];
  const all = lines(text);
  if (!all.length) return { rows, errors: ["The file is empty."], warnings, kind: "daily" };

  const header = splitLine(all[0]).map((h) => h.toLowerCase());
  const di = header.indexOf("date");
  const ei = header.indexOf("energy_kwh");
  if (di < 0 || ei < 0) return { rows, errors: ["Missing required columns: date, energy_kwh."], warnings, kind: "daily" };

  const unsupported = header.filter((h) => h && !ALLOWED_DAILY.includes(h));
  if (unsupported.length) warnings.push(`Column(s) ignored: ${unsupported.join(", ")}.`);

  const ii = header.indexOf("irradiance");
  const ti = header.indexOf("temperature");
  const seen = new Set();

  all.slice(1).forEach((line, idx) => {
    const n = idx + 2;
    const cells = splitLine(line);
    const date = cells[di] ?? "";
    if (!ISO_RE.test(date)) return errors.push(`Row ${n}: date "${date}" is not a real calendar date (use YYYY-MM-DD).`);
    if (Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return errors.push(`Row ${n}: date "${date}" does not exist.`);
    const raw = cells[ei];
    if (raw == null || raw === "") return errors.push(`Row ${n}: energy value is missing.`);
    const v = Number(raw);
    if (Number.isNaN(v)) return errors.push(`Row ${n}: energy "${raw}" is not a number.`);
    if (v < 0) return errors.push(`Row ${n}: negative energy (${v}) is impossible.`);
    if (seen.has(date)) return errors.push(`Row ${n}: duplicate date ${date}.`);
    if (v > 500) warnings.push(`Row ${n}: ${v} kWh is very high — check the units are kWh, not Wh.`);
    seen.add(date);
    const irr = ii >= 0 && cells[ii] !== "" ? Number(cells[ii]) : null;
    const tmp = ti >= 0 && cells[ti] !== "" ? Number(cells[ti]) : null;
    if (irr != null && (Number.isNaN(irr) || irr < 0)) return errors.push(`Row ${n}: irradiance "${cells[ii]}" is not a valid value.`);
    rows.push({ date, energy_kwh: v, irradiance: Number.isNaN(irr) ? null : irr, temp: Number.isNaN(tmp) ? null : tmp, source: "csv" });
  });

  rows.sort((a, b) => a.date.localeCompare(b.date));
  return { rows, errors, warnings, kind: "daily" };
}

function parseStamp(value) {
  const m = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})[ T](\d{1,2}):(\d{2})/.exec(String(value ?? "").trim());
  if (!m) return null;
  const [, d, mo, y, h, mi] = m;
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi)));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/**
 * Plant-generation CSV (15-minute stamps): joins nothing here, just aggregates per day.
 * Energy per day prefers DAILY_YIELD (already kWh); otherwise sums DC_POWER × 0.25 h.
 */
export function parseGenerationCsv(text) {
  const errors = [];
  const warnings = [];
  const all = lines(text);
  if (!all.length) return { rows: [], errors: ["The file is empty."], warnings, kind: "generation" };

  const header = splitLine(all[0]).map((h) => h.toUpperCase());
  const need = ["DATE_TIME"];
  const missing = need.filter((h) => !header.includes(h));
  if (missing.length) return { rows: [], errors: [`Missing required column(s): ${missing.join(", ")}.`], warnings, kind: "generation" };
  const yi = header.indexOf("DAILY_YIELD");
  const di = header.indexOf("DC_POWER");
  if (yi < 0 && di < 0) return { rows: [], errors: ["Need either DAILY_YIELD (kWh) or DC_POWER (kW) to work out daily energy."], warnings, kind: "generation" };
  const ti = header.indexOf("DATE_TIME");
  const pi = header.indexOf("PLANT_ID");

  const byDay = new Map();
  const seenStamps = new Set();
  all.slice(1).forEach((line, idx) => {
    const n = idx + 2;
    const cells = splitLine(line);
    const stamp = parseStamp(cells[ti]);
    if (!stamp) return errors.push(`Row ${n}: DATE_TIME "${cells[ti] ?? ""}" is not in DD-MM-YYYY HH:MM format.`);
    const date = stamp.toISOString().slice(0, 10);
    const stampKey = `${date}|${stamp.toISOString()}|${pi >= 0 ? cells[pi] : ""}`;
    if (seenStamps.has(stampKey)) warnings.push(`Row ${n}: duplicate timestamp ${cells[ti]} (${pi >= 0 ? `plant ${cells[pi]}` : "no plant id"}) — counted once.`);
    if (seenStamps.has(stampKey)) return;
    seenStamps.add(stampKey);

    const rawDc = di >= 0 ? Number(cells[di]) : null;
    const rawYield = yi >= 0 ? Number(cells[yi]) : null;
    if (rawDc != null && Number.isNaN(rawDc)) return errors.push(`Row ${n}: DC_POWER "${cells[di]}" is not a number.`);
    if (rawYield != null && Number.isNaN(rawYield)) return errors.push(`Row ${n}: DAILY_YIELD "${cells[yi]}" is not a number.`);
    if (rawDc != null && rawDc < 0) return errors.push(`Row ${n}: negative DC_POWER (${rawDc}) is impossible.`);

    const day = byDay.get(date) ?? { date, sumDc: 0, intervals: 0, maxYield: null, nightRows: 0 };
    if (rawDc != null) {
      if (rawDc <= 0.01) day.nightRows += 1;
      day.sumDc += rawDc;
      day.intervals += 1;
    }
    if (rawYield != null && rawYield >= 0) day.maxYield = Math.max(day.maxYield ?? 0, rawYield);
    byDay.set(date, day);
  });

  const rows = [...byDay.values()]
    .map((d) => {
      const energy = d.maxYield != null && d.maxYield > 0 ? d.maxYield : d.sumDc * 0.25;
      return {
        date: d.date,
        energy_kwh: Math.round(energy * 100) / 100,
        irradiance: null,
        temp: null,
        source: "csv",
        quality_flags: `15-min stamps: ${d.intervals} rows, ${d.nightRows} at night`,
      };
    })
    .filter((r) => {
      if (r.energy_kwh < 0) {
        errors.push(`${r.date}: aggregate energy came out negative — check the DC_POWER sign.`);
        return false;
      }
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  if (!rows.length && !errors.length) errors.push("No usable rows found — every row was skipped.");
  return { rows, errors, warnings, kind: "generation" };
}

/** Weather sensor CSV: daily insolation (mean kW/m² × 24) and mean ambient temperature. */
export function parseWeatherCsv(text) {
  const errors = [];
  const warnings = [];
  const all = lines(text);
  if (!all.length) return { byDate: {}, errors: ["The weather file is empty."], warnings };
  const header = splitLine(all[0]).map((h) => h.toUpperCase());
  const ti = header.indexOf("DATE_TIME");
  const ii = header.indexOf("IRRADIATION");
  const ai = header.indexOf("AMBIENT_TEMPERATURE");
  if (ti < 0 || (ii < 0 && ai < 0)) {
    return { byDate: {}, errors: ["Weather file needs DATE_TIME and at least IRRADIATION or AMBIENT_TEMPERATURE."], warnings };
  }
  const acc = new Map();
  all.slice(1).forEach((line, idx) => {
    const cells = splitLine(line);
    const stamp = parseStamp(cells[ti]);
    if (!stamp) return errors.push(`Row ${idx + 2}: DATE_TIME "${cells[ti] ?? ""}" is not in DD-MM-YYYY HH:MM format.`);
    const date = stamp.toISOString().slice(0, 10);
    const irr = ii >= 0 ? Number(cells[ii]) : NaN;
    const amb = ai >= 0 ? Number(cells[ai]) : NaN;
    if (ii >= 0 && Number.isNaN(irr)) return errors.push(`Row ${idx + 2}: IRRADIATION "${cells[ii]}" is not a number.`);
    if (ai >= 0 && Number.isNaN(amb)) return errors.push(`Row ${idx + 2}: AMBIENT_TEMPERATURE "${cells[ai]}" is not a number.`);
    const d = acc.get(date) ?? { n: 0, irr: 0, irrN: 0, amb: 0, ambN: 0 };
    d.n += 1;
    if (!Number.isNaN(irr)) {
      d.irr += irr;
      d.irrN += 1;
    }
    if (!Number.isNaN(amb)) {
      d.amb += amb;
      d.ambN += 1;
    }
    acc.set(date, d);
  });
  const byDate = {};
  acc.forEach((d, date) => {
    // mean irradiance over all stamps (night included) × 24 h = daily insolation in kWh/m²/day
    byDate[date] = {
      irradiance: d.irrN ? Math.round((d.irr / d.n) * 24 * 100) / 100 : null,
      temp: d.ambN ? Math.round((d.amb / d.ambN) * 10) / 10 : null,
    };
  });
  return { byDate, errors, warnings };
}

export function toCsv(rows) {
  if (!rows || !rows.length) return "";
  const keys = Object.keys(rows[0]);
  return [keys.join(","), ...rows.map((r) => keys.map((k) => (r[k] == null ? "" : String(r[k]).replace(/,/g, " "))).join(","))].join("\n");
}

export function downloadText(name, text, type = "text/csv") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}