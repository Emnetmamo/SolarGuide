import { Link } from "@tanstack/react-router";
import { DemoBadge } from "@/components/sg/bits";
import { fmtNum, fmtShort } from "@/lib/format";
import { cn } from "@/lib/utils";

const BAR = { good: "bg-ok", fair: "bg-sun", poor: "bg-bad", none: "bg-border" };

function tone(health) {
  if (health == null) return BAR.none;
  if (health >= 85) return BAR.good;
  if (health >= 70) return BAR.fair;
  return BAR.poor;
}

/** One ranked site: health bar, energy delivered against expectation, and the reason it is unranked. */
export function SiteHealthRow({ site }) {
  return (
    <li>
      <Link to="/projects/$projectId" params={{ projectId: site.id }} className="-mx-2 block rounded-xl p-2 transition hover:bg-muted">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
            <span className="truncate">{site.name}</span>
            {site.isDemo && <DemoBadge />}
          </span>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">{site.health == null ? "—" : `${site.health}%`}</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className={cn("h-2 rounded-full", tone(site.health))} style={{ width: site.health == null ? "0%" : `${site.health}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {site.health == null
            ? site.baseline > 0
              ? `Not enough data yet — ${site.days} of 5 days recorded`
              : "No design baseline recorded for this site"
            : `${fmtNum(site.actualSum, 1)} of ${fmtNum(site.expectedSum, 1)} kWh expected · last reading ${fmtShort(site.lastDate)}`}
        </p>
      </Link>
    </li>
  );
}