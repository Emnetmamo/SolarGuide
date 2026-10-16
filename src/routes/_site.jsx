import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/sg/shell";

export const Route = createFileRoute("/_site")({
  component: SiteLayout,
});

function SiteLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}