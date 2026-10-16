import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { HealthRankingCard } from "@/components/sg/insights/HealthRankingCard";
import { PlantOverviewCard } from "@/components/sg/insights/PlantOverviewCard";
import { PowerModelCard } from "@/components/sg/insights/PowerModelCard";
import { RiskForecastCard } from "@/components/sg/insights/RiskForecastCard";
import { Callout, GlossaryButton } from "@/components/sg/bits";
import { PageTitle } from "@/components/sg/shell";
import { DEMO_PROJECTS, demoBundleFor } from "@/lib/demo";
import { withDemoFleet } from "@/lib/predictive";
import { getFleetInsights } from "@/lib/server-fns";

export const Route = createFileRoute("/_authed/insights")({
  head: () => ({
    meta: [
      { title: "Predictive insights — SolarGuide" },
      { name: "description", content: "Health scores, failure-risk forecast and a learned power model for every solar site you monitor." },
    ],
  }),
  loader: async () => {
    const fleet = await getFleetInsights();
    return { fleet, demos: DEMO_PROJECTS.map((p) => demoBundleFor(p.id)).filter(Boolean) };
  },
  component: InsightsPage,
});

function InsightsPage() {
  const data = Route.useLoaderData();
  const fleet = useMemo(() => withDemoFleet(data.fleet, data.demos), [data]);
  const ownSites = fleet.sites.filter((s) => !s.isDemo);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageTitle eyebrow="Post-installation" title="Predictive insights">
          Health, failure risk and expected output for every site you monitor, learned from the readings you already record. Every score is a prototype
          indicator — not an equipment warranty and not a failure probability.
        </PageTitle>
        <GlossaryButton />
      </div>

      {ownSites.length === 0 && (
        <Callout tone="info" className="mb-6" title="No readings of your own yet">
          The numbers below are computed from the synthetic demo fleet. Add a project and record daily readings to have your own sites scored this way.
        </Callout>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <PlantOverviewCard overview={fleet.overview} />
        <HealthRankingCard sites={fleet.sites} overview={fleet.overview} />
        <RiskForecastCard sites={fleet.sites} />
        <PowerModelCard model={fleet.model} version={fleet.version} />
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Health compares what a site delivered with what was expected after adjusting for each day's irradiance; days with no reading are left out. The risk
        index is a transparent weighted score, not a validated probability. Warnings point at possible causes — a qualified installer confirms anything
        electrical.
      </p>
    </div>
  );
}