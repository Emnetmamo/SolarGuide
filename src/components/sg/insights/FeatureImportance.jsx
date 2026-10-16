/** Share of the model's predictive weight carried by each input. */
export function FeatureImportance({ features }) {
  if (!features?.length) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">What drives the prediction</p>
      <ul className="space-y-3">
        {features.map((f) => (
          <li key={f.name}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium">{f.name}</span>
              <span className="text-muted-foreground tabular-nums">{f.value}%</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-2 rounded-full bg-leaf" style={{ width: `${f.value}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        How strongly each input moves output across the training days. Sunlight dominating is expected; temperature dominating usually means little variation in
        sun.
      </p>
    </div>
  );
}