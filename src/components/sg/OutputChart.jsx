import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/** Actual versus expected daily energy, with the 7-day average and an optional forecast band. */
export function OutputChart({ data, forecast = [], height = 300 }) {
  const merged = [
    ...data.map((d) => ({ ...d, band: null, mid: null })),
    ...forecast.map((f) => ({ date: f.date, actual: null, expected: null, avg7: null, band: [f.low, f.high], mid: f.mid })),
  ];

  return (
    <div style={{ height }} role="img" aria-label="Chart of actual versus expected daily energy, plus a seven day forecast">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={merged} margin={{ left: -18, right: 8, top: 8 }}>
          <CartesianGrid stroke="oklch(var(--border))" strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={(d) => String(d).slice(5)} fontSize={11} minTickGap={24} stroke="oklch(var(--muted-foreground))" />
          <YAxis fontSize={11} stroke="oklch(var(--muted-foreground))" />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid oklch(var(--border))", fontSize: 12 }}
            formatter={(v) => (Array.isArray(v) ? `${v[0]}–${v[1]} kWh` : v == null ? "no reading" : `${v} kWh`)}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="expected" name="Expected" stroke="oklch(var(--chart-2))" strokeWidth={2} strokeDasharray="6 4" dot={false} connectNulls={false} />
          <Line type="monotone" dataKey="actual" name="Actual" stroke="oklch(var(--chart-1))" strokeWidth={2.5} dot={{ r: 2 }} connectNulls={false} />
          <Line type="monotone" dataKey="avg7" name="7-day average" stroke="oklch(var(--chart-3))" strokeWidth={1.5} dot={false} />
          {forecast.length > 0 && <Area dataKey="band" name="Forecast range" fill="oklch(var(--chart-2))" fillOpacity={0.25} stroke="none" />}
          {forecast.length > 0 && <Line dataKey="mid" name="Forecast" stroke="oklch(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}