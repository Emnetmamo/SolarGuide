import { lazy, Suspense } from "react";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { Box, Camera, ShieldCheck } from "lucide-react";
import { Callout, GlossaryButton } from "@/components/sg/bits";
import { PageTitle } from "@/components/sg/shell";
import { PhotoCheck } from "@/components/sg/lab/PhotoCheck";

const SolarLab3D = lazy(() => import("@/components/sg/lab/SolarLab3D"));

export const Route = createFileRoute("/_site/lab")({
  head: () => ({
    meta: [
      { title: "Visual Solar Lab — SolarGuide" },
      { name: "description", content: "Explore a home solar installation in 3D, follow the energy from the roof to your sockets, tap the part you recognise, and learn what to look at safely." },
      { property: "og:title", content: "Visual Solar Lab — SolarGuide" },
      { property: "og:description", content: "Tap a part of a home solar installation to learn what it does and what to check safely." },
    ],
  }),
  component: LabPage,
});

function LabPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageTitle eyebrow="Visual Solar Lab" title="Follow the energy through a real installation">
        Turn the house and see sunlight reach the roof, run down the wall to the inverter and battery, and end up in your sockets. Tap any part to read what it does,
        what can go wrong, and the one safe thing to do next.
      </PageTitle>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <GlossaryButton />
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Box className="h-4 w-4" /> Rotatable model
        </span>
      </div>

      <ClientOnly fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted sm:h-80" />}>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted sm:h-80" />}>
          <SolarLab3D />
        </Suspense>
      </ClientOnly>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <Camera className="h-6 w-6 text-primary" /> Check a photo
        </h2>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Take a photo of the panels, the inverter display, the shading or the mounting, and get a cautious possible observation with what the image cannot
          show. Prototype AI — always labelled.
        </p>
        <div className="mt-4">
          <PhotoCheck />
        </div>
      </section>

      <div className="mt-8">
        <Callout tone="warn" title="What this page is not">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            A 3D model and a single photo cannot reveal hidden defects. They help you describe what you see and decide who to call. Never open electrical
            equipment, touch wiring or climb on the roof.
          </p>
        </Callout>
      </div>
    </div>
  );
}