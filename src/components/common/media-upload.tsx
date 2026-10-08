"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Upload, X, FileText, Film, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { type UploadProgress, uploadBatch } from "@/lib/s3-upload";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  type MediaItem,
  type MediaModule,
  type MediaPurpose,
  acceptFor,
  fileDisplayName,
  formatBytes,
} from "@/types/media";

export function MediaUpload({
  purpose,
  module,
  value,
  onChange,
  label,
  description,
  required = false,
  maxItems,
  capture = "environment",
  allowCamera = true,
}: {
  purpose: MediaPurpose;
  module: MediaModule;
  value: MediaItem[];
  onChange: (next: MediaItem[]) => void;
  label: string;
  description?: string;
  required?: boolean;
  /** Cap on attached files; when 1, a new upload replaces the existing one. */
  maxItems?: number;
  /** Which camera the "Take photo" button opens (front camera for profile shots). */
  capture?: "environment" | "user";
  /** Hide the camera button for things nobody photographs (a resume PDF). */
  allowCamera?: boolean;
}) {
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  // Object URLs for instant local preview (no round-trip to S3 for what we just uploaded).
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = progress !== null;

  // Object URLs are process-wide allocations; drop them when the field unmounts.
  useEffect(() => {
    return () => {
      Object.values(previews).forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const files = Array.from(list);
    setProgress({ fraction: 0, done: 0, total: files.length });

    // Previews are keyed by the local File; we map them onto object keys once the
    // uploads come back, so a partly-failed batch never mislabels a thumbnail.
    const localUrls = files.map((f) =>
      f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
    );

    const { uploaded, errors } = await uploadBatch(files, purpose, module, setProgress);

    const newPreviews: Record<string, string> = {};
    uploaded.forEach((item) => {
      const idx = files.findIndex((f) => f.name === item.originalName);
      const url = idx >= 0 ? localUrls[idx] : null;
      if (item.kind === "image" && url) newPreviews[item.key] = url;
    });
    // Release previews for files that never made it.
    localUrls.forEach((url, i) => {
      if (url && !Object.values(newPreviews).includes(url)) {
        URL.revokeObjectURL(localUrls[i]!);
      }
    });

    if (uploaded.length) {
      setPreviews((p) => ({ ...p, ...newPreviews }));
      const next = [...value, ...uploaded];
      onChange(maxItems ? next.slice(-maxItems) : next);
    }
    errors.forEach((msg) => toast.error(msg));

    setProgress(null);
    if (cameraRef.current) cameraRef.current.value = "";
    if (fileRef.current) fileRef.current.value = "";
  }

  // Detaching here only edits the draft — the object is deleted from S3 when the
  // record is saved and the server sees the key is no longer referenced.
  function remove(key: string) {
    onChange(value.filter((m) => m.key !== key));
    setPreviews((p) => {
      const next = { ...p };
      if (next[key]) URL.revokeObjectURL(next[key]);
      delete next[key];
      return next;
    });
  }

  const atLimit = maxItems !== undefined && maxItems !== 1 && value.length >= maxItems;

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
        {allowCamera && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || atLimit}
            onClick={() => cameraRef.current?.click()}
          >
            <Camera className="size-4" /> Take photo
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || atLimit}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="size-4" /> Upload file
        </Button>
        {progress && (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {progress.total > 1
              ? `Uploading ${progress.done + 1} of ${progress.total} · ${Math.round(progress.fraction * 100)}%`
              : `Uploading ${Math.round(progress.fraction * 100)}%`}
          </span>
        )}
      </div>

      {progress && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-200"
            style={{ width: `${Math.max(3, Math.round(progress.fraction * 100))}%` }}
          />
        </div>
      )}

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture={capture}
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={fileRef}
        type="file"
        accept={acceptFor[purpose]}
        multiple={maxItems !== 1}
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {value.map((m) => {
            const name = fileDisplayName(m);
            return (
              <div
                key={m.key}
                title={`${name} · ${formatBytes(m.size)}`}
                className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border bg-muted"
              >
                {m.kind === "image" && previews[m.key] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previews[m.key]} alt={name} className="h-full w-full object-cover" />
                ) : m.kind === "video" ? (
                  <Film className="size-7 text-muted-foreground" />
                ) : (
                  <FileText className="size-7 text-muted-foreground" />
                )}
                <button
                  type="button"
                  onClick={() => remove(m.key)}
                  className="absolute right-0.5 top-0.5 rounded-full bg-background/90 p-0.5 text-foreground shadow hover:bg-background"
                  aria-label={`Remove ${name}`}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
