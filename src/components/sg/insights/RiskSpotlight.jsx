import { Link } from "@tanstack/react-router";
import { DemoBadge } from "@/components/sg/bits";
import { MetricTile } from "@/components/sg/insights/MetricTile";
import { fmtNum } from "@/lib/format";
import { HIGH_RISK } from "@/lib/predictive";

/** The highest-risk site: its energy, loss, anomalies, health, risk index and safe next step. */
export function RiskSpotlight({ site }) {
  const days = Math.max(1, site.days);
  return (
    <div className="rounded-2xl border border-border bg-muted/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Highest risk site</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <Link to="/projects/$projectId" params={{ projectId: site.id }} className="font-display text-lg font-bold text-primary underline-offset-4 hover:underline">
          {site.name}
        </Link>
        {site.isDemo && <DemoBadge />}
      </div>
      <p className="text-sm text-muted-foreground">{site.region || "Location not set"} · {site.findingTitle ?? "No unusual pattern detected in this period"}</p>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricTile label="Expected / day" value={fmtNum(site.expectedSum / days, 1)} unit="kWh" />
        <MetricTile label="Actual / day" value={fmtNum(site.actualSum / days, 1)} unit="kWh" tone={site.gap > 0 ? "warn" : "ok"} />
        <MetricTile label="Performance loss" value={site.gap == null ? "—" : `${fmtNum(site.gap, 1)}%`} tone={site.gap >= 20 ? "bad" : site.gap >= 10 ? "warn" : "ok"} />
        <MetricTile label="Anomaly days" value={String(site.anomalies)} tone={site.anomalies ? "warn" : "ok"} hint={`of ${site.days} recorded`} />
        <MetricTile label="Health score" value={site.health == null ? "—" : `${site.health}%`} tone={site.health < 70 ? "bad" : site.health < 85 ? "warn" : "ok"} />
        <MetricTile label="Failure risk" value={String(site.risk)} unit="/ 100" tone={site.risk >= HIGH_RISK ? "bad" : site.risk >= 35 ? "warn" : "ok"} />
      </div>

      <p className="mt-3 inline-flex rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">Suggested action: {site.action}</p>
      {site.confirm && <p className="mt-2 text-xs text-muted-foreground">{site.confirm}</p>}
    </div>
  );
}