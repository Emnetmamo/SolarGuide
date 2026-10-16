import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { Callout } from "@/components/sg/bits";
import { PageTitle } from "@/components/sg/shell";
import { NASA_ATTRIBUTION } from "@/lib/evidence";
import { MODEL_VERSION } from "@/lib/solar";

export const Route = createFileRoute("/_site/evidence")({
  head: () => ({
    meta: [
      { title: "Evidence — SolarGuide" },
      { name: "description", content: "Sourced facts behind SolarGuide, with links, dates and an honest verification status for each claim." },
      { property: "og:title", content: "Evidence — SolarGuide" },
      { property: "og:description", content: "Sources for the claims behind SolarGuide, and their verification status." },
    ],
  }),
  component: EvidencePage,
});

function StatusChip({ status }) {
  const map = {
    verified: "border-ok/40 bg-ok-soft text-ok",
    pending: "border-warn/40 bg-warn-soft text-warn",
    partial: "border-warn/40 bg-warn-soft text-warn",
  };
  const label = { verified: "Verified", pending: "Verification pending", partial: "Partly verified" };
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${map[status]}`}>{label[status]}</span>;
}

function EvidencePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageTitle eyebrow="Evidence" title="Every claim, with its source">
        Nothing on this page is stated as settled fact unless it has a source we could check. Where verification is incomplete, it is labelled as such
        rather than quietly dropped.
      </PageTitle>

      <div className="space-y-5">
        {CLAIMS.map((c) => (
          <article key={c.claim} className="card-soft p-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip status={c.status} />
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{c.area}</span>
            </div>
            <h2 className="mt-2 font-display text-lg font-bold">{c.claim}</h2>
            <dl className="mt-3 space-y-1 text-sm">
              <Row label="Organisation" value={c.org} />
              <Row label="Date" value={c.date} />
              <Row label="Relevant finding" value={c.finding} />
              <Row label="Why it matters here" value={c.relevance} />
              <Row label="Limitations" value={c.limits} />
            </dl>
            {c.link && (
              <a href={c.link} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline">
                Open source <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </article>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <Callout tone="info" title="Data and model sources used by the app">
          <ul className="space-y-1">
            <li>• {NASA_ATTRIBUTION}</li>
            <li>• Verification of the NASA POWER response shape, parameters and units was done against the live service before implementation.</li>
            <li>• Analysis rules: {MODEL_VERSION}. The rules are heuristic and deliberately transparent, not a trained model.</li>
            <li>• The photo check is a prototype prompt around a vision model, labelled as such wherever it appears.</li>
          </ul>
        </Callout>

        <Callout tone="warn" title="How to read this page">
          <p>
            A “verification pending” label means we have not been able to confirm the figure against its original source well enough to repeat it as fact.
            Treat those numbers as reported claims, and check them before publishing or quoting them.
          </p>
        </Callout>

        <p className="text-sm text-muted-foreground">
          Want to see how these ideas behave on real screens?{" "}
          <Link to="/lab" className="font-semibold text-primary underline">
            Open the Visual Solar Lab
          </Link>{" "}
          or read the{" "}
          <Link to="/about" className="font-semibold text-primary underline">
            limitations
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem,1fr]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

const CLAIMS = [
  {
    claim: "Dust reportedly reduced output by 68–78% over a year without cleaning (northern Nigeria).",
    status: "pending",
    area: "Soiling losses",
    org: "Reported study, northern Nigeria",
    date: "Reported figure — original publication not confirmed",
    finding: "A reported 68–78% output reduction over a year on uncleaned arrays.",
    relevance:
      "Motivates treating dust as a first-class cause of a slow decline rather than a rare event, which is why the demo project “gradual dust-related decline” exists.",
    limits:
      "Not independently verified in this work. Losses of this size depend strongly on local dust, rain patterns and cleaning practice, so the app never quotes a percentage — it only reports the observed drop for your own system.",
    link: "",
  },
  {
    claim: "South Africa accounts for about 71% of Africa's 3.37 GW rooftop solar capacity.",
    status: "pending",
    area: "Market context",
    org: "Reported market analysis",
    date: "Reported figure — original publication not confirmed",
    finding: "A concentration of rooftop solar capacity in one country.",
    relevance: "Frames why small, distributed systems matter for energy access across the region.",
    limits: "Not independently verified here. Capacity figures move quickly and depend on what counts as “rooftop”.",
    link: "",
  },
  {
    claim: "A Netherlands study reportedly reduced solar-yield forecast error from 12.2% to 7.4% using one month of site data.",
    status: "pending",
    area: "Calibration",
    org: "Reported study, the Netherlands",
    date: "Reported figure — original publication not confirmed",
    finding: "Site-specific calibration over one month roughly halved forecast error.",
    relevance:
      "This is the idea behind the calibration block: after 7–28 clean days the app computes a correction factor and shows it before and after.",
    limits:
      "Not independently verified here, and a temperate European rooftop is a different setting from an equatorial or high-dust site. The app therefore labels its own calibration as a prototype correction, not a validated forecast model.",
    link: "",
  },
];