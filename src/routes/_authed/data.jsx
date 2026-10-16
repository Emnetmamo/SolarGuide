import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Database, Download, Eye, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Callout, Field } from "@/components/sg/bits";
import { PageTitle } from "@/components/sg/shell";
import { downloadText, toCsv } from "@/lib/csv";
import { exportMyReadings, getConsent, getSharedDataset, listMyProjects, saveConsent, setProjectSharing } from "@/lib/server-fns";
import { fmtDateTime, fmtNum } from "@/lib/format";

const CONSENT_VERSION = "1.0";
const SHARED_FIELDS = [
  "a pseudonymous project code (P001, P002 …)",
  "the coarse region only",
  "the day and the energy produced that day",
  "irradiance for that day, when it exists",
  "the project's design baseline in kWh/day",
];

export const Route = createFileRoute("/_authed/data")({
  head: () => ({
    meta: [
      { title: "Data & consent — SolarGuide" },
      { name: "description", content: "Choose whether anonymised readings are shared, preview exactly what would be contributed, and withdraw at any time." },
    ],
  }),
  loader: async () => {
    const [consent, own] = await Promise.all([getConsent(), listMyProjects()]);
    return { consent, own };
  },
  component: DataPage,
});

function DataPage() {
  const { consent, own } = Route.useLoaderData();
  const router = useRouter();
  const grant = useServerFn(saveConsent);
  const share = useServerFn(setProjectSharing);
  const preview = useServerFn(getSharedDataset);
  const exportAll = useServerFn(exportMyReadings);

  const latest = consent.records?.[0] ?? null;
  const granted = !!latest?.granted;
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState(null);

  const sharedPerProject = (id) => (consent.sharedReadings ?? []).filter((r) => r.project_id === id).length;

  async function setConsentState(next) {
    setBusy(true);
    try {
      await grant({ data: { granted: next, version: CONSENT_VERSION, scope: "open_dataset" } });
      toast.success(next ? "Thank you — contributions are on" : "Contributions stopped and existing rows unlinked");
      await router.invalidate();
    } catch {
      toast.error("That did not save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleProject(projectId, on) {
    try {
      await share({ data: { projectId, shared: on, consentId: latest?.id ?? "" } });
      toast.success(on ? "This project's readings are now contributed" : "This project's readings are no longer contributed");
      await router.invalidate();
    } catch {
      toast.error("That did not save. Please try again.");
    }
  }

  async function loadPreview() {
    setBusy(true);
    try {
      const res = await preview();
      setRows(res.rows);
    } catch {
      toast.error("The preview could not be built.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadAll() {
    setBusy(true);
    try {
      const all = await exportAll();
      downloadText("solarguide-my-readings.csv", toCsv(all));
      toast.success("Your readings were downloaded");
    } catch {
      toast.error("The download could not be prepared.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageTitle eyebrow="Data & consent" title="You decide what is shared">
        Contributing readings to an open solar dataset is completely separate from using SolarGuide. It is off unless you turn it on, and you can turn it
        off again whenever you like.
      </PageTitle>

      <div className="space-y-6">
        <div className="card-soft p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${granted ? "bg-ok-soft text-ok" : "bg-muted text-muted-foreground"}`}>
                {granted ? <ShieldCheck className="h-5 w-5" /> : <ShieldOff className="h-5 w-5" />}
              </span>
              <div>
                <p className="font-display text-lg font-bold">{granted ? "Contributing anonymised readings" : "Not contributing"}</p>
                <p className="text-sm text-muted-foreground">
                  {latest
                    ? `Consent version ${latest.version} · last change ${fmtDateTime(latest.withdrawn_at || latest.granted_at)}`
                    : "No consent decision recorded yet."}
                </p>
              </div>
            </div>
            {granted ? (
              <Button variant="outline" disabled={busy} onClick={() => setConsentState(false)}>
                <ShieldOff className="h-4 w-4" /> Withdraw consent
              </Button>
            ) : (
              <Button disabled={busy} onClick={() => setConsentState(true)}>
                <ShieldCheck className="h-4 w-4" /> I agree to contribute
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="card-soft p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <Database className="h-5 w-5 text-primary" /> Exactly what is shared
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {SHARED_FIELDS.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm">
              <strong>Never shared:</strong> your name, email, phone number, exact coordinates, project names, notes, private photos, or anything that
              identifies a household. Purpose: a small open dataset of real small-system performance. Access: anyone may read the anonymised set.
            </p>
          </div>

          <div className="card-soft p-5">
            <h2 className="font-display text-lg font-bold">Withdrawing later</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Withdrawing stops future contributions immediately and unlinks your readings from the shared set. Rows already downloaded by someone else
              cannot be recalled — that limit is real, and we would rather state it than hide it.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={busy} onClick={loadPreview}>
                <Eye className="h-4 w-4" /> Preview my contribution
              </Button>
              <Button variant="outline" size="sm" disabled={busy} onClick={downloadAll}>
                <Download className="h-4 w-4" /> Download my readings
              </Button>
            </div>
          </div>
        </div>

        {rows && (
          <div className="card-soft overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-display text-lg font-bold">Preview: {rows.length} contributed row(s)</h2>
              <p className="text-sm text-muted-foreground">
                {granted ? "This is exactly what another researcher would see." : "Contribution is off, so there is nothing in the shared set."}
              </p>
            </div>
            {rows.length > 0 ? (
              <div className="max-h-72 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2">Project code</th>
                      <th className="px-4 py-2">Region</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">kWh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 200).map((r, i) => (
                      <tr key={`${r.project_code}-${r.date}-${i}`} className="border-b border-border/60 last:border-0">
                        <td className="px-4 py-1.5 font-mono text-xs">{r.project_code}</td>
                        <td className="px-4 py-1.5">{r.region}</td>
                        <td className="px-4 py-1.5">{r.date}</td>
                        <td className="px-4 py-1.5 font-medium">{fmtNum(r.energy_kwh, 1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-5 py-6 text-muted-foreground">Nothing contributed yet.</p>
            )}
            <div className="border-t border-border px-5 py-3">
              <Button size="sm" variant="outline" disabled={!rows.length} onClick={() => downloadText("solarguide-shared-dataset.csv", toCsv(rows))}>
                <Download className="h-4 w-4" /> Download this set
              </Button>
            </div>
          </div>
        )}

        <div className="card-soft p-5">
          <h2 className="font-display text-lg font-bold">Choose per project</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Contribution is per project and needs consent above. Demo projects are always excluded. Readings you add afterwards start unshared — revisit
            this page after an import.
          </p>
          <ul className="mt-3 space-y-3">
            {(own.projects ?? []).map((p) => {
              const count = sharedPerProject(p.id);
              return (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-4">
                  <div>
                    <Link to="/projects/$projectId" params={{ projectId: p.id }} className="font-medium text-primary underline">
                      {p.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {p.region || "Location not set"} · {count} contributed row(s)
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={count ? "outline" : "default"}
                    disabled={!granted}
                    onClick={() => toggleProject(p.id, count === 0)}
                  >
                    {count ? "Stop contributing this project" : "Contribute this project"}
                  </Button>
                </li>
              );
            })}
            {!(own.projects ?? []).length && <li className="text-muted-foreground">You have no projects yet.</li>}
          </ul>
        </div>

        <Field label="Consent history" hint="Every change is recorded with a timestamp and the version of the wording you agreed to.">
          <ul className="space-y-2 text-sm">
            {(consent.records ?? []).map((r) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-2 border-b border-border/60 pb-2 last:border-0">
                <span>{r.granted ? "Contribution turned on" : "Contribution withdrawn"}</span>
                <span className="text-muted-foreground">
                  {fmtDateTime(r.granted_at || r.withdrawn_at)} · version {r.version}
                </span>
              </li>
            ))}
            {!(consent.records ?? []).length && <li className="text-muted-foreground">No decisions recorded yet.</li>}
          </ul>
        </Field>

        <Callout tone="info" title="Where this data lives">
          <p>
            Your projects, checklists, photos and readings are stored in your SolarGuide account and are visible only to you (and app administrators).
            Photos are stored privately with no public link. Nothing is contributed anywhere without the opt-in above.
          </p>
        </Callout>
      </div>
    </div>
  );
}