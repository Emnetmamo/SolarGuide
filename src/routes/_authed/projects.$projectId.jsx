import { useMemo, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ProjectHeader } from "@/components/sg/project/ProjectHeader";
import { DesignSummary } from "@/components/sg/project/DesignSummary";
import { ChecklistSection } from "@/components/sg/project/ChecklistSection";
import { ChecklistReadOnly } from "@/components/sg/project/ChecklistReadOnly";
import { Callout, Term } from "@/components/sg/bits";
import { analyse } from "@/lib/analysis";
import { loadProjectBundle } from "@/lib/project-data";
import { saveChecklist } from "@/lib/server-fns";

export const Route = createFileRoute("/_authed/projects/$projectId")({
  loader: ({ params }) => loadProjectBundle(params.projectId),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.project?.name ?? "Project"} — SolarGuide` },
      { name: "description", content: "Site, roof, shade, load, system estimate and the pre-installation checklist for this project." },
    ],
  }),
  component: OverviewPage,
});

function OverviewPage() {
  const bundle = Route.useLoaderData();
  const { project, design, readings, isDemo } = bundle;
  const analysis = useMemo(() => analyse(project, design, readings), [bundle]);
  const save = useServerFn(saveChecklist);
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const preItems = (bundle.checklist ?? []).filter((i) => i.phase !== "commissioning");

  async function handleSave(items) {
    setSaving(true);
    try {
      await save({
        data: {
          projectId: project.id,
          items: items.map((i) => ({
            id: i.id,
            status: i.status,
            notes: i.notes ?? "",
            evidence_file_uri: i.evidence_file_uri || undefined,
          })),
        },
      });
      toast.success("Checklist saved");
      await router.invalidate();
    } catch {
      toast.error("The checklist could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <ProjectHeader project={project} isDemo={isDemo} analysis={analysis} active="overview" />

      <div className="space-y-10">
        <section>
          <h2 className="mb-3 text-xl font-bold">System design</h2>
          <DesignSummary project={project} design={design} />
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">Pre-installation checklist</h2>
          <p className="mb-4 max-w-2xl text-muted-foreground">
            Roof condition, shade, cable size, <Term t="earthing">earthing</Term>, inverter match, protection, mounting, ventilation and maintenance access.
          </p>
          {isDemo ? <ChecklistReadOnly items={preItems} /> : <ChecklistSection items={preItems} onSave={handleSave} saving={saving} />}
        </section>

        <Callout tone="warn" title="Before anyone installs anything">
          Final sizing, cable sizing, protection, {""}
          <Term t="string voltage">string voltage</Term> design and earthing must be confirmed by a qualified person. This project record is a checklist and
          an estimate, not a signed-off design.
        </Callout>
      </div>
    </div>
  );
}