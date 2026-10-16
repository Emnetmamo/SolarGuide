import { useState } from "react";
import { Crosshair, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Callout, Field } from "@/components/sg/bits";
import { ROOF_LABEL } from "@/lib/demo";
import { cn } from "@/lib/utils";

export function StepSite({ form, setForm }) {
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState("");

  function locate() {
    if (!navigator.geolocation) {
      setNote("This device cannot share a location. You can type the town instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, latitude: Math.round(pos.coords.latitude * 1000) / 1000, longitude: Math.round(pos.coords.longitude * 1000) / 1000, resource: null }));
        setNote("Location captured. It is used only to look up sunlight averages for this area.");
        setLocating(false);
      },
      () => {
        setNote("We could not read the location. You can type the town instead.");
        setLocating(false);
      },
      { timeout: 8000 },
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Project name" htmlFor="wiz-name" hint="For example the household or site name">
          <Input id="wiz-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Kimironko Home" />
        </Field>
        <Field label="Town or region" htmlFor="wiz-region" hint="Coarse location is enough for the estimate">
          <Input id="wiz-region" value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} placeholder="Kigali, Rwanda" />
        </Field>
      </div>

      <div className="space-y-2">
        <Button type="button" variant="outline" onClick={locate} disabled={locating}>
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />} Use my current location
        </Button>
        {form.latitude != null && (
          <p className="text-sm text-muted-foreground">
            Saved coordinates {form.latitude}, {form.longitude} — kept private and never shared with the open dataset.
          </p>
        )}
        {note && <p className="text-sm text-muted-foreground">{note}</p>}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Roof type</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.entries(ROOF_LABEL).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, roof_type: value }))}
              aria-pressed={form.roof_type === value}
              className={cn(
                "rounded-2xl border px-3 py-3 text-sm font-medium transition",
                form.roof_type === value ? "border-primary bg-secondary text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Callout tone="info">
        Your location changes the sunlight estimate: two towns a few hours apart can differ by more than 10% in daily energy.
      </Callout>
    </div>
  );
}