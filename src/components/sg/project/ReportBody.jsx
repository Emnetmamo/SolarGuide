import { DemoBadge, StatusBadge } from "@/components/sg/bits";
import { OutputChart } from "@/components/sg/OutputChart";
import { MODEL_VERSION } from "@/lib/solar";
import { fmtDate, fmtGap, fmtNum } from "@/lib/format";

/** The one-page report, shared by the printable page and the public owner link. */
export function ReportBody({ project, design, analysis, generatedAt, isDemo, shared = false }) {
  const completeness = analysis.days ? Math.round(((analysis.days - analysis.missing) / analysis.days) * 100) : 0;

  return (
    <article className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-leaf">SolarGuide · performance report</p>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            {project.region || "Location not set"} · report generated {fmtDate(generatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isDemo && <DemoBadge />}
          <StatusBadge status={analysis.status} />
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Cell label="System size" value={`${fmtNum(design?.pv_kwp, 1)} kWp`} />
        <Cell label="Expected" value={`${fmtNum(design?.expected_daily_min, 1)}–${fmtNum(design?.expected_daily_max, 1)} kWh/day`} />
        <Cell label="Actual (last 14 valid days)" value={`${fmtNum(analysis.actualSum, 1)} kWh`} />
        <Cell label="Gap" value={fmtGap(analysis.gap)} />
      </section>

      <section>
        <h2 className="font-display text-lg font-bold">Expected versus actual</h2>
        <p className="text-sm text-muted-foreground">
          {analysis.comparisonFrom ? `${fmtDate(analysis.comparisonFrom)} → ${fmtDate(analysis.comparisonTo)}` : "No readings yet"} ·{" "}
          {analysis.days - analysis.missing} of {analysis.days} days have a reading ({completeness}% complete). Missing days are excluded, not counted as
          zero.
        </p>
        <div className="mt-3">
          <OutputChart data={analysis.chart} forecast={analysis.forecast} height={240} />
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold">Warnings, possible causes and next steps</h2>
        {analysis.findings.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No unusual drops were detected in this period.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {analysis.findings.map((f) => (
              <li key={f.type} className="rounded-2xl border border-warn/30 bg-warn-soft p-4 text-sm">
                <p className="font-semibold">{f.title}</p>
                <p className="mt-1">{f.evidence}</p>
                <p className="mt-1">
                  <strong>Next step:</strong> {f.action}. {f.confirm}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Warnings are possible causes based on rules, not diagnoses. Never open electrical equipment, touch wiring or climb on the array — call a
          qualified installer.
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold">Recent outlook</h2>
        <ul className="mt-2 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {analysis.forecast.slice(0, 4).map((f) => (
            <li key={f.date} className="rounded-xl border border-border p-3">
              <p className="text-muted-foreground">{fmtDate(f.date, { year: undefined })}</p>
              <p className="font-semibold">
                ≈ {fmtNum(f.mid, 1)} kWh <span className="font-normal text-muted-foreground">({fmtNum(f.low, 1)}–{fmtNum(f.high, 1)})</span>
              </p>
            </li>
          ))}
          {!analysis.forecast.length && <li className="text-muted-foreground">Not enough data for an outlook.</li>}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
        <h2 className="font-display text-sm font-bold text-foreground">Data sources and model notes</h2>
        <p className="mt-1">
          Expected output = system kWp × peak sun hours × performance ratio ({fmtNum(design?.performance_ratio, 2)}). Baseline{" "}
          {fmtNum(analysis.baseline, 2)} kWh/day from {fmtDate(project.monitoring_start)}.
        </p>
        <p className="mt-1">Solar resource: {design?.resource_source || "not recorded"}{design?.resource_timestamp ? ` · retrieved ${String(design.resource_timestamp).slice(0, 10)}` : ""}.</p>
        <p className="mt-1">
          Analysis: {MODEL_VERSION}{isDemo ? " · synthetic demo data" : ""}. Warnings are rule-based hypotheses and the risk indicator is a prototype score,
          not a validated failure probability.
        </p>
        {shared ? (
          <p className="mt-1">This shared view is read-only and omits exact coordinates, customer details, notes and photos.</p>
        ) : (
          <p className="mt-1">Personal details, exact coordinates and photos are not included in this report by default.</p>
        )}
      </section>
    </article>
  );
}

function Cell({ label, value }) {
  return (
    <div className="rounded-2xl border border-border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-lg font-bold text-primary">{value}</p>
    </div>
  );
}