import { useMemo } from "react";
import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { fmtNum } from "@/lib/format";

/** Expected against actual output for every training day, with the perfect-prediction line. */
export function PredictionScatter({ points }) {
  const max = useMemo(
    () => Math.max(1, ...points.map((p) => Math.max(p.actual, p.predicted))) * 1.05,
    [points],
  );

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expected vs actual output</p>
      <div style={{ height: 210 }} role="img" aria-label="Scatter plot of the model's expected daily output against what each site actually produced">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ left: -18, right: 8, top: 8, bottom: 4 }}>
            <CartesianGrid stroke="oklch(var(--border))" strokeDasharray="3 3" />
            <XAxis type="number" dataKey="predicted" name="Expected" domain={[0, Math.round(max)]} fontSize={11} stroke="oklch(var(--muted-foreground))" />
            <YAxis type="number" dataKey="actual" name="Actual" domain={[0, Math.round(max)]} fontSize={11} stroke="oklch(var(--muted-foreground))" />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{ borderRadius: 12, border: "1px solid oklch(var(--border))", fontSize: 12 }}
              formatter={(v) => `${fmtNum(v, 1)} kWh`}
            />
            <ReferenceLine segment={[{ x: 0, y: 0 }, { x: Math.round(max), y: Math.round(max) }]} stroke="oklch(var(--bad))" strokeDasharray="5 4" />
            <Scatter data={points} fill="oklch(var(--chart-1))" fillOpacity={0.55} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Each dot is one monitored day, in kWh. The red dashed line is a perfect prediction — dots below it produced less than the model expected for that weather.
      </p>
    </div>
  );
}