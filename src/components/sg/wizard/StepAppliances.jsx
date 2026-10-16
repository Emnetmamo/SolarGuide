import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Callout, Stat, Term } from "@/components/sg/bits";
import { applianceKwh } from "@/lib/solar";
import { fmtNum } from "@/lib/format";

const PRESETS = [
  { name: "LED lights", watts: 10, hours: 5 },
  { name: "Fridge", watts: 120, hours: 10 },
  { name: "TV", watts: 80, hours: 4 },
  { name: "Phone charging", watts: 10, hours: 3 },
  { name: "Water pump", watts: 550, hours: 1 },
  { name: "Fan", watts: 60, hours: 6 },
  { name: "Washing machine", watts: 500, hours: 0.5 },
  { name: "Freezer", watts: 150, hours: 8 },
];

export function StepAppliances({ form, setForm, estimate }) {
  function add(preset) {
    setForm((f) => {
      if (f.appliances.length >= 8) return f;
      const existing = f.appliances.find((a) => a.name === preset.name);
      if (existing) return { ...f, appliances: f.appliances.map((a) => (a.name === preset.name ? { ...a, qty: a.qty + 1 } : a)) };
      return { ...f, appliances: [...f.appliances, { name: preset.name, watts: preset.watts, qty: 1, hours: preset.hours }] };
    });
  }

  function update(name, patch) {
    setForm((f) => ({ ...f, appliances: f.appliances.map((a) => (a.name === name ? { ...a, ...patch } : a)) }));
  }

  function remove(name) {
    setForm((f) => ({ ...f, appliances: f.appliances.filter((a) => a.name !== name) }));
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold">Tap what the household uses</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button key={p.name} type="button" variant="outline" size="sm" onClick={() => add(p)}>
              <Plus className="h-3.5 w-3.5" /> {p.name}
            </Button>
          ))}
        </div>
      </div>

      <ul className="space-y-2">
        {form.appliances.map((a) => (
          <li key={a.name} className="card-soft grid items-end gap-3 p-4 sm:grid-cols-[1.4fr,0.7fr,0.7fr,1fr,auto]">
            <div>
              <p className="font-medium">{a.name}</p>
              <p className="text-xs text-muted-foreground">{fmtNum(applianceKwh(a), 2)} kWh/day</p>
            </div>
            <label className="text-xs text-muted-foreground">
              How many
              <Input
                className="mt-1"
                inputMode="numeric"
                value={a.qty}
                onChange={(e) => update(a.name, { qty: Math.max(0, Number(e.target.value) || 0) })}
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Watts
              <Input
                className="mt-1"
                inputMode="numeric"
                value={a.watts}
                onChange={(e) => update(a.name, { watts: Math.max(0, Number(e.target.value) || 0) })}
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Hours per day
              <Input
                className="mt-1"
                inputMode="decimal"
                value={a.hours}
                onChange={(e) => update(a.name, { hours: Math.max(0, Number(e.target.value) || 0) })}
              />
            </label>
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(a.name)} aria-label={`Remove ${a.name}`}>
              <Minus className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>

      <Stat label="Estimated daily energy" value={fmtNum(estimate.load, 1)} unit="kWh/day" hint="watts × quantity × hours ÷ 1000, added up" />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold" htmlFor="wiz-override">
            Or enter the household's daily usage directly
          </label>
          <Input
            id="wiz-override"
            className="mt-1"
            inputMode="decimal"
            placeholder="e.g. 6.5"
            value={form.load_override}
            onChange={(e) => setForm((f) => ({ ...f, load_override: e.target.value }))}
          />
        </div>
      </div>

      <Callout tone="info">
        Energy (<Term t="kWh">kWh</Term> per day) is how much the appliances use; system size (<Term t="kWp">kWp</Term>) is how big the panels are. They are
        different things, and a system is usually sized a little above the load so cloudy days still work.
      </Callout>
    </div>
  );
}