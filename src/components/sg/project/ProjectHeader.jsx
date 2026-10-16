import { Link } from "@tanstack/react-router";
import { DemoBadge, StatusBadge } from "@/components/sg/bits";
import { fmtGap, fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ProjectHeader({ project, isDemo, analysis, active }) {
  const tabs = [
    { key: "overview", label: "Before installation", to: "/projects/$projectId", params: { projectId: project.id }, exact: true },
    { key: "commissioning", label: "Commissioning", to: "/projects/$projectId/commissioning", params: { projectId: project.id } },
    { key: "monitoring", label: "After installation", to: "/projects/$projectId/monitoring", params: { projectId: project.id } },
    { key: "report", label: "Report", to: "/projects/$projectId/report", params: { projectId: project.id } },
  ];

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {isDemo && <DemoBadge />}
            <p className="text-sm font-semibold uppercase tracking-wider text-leaf">{project.region || "Location not set"}</p>
          </div>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">{project.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <StatusBadge status={analysis.status} />
            <span>
              Gap (last {analysis.validDays} valid days): <strong className="text-foreground">{fmtGap(analysis.gap)}</strong>
            </span>
            <span>
              Expected {fmtNum(analysis.baseline, 1)} kWh/day
            </span>
          </div>
        </div>
        {isDemo && (
          <p className="max-w-xs rounded-2xl border border-sun/40 bg-sun/15 p-3 text-xs text-sun-foreground">
            This is a synthetic demo project. Nothing here is a real customer record, and demo data is never contributed to the open dataset.
          </p>
        )}
      </div>

      <nav className="no-print mt-6 flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((t) => (
          <Link
            key={t.key}
            to={t.to}
            params={t.params}
            activeOptions={{ exact: t.exact }}
            className={cn("rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted")}
            activeProps={{ className: "bg-primary !text-primary-foreground" }}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}