import { Link } from "@tanstack/react-router";
import { Callout } from "@/components/sg/bits";
import { RiskSpotlight } from "@/components/sg/insights/RiskSpotlight";
import { MIN_SCORED_DAYS } from "@/lib/predictive";

/** Module 3 — the site most likely to need attention next, with a safe suggested action. */
export function RiskForecastCard({ sites }) {
  const scored = sites.filter((s) => s.risk != null).sort((a, b) => b.risk - a.risk || (a.health ?? 100) - (b.health ?? 100));
  const top = scored[0] ?? null;

  return (
    <section className="card-soft p-5">
      <header className="mb-4">
        <h2 className="font-display text-xl font-bold">Failure risk forecast</h2>
        <p className="text-sm text-muted-foreground">
          Which site is most likely to need attention next — and what to do about it. A prototype indicator, not a validated failure probability.
        </p>
      </header>

      {!top ? (
        <Callout tone="info" title="Nothing to forecast yet">
          A site needs at least {MIN_SCORED_DAYS} days of readings and a design baseline before its risk can be scored.
        </Callout>
      ) : (
        <>
          <RiskSpotlight site={top} />

          {scored.length > 1 && (
            <>
              <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next sites to watch</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {scored.slice(1, 4).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0">
                    <Link to="/projects/$projectId" params={{ projectId: s.id }} className="truncate underline-offset-4 hover:underline">
                      {s.name}
                      {s.isDemo ? " (demo)" : ""}
                    </Link>
                    <span className="shrink-0 text-muted-foreground">
                      risk {s.risk} · {s.action}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Risk index = 70% size of the shortfall + 30% share of anomaly days, both over the last 30 days. This is a possible cause, not a diagnosis — and never
        open electrical equipment or climb on the roof yourself.
      </p>
    </section>
  );
}