import { Input } from "@/components/ui/input";
import { Callout, Field } from "@/components/sg/bits";
import { cn } from "@/lib/utils";

function NotSure({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(value == null ? 0 : null)}
      aria-pressed={value == null}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        value == null ? "border-warn bg-warn-soft text-warn" : "border-border bg-card text-muted-foreground hover:bg-muted",
      )}
    >
      I'm not sure
    </button>
  );
}

export function StepRoof({ form, setForm }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tilt in degrees" htmlFor="wiz-tilt" hint="How far the panels lean up from flat. 0° is flat, 30° is a typical pitched roof.">
          <div className="flex items-center gap-2">
            <Input
              id="wiz-tilt"
              inputMode="numeric"
              disabled={form.tilt == null}
              value={form.tilt ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, tilt: e.target.value === "" ? 0 : Number(e.target.value) }))}
              placeholder="10"
            />
            <NotSure value={form.tilt} onChange={(v) => setForm((f) => ({ ...f, tilt: v }))} />
          </div>
        </Field>

        <Field label="Direction (azimuth)" htmlFor="wiz-az" hint="0° is north, 90° east, 180° south, 270° west. In the southern hemisphere, north-facing panels collect the most sun.">
          <div className="flex items-center gap-2">
            <Input
              id="wiz-az"
              inputMode="numeric"
              disabled={form.azimuth == null}
              value={form.azimuth ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, azimuth: e.target.value === "" ? 0 : Number(e.target.value) }))}
              placeholder="0"
            />
            <NotSure value={form.azimuth} onChange={(v) => setForm((f) => ({ ...f, azimuth: v }))} />
          </div>
        </Field>
      </div>

      <Callout tone="sun" title="How to measure this with your phone">
        <p>
          Tilt: a level or clinometer app, laid along the panel frame. Direction: a compass app — hold it away from metal sheets, which can pull the
          needle. If you would rather not guess, tap “I'm not sure” and we continue with a clearly labelled rough estimate instead of blocking you.
        </p>
      </Callout>

      <Callout tone="warn" title="Who confirms this">
        Final tilt, mounting and any roof work must be confirmed by a qualified installer. Nothing here replaces an on-site assessment.
      </Callout>
    </div>
  );
}