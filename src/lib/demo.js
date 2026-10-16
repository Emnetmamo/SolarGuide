// Deterministic synthetic demo data. Every record here is SYNTHETIC and stays on this device —
// demo projects are never written to the database and contain no real customer information.
import { expectedDailyKwh, FALLBACK_PSH, round } from "./solar";

export const PRE_CHECKLIST = [
  "Roof condition & strength",
  "Shade from trees, tanks, buildings",
  "Cable size suits current & length",
  "Earthing / grounding in place",
  "Inverter matches array voltage & power",
  "Protection: fuses, breakers, surge",
  "Mounting secure & corrosion-free",
  "Inverter ventilation",
  "Safe access for maintenance",
];

export const COMMISSIONING_FIELDS = [
  ["Installed PV capacity", "kWp"],
  ["Inverter model", ""],
  ["Key inverter settings", ""],
  ["String voltage (open circuit)", "V"],
  ["Installation date", "date"],
  ["Installer notes", ""],
];

export const SHADE_LABEL = { none: "No shade", some: "Some shade at times", heavy: "Heavy shade" };
export const ROOF_LABEL = {
  metal_sheet: "Metal sheet",
  tile: "Tile",
  concrete_flat: "Concrete / flat",
  other: "Other / not sure",
};

export const DEMO_END = "2026-10-14";
const DAYS = 60;

function dateAt(i) {
  const end = new Date(DEMO_END + "T00:00:00Z").getTime();
  return new Date(end - (DAYS - 1 - i) * 864e5).toISOString().slice(0, 10);
}

// Mulberry32 PRNG — deterministic, so every visitor sees the same demo scenarios.
function rng(seed) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function weatherSeries(seed = 42) {
  const r = rng(seed);
  return Array.from({ length: DAYS }, (_, i) => {
    const cloudy = r() < 0.15;
    const irradiance = round(cloudy ? 2 + r() * 1.5 : 4.6 + r() * 1.0, 2);
    const temp = round(cloudy ? 20 + r() * 2 : 23 + r() * 4, 1);
    return { date: dateAt(i), irradiance, temp };
  });
}

export function isDemoId(id) {
  return typeof id === "string" && id.startsWith("demo-");
}

function scenarioOf(id) {
  if (id === "demo-dust") return 1;
  if (id === "demo-outage") return 2;
  return 3;
}

export function demoReadings(project) {
  const r = rng(project.id.length * 97 + scenarioOf(project.id));
  const weather = weatherSeries(42);
  return weather.map((d, i) => {
    const expected = project.baseline_kwh * Math.min(1.3, d.irradiance / 5);
    let factor = 0.97 + (r() - 0.5) * 0.06;
    if (project.scenario === "dust") factor *= 1 - (0.3 * i) / DAYS; // gradual decline to ~70%
    if (project.scenario === "outage" && [38, 39, 40, 51].includes(i)) factor = r() * 0.03;
    if (project.scenario === "shortfall") factor *= 0.72;
    return {
      id: `${project.id}-r${i}`,
      project_id: project.id,
      date: d.date,
      // one missing day, so missing data is visible in the demo and never counted as zero
      energy_kwh: i === 22 && project.scenario !== "outage" ? null : round(expected * factor, 2),
      irradiance: d.irradiance,
      temp: d.temp,
      source: "demo",
      shared: false,
    };
  });
}

function applications(kwp) {
  return [
    { name: "LED lights", watts: 10, qty: 8, hours: 5 },
    { name: "Fridge", watts: 120, qty: 1, hours: 10 },
    { name: "TV", watts: 80, qty: 1, hours: 4 },
    { name: "Phone charging", watts: 10, qty: 4, hours: 3 },
    { name: "Water pump", watts: kwp > 3.5 ? 750 : 400, qty: 1, hours: 1 },
  ];
}

function demoDesign(p) {
  const monthly = FALLBACK_PSH;
  return {
    id: `design-${p.id}`,
    project_id: p.id,
    tilt: 10,
    azimuth: 0,
    shade_level: "none",
    appliances: applications(p.kwp),
    estimated_daily_load_kwh: p.baseline_kwh,
    pv_kwp: p.kwp,
    performance_ratio: 0.75,
    expected_daily_kwh: p.baseline_kwh,
    expected_daily_min: round(p.baseline_kwh * 0.85, 2),
    expected_daily_max: round(p.baseline_kwh * 1.12, 2),
    expected_monthly_min: round(p.baseline_kwh * 28, 0),
    expected_monthly_max: round(p.baseline_kwh * 33, 0),
    resource_source: "Synthetic demo resource table (Kigali-like, all values simulated)",
    resource_timestamp: "",
    resource_monthly: monthly,
    assumptions:
      "SYNTHETIC DEMO RECORD. System size, load and resource values are simulated for teaching and never describe a real customer.",
    correction_factor: null,
    correction_days: 0,
    monitoring_start: p.monitoring_start,
  };
}

function demoChecklist(p) {
  const pre = PRE_CHECKLIST.map((label, i) => ({
    id: `${p.id}-c${i}`,
    project_id: p.id,
    phase: "pre",
    order: i,
    label,
    status: "pass",
    notes: i === 3 ? "Measured 4 ohms to earth electrode." : "",
    not_measured: false,
    recorded_at: p.monitoring_start,
  }));
  const values = [String(p.kwp), "DemoInverter 3000", "Grid-tie, 230 V", "-", p.monitoring_start, "Synthetic demo record"];
  const comm = COMMISSIONING_FIELDS.map(([label, unit], i) => ({
    id: `${p.id}-m${i}`,
    project_id: p.id,
    phase: "commissioning",
    order: i,
    label,
    status: "unchecked",
    unit,
    value: values[i] === "-" ? "" : values[i],
    not_measured: values[i] === "-",
    notes: "",
    recorded_at: p.monitoring_start,
  }));
  return [...pre, ...comm];
}

function base(id, name, region, kwp, scenario, scenarioLabel, clientLabel) {
  const psh = 5;
  const baseline = expectedDailyKwh(kwp, psh, 0.75) ?? 0;
  return {
    id,
    name,
    region,
    roof_type: "metal_sheet",
    status: "monitoring",
    demo_flag: true,
    monitoring_start: dateAt(0),
    baseline_kwh: baseline,
    client_label: clientLabel,
    kwp,
    scenario,
    scenario_label: scenarioLabel,
    notes: "SYNTHETIC DEMO PROJECT — generated on the device, not a real installation.",
  };
}

export const DEMO_PROJECTS = [
  base("demo-dust", "Kimironko Home", "Kigali, Rwanda", 3, "dust", "Gradual dust-related decline", "Homeowner demo"),
  base("demo-outage", "Musanze Clinic", "Northern Province, Rwanda", 5, "outage", "Inverter outage days", "Small clinic demo"),
  base("demo-shortfall", "Huye School", "Southern Province, Rwanda", 4, "shortfall", "Shortfall from day one", "School demo"),
];

export function demoBundleFor(id) {
  const project = DEMO_PROJECTS.find((p) => p.id === id);
  if (!project) return null;
  return {
    project,
    design: demoDesign(project),
    checklist: demoChecklist(project),
    readings: demoReadings(project),
    findings: [],
    isDemo: true,
  };
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}