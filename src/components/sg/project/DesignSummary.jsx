import { EstimateNotice, Stat, Term } from "@/components/sg/bits";
import { ROOF_LABEL, SHADE_LABEL } from "@/lib/demo";
import { fmtNum } from "@/lib/format";

export function DesignSummary({ project, design }) {
  if (!design) {
    return <p className="card-soft p-5 text-muted-foreground">This project has no design record yet.</p>;
  }
  const monthly = design.resource_monthly ?? [];
  const fallback = /fallback|synthetic/i.test(design.resource_source ?? "");

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="System size" value={fmtNum(design.pv_kwp, 1)} unit="kWp" hint="Peak power of the panels" />
        <Stat label="Daily energy" value={`${fmtNum(design.expected_daily_min, 1)}–${fmtNum(design.expected_daily_max, 1)}`} unit="kWh" hint="Expected range, not a guarantee" />
        <Stat label="Monthly energy" value={`${fmtNum(design.expected_monthly_min, 0)}–${fmtNum(design.expected_monthly_max, 0)}`} unit="kWh" hint="Across a full year" />
        <Stat label="Performance ratio" value={fmtNum(design.performance_ratio, 2)} hint="Share of ideal output after real-world losses" />
      </div>

      <EstimateNotice source={design.resource_source} timestamp={design.resource_timestamp} fallback={fallback} />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card-soft p-5">
          <h2 className="font-display text-lg font-bold">Site &amp; roof</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Roof type" value={ROOF_LABEL[project.roof_type] ?? "Not set"} />
            <Row label="Tilt" value={design.tilt == null ? "Not sure — rough estimate" : `${fmtNum(design.tilt, 0)}°`} />
            <Row label="Direction (azimuth)" value={design.azimuth == null ? "Not sure — rough estimate" : `${fmtNum(design.azimuth, 0)}° from north`} />
            <Row label="Shade" value={SHADE_LABEL[design.shade_level] ?? "Not set"} />
          </dl>
          {monthly.length === 12 && (
            <p className="mt-4 text-xs text-muted-foreground">
              Peak sun hours by month: {monthly.map((v) => fmtNum(v, 1)).join(" · ")}
            </p>
          )}
        </div>

        <div className="card-soft p-5">
          <h2 className="font-display text-lg font-bold">Household load</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Estimated daily energy: <strong className="text-foreground">{fmtNum(design.estimated_daily_load_kwh, 1)} kWh/day</strong>
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {(design.appliances ?? []).map((a, i) => (
              <li key={`${a.name}-${i}`} className="flex justify-between gap-3 border-b border-border/60 pb-1.5">
                <span>
                  {a.name} <span className="text-muted-foreground">×{a.qty}</span>
                </span>
                <span className="text-muted-foreground">
                  {a.watts} W × {a.hours} h = <strong className="text-foreground">{fmtNum((a.watts * a.qty * a.hours) / 1000, 2)} kWh</strong>
                </span>
              </li>
            ))}
            {!(design.appliances ?? []).length && <li className="text-muted-foreground">No appliances recorded.</li>}
          </ul>
        </div>
      </div>

      <div className="card-soft p-5">
        <h2 className="font-display text-lg font-bold">Assumptions</h2>
        <p className="mt-2 text-sm text-muted-foreground">{design.assumptions || "No assumptions recorded."}</p>
        <p className="mt-3 text-sm">
          How this is calculated: <Term t="kWp">system kWp</Term> × <Term t="peak sun hours">peak sun hours</Term> ×{" "}
          <Term t="performance ratio">performance ratio</Term> = expected daily <Term t="kWh">kWh</Term>. A qualified installer must confirm final sizing,
          cabling, protection and earthing.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}