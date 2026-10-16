import { Input } from "@/components/ui/input";
import { Callout } from "@/components/sg/bits";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "pass", label: "Pass", cls: "bg-ok text-white border-ok" },
  { value: "attention", label: "Needs attention", cls: "bg-warn text-white border-warn" },
  { value: "unchecked", label: "Not checked", cls: "bg-muted text-muted-foreground border-border" },
];

export function StepChecklist({ form, setForm }) {
  function update(label, patch) {
    setForm((f) => ({ ...f, checklist: f.checklist.map((c) => (c.label === label ? { ...c, ...patch } : c)) }));
  }

  const flagged = form.checklist.filter((c) => c.status === "attention").length;

  return (
    <div className="space-y-5">
      <Callout tone={flagged ? "warn" : "info"}>
        {flagged
          ? `${flagged} item(s) are marked as needing attention. They will be saved with the project so they are not forgotten.`
          : "Mark what you have already verified. Anything you leave as “not checked” is saved as not checked — no guessing."}
      </Callout>

      <ul className="space-y-3">
        {form.checklist.map((item) => (
          <li key={item.label} className="card-soft p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium">{item.label}</p>
              <div className="flex gap-1.5">
                {OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => update(item.label, { status: o.value })}
                    aria-pressed={item.status === o.value}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      item.status === o.value ? o.cls : "border-border bg-card text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <Input
              className="mt-3"
              value={item.notes}
              onChange={(e) => update(item.label, { notes: e.target.value })}
              placeholder="Notes (optional)"
            />
          </li>
        ))}
      </ul>

      <Callout tone="warn" title="What this checklist is not">
        It does not replace local electrical codes or an inspection by a qualified person. It is a record of what was looked at, so nothing is forgotten
        between the site visit and the installation.
      </Callout>
    </div>
  );
}