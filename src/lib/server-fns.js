const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import { ACTION_SEVERITY, adjustedExpected, diagnose, gapPct, MODEL_VERSION, riskIndicator, round, statusFor, VISION_VERSION } from "@/lib/solar";
import { COMMISSIONING_FIELDS, PRE_CHECKLIST } from "@/lib/demo";
import { buildFleet } from "@/lib/predictive";
import { fetchSolarResource } from "@/lib/solar-resource.server";

const iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const short = (n) => z.string().max(n);
const newToken = () => crypto.randomUUID().replace(/-/g, "").slice(0, 24);

const ProjectFields = z.object({
  name: z.string().min(1).max(120),
  region: short(120).default(""),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  roof_type: z.enum(["metal_sheet", "tile", "concrete_flat", "other"]).default("metal_sheet"),
  client_label: short(120).default(""),
  monitoring_start: iso.optional(),
});

const DesignFields = z.object({
  tilt: z.number().min(0).max(90).nullable().optional(),
  azimuth: z.number().min(-180).max(180).nullable().optional(),
  shade_level: z.enum(["none", "some", "heavy"]).default("none"),
  appliances: z
    .array(z.object({ name: short(60), watts: z.number().min(0).max(20000), qty: z.number().min(0).max(100), hours: z.number().min(0).max(24) }))
    .max(30)
    .default([]),
  estimated_daily_load_kwh: z.number().min(0).max(100000),
  pv_kwp: z.number().min(0).max(10000),
  performance_ratio: z.number().min(0.3).max(1),
  expected_daily_kwh: z.number().min(0).max(100000),
  expected_daily_min: z.number().min(0).max(100000),
  expected_daily_max: z.number().min(0).max(100000),
  expected_monthly_min: z.number().min(0).max(1000000),
  expected_monthly_max: z.number().min(0).max(1000000),
  resource_source: short(300).default(""),
  resource_timestamp: short(60).default(""),
  resource_monthly: z.array(z.number().min(0).max(24)).max(12).default([]),
  assumptions: z.string().max(3000).default(""),
});

/* ---------------------------------- reads --------------------------------- */

export const listMyProjects = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const since = new Date(Date.now() - 45 * 864e5).toISOString().slice(0, 10);
    const [projects, designs, readings] = await Promise.all([
      db.entities.Project.filter({}, { sort: "-created_date", limit: 100 }),
      db.entities.Design.filter({}, { sort: "-created_date", limit: 100 }),
      db.entities.Reading.filter({ date: { $gte: since } }, { sort: "-date", limit: 900, fields: ["project_id", "date", "energy_kwh", "irradiance", "temp", "source"] }),
    ]);
    return { projects: projects.items ?? [], designs: designs.items ?? [], readings: readings.items ?? [] };
  });

export const getProjectBundle = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string().min(1).max(64) }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const project = await db.entities.Project.get(data.id).catch((error) => {
      if (error?.status === 404) return null;
      throw error;
    });
    if (!project) return null;
    const [designs, checklist, readings, findings] = await Promise.all([
      db.entities.Design.filter({ project_id: data.id }, { sort: "-created_date", limit: 1 }),
      db.entities.ChecklistItem.filter({ project_id: data.id }, { sort: "order", limit: 40 }),
      db.entities.Reading.filter({ project_id: data.id }, { sort: "date", limit: 500 }),
      db.entities.Finding.filter({ project_id: data.id }, { sort: "-created_date", limit: 20 }),
    ]);
    return {
      project,
      design: designs.items?.[0] ?? null,
      checklist: checklist.items ?? [],
      readings: readings.items ?? [],
      findings: findings.items ?? [],
      isDemo: false,
    };
  });

