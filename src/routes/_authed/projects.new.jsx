import { createFileRoute } from "@tanstack/react-router";
import { NewProjectWizard } from "@/components/sg/wizard/NewProjectWizard";

export const Route = createFileRoute("/_authed/projects/new")({
  head: () => ({
    meta: [
      { title: "Plan a system — SolarGuide" },
      { name: "description", content: "Six short steps: site, roof, shade, appliances, system estimate and pre-installation checklist." },
    ],
  }),
  component: NewProjectWizard,
});