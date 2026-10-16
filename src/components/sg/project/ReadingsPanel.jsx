import { useEffect, useState } from "react";
import { CloudOff, Loader2, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Callout, Field } from "@/components/sg/bits";
import { flushQueue, pendingCount } from "@/lib/offline-queue";
import { fmtDate, fmtNum, todayIso } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Manual daily entry, the offline queue, and the recent readings table. */
export function ReadingsPanel({ analysis, isDemo, onAdd, adding, onOpenImport, onSynced }) {
  const [date, setDate] = useState(todayIso());
  const [kwh, setKwh] = useState("");
  const [irradiance, setIrradiance] = useState("");
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setPending(pendingCount());
    setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  async function submit(event) {
    event.preventDefault();
    const value = Number(kwh);
    if (!kwh || Number.isNaN(value) || value < 0) {
      setMessage("Enter the day's energy in kWh — a number of 0 or more.");
      return;
    }
    const row = { date, energy_kwh: value, irradiance: irradiance === "" ? null : Number(irradiance), source: "manual" };
    const queued = await onAdd(row);
    if (queued === "queued") {
      setPending(pendingCount());
      setMessage("Saved on this device. It will sync when you are back online.");
    } else {
      setMessage("Reading saved.");
    }
    setKwh("");
    setIrradiance("");
  }

  async function sync() {
    setSyncing(true);
    try {
      const sent = await flushQueue((payload) => onAdd(payload, true));
      setPending(pendingCount());
      setMessage(sent ? `${sent} saved reading(s) synced.` : "Nothing to sync.");
      if (sent && onSynced) onSynced();
    } finally {
      setSyncing(false);
    }
  }

  const recent = [...(analysis.chart ?? [])].slice(-14).reverse();

  return (
    <div className="space-y-5">
      {!online && (
        <Callout tone="warn" title="You are offline">
          Readings you type now are saved on this device and sync automatically when the connection returns.
        </Callout>
      )}
      {pending > 0 && (
        <Callout tone="info">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2">
              <CloudOff className="h-4 w-4" /> {pending} reading(s) saved on this device, not synced yet.
            </span>
            <Button size="sm" variant="outline" disabled={syncing} onClick={sync}>
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Sync now
            </Button>
          </div>
        </Callout>
      )}

      {isDemo ? (
        <Callout tone="sun" title="Demo project — readings are generated">
          These readings are synthetic and cannot be changed. Open a project you created to add or import readings.
        </Callout>
      ) : (
        <div className="card-soft p-5">
          <form onSubmit={submit} className="space-y-4">
            <h2 className="font-display text-lg font-bold">Add a reading from the inverter display</h2>
            <p className="text-sm text-muted-foreground">Copy today's kWh figure from the inverter screen. One row per day is enough.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Date" htmlFor="reading-date">
                <Input id="reading-date" type="date" max={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Field label="Energy today (kWh)" htmlFor="reading-kwh">
                <Input id="reading-kwh" inputMode="decimal" value={kwh} onChange={(e) => setKwh(e.target.value)} placeholder="11.2" />
              </Field>
              <Field label="Sunshine (optional)" htmlFor="reading-irr" hint="kWh/m²/day, if you have it">
                <Input id="reading-irr" inputMode="decimal" value={irradiance} onChange={(e) => setIrradiance(e.target.value)} placeholder="5.1" />
              </Field>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={adding}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save reading
              </Button>
              <Button type="button" variant="outline" onClick={onOpenImport}>
                <Upload className="h-4 w-4" /> Import a CSV
              </Button>
            </div>
            {message && <p className="text-sm font-medium text-primary">{message}</p>}
          </form>
        </div>
      )}

      <div className="card-soft overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-bold">Recent days</h2>
          <p className="text-sm text-muted-foreground">Expected is weather-adjusted. A day with no reading shows as a gap, never as zero production.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Day</th>
                <th className="px-4 py-2">Actual</th>
                <th className="px-4 py-2">Expected</th>
                <th className="px-4 py-2">Difference</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((row) => {
                const diff = row.actual == null ? null : Math.round((row.expected - row.actual) * 10) / 10;
                return (
                  <tr key={row.date} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-2">{fmtDate(row.date)}</td>
                    <td className="px-4 py-2 font-medium">{row.actual == null ? <span className="text-muted-foreground">no reading</span> : `${fmtNum(row.actual, 1)} kWh`}</td>
                    <td className="px-4 py-2 text-muted-foreground">{fmtNum(row.expected, 1)} kWh</td>
                    <td className={cn("px-4 py-2 font-medium", diff == null ? "text-muted-foreground" : diff > 0 ? "text-warn" : "text-ok")}>
                      {diff == null ? "—" : `${diff > 0 ? "−" : "+"}${fmtNum(Math.abs(diff), 1)} kWh`}
                    </td>
                  </tr>
                );
              })}
              {!recent.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    No readings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}