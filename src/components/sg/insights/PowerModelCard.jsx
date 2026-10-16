import { Callout, DemoBadge } from "@/components/sg/bits";
import { FeatureImportance } from "@/components/sg/insights/FeatureImportance";
import { MetricTile } from "@/components/sg/insights/MetricTile";
import { PredictionScatter } from "@/components/sg/insights/PredictionScatter";
import { fmtInt, fmtNum } from "@/lib/format";

const REASON = {
  "not-enough-records": (n, need) =>
    `${n} of the ${need} days that pair a reading with sunlight data are needed before a model can be fitted. Recording weather alongside daily energy — or importing it from a CSV — brings this forward.`,
  "no-signal": (n) =>
    `Across ${n} recorded days there was no clear relationship between sunlight and output, so no model is shown rather than a misleading one. This usually means the weather barely varied in the period.`,
};

/** Module 4 — the learned model, its accuracy and what it weighted. */
export function PowerModelCard({ model, version }) {
  return (
    <section className="card-soft p-5">
      <header className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-bold">Power prediction</h2>
          <p className="text-sm text-muted-foreground">A least-squares model learns what a site should produce from the sunlight and temperature you record.</p>
        </div>
        {model.ok && model.includesDemo && <DemoBadge />}
      </header>

      {!model.ok ? (
        <Callout tone="info" title="Not enough data for a model yet">
          {(REASON[model.reason] ?? REASON["not-enough-records"])(model.n, model.need)}
        </Callout>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <MetricTile label="Model R²" value={fmtNum(model.r2, 3)} tone={model.r2 >= 0.6 ? "ok" : "warn"} />
            <MetricTile label="Mean abs. error" value={fmtNum(model.mae, 1)} unit="kWh" tone="warn" />
            <MetricTile label="Training records" value={fmtInt(model.n)} unit="days" />
          </div>

          {model.r2 < 0.3 && (
            <p className="mt-2 text-xs text-warn">
              The model explains only {Math.round(Math.max(0, model.r2) * 100)}% of the day-to-day variation, so treat it as a rough baseline rather than a forecast.
            </p>
          )}
          {model.includesDemo && (
            <p className="mt-2 text-xs text-muted-foreground">Fitted on the synthetic demo records, because your own fleet does not have enough weather data yet.</p>
          )}

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <PredictionScatter points={model.points} />
            <FeatureImportance features={model.features} />
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Model: <span className="font-mono">{version}</span> · R² 1.0 would mean every training day matched the fit exactly. No number here is a promise of future output.
          </p>
        </>
      )}
    </section>
  );
}