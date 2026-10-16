import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/sg/bits";
import { PhotoUpload } from "@/components/sg/PhotoUpload";
import { useAuth } from "@/lib/AuthContext";
import { runPhotoCheck } from "@/lib/server-fns";
import { VISION_VERSION } from "@/lib/solar";

const AREAS = [
  { key: "panel", label: "Panel surface" },
  { key: "inverter", label: "Inverter / display" },
  { key: "shading", label: "Shading around panels" },
  { key: "mounting", label: "Mounting & cables" },
];

/** AI photo check. Cautious, transparent, and clearly labelled as a prototype. */
export function PhotoCheck() {
  const { isAuthenticated, isLoadingAuth, navigateToLogin } = useAuth();
  const [area, setArea] = useState("panel");
  const [fileUri, setFileUri] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = useServerFn(runPhotoCheck);

  async function check() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await run({ data: { area, file_uri: fileUri } });
      setResult(res);
    } catch {
      setError("The photo check could not run. Please try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {AREAS.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => setArea(a.key)}
            aria-pressed={area === a.key}
            className={
              area === a.key
                ? "rounded-full border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                : "rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted"
            }
          >
            {a.label}
          </button>
        ))}
      </div>

      {isLoadingAuth ? (
        <div className="h-28 animate-pulse rounded-2xl bg-muted" aria-hidden />
      ) : !isAuthenticated ? (
        <Callout tone="info" title="Sign in to run a photo check">
          <p>Photos are stored privately in your account, so a quick sign-in is needed before a photo can be checked.</p>
          <Button size="sm" className="mt-3" onClick={navigateToLogin}>
            Sign in
          </Button>
        </Callout>
      ) : (
        <>
          <PhotoUpload
            label="Choose a photo"
            hint="Stored privately (no public link). Photos are never added to a shared dataset without separate, explicit consent."
            fileUri={fileUri}
            onChange={setFileUri}
          />
          <Button disabled={!fileUri || busy} onClick={check}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {busy ? "Looking at the photo…" : "Check this photo"}
          </Button>
          {error && <p className="text-sm font-medium text-bad">{error}</p>}
        </>
      )}

      {result && (
        <div className="card-soft space-y-3 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-leaf">Prototype AI photo check · {result.model_version ?? VISION_VERSION}</p>
          <div>
            <p className="text-sm font-semibold">Possible observation</p>
            <p className="text-sm text-muted-foreground">{result.observation}</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Confidence</p>
            <p className="text-sm text-muted-foreground">{result.confidence} — based on this single photo only</p>
          </div>
          <div>
            <p className="text-sm font-semibold">What this photo cannot show</p>
            <p className="text-sm text-muted-foreground">{result.limits}</p>
          </div>
          <div className="rounded-xl bg-ok-soft px-3 py-2 text-sm">
            <strong>Recommended next step:</strong> {result.next_step}
          </div>
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            This is a cautious observation from one image, not a diagnosis. It never replaces a qualified installer, and it never asks you to open
            equipment, touch wiring or climb on the roof.
          </p>
        </div>
      )}
    </div>
  );
}