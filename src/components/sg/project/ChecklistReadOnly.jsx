import { PrivateImage } from "@/components/sg/PrivateImage";
import { fmtDate } from "@/lib/format";

const STATUS_WORD = { pass: "Pass", attention: "Needs attention", unchecked: "Not checked" };
const STATUS_CLASS = { pass: "bg-ok-soft text-ok", attention: "bg-warn-soft text-warn", unchecked: "bg-muted text-muted-foreground" };

/** Demo projects are read-only, so their records are shown rather than edited. */
export function ChecklistReadOnly({ items }) {
  if (!items?.length) return <p className="card-soft p-5 text-muted-foreground">Nothing recorded for this phase yet.</p>;
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="card-soft p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{item.label}</p>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASS[item.status] ?? STATUS_CLASS.unchecked}`}>
              {STATUS_WORD[item.status] ?? "Not checked"}
            </span>
          </div>
          {item.not_measured ? (
            <p className="mt-1 text-sm text-muted-foreground">Not measured</p>
          ) : item.value ? (
            <p className="mt-1 text-sm">
              <span className="text-muted-foreground">{item.label.includes("notes") ? "" : "Value:"}</span> {item.value} {item.unit ?? ""}
            </p>
          ) : null}
          {item.notes && <p className="mt-1 text-sm text-muted-foreground">{item.notes}</p>}
          {item.recorded_at && (
            <p className="mt-1 text-xs text-muted-foreground">
              Recorded {fmtDate(item.recorded_at)}
              {item.recorded_by ? ` by ${item.recorded_by}` : ""}
            </p>
          )}
          {item.evidence_file_uri && (
            <PrivateImage fileUri={item.evidence_file_uri} alt={item.label} className="mt-3 h-32 w-48 rounded-xl border border-border object-cover" />
          )}
        </li>
      ))}
    </ul>
  );
}