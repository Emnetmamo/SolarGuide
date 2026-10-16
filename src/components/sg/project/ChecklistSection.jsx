import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Callout } from "@/components/sg/bits";
import { PhotoUpload } from "@/components/sg/PhotoUpload";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "pass", label: "Pass", tone: "ok" },
  { value: "attention", label: "Needs attention", tone: "warn" },
  { value: "unchecked", label: "Not checked", tone: "muted" },
];

const TONE_CLASS = {
  ok: "bg-ok text-white border-ok",
  warn: "bg-warn text-white border-warn",
  muted: "bg-muted text-muted-foreground border-border",
};

/** Pre-installation checklist: pass / needs attention / not checked, notes and optional photo. */
export function ChecklistSection({ items, onSave, saving }) {
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

  const attention = draft.filter((i) => i.status === "attention").length;
  const unchecked = draft.filter((i) => i.status === "unchecked").length;

  return (
    <div className="space-y-4">
      <Callout tone={attention || unchecked ? "warn" : "ok"}>
        {attention || unchecked
          ? `${attention} item(s) need attention and ${unchecked} are not checked yet. A checklist does not replace local electrical codes or an inspection by a qualified person.`
          : "All items marked as passing. This checklist does not replace local electrical codes or an inspection by a qualified person."}
      </Callout>

      <ul className="space-y-3">
        {draft.map((item) => (
          <li key={item.id} className="card-soft p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="font-medium">{item.label}</p>
              <div className="flex gap-1.5">
                {OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => update(item.id, { status: o.value })}
                    aria-pressed={item.status === o.value}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      item.status === o.value ? TONE_CLASS[o.tone] : "border-border bg-card text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              value={item.notes ?? ""}
              onChange={(e) => update(item.id, { notes: e.target.value })}
              placeholder="Notes (optional) — what you saw, measurements, anything to follow up"
              className="mt-3 min-h-[60px] text-sm"
            />
            <div className="mt-3">
              <PhotoUpload
                label="Add evidence photo"
                fileUri={item.evidence_file_uri}
                onChange={(uri) => update(item.id, { evidence_file_uri: uri })}
                hint="Stored privately — only you (and app admins) can open it."
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3">
        <Button disabled={!dirty || saving} onClick={() => onSave(draft)}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save checklist
        </Button>
        {dirty && !saving && <span className="text-sm text-muted-foreground">Unsaved changes</span>}
      </div>
    </div>
  );
}