import { useState } from "react";
import { CalendarDays, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Callout, Stat } from "@/components/sg/bits";
import { fmtDate, fmtNum } from "@/lib/format";

/** Seven-day outlook and the calibration factor. Both labelled as estimates. */
export function ForecastPanel({ analysis, isDemo, onApplyCalibration, applying }) {
  const [message, setMessage] = useState("");
  const max = Math.max(1, ...analysis.forecast.map((f) => f.high));
  const cal = analysis.calibration;

  return (
    <div className="space-y-5">
      <div className="card-soft p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <CalendarDays className="h-5 w-5 text-primary" /> Next seven days
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A rough estimate from your recent readings and the system baseline, with an uncertainty band. It is not a weather forecast and it guarantees
          nothing.
        </p>

        <ul className="mt-4 space-y-2">
          {analysis.forecast.map((f) => (
            <li key={f.date} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm text-muted-foreground">{fmtDate(f.date, { year: undefined })}</span>
              <span className="relative h-6 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="absolute inset-y-0 rounded-full bg-sun/50"
                  style={{ left: `${(f.low / max) * 100}%`, width: `${((f.high - f.low) / max) * 100}%` }}
                />
                <span className="absolute inset-y-1 w-1.5 rounded-full bg-primary" style={{ left: `${(f.mid / max) * 100}%` }} />
              </span>
              <span className="w-24 shrink-0 text-right text-sm font-medium">{fmtNum(f.mid, 1)} kWh</span>
            </li>
          ))}
          {!analysis.forecast.length && <li className="text-sm text-muted-foreground">Add a few readings to see an outlook.</li>}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">The pale band is the range we would treat as normal (±1 standard deviation of recent days).</p>
      </div>

      <div className="card-soft p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <TrendingUp className="h-5 w-5 text-primary" /> Calibration
        </h2>
        {cal.factor == null ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Not enough clean days yet ({cal.days} of 7 needed). Calibration compares your own output with the weather-adjusted baseline and adjusts the
            expectation so future comparisons are fairer. Outage days and missing readings are excluded.
          </p>
        ) : (
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Stat label="Valid days used" value={String(cal.days)} hint="7–28 clean days" />
              <Stat label="Correction factor" value={fmtNum(cal.factor, 3)} hint="Actual ÷ expected across those days" />
              <Stat label="Adjusted expectation" value={fmtNum(analysis.baseline * cal.factor, 2)} unit="kWh/day" hint={`from ${fmtNum(analysis.baseline, 2)}`} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              A factor near 1.00 means the system behaves as designed. A lower factor may reflect shading, soiling, a real installation difference — or a
              resource estimate that is too optimistic for your site.
            </p>
            {!isDemo && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  disabled={applying}
                  onClick={async () => {
                    const res = await onApplyCalibration(cal.factor, cal.days);
                    setMessage(res ? `Expectation updated to ${fmtNum(res.baseline, 2)} kWh/day.` : "The calibration could not be saved.");
                  }}
                >
                  {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Use this correction
                </Button>
                {message && <span className="text-sm text-muted-foreground">{message}</span>}
              </div>
            )}
          </>
        )}
      </div>

      <Callout tone="info" title="Prototype risk indicator">
        <p>
          The score ({analysis.risk}/100) is a transparent rule: 70% weighting on the current performance gap, 30% on how often days look unusual. It is a
          risk indicator for prioritising attention — not a validated probability of failure.
        </p>
      </Callout>
    </div>
  );
}