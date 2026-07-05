"use client";

import { useRef, useState } from "react";
import { Camera, Upload, X, FileText, Film, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  type MediaItem,
  type MediaKind,
  type MediaModule,
  type MediaPurpose,
  acceptFor,
  extFromName,
  kindOfContentType,
  maxSizeFor,
} from "@/types/media";

// Upload a single file straight to the private S3 bucket via a presigned PUT URL.
// The server signs the URL against the exact content type, so we must PUT with the
// same header. Returns the persisted MediaItem (only the object key + metadata).
async function uploadToS3(
  file: File,
  purpose: MediaPurpose,
  module: MediaModule,
): Promise<MediaItem> {
  const contentType = file.type || "application/octet-stream";
  const kind = kindOfContentType(contentType);
  if (file.size > maxSizeFor(kind)) {
    throw new Error(`${file.name} is too large (max ${Math.round(maxSizeFor(kind) / 1048576)} MB)`);
  }
  const res = await AuthService.getUploadUrl(getToken() ?? "", {
    purpose,
    module,
    contentType,
    ext: extFromName(file.name),
    size: file.size,
  });
  if (isErr(res)) throw new Error("Connection Error");
  const body = res.data as {
    success?: boolean;
    msg?: string;
    key?: string;
    uploadUrl?: string;
    kind?: MediaKind;
  };
  if (!body.success || !body.uploadUrl || !body.key) {
    throw new Error(body.msg ?? "Upload is not available");
  }
  const put = await fetch(body.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": contentType },
  });
  if (!put.ok) throw new Error(`Upload failed (${put.status})`);
  return {
    key: body.key,
    kind: body.kind ?? kind,
    purpose,
    contentType,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };
}

export function MediaUpload({
  purpose,
  module,
  value,
  onChange,
  label,
  description,
  required = false,
}: {
  purpose: MediaPurpose;
  module: MediaModule;
  value: MediaItem[];
  onChange: (next: MediaItem[]) => void;
  label: string;
  description?: string;
  required?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  // Object URLs for instant local preview (no round-trip to S3 for what we just uploaded).
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    const added: MediaItem[] = [];
    const newPreviews: Record<string, string> = {};
    for (const file of Array.from(files)) {
      try {
        const item = await uploadToS3(file, purpose, module);
        added.push(item);
        if (item.kind === "image") newPreviews[item.key] = URL.createObjectURL(file);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      }
    }
    if (added.length) {
      setPreviews((p) => ({ ...p, ...newPreviews }));
      onChange([...value, ...added]);
    }
    setBusy(false);
    if (cameraRef.current) cameraRef.current.value = "";
    if (fileRef.current) fileRef.current.value = "";
  }

  function remove(key: string) {
    onChange(value.filter((m) => m.key !== key));
    setPreviews((p) => {
      const next = { ...p };
      if (next[key]) URL.revokeObjectURL(next[key]);
      delete next[key];
      return next;
    });
  }

  return (
    <div className="space-y-2">
      <Label>
        {label}{" "}
        <span className="text-xs font-normal text-muted-foreground">
          {required ? "(required)" : "(optional)"}
        </span>
      </Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => cameraRef.current?.click()}
        >
          <Camera className="size-4" /> Take photo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="size-4" /> Upload file
        </Button>
        {busy && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={fileRef}
        type="file"
        accept={acceptFor[purpose]}
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {value.map((m) => (
            <div
              key={m.key}
              className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border bg-muted"
            >
              {m.kind === "image" && previews[m.key] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previews[m.key]} alt="upload" className="h-full w-full object-cover" />
              ) : m.kind === "video" ? (
                <Film className="size-7 text-muted-foreground" />
              ) : (
                <FileText className="size-7 text-muted-foreground" />
              )}
              <button
                type="button"
                onClick={() => remove(m.key)}
                className="absolute right-0.5 top-0.5 rounded-full bg-background/90 p-0.5 text-foreground shadow hover:bg-background"
                aria-label="Remove"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
