import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Callout } from "@/components/sg/bits";
import { DAILY_TEMPLATE, GENERATION_TEMPLATE, UNITS_NOTE, WEATHER_TEMPLATE, downloadText, parseDailyCsv, parseGenerationCsv, parseWeatherCsv } from "@/lib/csv";
import { fmtNum } from "@/lib/format";

function parse(text) {
  const first = text.split(/\r?\n/)[0] ?? "";
  return /DATE_TIME/i.test(first) ? parseGenerationCsv(text) : parseDailyCsv(text);
}

/** Import a readings CSV (simple daily file, or the plant 15-minute export), with a preview first. */
export function CsvImportDialog({ open, onOpenChange, onImport, busy }) {
  const [main, setMain] = useState(null);
  const [weather, setWeather] = useState(null);

  const rows = useMemo(() => {
    if (!main) return [];
    const byDate = weather?.parsed.byDate ?? {};
    return main.parsed.rows.map((r) => ({
      ...r,
      irradiance: r.irradiance ?? byDate[r.date]?.irradiance ?? null,
      temp: r.temp ?? byDate[r.date]?.temp ?? null,
    }));
  }, [main, weather]);

  const errors = [...(main?.parsed.errors ?? []), ...(weather?.parsed.errors ?? [])];
  const warnings = [...(main?.parsed.warnings ?? []), ...(weather?.parsed.warnings ?? [])];

  async function pickMain(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setWeather(null);
    setMain({ name: file.name, parsed: parse(await file.text()) });
  }

  async function pickWeather(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setWeather({ name: file.name, parsed: parseWeatherCsv(await file.text()) });
  }

  function reset() {
    setMain(null);
    setWeather(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import readings from a file</DialogTitle>
          <DialogDescription>Nothing is saved until you press Import — you can check the rows and errors first.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 rounded-2xl border border-border p-4">
            <p className="font-semibold">1. Readings file</p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted">
              <FileSpreadsheet className="h-4 w-4" /> Choose a CSV
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={pickMain} />
            </label>
            {main && (
              <p className="text-sm text-muted-foreground">
                {main.name} · detected <strong>{main.parsed.kind === "generation" ? "plant generation (15-minute)" : "daily readings"}</strong> format ·{" "}
                {main.parsed.rows.length} day(s)
              </p>
            )}
          </div>

          <div className="space-y-2 rounded-2xl border border-border p-4">
            <p className="font-semibold">2. Weather file (optional)</p>
            <p className="text-xs text-muted-foreground">Adds irradiance and temperature per day, so the expectation can be adjusted for cloudy weather.</p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted">
              <Upload className="h-4 w-4" /> Choose a weather CSV
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={pickWeather} />
            </label>
            {weather && <p className="text-sm text-muted-foreground">{weather.name} · matched {Object.keys(weather.parsed.byDate).length} day(s)</p>}
          </div>

          {errors.length > 0 && (
            <Callout tone="bad" title={`${errors.length} problem(s) found — those rows are skipped`}>
              <ul className="max-h-40 space-y-1 overflow-y-auto">
                {errors.slice(0, 25).map((e) => (
                  <li key={e} className="flex gap-2">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> {e}
                  </li>
                ))}
              </ul>
            </Callout>
          )}
          {warnings.length > 0 && (
            <Callout tone="warn" title="Worth checking">
              <ul className="space-y-1">
                {warnings.slice(0, 10).map((w) => (
                  <li key={w} className="flex gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {w}
                  </li>
                ))}
              </ul>
            </Callout>
          )}

          {rows.length > 0 && (
            <div className="space-y-2">
              <p className="font-semibold">Preview ({rows.length} rows)</p>
              <div className="max-h-56 overflow-auto rounded-2xl border border-border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Energy kWh</th>
                      <th className="px-3 py-2">Irradiance</th>
                      <th className="px-3 py-2">Temp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 60).map((r) => (
                      <tr key={r.date} className="border-b border-border/60 last:border-0">
                        <td className="px-3 py-1.5">{r.date}</td>
                        <td className="px-3 py-1.5 font-medium">{fmtNum(r.energy_kwh, 2)}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{r.irradiance == null ? "—" : fmtNum(r.irradiance, 2)}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{r.temp == null ? "—" : fmtNum(r.temp, 1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">Existing rows for the same date are updated rather than duplicated. Missing days stay missing.</p>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Templates &amp; units</p>
            <p className="mt-1">{UNITS_NOTE.daily}</p>
            <p className="mt-1">{UNITS_NOTE.generation}</p>
            <p className="mt-1">{UNITS_NOTE.weather}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => downloadText("solarguide-daily-template.csv", DAILY_TEMPLATE)}>
                <Download className="h-4 w-4" /> Daily template
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadText("Plant_2_Generation_Data_template.csv", GENERATION_TEMPLATE)}>
                <Download className="h-4 w-4" /> Plant generation
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadText("Plant_2_Weather_Sensor_Data_template.csv", WEATHER_TEMPLATE)}>
                <Download className="h-4 w-4" /> Weather sensor
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!rows.length || busy}
            onClick={async () => {
              const ok = await onImport(rows);
              if (ok !== false) {
                reset();
                onOpenChange(false);
              }
            }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Import {rows.length ? `${rows.length} day(s)` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}