/** Post-installation predictive layer for every project this account can see. */
export const getFleetInsights = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const [projects, designs, readings] = await Promise.all([
      db.entities.Project.filter({}, { sort: "-created_date", limit: 100 }),
      db.entities.Design.filter({}, { sort: "-created_date", limit: 100 }),
      db.entities.Reading.filter({}, { sort: "-date", limit: 1000, fields: ["project_id", "date", "energy_kwh", "irradiance", "temp"] }),
    ]);
    const designList = designs.items ?? [];
    const readingList = readings.items ?? [];
    const bundles = (projects.items ?? []).map((project) => ({
      project,
      design: designList.find((d) => d.project_id === project.id) ?? null,
      readings: readingList.filter((r) => r.project_id === project.id),
    }));
    return buildFleet(bundles);
  });

/* --------------------------------- writes --------------------------------- */

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      project: ProjectFields,
      design: DesignFields,
      checklist: z
        .array(z.object({ label: z.string().min(1).max(120), status: z.enum(["pass", "attention", "unchecked"]).default("unchecked"), notes: z.string().max(2000).default("") }))
        .max(20)
        .default([]),
    }),
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const share_token = newToken();
    const project = await db.entities.Project.create({
      ...data.project,
      status: "planning",
      demo_flag: false,
      share_token,
      baseline_kwh: data.design.expected_daily_kwh,
      monitoring_start: data.project.monitoring_start ?? new Date().toISOString().slice(0, 10),
    });
    await db.entities.Design.create({ ...data.design, project_id: project.id, monitoring_start: project.monitoring_start });
    const provided = new Map(data.checklist.map((c) => [c.label, c]));
    const items = [
      ...PRE_CHECKLIST.map((label, order, i) => ({
        project_id: project.id,
        phase: "pre",
        order,
        label,
        status: provided.get(label)?.status ?? "unchecked",
        notes: provided.get(label)?.notes ?? "",
        recorded_at: provided.get(label) ? new Date().toISOString() : "",
        not_measured: i < 0,
      })),
      ...COMMISSIONING_FIELDS.map(([label, unit], order) => ({
        project_id: project.id,
        phase: "commissioning",
        order,
        label,
        unit,
        value: "",
        status: "unchecked",
        notes: "",
        not_measured: false,
      })),
    ];
    await db.entities.ChecklistItem.bulkCreate(items);
    return { id: project.id, share_token };
  });

export const updateProject = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      id: z.string().min(1).max(64),
      patch: z.object({
        name: short(120).optional(),
        region: short(120).optional(),
        client_label: short(120).optional(),
        notes: z.string().max(3000).optional(),
        status: z.enum(["planning", "installed", "monitoring"]).optional(),
        monitoring_start: iso.optional(),
        baseline_kwh: z.number().min(0).max(100000).optional(),
        share_token: z.string().min(8).max(64).optional(),
      }),
    }),
  )
  .handler(async ({ data, context }) =>
    context.getBase44().entities.Project.update(data.id, data.patch),
  );

export const rotateShareToken = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string().min(1).max(64) }))
  .handler(async ({ data, context }) => {
    const share_token = newToken();
    await context.getBase44().entities.Project.update(data.id, { share_token });
    return { share_token };
  });

export const saveChecklist = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      projectId: z.string().min(1).max(64),
      items: z
        .array(
          z.object({
            id: z.string().min(1).max(64),
            status: z.enum(["pass", "attention", "unchecked"]).optional(),
            notes: z.string().max(2000).optional(),
            value: short(200).optional(),
            not_measured: z.boolean().optional(),
            evidence_file_uri: z.string().max(500).optional(),
            recorded_at: short(40).optional(),
          }),
        )
        .max(40),
    }),
  )
  .handler(async ({ data, context }) => {
    const payload = data.items.map((item) => ({ ...item, recorded_by: context.user.email, recorded_at: item.recorded_at ?? new Date().toISOString() }));
    if (payload.length) await context.getBase44().entities.ChecklistItem.bulkUpdate(payload);
    return { saved: payload.length };
  });

