"use client";

import { useEffect, useState } from "react";
import { FileText, Film, ImageIcon, Loader2 } from "lucide-react";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { type MediaItem, mediaPurposeLabel } from "@/types/media";

// Read-only viewer for media attached to a request / log / item. Resolves the stored
// private object keys into short-lived presigned GET URLs on mount — the only way to
// view them (the bucket has no public access). Clicking opens the full file in a new
// tab (still a signed URL).
export function MediaGallery({
  media,
  className,
}: {
  media?: MediaItem[];
  className?: string;
}) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const keys = (media ?? []).map((m) => m.key).filter(Boolean);
    if (keys.length === 0) return;
    let active = true;
    setLoading(true);
    (async () => {
      const res = await AuthService.getMediaUrls(getToken() ?? "", keys);
      if (!active) return;
      if (!isErr(res)) {
        const body = res.data as { success?: boolean; urls?: Record<string, string> };
        if (body.success && body.urls) setUrls(body.urls);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [media]);

  if (!media || media.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {media.map((m) => {
          const url = urls[m.key];
          const title = mediaPurposeLabel[m.purpose] ?? "File";
          return (
            <a
              key={m.key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title={title}
              className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border bg-muted"
              onClick={(e) => {
                if (!url) e.preventDefault();
              }}
            >
              {loading && !url ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : m.kind === "image" && url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={title} className="h-full w-full object-cover" />
              ) : m.kind === "video" ? (
                <Film className="size-6 text-muted-foreground" />
              ) : m.kind === "pdf" ? (
                <FileText className="size-6 text-muted-foreground" />
              ) : (
                <ImageIcon className="size-6 text-muted-foreground" />
              )}
              <span className="absolute inset-x-0 bottom-0 truncate bg-background/80 px-1 text-center text-[10px] leading-4 text-muted-foreground">
                {title}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
