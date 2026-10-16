import { Link } from "@tanstack/react-router";
import { BookOpen, Box, Home, LayoutGrid, LineChart, LogOut, ShieldCheck, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/dashboard", label: "Projects", icon: LayoutGrid },
  { to: "/insights", label: "Insights", icon: LineChart },
  { to: "/lab", label: "Solar Lab", icon: Box },
  { to: "/evidence", label: "Evidence", icon: BookOpen },
  { to: "/data", label: "Data", icon: ShieldCheck },
];

function AuthButton({ className }) {
  const { isAuthenticated, isLoadingAuth, logout, navigateToLogin } = useAuth();
  if (isLoadingAuth) return <span className={cn("h-10 w-24 rounded-full bg-muted", className)} aria-hidden />;
  if (!isAuthenticated) {
    return (
      <Button size="sm" variant="sun" className={className} onClick={navigateToLogin}>
        Sign in
      </Button>
    );
  }
  return (
    <Button size="sm" variant="ghost" className={className} onClick={() => logout()}>
      <LogOut className="h-4 w-4" /> Sign out
    </Button>
  );
}

export function AppShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col pb-24 md:pb-0">
      <header className="no-print sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-sun">
              <Sun className="h-5 w-5" />
            </span>
            SolarGuide
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                activeProps={{ className: "bg-secondary !text-primary" }}
              >
                {n.label}
              </Link>
            ))}
            <Link
              to="/about"
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
              activeProps={{ className: "bg-secondary !text-primary" }}
            >
              Limits
            </Link>
          </nav>
          <AuthButton />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="no-print border-t bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>Prototype for the OSEAS hackathon · estimates are ranges, warnings are possible causes — not diagnoses.</p>
          <nav className="flex flex-wrap gap-4">
            <Link to="/about" className="underline hover:text-primary">
              About &amp; limits
            </Link>
            <Link to="/evidence" className="underline hover:text-primary">
              Evidence
            </Link>
            <Link to="/data" className="underline hover:text-primary">
              Data &amp; consent
            </Link>
          </nav>
        </div>
      </footer>

      <nav className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t bg-card md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            activeOptions={{ exact: n.to === "/" }}
            className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs text-muted-foreground"
            activeProps={{ className: "!text-primary font-semibold" }}
          >
            <n.icon className="h-5 w-5" aria-hidden />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageTitle({ eyebrow, title, children }) {
  return (
    <div className="mb-6">
      {eyebrow && <p className="text-sm font-semibold uppercase tracking-wider text-leaf">{eyebrow}</p>}
      <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">{title}</h1>
      {children && <div className="mt-2 max-w-2xl text-muted-foreground">{children}</div>}
    </div>
  );
}