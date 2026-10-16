import { AlertTriangle, CheckCircle2, Cloud, Gauge, Loader2, Search, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Callout, StatusBadge, Term } from "@/components/sg/bits";
import { STATUS_PLAIN } from "@/lib/solar";
import { fmtDate, fmtGap, fmtNum } from "@/lib/format";

const TYPE_ICON = { dust: Cloud, outage: Gauge, install: Wrench, shade: Search, none: CheckCircle2 };

/** Status, percentage gap and the possible-cause cards. Everything is a hypothesis, never a diagnosis. */
export function FindingsPanel({ analysis, isDemo, onRun, running, saved }) {
  return (
    <div className="space-y-5">
      <div className="card-soft p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge status={analysis.status} size="lg" />
          {!isDemo && (
            <Button variant="outline" size="sm" disabled={running} onClick={onRun}>
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Check for unusual drops
            </Button>
          )}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{STATUS_PLAIN[analysis.status]}</p>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Item label="Comparison period" value={analysis.comparisonFrom ? `${fmtDate(analysis.comparisonFrom)} → ${fmtDate(analysis.comparisonTo)}` : "—"} />
          <Item label="Valid days used" value={String(analysis.validDays)} />
          <Item label="Actual vs expected" value={`${fmtNum(analysis.actualSum, 1)} / ${fmtNum(analysis.expectedSum, 1)} kWh`} />
          <Item label="Gap" value={fmtGap(analysis.gap)} />
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          Gap = (expected − actual) ÷ expected × 100, over the last {analysis.validDays} days with readings. Thresholds (10% / 20%) are initial prototype
          values, not engineering standards. Missing days ({analysis.missing}) are left out rather than counted as zero.
        </p>
      </div>

      {analysis.findings.length === 0 ? (
        <Callout tone="ok" title="No unusual drops detected in this period">
          Keep adding readings. A pattern that only appears over weeks — like gradual soiling — cannot be seen earlier than that.
        </Callout>
      ) : (
        <ul className="space-y-4">
          {analysis.findings.map((f) => {
            const Icon = TYPE_ICON[f.type] ?? AlertTriangle;
            return (
              <li key={f.type} className="card-soft p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warn-soft text-warn">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-display text-lg font-bold">{f.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <strong className="text-foreground">Observed:</strong> {f.evidence}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      <strong className="text-foreground">What would confirm or rule it out:</strong> {f.confirm}
                    </p>
                    <p className="mt-2 inline-flex rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
                      Suggested next step: {f.action}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      This is a possible cause, not a diagnosis. Compare with weather and your own notes before acting. Never open electrical equipment,
                      touch wiring or climb on the roof yourself.
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {saved?.length > 0 && (
        <div className="card-soft p-5">
          <h2 className="font-display text-lg font-bold">Saved checks</h2>
          <p className="text-sm text-muted-foreground">Each check is stored with the date it ran and the rule set that produced it.</p>
          <ul className="mt-3 space-y-2 text-sm">
            {saved.slice(0, 6).map((f) => (
              <li key={f.id} className="flex flex-wrap justify-between gap-2 border-b border-border/60 pb-2 last:border-0">
                <span>{f.title}</span>
                <span className="text-muted-foreground">
                  {fmtDate(f.created_date)} · gap {fmtNum(f.observed_gap_pct, 1)}% · <span className="font-mono text-xs">{f.model_version}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            The risk indicator is a transparent prototype score, not a validated <Term t="performance ratio">failure probability</Term>.
          </p>
        </div>
      )}
    </div>
  );
}

function Item({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}