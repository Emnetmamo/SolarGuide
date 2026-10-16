import { useState } from "react";
import { Check, Copy, Link2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Callout, Stat } from "@/components/sg/bits";
import { fmtDate, fmtNum } from "@/lib/format";

/** Handover summary: baseline, monitoring start, and a read-only link for the owner. */
export function HandoverPanel({ project, design, isDemo, onRotate, rotating, onStatus }) {
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
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Baseline at handover" value={fmtNum(project.baseline_kwh, 1)} unit="kWh/day" hint="What the system should produce on a typical day" />
        <Stat label="Monitoring starts" value={fmtDate(project.monitoring_start)} hint="Day one of the comparison" />
        <Stat label="Status" value={project.status} hint="Planning → installed → monitoring" />
      </div>

      <Callout tone="info" title="Owner link (read-only)">
        <p>
          This link opens a one-page report — expected versus actual, current status and next steps — with no sign-in needed. It shows only the summary
          figures and never your coordinates, notes or photos.
        </p>
        {isDemo ? (
          <p className="mt-2 font-medium">Demo projects do not have a shareable link because they are not real customer records.</p>
        ) : (
          <div className="mt-3 space-y-2">
            <code className="block break-all rounded-xl border border-border bg-card px-3 py-2 text-xs">{shareUrl}</code>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={copy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy link"}
              </Button>
              <Button size="sm" variant="ghost" disabled={rotating} onClick={onRotate}>
                {rotating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                New link
              </Button>
            </div>
          </div>
        )}
      </Callout>

      <div className="card-soft p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Link2 className="h-5 w-5 text-primary" /> Handover summary
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex justify-between gap-4">
            <span className="text-muted-foreground">Installed capacity</span>
            <span className="font-medium">{fmtNum(design?.pv_kwp, 1)} kWp</span>
          </li>
          <li className="flex justify-between gap-4">
            <span className="text-muted-foreground">Expected daily energy</span>
            <span className="font-medium">
              {fmtNum(design?.expected_daily_min, 1)}–{fmtNum(design?.expected_daily_max, 1)} kWh
            </span>
          </li>
          <li className="flex justify-between gap-4">
            <span className="text-muted-foreground">Resource source</span>
            <span className="max-w-[60%] text-right font-medium">{design?.resource_source || "Not recorded"}</span>
          </li>
        </ul>
        {!isDemo && project.status !== "monitoring" && (
          <Button className="mt-4" size="sm" onClick={() => onStatus("monitoring")}>
            Mark as installed &amp; monitoring
          </Button>
        )}
      </div>
    </div>
  );
}