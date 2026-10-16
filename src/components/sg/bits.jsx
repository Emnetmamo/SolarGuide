import { AlertCircle, AlertTriangle, BookOpen, CheckCircle2, CircleHelp, FlaskConical, Info, Sun } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { STATUS_LABEL } from "@/lib/solar";
import { cn } from "@/lib/utils";

const STATUS_STYLE = {
  ok: "bg-ok-soft text-ok border-ok/30",
  low: "bg-warn-soft text-warn border-warn/30",
  check: "bg-bad-soft text-bad border-bad/30",
  unknown: "bg-muted text-muted-foreground border-border",
};
const STATUS_ICON = { ok: CheckCircle2, low: AlertCircle, check: AlertTriangle, unknown: CircleHelp };

export function StatusBadge({ status, size = "md" }) {
  const Icon = STATUS_ICON[status] ?? CircleHelp;
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full border font-semibold", STATUS_STYLE[status] ?? STATUS_STYLE.unknown, size === "lg" ? "px-4 py-2 text-base" : "px-3 py-1 text-sm")}
    >
      <Icon className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} aria-hidden />
      {STATUS_LABEL[status] ?? STATUS_LABEL.unknown}
    </span>
  );
}

export function DemoBadge({ className }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border-2 border-dashed border-sun/70 bg-sun/25 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-sun-foreground", className)}>
      <FlaskConical className="h-3.5 w-3.5" aria-hidden /> Demo data
    </span>
  );
}

export const GLOSSARY = {
  kWp: "Kilowatt-peak: the size of the panels — how much power they give in perfect full sun. A 3 kWp system is about 6–8 panels.",
  kWh: "Kilowatt-hour: an amount of energy. A 100 W bulb on for 10 hours uses 1 kWh.",
  inverter: "The box that turns panel electricity (DC) into the electricity your sockets use (AC). Its screen often shows today's energy.",
  irradiance: "How strong the sunlight is on the panels. Cloudy days have low irradiance.",
  "peak sun hours": "The number of 'perfect sun' hours a day is worth. 5 peak sun hours ≈ 5 hours of full midday sun.",
  "performance ratio": "The share of ideal output a real system delivers after heat, dust, wiring and inverter losses. 0.75 means 75%.",
  shade: "Anything blocking sun from the panels — trees, tanks, walls. Even small shade on one panel can cut output a lot.",
  "string voltage": "The voltage of panels wired in a row. Installers measure it to check every panel is connected.",
  earthing: "A safety wire to the ground that protects people and equipment from shocks and lightning.",
};

export function Term({ t, children }) {
  return (
    <Popover>
      <PopoverTrigger className="cursor-help border-b-2 border-dotted border-primary/50 font-medium">{children ?? t}</PopoverTrigger>
      <PopoverContent className="max-w-xs text-sm">
        <p className="font-display font-semibold text-primary">{t}</p>
        <p className="mt-1 text-muted-foreground">{GLOSSARY[t] ?? "No explanation yet."}</p>
      </PopoverContent>
    </Popover>
  );
}

export function GlossaryButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-primary hover:bg-muted">
          <BookOpen className="h-4 w-4" /> Explain the words
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Plain-language glossary</DialogTitle>
        </DialogHeader>
        <dl className="space-y-4">
          {Object.entries(GLOSSARY).map(([term, text]) => (
            <div key={term}>
              <dt className="font-display font-semibold text-primary">{term}</dt>
              <dd className="text-sm text-muted-foreground">{text}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}

const TONES = {
  info: { wrap: "border-border bg-muted/60", icon: "text-primary", Icon: Info },
  ok: { wrap: "border-ok/30 bg-ok-soft", icon: "text-ok", Icon: CheckCircle2 },
  warn: { wrap: "border-warn/30 bg-warn-soft", icon: "text-warn", Icon: AlertTriangle },
  bad: { wrap: "border-bad/30 bg-bad-soft", icon: "text-bad", Icon: AlertCircle },
  sun: { wrap: "border-sun/40 bg-sun/15", icon: "text-sun-foreground", Icon: Sun },
};

export function Callout({ tone = "info", title, children, className }) {
  const { wrap, icon, Icon } = TONES[tone] ?? TONES.info;
  return (
    <div className={cn("flex gap-3 rounded-2xl border p-4", wrap, className)}>
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", icon)} aria-hidden />
      <div className="text-sm">
        {title && <p className="font-display font-semibold">{title}</p>}
        <div className={cn(title && "mt-1", "text-foreground/85")}>{children}</div>
      </div>
    </div>
  );
}

export function Stat({ label, value, unit, hint }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-primary">
        {value}
        {unit && <span className="ml-1 text-base font-semibold text-muted-foreground">{unit}</span>}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Field({ label, hint, children, htmlFor }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
      </Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

export function EstimateNotice({ source, timestamp, fallback }) {
  return (
    <Callout tone={fallback ? "warn" : "sun"}>
      <p className="font-semibold">{fallback ? "Estimate: solar API unavailable — using fallback values." : "Solar resource from a public dataset."}</p>
      <p className="mt-1">
        {source}
        {timestamp ? ` · retrieved ${String(timestamp).slice(0, 10)}` : ""}
      </p>
      <p className="mt-1 text-xs">
        {fallback
          ? "These are built-in approximate numbers, not measured local data. Treat the estimate as a rough guide and re-run once the resource service is reachable."
          : "Location-specific monthly averages from a climate dataset, not today's weather."}
      </p>
    </Callout>
  );
}