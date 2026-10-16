import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardCheck, FlaskConical, LineChart, Ruler, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SunHero } from "@/components/sg/SunHero";
import { DemoBadge } from "@/components/sg/bits";
import { DEMO_PROJECTS } from "@/lib/demo";

export const Route = createFileRoute("/_site/")({
  head: () => ({
    meta: [
      { title: "SolarGuide — plan, verify and monitor home solar" },
      {
        name: "description",
        content: "Catch preventable solar problems early: plan before installing, record evidence at handover, and spot unusual drops after installation.",
      },
      { property: "og:title", content: "SolarGuide — plan, verify and monitor home solar" },
      { property: "og:description", content: "Solar problems are often preventable. SolarGuide helps installers and owners catch them early." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const STEPS = [
  { icon: Ruler, t: "Plan", d: "Roof, shade and appliances become a sensible system size — as a range, not a promise." },
  { icon: ClipboardCheck, t: "Hand over", d: "Checklists, photos and commissioning values become the baseline." },
  { icon: LineChart, t: "Monitor", d: "Actual against expected, with gentle early warnings and a possible cause." },
];

function Landing() {
  return (
    <>
      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-20">
          <div>
            <p className="font-semibold uppercase tracking-wider text-sun">Open-source · Energy access</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight md:text-6xl">Solar problems are often preventable.</h1>
            <p className="mt-4 max-w-md text-lg opacity-90">
              SolarGuide helps installers plan it right, and helps owners notice when something looks off — using their own readings, the weather, and plain
              language.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="sun">
                <Link to="/projects/new">Plan a system</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/dashboard">Check my system</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm opacity-80">Sign in with email or Google — it takes a moment, and your projects stay private to you.</p>
          </div>
          <SunHero />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.t} className="card-soft p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary">
                  <s.icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-muted-foreground">Step {i + 1}</span>
              </div>
              <h2 className="mt-4 text-xl font-bold">{s.t}</h2>
              <p className="mt-1 text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Three demo projects</h2>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              Synthetic data, generated on your device, so you can see how each problem looks. They are clearly marked as demo records and are never
              contributed to the open dataset.
            </p>
          </div>
          <FlaskConical className="h-6 w-6 text-sun-foreground" aria-hidden />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {DEMO_PROJECTS.map((p) => (
            <Link key={p.id} to="/projects/$projectId" params={{ projectId: p.id }} className="card-soft block p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
              <DemoBadge />
              <h3 className="mt-3 text-lg font-bold">{p.name}</h3>
              <p className="text-sm text-muted-foreground">{p.region}</p>
              <p className="mt-3 text-sm">{p.scenario_label}</p>
              <p className="mt-1 text-xs text-muted-foreground">Look for it in the expected-versus-actual chart and the warnings.</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card-soft p-6">
            <h2 className="text-xl font-bold">What you can do here</h2>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li>• Plan a system in six short steps, with a location-specific sunlight estimate.</li>
              <li>• Record a pre-installation and commissioning checklist, with photos and “not measured” allowed.</li>
              <li>• Add or import daily readings, then compare actual against expected.</li>
              <li>• Get a cautious warning with a possible cause and one safe next step.</li>
              <li>• Learn where to look on the 3D panel lab, and check a photo with AI assistance.</li>
              <li>• Choose whether anonymised readings are shared, and withdraw at any time.</li>
            </ul>
          </div>
          <div className="flex gap-4 rounded-2xl border border-warn/30 bg-warn-soft p-6">
            <ShieldAlert className="h-6 w-6 shrink-0 text-warn" />
            <p className="text-sm">
              <strong>Honest limits:</strong> estimates are ranges, warnings are possible causes — not diagnoses. This is a working prototype, not a
              certified inspection. Never touch wiring, open an inverter, or climb a roof. Call a qualified installer.{" "}
              <Link to="/about" className="font-semibold underline">
                Read the limits
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}