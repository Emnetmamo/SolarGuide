import { useMemo, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ProjectHeader } from "@/components/sg/project/ProjectHeader";
import { CommissioningSection } from "@/components/sg/project/CommissioningSection";
import { ChecklistReadOnly } from "@/components/sg/project/ChecklistReadOnly";
import { HandoverPanel } from "@/components/sg/project/HandoverPanel";
import { Callout } from "@/components/sg/bits";
import { analyse } from "@/lib/analysis";
import { loadProjectBundle } from "@/lib/project-data";
import { rotateShareToken, saveChecklist, updateProject } from "@/lib/server-fns";

export const Route = createFileRoute("/_authed/projects/$projectId_/commissioning")({
  loader: ({ params }) => loadProjectBundle(params.projectId),
  head: ({ loaderData }) => ({
    meta: [
      { title: `Commissioning — ${loaderData?.project?.name ?? "project"}` },
      { name: "description", content: "Commissioning evidence, handover summary and the owner's read-only report link." },
    ],
  }),
  component: CommissioningPage,
});

function CommissioningPage() {
  const bundle = Route.useLoaderData();
  const { project, design, readings, isDemo } = bundle;
  const analysis = useMemo(() => analyse(project, design, readings), [bundle]);
  const save = useServerFn(saveChecklist);
  const rotate = useServerFn(rotateShareToken);
  const update = useServerFn(updateProject);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [rotating, setRotating] = useState(false);

  const items = (bundle.checklist ?? []).filter((i) => i.phase === "commissioning");

  async function handleSave(list) {
    setSaving(true);
    try {
      await save({
        data: {
          projectId: project.id,
          items: list.map((i) => ({
            id: i.id,
            value: i.value ?? "",
            not_measured: !!i.not_measured,
            evidence_file_uri: i.evidence_file_uri || undefined,
          })),
        },
      });
      toast.success("Commissioning record saved");
      await router.invalidate();
    } catch {
      toast.error("The record could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRotate() {
    setRotating(true);
    try {
      await rotate({ data: { id: project.id } });
      toast.success("A new owner link was created — the old one no longer works.");
      await router.invalidate();
    } catch {
      toast.error("The link could not be regenerated.");
    } finally {
      setRotating(false);
    }
  }

  async function handleStatus(status) {
    try {
      await update({ data: { id: project.id, patch: { status } } });
      toast.success("Project marked as monitoring");
      await router.invalidate();
    } catch {
      toast.error("The status could not be updated.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <ProjectHeader project={project} isDemo={isDemo} analysis={analysis} active="commissioning" />

      <div className="space-y-10">
        <section>
          <h2 className="mb-3 text-xl font-bold">Handover</h2>
          <HandoverPanel project={project} design={design} isDemo={isDemo} onRotate={handleRotate} rotating={rotating} onStatus={handleStatus} />
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">Commissioning evidence</h2>
          <p className="mb-4 max-w-2xl text-muted-foreground">
            Array and inverter photos, installed capacity, inverter model and key settings,{" "}
            string voltage and the installation date. Anything you cannot measure can be recorded as “not measured”.
          </p>
          {isDemo ? <ChecklistReadOnly items={items} /> : <CommissioningSection items={items} onSave={handleSave} saving={saving} />}
        </section>

        <Callout tone="info" title="What monitoring starts from">
          The baseline of {analysis.baseline} kWh/day and the monitoring start date are what every later comparison is measured against. Change them only
          if the system or the site genuinely changed.
        </Callout>
      </div>
    </div>
  );
}