export const addReadings = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      projectId: z.string().min(1).max(64),
      rows: z
        .array(
          z.object({
            date: iso,
            energy_kwh: z.number().min(0).max(100000),
            irradiance: z.number().min(0).max(40).nullable().optional(),
            temp: z.number().min(-60).max(80).nullable().optional(),
            source: z.enum(["manual", "csv", "demo"]).default("manual"),
            quality_flags: short(200).optional(),
          }),
        )
        .min(1)
        .max(1000),
    }),
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const existing = await db.entities.Reading.filter({ project_id: data.projectId }, { sort: "date", limit: 1500, fields: ["id", "date"] });
    const byDate = new Map((existing.items ?? []).map((r) => [r.date, r.id]));
    const creates = [];
    const updates = [];
    data.rows.forEach((row) => {
      const id = byDate.get(row.date);
      const record = { project_id: data.projectId, ...row };
      if (id) updates.push({ id, ...record, shared: false });
      else creates.push(record);
    });
    if (creates.length) await db.entities.Reading.bulkCreate(creates);
    if (updates.length) await db.entities.Reading.bulkUpdate(updates);
    return { created: creates.length, updated: updates.length };
  });

export const saveCalibration = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ projectId: z.string().min(1).max(64), factor: z.number().min(0.4).max(1.6), days: z.number().min(7).max(28) }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const designs = await db.entities.Design.filter({ project_id: data.projectId }, { sort: "-created_date", limit: 1 });
    const design = designs.items?.[0];
    if (!design) throw new Error("This project has no design record");
    const baseline = round((design.expected_daily_kwh ?? 0) * data.factor, 2);
    await db.entities.Design.update(design.id, { correction_factor: data.factor, correction_days: data.days });
    await db.entities.Project.update(data.projectId, { baseline_kwh: baseline });
    return { baseline };
  });

export const runDiagnostics = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ projectId: z.string().min(1).max(64) }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const project = await db.entities.Project.get(data.projectId).catch(() => null);
    if (!project) throw new Error("Project not found");
    const [designs, readings] = await Promise.all([
      db.entities.Design.filter({ project_id: data.projectId }, { sort: "-created_date", limit: 1 }),
      db.entities.Reading.filter({ project_id: data.projectId }, { sort: "date", limit: 500 }),
    ]);
    const design = designs.items?.[0] ?? null;
    const baseline = project.baseline_kwh || design?.expected_daily_kwh || 0;
    const rows = (readings.items ?? []).map((r) => ({
      date: r.date,
      actual: r.energy_kwh ?? null,
      expected: adjustedExpected(baseline, r.irradiance ?? null),
    }));
    const findings = diagnose(rows);
    const recent = rows.filter((r) => r.actual != null).slice(-14);
    const expSum = recent.reduce((s, r) => s + r.expected, 0);
    const actSum = recent.reduce((s, r) => s + r.actual, 0);
    const gap = recent.length >= 5 ? gapPct(expSum, actSum) : null;
    const anomalies = rows.filter((r) => r.actual != null && r.expected > 0 && r.actual < 0.6 * r.expected).length;
    const risk = riskIndicator(gap, anomalies, rows.length);

    if (findings.length) {
      await db.entities.Finding.bulkCreate(
        findings.map((f) => ({
          project_id: data.projectId,
          type: f.type,
          severity: ACTION_SEVERITY[f.action] ?? "info",
          title: f.title,
          observed_gap_pct: gap ?? 0,
          possible_causes: f.title,
          evidence_summary: f.evidence,
          recommended_action: f.action,
          confirm_hint: f.confirm,
          model_version: MODEL_VERSION,
          demo_flag: false,
        })),
      );
    }
    return { findings, gap, status: statusFor(gap), risk, anomalies, days: rows.length };
  });

export const getSolarResource = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .validator(z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) }))
  .handler(async ({ data }) => fetchSolarResource(data));

/* ------------------------- consent & open dataset ------------------------- */

