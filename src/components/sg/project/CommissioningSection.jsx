import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Callout } from "@/components/sg/bits";
import { PhotoUpload } from "@/components/sg/PhotoUpload";
import { fmtDate } from "@/lib/format";

/** Commissioning evidence: every value can be recorded as "not measured" instead of invented. */
export function CommissioningSection({ items, onSave, saving }) {
  const [draft, setDraft] = useState(items);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDraft(items);
    setDirty(false);
  }, [items]);

  function update(id, patch) {
    setDraft((list) => list.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    setDirty(true);
  }

  const recorded = draft.filter((i) => i.not_measured || (i.value ?? "").trim()).length;

  return (
    <div className="space-y-4">
      <Callout tone={recorded === draft.length ? "ok" : "info"}>
        {recorded === draft.length
          ? "Every commissioning value is recorded (or explicitly marked not measured)."
          : `${recorded} of ${draft.length} values recorded. Anything you cannot measure can be marked "not measured" — never guess a value.`}
      </Callout>

      <ul className="space-y-3">
        {draft.map((item) => (
          <li key={item.id} className="card-soft p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-[12rem] flex-1">
                <p className="font-medium">{item.label}</p>
                {item.recorded_at && (
                  <p className="text-xs text-muted-foreground">
                    Last saved {fmtDate(item.recorded_at)} {item.recorded_by ? `by ${item.recorded_by}` : ""}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={item.value ?? ""}
                  disabled={item.not_measured}
                  onChange={(e) => update(item.id, { value: e.target.value })}
                  placeholder={item.not_measured ? "Not measured" : "Value"}
                  className="w-40"
                />
                {item.unit && item.unit !== "date" && <span className="text-sm text-muted-foreground">{item.unit}</span>}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border"
                  checked={!!item.not_measured}
                  onChange={(e) => update(item.id, { not_measured: e.target.checked, value: e.target.checked ? "" : item.value })}
                />
                Not measured
              </label>
            </div>
            <div className="mt-3">
              <PhotoUpload label="Add evidence photo" fileUri={item.evidence_file_uri} onChange={(uri) => update(item.id, { evidence_file_uri: uri })} hint="Stored privately." />
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3">
        <Button disabled={!dirty || saving} onClick={() => onSave(draft)}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save commissioning record
        </Button>
        {!dirty && !saving && (
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-ok" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}