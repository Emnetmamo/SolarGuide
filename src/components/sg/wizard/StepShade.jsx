import { Callout } from "@/components/sg/bits";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "none", label: "No shade", hint: "Clear view of the sun most of the day" },
  { value: "some", label: "Some shade", hint: "Trees or a wall shade the roof at some hours" },
  { value: "heavy", label: "Heavy shade", hint: "Shade for much of the day, or a small roof area" },
];

export function StepShade({ form, setForm }) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-semibold">How much of the day do the panels have clear sun?</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, shade_level: o.value }))}
              aria-pressed={form.shade_level === o.value}
              className={cn(
                "rounded-2xl border p-4 text-left transition",
                form.shade_level === o.value ? "border-primary bg-secondary" : "border-border bg-card hover:bg-muted",
              )}
            >
              <span className="block font-semibold">{o.label}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{o.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <Callout tone="warn" title="Shade is the most under-estimated problem">
        Trees, water tanks, nearby buildings and roof structures all reduce output — and shade on even one panel can pull down a whole string of panels.
        A photo can show where shade falls, but it cannot give a precise shade-loss percentage. We apply a labelled shade adjustment to the estimate and
        leave the final judgement to a site visit.
      </Callout>

      <Callout tone="info" title="What we apply">
        No shade keeps the estimate unchanged, "some" shade reduces the expected range by about 12%, and "heavy" shade by about 30%. This is a rough
        planning guide, not a measurement.
      </Callout>
    </div>
  );
}