import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Callout, DemoBadge, StatusBadge } from "@/components/sg/bits";
import { PageTitle } from "@/components/sg/shell";
import { buildCards } from "@/lib/analysis";
import { DEMO_PROJECTS, demoBundleFor } from "@/lib/demo";
import { fmtGap, fmtNum } from "@/lib/format";
import { listMyProjects } from "@/lib/server-fns";

export const Route = createFileRoute("/_authed/dashboard")({
  head: () => ({
    meta: [
      { title: "Projects — SolarGuide" },
      { name: "description", content: "All your solar projects with status, last reading, performance gap and alerts to follow up." },
    ],
  }),
  loader: async () => {
    const own = await listMyProjects();
    return { ...own, demos: DEMO_PROJECTS.map((p) => demoBundleFor(p.id)).filter(Boolean) };
  },
  component: Dashboard,
});

function Dashboard() {
  const data = Route.useLoaderData();
  const { user } = Route.useRouteContext();
  const cards = useMemo(() => buildCards(data.projects, data.designs, data.readings, data.demos), [data]);
  const mine = cards.filter((c) => !c.isDemo);
  const demos = cards.filter((c) => c.isDemo);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle eyebrow="Projects" title={user?.full_name ? `Hello, ${user.full_name.split(" ")[0]}` : "Your projects"}>
          Each card shows the status, the last reading and the gap against the weather-adjusted expectation. Alerts are possible causes worth following
          up — not diagnoses.
        </PageTitle>
        <Button asChild size="lg">
          <Link to="/projects/new">
            <Plus /> New project
          </Link>
        </Button>
      </div>

      {mine.length === 0 ? (
        <Callout tone="info" className="mb-6" title="No projects yet">
          <p>
            Start with “Plan a system” to record a site, a load and a system estimate, or explore the demo projects below to see how monitoring behaves
            when something drifts.
          </p>
        </Callout>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mine.map(({ project, design, a }) => (
            <ProjectCard key={project.id} project={project} design={design} a={a} />
          ))}
        </div>
      )}

      <div className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Demo projects</h2>
            <p className="mt-1 text-muted-foreground">
              Synthetic records generated on this device, each showing a different failure pattern. They are read-only and never contribute to the shared
              dataset.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/data">
              <ShieldCheck /> Data &amp; consent
            </Link>
          </Button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {demos.map(({ project, design, a }) => (
            <ProjectCard key={project.id} project={project} design={design} a={a} isDemo />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, design, a, isDemo }) {
  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: project.id }}
      className="card-soft block p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold">{project.name}</h3>
          <p className="text-sm text-muted-foreground">
            {project.region || "Location not set"} · {fmtNum(design?.pv_kwp, 1)} kWp
          </p>
        </div>
        {isDemo && <DemoBadge />}
      </div>

      <div className="mt-4">
        <StatusBadge status={a.status} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Last reading</dt>
          <dd className="font-semibold">{a.lastReading ? `${fmtNum(a.lastReading.actual, 1)} kWh` : "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Gap</dt>
          <dd className="font-semibold">{fmtGap(a.gap)}</dd>
        </div>
      </dl>

      {a.findings.length > 0 ? (
        <p className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-sm font-medium text-warn">
          {a.findings.length} possible issue(s) to follow up
        </p>
      ) : (
        <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-ok">
          No alerts <ArrowRight className="h-3.5 w-3.5" />
        </p>
      )}
    </Link>
  );
}