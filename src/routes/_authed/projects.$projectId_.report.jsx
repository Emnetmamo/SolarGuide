import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Copy, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportBody } from "@/components/sg/project/ReportBody";
import { analyse } from "@/lib/analysis";
import { loadProjectBundle } from "@/lib/project-data";
import { todayIso } from "@/lib/format";

export const Route = createFileRoute("/_authed/projects/$projectId_/report")({
  loader: ({ params }) => loadProjectBundle(params.projectId),
  head: ({ loaderData }) => ({
    meta: [
      { title: `Report — ${loaderData?.project?.name ?? "project"}` },
      { name: "description", content: "One-page printable performance report: system summary, expected versus actual, warnings, actions and forecast." },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const bundle = Route.useLoaderData();
  const { project, design, readings, isDemo } = bundle;
  const analysis = useMemo(() => analyse(project, design, readings), [bundle]);
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window === "undefined" ? "" : `${window.location.origin}/share/${project.share_token ?? ""}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/projects/$projectId/monitoring" params={{ projectId: project.id }}>
            <ArrowLeft className="h-4 w-4" /> Back to monitoring
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          {!isDemo && (
            <Button variant="outline" size="sm" onClick={copy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Link copied" : "Copy owner link"}
            </Button>
          )}
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print / save as PDF
          </Button>
        </div>
      </div>

      <div className="card-soft p-6 md:p-8">
        <ReportBody project={project} design={design} analysis={analysis} generatedAt={todayIso()} isDemo={isDemo} />
      </div>
    </div>
  );
}