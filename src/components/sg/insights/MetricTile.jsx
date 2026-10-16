import { cn } from "@/lib/utils";

const TONE = { none: "bg-border", ok: "bg-ok", warn: "bg-warn", bad: "bg-bad", sun: "bg-sun" };

/** One headline number in a predictive module, with a colour-coded underline. */
export function MetricTile({ label, value, unit, tone = "none", hint }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-bold text-primary">
        {value}
        {unit && <span className="ml-1 text-sm font-semibold text-muted-foreground">{unit}</span>}
      </p>
      <span className={cn("mt-1.5 block h-1 w-10 rounded-full", TONE[tone] ?? TONE.none)} aria-hidden />
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}