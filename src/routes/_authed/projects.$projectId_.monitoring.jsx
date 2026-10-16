import { useMemo, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileText, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectHeader } from "@/components/sg/project/ProjectHeader";
import { FindingsPanel } from "@/components/sg/project/FindingsPanel";
import { OutputChart } from "@/components/sg/OutputChart";
import { ReadingsPanel } from "@/components/sg/project/ReadingsPanel";
import { CsvImportDialog } from "@/components/sg/project/CsvImportDialog";
import { ForecastPanel } from "@/components/sg/project/ForecastPanel";
import { Callout, Term } from "@/components/sg/bits";
import { analyse } from "@/lib/analysis";
import { enqueue } from "@/lib/offline-queue";
import { loadProjectBundle } from "@/lib/project-data";
import { addReadings, runDiagnostics, saveCalibration } from "@/lib/server-fns";
import { MODEL_VERSION } from "@/lib/solar";

export const Route = createFileRoute("/_authed/projects/$projectId_/monitoring")({
  loader: ({ params }) => loadProjectBundle(params.projectId),
  head: ({ loaderData }) => ({
    meta: [
      { title: `Monitoring — ${loaderData?.project?.name ?? "project"}` },
      { name: "description", content: "Actual against expected output, warnings with possible causes, and the seven-day outlook." },
    ],
  }),
  component: MonitoringPage,
});

function MonitoringPage() {
  const bundle = Route.useLoaderData();
  const { project, design, readings, findings, isDemo } = bundle;
  const analysis = useMemo(() => analyse(project, design, readings), [bundle]);
  const addFn = useServerFn(addReadings);
  const runFn = useServerFn(runDiagnostics);
  const calFn = useServerFn(saveCalibration);
  const router = useRouter();

  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [running, setRunning] = useState(false);
  const [applying, setApplying] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  async function onAdd(input, fromQueue = false) {
    if (isDemo) {
      toast.error("Demo projects are read-only.");
      return false;
    }
    if (!fromQueue && typeof navigator !== "undefined" && navigator.onLine === false) {
      enqueue({ projectId: project.id, ...input });
      return "queued";
    }
    setAdding(true);
    try {
      const payload = fromQueue ? input : { projectId: project.id, rows: [input] };
      await addFn({ data: { projectId: payload.projectId, rows: payload.rows } });
      if (!fromQueue) toast.success("Reading saved");
      await router.invalidate();
      return true;
    } catch {
      toast.error("The reading could not be saved.");
      return false;
    } finally {
      setAdding(false);
    }
  }

  async function onImport(rows) {
    setImporting(true);
    try {
      const res = await addFn({ data: { projectId: project.id, rows } });
      toast.success(`${res.created} day(s) added, ${res.updated} updated`);
      await router.invalidate();
      return true;
    } catch {
      toast.error("The import could not be saved.");
      return false;
    } finally {
      setImporting(false);
    }
  }

  async function onRun() {
    setRunning(true);
    try {
      const res = await runFn({ data: { projectId: project.id } });
      toast.success(res.findings.length ? `${res.findings.length} possible issue(s) found` : "No unusual drops found");
      await router.invalidate();
    } catch {
      toast.error("The check could not run.");
    } finally {
      setRunning(false);
    }
  }

  async function onApplyCalibration(factor, days) {
    setApplying(true);
    try {
      const res = await calFn({ data: { projectId: project.id, factor, days } });
      await router.invalidate();
      return res;
    } catch {
      toast.error("The correction could not be saved.");
      return null;
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <ProjectHeader project={project} isDemo={isDemo} analysis={analysis} active="monitoring" />

      <div className="space-y-10">
        <section>
          <FindingsPanel analysis={analysis} isDemo={isDemo} onRun={onRun} running={running} saved={findings} />
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Actual against expected</h2>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/insights">
                  <TrendingUp className="h-4 w-4" /> Predictions
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/projects/$projectId/report" params={{ projectId: project.id }}>
                  <FileText className="h-4 w-4" /> One-page report
                </Link>
              </Button>
            </div>
          </div>
          <div className="card-soft p-5">
            <OutputChart data={analysis.chart} forecast={analysis.forecast} />
            <p className="mt-3 text-sm text-muted-foreground">
              Solid green is what was produced; the dashed yellow line is what was expected after adjusting for that day's{" "}
              <Term t="irradiance">irradiance</Term>; the dotted line is a 7-day average. {analysis.missing} day(s) have no reading and are shown as gaps,
              never as zero production.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">Readings</h2>
          <ReadingsPanel
            analysis={analysis}
            isDemo={isDemo}
            onAdd={onAdd}
            adding={adding}
            onOpenImport={() => setImportOpen(true)}
            onSynced={() => router.invalidate()}
          />
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">Outlook and calibration</h2>
          <ForecastPanel analysis={analysis} isDemo={isDemo} onApplyCalibration={onApplyCalibration} applying={applying} />
        </section>

        <Callout tone="info" title="Installer detail">
          <ul className="space-y-1">
            <li>• Performance ratio in use: {analysis.pr}</li>
            <li>• Baseline expectation: {analysis.baseline} kWh/day since {project.monitoring_start || "handover"}</li>
            <li>• Solar resource: {design?.resource_source || "not recorded"}</li>
            <li>• Analysis rules: <span className="font-mono text-xs">{MODEL_VERSION}</span></li>
          </ul>
        </Callout>
      </div>

      <CsvImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={onImport} busy={importing} />
    </div>
  );
}