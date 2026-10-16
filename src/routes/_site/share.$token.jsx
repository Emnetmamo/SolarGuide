import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { ReportBody } from "@/components/sg/project/ReportBody";
import { Callout } from "@/components/sg/bits";
import { getSharedReport } from "@/lib/server-fns";
import { analyse } from "@/lib/analysis";
import { fmtDate } from "@/lib/format";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/share/$token")({
  loader: async ({ params }) => {
    const report = await getSharedReport({ data: { token: params.token } });
    if (!report) throw notFound();
    return report;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.project?.name ?? "Shared report"} — SolarGuide handover` },
      { name: "description", content: "Read-only solar performance report shared by a SolarGuide installer." },
    ],
  }),
  component: SharedReport,
});

function SharedReport() {
  const data = Route.useLoaderData();
  const project = { ...data.project, id: "shared" };
  const analysis = analyse(project, data.design, data.readings);

  useEffect(() => {
    if (typeof document !== "undefined") document.title = `${data.project.name} — SolarGuide handover`;
  }, [data.project.name]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Callout tone="info" className="mb-6">
        <p>
          This is a read-only handover report. It shows summary figures only — no exact coordinates, customer details, notes or photos. The installer can
          revoke this link at any time.
        </p>
      </Callout>

      <ReportBody
        project={project}
        design={data.design}
        analysis={analysis}
        generatedAt={project.monitoring_start ? new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}
        isDemo={!!project.demo_flag}
        shared
      />

      <p className="mt-8 text-sm text-muted-foreground">
        Monitoring starts {fmtDate(project.monitoring_start)}. Created with{" "}
        <Link to="/" className="font-semibold text-primary underline">
          SolarGuide
        </Link>
        . Estimates are ranges and warnings are possible causes, not diagnoses.
      </p>
    </div>
  );
}