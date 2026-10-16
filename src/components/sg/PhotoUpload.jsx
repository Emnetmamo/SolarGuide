const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

import { PrivateImage } from "@/components/sg/PrivateImage";

const MAX_BYTES = 8 * 1024 * 1024;

/** Photo evidence or photo-check upload. Files are stored privately — no public URL. */
export function PhotoUpload({ label = "Add a photo", hint, fileUri, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pick(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError("Please use a photo smaller than 8 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await db.integrations.Core.UploadPrivateFile({ file });
      onChange(res.file_uri);
    } catch {
      setError("The upload did not go through. Please try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        {fileUri ? (
          <>
            <PrivateImage fileUri={fileUri} alt={label} className="h-24 w-32 rounded-xl border border-border object-cover" />
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
              <X className="h-4 w-4" /> Remove
            </Button>
          </>
        ) : (
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {busy ? "Uploading…" : label}
          </Button>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={pick} />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs font-medium text-bad">{error}</p>}
    </div>
  );
}