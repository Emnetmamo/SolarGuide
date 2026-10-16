import { MetricTile } from "@/components/sg/insights/MetricTile";
import { fmtInt, fmtNum } from "@/lib/format";

/** Module 1 — the whole monitored fleet at a glance. */
export function PlantOverviewCard({ overview }) {
  return (
    <section className="card-soft p-5">
      <header className="mb-4">
        <h2 className="font-display text-xl font-bold">Plant overview</h2>
        <p className="text-sm text-muted-foreground">Every site you monitor, scored from its own readings over the last 30 days.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricTile label="System health" value={overview.health == null ? "—" : `${overview.health}%`} tone={overview.health == null ? "none" : overview.health < 80 ? "warn" : "ok"} />
        <MetricTile label="Sites monitored" value={fmtInt(overview.sites)} hint={`${overview.scored} scored`} />
        <MetricTile label="Anomaly days" value={fmtInt(overview.anomalies)} tone={overview.anomalies ? "warn" : "ok"} hint="below 60% of expected" />
        <MetricTile label="High risk sites" value={fmtInt(overview.highRisk)} tone={overview.highRisk ? "bad" : "ok"} hint="risk 60 or more" />
        <MetricTile label="Energy recorded" value={fmtInt(overview.energyKwh)} unit="kWh" tone="sun" hint={`across ${overview.days} recorded days`} />
        <MetricTile label="Average daily output" value={overview.avgDaily == null ? "—" : fmtNum(overview.avgDaily, 1)} unit="kWh" tone="sun" />
      </div>

      {overview.demoCount > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {overview.demoCount} of these site(s) are the synthetic demo fleet, generated on this device — they are shown so the scores can be explored before real data exists.
        </p>
      )}
    </section>
  );
}