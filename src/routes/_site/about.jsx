import { createFileRoute, Link } from "@tanstack/react-router";
import { Callout, GlossaryButton, Term } from "@/components/sg/bits";
import { PageTitle } from "@/components/sg/shell";

export const Route = createFileRoute("/_site/about")({
  head: () => ({
    meta: [
      { title: "About & limitations — SolarGuide" },
      { name: "description", content: "How SolarGuide's estimates work, what is real, what is simulated, and when to call a qualified installer." },
      { property: "og:title", content: "About & limitations — SolarGuide" },
      { property: "og:description", content: "Estimates, data quality, model limits, and when to call a qualified installer." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageTitle eyebrow="About & limitations" title="What this tool can and cannot tell you">
        SolarGuide is a working prototype built for the OSEAS hackathon with CMU Africa. It is designed to be honest about its own limits — especially
        before anyone spends money or touches an installation.
      </PageTitle>

      <div className="mb-6">
        <GlossaryButton />
      </div>

      <div className="space-y-6">
        <section className="card-soft p-6">
          <h2 className="text-xl font-bold">How the estimates work</h2>
          <p className="mt-2 text-muted-foreground">
            Expected daily energy = system <Term t="kWp">kWp</Term> × <Term t="peak sun hours">peak sun hours</Term> ×{" "}
            <Term t="performance ratio">performance ratio</Term>, adjusted for shade and, once you are monitoring, for that day's{" "}
            <Term t="irradiance">irradiance</Term>. Every estimate is shown as a range because weather, dust, heat and installation quality all move the
            real number.
          </p>
          <p className="mt-2 text-muted-foreground">
            Monthly sunlight averages come from NASA POWER's public climatology (2001–2025). If that service cannot be reached, the app falls back to a
            built-in regional table and shows a visible notice saying so — fallback values are never presented as measured local data.
          </p>
        </section>

        <section className="card-soft p-6">
          <h2 className="text-xl font-bold">What is real, simulated or rule-based</h2>
          <ul className="mt-2 space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Real:</strong> accounts and sign-in, the database, your projects, checklists, photos and readings, the
              solar-resource lookup, the photo check, and the report you can print.
            </li>
            <li>
              <strong className="text-foreground">Rule-based:</strong> the status words and the possible causes. Status thresholds (10% "a bit low", 20%
              "needs a check") are initial prototype values, not engineering standards — they are deliberately simple and shown on screen.
            </li>
            <li>
              <strong className="text-foreground">Simulated:</strong> the three demo projects. Their data is generated on your device, deterministic, and
              always marked “DEMO DATA”.
            </li>
            <li>
              <strong className="text-foreground">Prototype AI:</strong> the photo check uses a vision model with a cautious prompt. It returns a possible
              observation, a confidence level and what the image cannot show. It is not a certified inspection and its output is never presented as a
              diagnosis.
            </li>
          </ul>
        </section>

        <section className="card-soft p-6">
          <h2 className="text-xl font-bold">Data quality and monitoring limits</h2>
          <ul className="mt-2 space-y-2 text-muted-foreground">
            <li>• A day with no reading is treated as missing, never as zero production.</li>
            <li>• Imported files are validated first: malformed dates, missing or negative values and duplicate dates are listed, and you see the rows before anything is saved.</li>
            <li>• A gap only becomes meaningful after about two weeks of readings; a single bad day is not a fault.</li>
            <li>• The calibration factor needs 7–28 clean days and excludes outage days and incomplete records.</li>
            <li>• The "risk indicator" is a transparent prototype score (70% current gap, 30% unusual days). It is not a validated probability of failure.</li>
          </ul>
        </section>

        <Callout tone="warn" title="When to call a qualified installer">
          <p>
            Any electrical work, any error code you cannot clear from the display, anything involving wiring, junction boxes, inverters, earthing or the
            roof itself. Never open equipment, touch wiring or climb on the array. The app will always route those situations to a professional.
          </p>
        </Callout>

        <section className="card-soft p-6">
          <h2 className="text-xl font-bold">Sharing and privacy</h2>
          <p className="mt-2 text-muted-foreground">
            Projects are private to the account that created them. Contributing anonymised readings to the shared dataset is a separate, opt-in choice,
            unchecked by default, recorded with a timestamp and a consent version, and revocable at any time on the{" "}
            <Link to="/data" className="font-semibold text-primary underline">
              Data &amp; consent
            </Link>{" "}
            page. Names, exact coordinates, owner details and private photos are never included — the shared set uses pseudonymous project codes and a
            coarse region.
          </p>
        </section>

        <section className="card-soft p-6">
          <h2 className="text-xl font-bold">Handover: reusing this work</h2>
          <p className="mt-2 text-muted-foreground">
            The project is intentionally split so another team can pick it up: the calculation rules live in{" "}
            <code className="rounded bg-muted px-1">solar.js</code>, the demo scenarios in <code className="rounded bg-muted px-1">demo.js</code>, CSV
            reading in <code className="rounded bg-muted px-1">csv.js</code>, and the analysis in <code className="rounded bg-muted px-1">analysis.js</code>.
            Data is stored as projects, design, checklist items, readings, findings, consent records and photo checks, so the analytics can be swapped for a
            properly validated model without touching the screens.
          </p>
          <p className="mt-2 text-muted-foreground">
            Next steps for a continuation team: a validated performance model trained on real plants, per-account owner invitations, weather-forecast
            integration for the seven-day outlook, and a documented data dictionary for the shared dataset.
          </p>
        </section>
      </div>
    </div>
  );
}