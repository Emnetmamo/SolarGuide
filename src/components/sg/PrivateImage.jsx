const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from "react";
import { Image } from "@/components/ui/image";

import { cn } from "@/lib/utils";

/**
 * Shows a photo that lives in private storage. Private files have no public URL,
 * so a short-lived signed link is created for the viewer; access still follows the
 * app's permissions.
 */
export function PrivateImage({ fileUri, alt, className, fittingType = "fill" }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setUrl(null);
    setFailed(false);
    if (!fileUri) return undefined;
    db.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: 3600 })
      .then((res) => alive && setUrl(res?.signed_url ?? null))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [fileUri]);

  if (!fileUri) return null;
  if (failed) {
    return <div className={cn("grid place-items-center rounded-xl bg-muted text-xs text-muted-foreground", className)}>Photo not available</div>;
  }
  if (!url) return <div className={cn("animate-pulse rounded-xl bg-muted", className)} aria-hidden />;
  return <Image src={url} alt={alt} className={className} fittingType={fittingType} />;
}