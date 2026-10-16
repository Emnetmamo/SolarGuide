import { MetricTile } from "@/components/sg/insights/MetricTile";
import { SiteHealthRow } from "@/components/sg/insights/SiteHealthRow";
import { fmtInt } from "@/lib/format";

/** Module 2 — health of every site, ranked from the weakest up. */
export function HealthRankingCard({ sites, overview }) {
  const ranked = [...sites].sort((a, b) => (a.health ?? 101) - (b.health ?? 101) || a.name.localeCompare(b.name));

  return (
    <section className="card-soft p-5">
      <header className="mb-4">
        <h2 className="font-display text-xl font-bold">Site health</h2>
        <p className="text-sm text-muted-foreground">Health is the share of the weather-adjusted expectation each site actually delivered over the last 30 days.</p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <MetricTile label="Lowest" value={overview.lowest == null ? "—" : `${overview.lowest}%`} tone={overview.lowest == null ? "none" : overview.lowest < 70 ? "bad" : overview.lowest < 85 ? "warn" : "ok"} />
        <MetricTile label="Below 80%" value={fmtInt(overview.below80)} tone={overview.below80 ? "warn" : "ok"} />
        <MetricTile label="Below 60%" value={fmtInt(overview.below60)} tone={overview.below60 ? "bad" : "ok"} />
      </div>

      <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Health ranking</h3>
      {ranked.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No sites to score yet.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {ranked.map((s) => (
            <SiteHealthRow key={s.id} site={s} />
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        {overview.scored} of {overview.sites} site(s) have enough readings to be scored. Missing days are left out of the sum, never counted as zero.
      </p>
    </section>
  );
}