export const getConsent = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const [records, shared] = await Promise.all([
      db.entities.ConsentRecord.filter({}, { sort: "-created_date", limit: 20 }),
      db.entities.Reading.filter({ shared: true }, { sort: "-date", limit: 1000, fields: ["project_id", "date", "energy_kwh", "irradiance"] }),
    ]);
    return { records: records.items ?? [], sharedReadings: shared.items ?? [] };
  });

export const saveConsent = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ granted: z.boolean(), version: z.string().min(1).max(20), scope: short(60).default("open_dataset") }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const now = new Date().toISOString();
    const record = await db.entities.ConsentRecord.create({
      granted: data.granted,
      version: data.version,
      scope: data.scope,
      granted_at: data.granted ? now : "",
      withdrawn_at: data.granted ? "" : now,
    });
    // Withdrawing consent stops future contributions immediately.
    if (!data.granted) await db.entities.Reading.updateMany({ shared: true }, { $set: { shared: false, consent_id: "" } });
    return record;
  });

export const setProjectSharing = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ projectId: z.string().min(1).max(64), shared: z.boolean(), consentId: short(64).optional() }))
  .handler(async ({ data, context }) => {
    await context
      .getBase44()
      .entities.Reading.updateMany({ project_id: data.projectId }, { $set: { shared: data.shared, consent_id: data.shared ? (data.consentId ?? "") : "" } });
    return { shared: data.shared };
  });

/** Anonymised rows for the shared dataset: pseudonymous project codes, coarse region, no identifiers. */
export const getSharedDataset = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const [records, projects, readings] = await Promise.all([
      db.entities.ConsentRecord.filter({}, { sort: "-created_date", limit: 1 }),
      db.entities.Project.filter({}, { sort: "created_date", limit: 100, fields: ["id", "region", "name", "baseline_kwh"] }),
      db.entities.Reading.filter({ shared: true }, { sort: "date", limit: 1000, fields: ["project_id", "date", "energy_kwh", "irradiance"] }),
    ]);
    const consent = records.items?.[0] ?? null;
    if (!consent?.granted) return { consent, rows: [], projectCount: 0 };
    const list = projects.items ?? [];
    const code = (id) => {
      const i = list.findIndex((p) => p.id === id);
      return `P${String(i + 1).padStart(3, "0")}`;
    };
    const rows = (readings.items ?? []).map((r) => {
      const p = list.find((x) => x.id === r.project_id);
      return {
        project_code: code(r.project_id),
        region: (p?.region ?? "").split(",").pop().trim(),
        baseline_kwh: p?.baseline_kwh ?? "",
        date: r.date,
        energy_kwh: r.energy_kwh,
        irradiance: r.irradiance ?? "",
      };
    });
    return { consent, rows, projectCount: new Set(rows.map((r) => r.project_code)).size };
  });

/** Every reading this account holds, for the "download a copy" promise. */
export const exportMyReadings = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const [projects, readings] = await Promise.all([
      db.entities.Project.filter({}, { sort: "created_date", limit: 100, fields: ["id", "name", "region"] }),
      db.entities.Reading.filter({}, { sort: "date", limit: 2000 }),
    ]);
    const list = projects.items ?? [];
    return (readings.items ?? []).map((r) => {
      const p = list.find((x) => x.id === r.project_id);
      return {
        project: p?.name ?? "",
        region: p?.region ?? "",
        date: r.date,
        energy_kwh: r.energy_kwh,
        irradiance: r.irradiance ?? "",
        temperature: r.temp ?? "",
        source: r.source ?? "",
        contributed: r.shared ? "yes" : "no",
      };
    });
  });

/* ------------------------------ photo check ------------------------------- */

const AREA_TEXT = {
  panel: "the solar panel surface",
  inverter: "the inverter or its display",
  shading: "shading near the panels",
  mounting: "the mounting frame and visible cabling",
};

