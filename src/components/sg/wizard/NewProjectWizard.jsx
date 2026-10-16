import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { PageTitle } from "@/components/sg/shell";
import { WizardLayout, WizardStep, initialWizardState, STEP_LABELS } from "@/components/sg/wizard/wizard-shared";
import { createProject } from "@/lib/server-fns";
import { PRE_CHECKLIST } from "@/lib/demo";
import { dailyLoadKwh, expectedRanges, FALLBACK_PSH, recommendKwp, round } from "@/lib/solar";

function buildEstimate(form) {
  const monthly = form.resource?.monthly ?? FALLBACK_PSH;
  const load = form.load_override !== "" ? Number(form.load_override) || 0 : dailyLoadKwh(form.appliances);
  const ranges = expectedRanges(form.pv_kwp, monthly, form.performance_ratio, form.shade_level);
  const pshAnnual = monthly.reduce((a, b) => a + b, 0) / monthly.length;
  return { load, monthly, ranges, pshAnnual, recommended: recommendKwp(load, pshAnnual, form.performance_ratio) };
}

export function NewProjectWizard() {
  const navigate = useNavigate();
  const create = useServerFn(createProject);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ ...initialWizardState, checklist: PRE_CHECKLIST.map((label) => ({ label, status: "unchecked", notes: "" })) });

  const estimate = useMemo(() => buildEstimate(form), [form]);

  const canNext = step !== 0 || form.name.trim().length > 1;

  async function finish() {
    setSaving(true);
    setError("");
    try {
      const project = {
        name: form.name.trim(),
        region: form.region.trim(),
        roof_type: form.roof_type,
        client_label: form.client_label.trim(),
      };
      if (form.latitude != null && form.longitude != null) {
        project.latitude = form.latitude;
        project.longitude = form.longitude;
      }

      const assumptions = [
        `Estimated from ${form.appliances.length} appliance group(s) and a ${form.performance_ratio} performance ratio.`,
        `Shade adjustment: ${form.shade_level}.`,
        form.latitude != null ? "Location-specific monthly sunlight averages were used." : "No location captured — a built-in regional average was used.",
        "Rough planning estimate only: final sizing, cabling, protection and earthing must be confirmed by a qualified installer.",
      ].join(" ");

      const design = {
        tilt: form.tilt,
        azimuth: form.azimuth,
        shade_level: form.shade_level,
        appliances: form.appliances,
        estimated_daily_load_kwh: round(estimate.load, 2),
        pv_kwp: form.pv_kwp,
        performance_ratio: form.performance_ratio,
        expected_daily_kwh: estimate.ranges.daily,
        expected_daily_min: estimate.ranges.daily_min,
        expected_daily_max: estimate.ranges.daily_max,
        expected_monthly_min: estimate.ranges.monthly_min,
        expected_monthly_max: estimate.ranges.monthly_max,
        resource_source: form.resource?.source ?? "Built-in fallback table (no lookup run)",
        resource_timestamp: form.resource?.timestamp ?? "",
        resource_monthly: estimate.monthly,
        assumptions,
      };

      const res = await create({ data: { project, design, checklist: form.checklist } });
      toast.success("Project saved");
      navigate({ to: "/projects/$projectId", params: { projectId: res.id } });
    } catch {
      setError("The project could not be saved just now. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageTitle eyebrow="New project" title="Plan a system">
        Six short steps: site, roof, shade, appliances, system estimate, checklist. You can stop at any step and come back — nothing is saved until the
        final step.
      </PageTitle>

      <WizardLayout
        step={step}
        form={form}
        setForm={setForm}
        estimate={estimate}
        canNext={canNext}
        saving={saving}
        error={error}
        onBack={() => setStep((s) => Math.max(0, s - 1))}
        onNext={() => setStep((s) => Math.min(STEP_LABELS.length - 1, s + 1))}
        onFinish={finish}
      >
        <WizardStep step={step} form={form} setForm={setForm} estimate={estimate} />
      </WizardLayout>
    </div>
  );
}