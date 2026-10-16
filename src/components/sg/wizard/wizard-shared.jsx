import { Suspense } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/sg/bits";
import { StepSite } from "@/components/sg/wizard/StepSite";
import { StepRoof } from "@/components/sg/wizard/StepRoof";
import { StepShade } from "@/components/sg/wizard/StepShade";
import { StepAppliances } from "@/components/sg/wizard/StepAppliances";
import { StepEstimate } from "@/components/sg/wizard/StepEstimate";
import { StepChecklist } from "@/components/sg/wizard/StepChecklist";

export const STEP_LABELS = ["Site", "Roof", "Shade", "Appliances", "Estimate", "Checklist"];

export const initialWizardState = {
  name: "",
  region: "",
  latitude: null,
  longitude: null,
  roof_type: "metal_sheet",
  client_label: "",
  tilt: null,
  azimuth: null,
  shade_level: "none",
  appliances: [
    { name: "LED lights", watts: 10, qty: 6, hours: 5 },
    { name: "Fridge", watts: 120, qty: 1, hours: 10 },
  ],
  load_override: "",
  pv_kwp: 3,
  performance_ratio: 0.75,
  resource: null,
  checklist: [],
};

export function WizardLayout({ step, form, setForm, estimate, onBack, onNext, onFinish, saving, error, children, canNext = true }) {
  const last = step === STEP_LABELS.length - 1;
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-muted-foreground">
          Step {step + 1} of {STEP_LABELS.length} · {STEP_LABELS[step]}
        </p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }} />
        </div>
      </div>

      {children}

      {error && <Callout tone="bad">{error}</Callout>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <Button variant="ghost" disabled={step === 0 || saving} onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {last ? (
          <Button disabled={saving} onClick={onFinish}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save project
          </Button>
        ) : (
          <Button disabled={!canNext} onClick={onNext}>
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function WizardStep({ step, form, setForm, estimate }) {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-muted" />}>
      {step === 0 && <StepSite form={form} setForm={setForm} />}
      {step === 1 && <StepRoof form={form} setForm={setForm} />}
      {step === 2 && <StepShade form={form} setForm={setForm} />}
      {step === 3 && <StepAppliances form={form} setForm={setForm} estimate={estimate} />}
      {step === 4 && <StepEstimate form={form} setForm={setForm} estimate={estimate} />}
      {step === 5 && <StepChecklist form={form} setForm={setForm} />}
    </Suspense>
  );
}