export const runPhotoCheck = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ projectId: z.string().max(64).optional(), area: z.enum(["panel", "inverter", "shading", "mounting"]), file_uri: z.string().min(4).max(500) }))
  .handler(async ({ data, context }) => {
    const visitor = context.getBase44();
    const service = visitor.asServiceRole;
    const { signed_url } = await service.integrations.Core.CreateFileSignedUrl({ file_uri: data.file_uri, expires_in: 900 });

    const prompt = [
      "You are helping the owner of a small solar system look at a photo they took. You are NOT a certified inspector and you cannot diagnose faults.",
      `The photo is meant to show ${AREA_TEXT[data.area]}.`,
      "Write for someone with no electrical training. Use cautious wording: say 'possible observation' and 'may be related to'. Never state a cause as certain. Never tell the person to open equipment, touch wiring, climb on the roof or work on the array — route anything electrical to a qualified installer.",
      "Return exactly these four fields:",
      "observation: 1–2 short sentences on what is visibly present in the photo only.",
      "confidence: one of low, medium, high — low whenever the photo is unclear, distant or poorly lit.",
      "limits: 1–2 sentences on what this photo cannot show.",
      "next_step: one safe, concrete next step.",
    ].join("\n");

    const schema = {
      type: "object",
      properties: {
        observation: { type: "string" },
        confidence: { type: "string", enum: ["low", "medium", "high"] },
        limits: { type: "string" },
        next_step: { type: "string" },
      },
      required: ["observation", "confidence", "limits", "next_step"],
    };

    const result = await service.integrations.Core.InvokeLLM({ prompt, file_urls: [signed_url], response_json_schema: schema });
    const pick = (v, fallback) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 900) : fallback);
    const confidence = ["low", "medium", "high"].includes(result?.confidence) ? result.confidence : "low";

    return visitor.entities.PhotoCheck.create({
      project_id: data.projectId ?? "",
      area: data.area,
      file_uri: data.file_uri,
      observation: pick(result?.observation, "The check did not return a readable observation."),
      confidence,
      limits: pick(result?.limits, "This photo alone cannot confirm what is happening with the system."),
      next_step: pick(result?.next_step, "Compare with a photo from a different angle, and ask your installer if you are unsure."),
      model_version: VISION_VERSION,
      demo_flag: false,
    });
  });

/* ------------------------- public shared report --------------------------- */

export const getSharedReport = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string().regex(/^[a-z0-9]{8,64}$/i) }))
  .handler(async ({ data, context }) => {
    const service = context.getBase44().asServiceRole;
    const found = await service.entities.Project.filter({ share_token: data.token }, { limit: 1 });
    const project = found.items?.[0];
    if (!project) return null;
    const [designs, readings] = await Promise.all([
      service.entities.Design.filter({ project_id: project.id }, { sort: "-created_date", limit: 1 }),
      service.entities.Reading.filter({ project_id: project.id }, { sort: "date", limit: 500, fields: ["date", "energy_kwh", "irradiance"] }),
    ]);
    const design = designs.items?.[0] ?? null;
    // Deliberately narrow: no exact coordinates, no client name, no notes, no photos, no ids.
    return {
      project: {
        name: project.name,
        region: project.region,
        status: project.status,
        monitoring_start: project.monitoring_start,
        baseline_kwh: project.baseline_kwh,
        demo_flag: !!project.demo_flag,
      },
      design: design
        ? {
            pv_kwp: design.pv_kwp,
            performance_ratio: design.performance_ratio,
            expected_daily_kwh: design.expected_daily_kwh,
            expected_monthly_min: design.expected_monthly_min,
            expected_monthly_max: design.expected_monthly_max,
            resource_source: design.resource_source,
            resource_timestamp: design.resource_timestamp,
            assumptions: design.assumptions,
          }
        : null,
      readings: (readings.items ?? []).map((r) => ({ date: r.date, energy_kwh: r.energy_kwh, irradiance: r.irradiance })),
    };
  });