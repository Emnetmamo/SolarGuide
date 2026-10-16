import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Callout, EstimateNotice, Field, Stat, Term } from "@/components/sg/bits";
import { getSolarResource } from "@/lib/server-fns";
import { fmtNum } from "@/lib/format";

export function StepEstimate({ form, setForm, estimate }) {
  const fetchResource = useServerFn(getSolarResource);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (form.resource || form.latitude == null || form.longitude == null) return undefined;
    let alive = true;
    setLoading(true);
    fetchResource({ data: { latitude: form.latitude, longitude: form.longitude } })
      .then((res) => alive && setForm((f) => ({ ...f, resource: res })))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    if (form.latitude == null || form.longitude == null) {
      setForm((f) => ({ ...f, resource: { monthly: null, source: "Built-in fallback table (no location captured)", timestamp: new Date().toISOString(), fallback: true } }));
      return;
    }
    setLoading(true);
    try {
      const res = await fetchResource({ data: { latitude: form.latitude, longitude: form.longitude } });
      setForm((f) => ({ ...f, resource: res }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" disabled={loading} onClick={load}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Look up sunlight for this location
        </Button>
        <span className="text-sm text-muted-foreground">Using NASA POWER climate averages · falls back to a built-in table if unavailable</span>
      </div>

      {form.resource && (
        <EstimateNotice
          source={form.resource.source}
          timestamp={form.resource.timestamp}
          fallback={form.resource.fallback || !form.resource.monthly}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Recommended size" value={fmtNum(estimate.recommended, 1)} unit="kWp" hint={`Covers ${fmtNum(estimate.load, 1)} kWh/day`} />
        <Stat label="Average peak sun hours" value={fmtNum(estimate.pshAnnual, 1)} unit="h/day" hint="A full-sun equivalent, averaged over the year" />
        <Stat label="Chosen size" value={fmtNum(form.pv_kwp, 1)} unit="kWp" hint="Adjustable — installers often round up" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="System size (kWp)" htmlFor="wiz-kwp" hint="Panels' peak power in full sun">
          <Input
            id="wiz-kwp"
            inputMode="decimal"
            value={form.pv_kwp}
            onChange={(e) => setForm((f) => ({ ...f, pv_kwp: Math.max(0, Number(e.target.value) || 0) }))}
          />
        </Field>
        <Field label="Performance ratio" htmlFor="wiz-pr" hint="Share of ideal output after heat, dust, wiring and inverter losses. 0.75 is a common default.">
          <Input
            id="wiz-pr"
            inputMode="decimal"
            value={form.performance_ratio}
            onChange={(e) => setForm((f) => ({ ...f, performance_ratio: Math.min(1, Math.max(0.3, Number(e.target.value) || 0.75)) }))}
          />
        </Field>
      </div>

      <Button type="button" variant="secondary" size="sm" onClick={() => setForm((f) => ({ ...f, pv_kwp: estimate.recommended }))}>
        <Sparkles className="h-4 w-4" /> Use the recommended size
      </Button>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Expected daily energy" value={`${fmtNum(estimate.ranges.daily_min, 1)}–${fmtNum(estimate.ranges.daily_max, 1)}`} unit="kWh" />
        <Stat label="Expected monthly energy" value={`${fmtNum(estimate.ranges.monthly_min, 0)}–${fmtNum(estimate.ranges.monthly_max, 0)}`} unit="kWh" />
        <Stat label="Expected over a year" value={fmtNum(estimate.ranges.annual, 0)} unit="kWh" />
      </div>

      <Callout tone="warn" title="A range, not a promise">
        expected daily <Term t="kWh">kWh</Term> = size × <Term t="peak sun hours">peak sun hours</Term> ×{" "}
        <Term t="performance ratio">performance ratio</Term>, then adjusted for shade. Real output varies with weather, dust, heat and installation quality.
        Cable sizing, earthing, protection and inverter compatibility must be confirmed by a qualified installer.
      </Callout>
    </div>
  );
}