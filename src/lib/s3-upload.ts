// Browser → S3 upload pipeline.
//
// Every file goes straight from the browser to the PRIVATE bucket via a short-lived
// presigned PUT URL — it never passes through our Express server, so a 40 MB video
// costs us no bandwidth and no request time.
//
// Four things keep that path cheap and reliable:
//   1. Photos are downscaled and re-encoded before upload. A modern phone camera
//      produces 4-8 MB per shot; an Aadhaar scan is perfectly legible at 2000px, so
//      we typically ship ~10% of the bytes. Fewer bytes = faster uploads on the
//      centre's connection and less stored/transferred data to pay for.
//   2. Uploads run concurrently but bounded, so picking ten mark sheets doesn't open
//      ten sockets and starve each other.
//   3. Transient failures retry with backoff. The presigned URL is valid for five
//      minutes, so a retry can reuse it rather than re-signing.
//   4. Progress is reported per file via XHR (fetch can't do upload progress).

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import {
  type MediaItem,
  type MediaKind,
  type MediaModule,
  type MediaPurpose,
  extFromName,
  kindOfContentType,
  maxSizeFor,
} from "@/types/media";

/** Longest edge (px) a stored photo keeps. Well above what any document scan needs. */
const MAX_IMAGE_EDGE = 2000;
/** Images at or under this are shipped untouched — re-encoding would only cost time. */
const COMPRESS_THRESHOLD = 600 * 1024;
const JPEG_QUALITY = 0.82;

/** Parallel PUTs in flight. Enough to saturate a typical link, few enough to be fair. */
const CONCURRENCY = 3;
const MAX_ATTEMPTS = 3;

export interface UploadProgress {
  /** 0-1 across the whole batch. */
  fraction: number;
  done: number;
  total: number;
}

/**
 * Downscale + re-encode an image so we upload a fraction of the original bytes.
 * Returns the original file untouched when it is already small, isn't a
 * canvas-decodable image (HEIC on most browsers), or when compression wouldn't help.
 */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size <= COMPRESS_THRESHOLD) return file;
  if (typeof createImageBitmap !== "function") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    // Keep the original if the round-trip didn't actually save anything.
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: file.lastModified });
  } catch {
    // HEIC and other formats the browser can't decode fall through unchanged; the
    // server accepts them as-is.
    return file;
  }
}

/** PUT the body to the presigned URL, reporting progress. Resolves on 2xx. */
function putWithProgress(
  url: string,
  body: Blob,
  contentType: string,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      // 4xx is a signature/permission problem — retrying is pointless, so mark it.
      else reject(Object.assign(new Error(`Upload failed (${xhr.status})`), { permanent: xhr.status < 500 }));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));
    xhr.send(body);
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Upload one file and return the MediaItem to persist (object key + metadata only —
 * never a URL). Retries transient failures; a 4xx from S3 fails immediately.
 */
export async function uploadOne(
  file: File,
  purpose: MediaPurpose,
  module: MediaModule,
  onProgress?: (fraction: number) => void,
): Promise<MediaItem> {
  const payload = await compressImage(file);
  const contentType = payload.type || "application/octet-stream";
  const kind = kindOfContentType(contentType);
  if (payload.size > maxSizeFor(kind)) {
    throw new Error(
      `${file.name} is too large (max ${Math.round(maxSizeFor(kind) / 1048576)} MB)`,
    );
  }

  const res = await AuthService.getUploadUrl(getToken() ?? "", {
    purpose,
    module,
    contentType,
    ext: extFromName(payload.name),
    size: payload.size,
    originalName: file.name,
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

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await putWithProgress(body.uploadUrl, payload, contentType, onProgress);
      return {
        key: body.key,
        kind: body.kind ?? kind,
        purpose,
        contentType,
        size: payload.size,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      };
    } catch (e) {
      lastError = e;
      if ((e as { permanent?: boolean }).permanent) break;
      if (attempt < MAX_ATTEMPTS) await sleep(400 * 2 ** (attempt - 1));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Upload failed");
}

/**
 * Upload a batch with bounded concurrency. Never rejects — one bad file shouldn't
 * discard the rest — so callers get both the successes and the per-file errors and
 * decide what to surface.
 */
export async function uploadBatch(
  files: File[],
  purpose: MediaPurpose,
  module: MediaModule,
  onProgress?: (p: UploadProgress) => void,
): Promise<{ uploaded: MediaItem[]; errors: string[] }> {
  const uploaded: MediaItem[] = [];
  const errors: string[] = [];
  // Per-file completion fraction, so the aggregate bar moves smoothly rather than
  // jumping once per finished file.
  const fractions = new Array<number>(files.length).fill(0);

  const report = () => {
    if (!onProgress) return;
    const sum = fractions.reduce((a, b) => a + b, 0);
    onProgress({
      fraction: files.length ? sum / files.length : 1,
      done: uploaded.length + errors.length,
      total: files.length,
    });
  };

  let cursor = 0;
  async function worker() {
    for (;;) {
      const i = cursor++;
      if (i >= files.length) return;
      try {
        const item = await uploadOne(files[i], purpose, module, (f) => {
          fractions[i] = f;
          report();
        });
        fractions[i] = 1;
        uploaded.push(item);
      } catch (e) {
        fractions[i] = 1;
        errors.push(e instanceof Error ? e.message : `${files[i].name} failed to upload`);
      }
      report();
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, files.length) }, () => worker()),
  );
  return { uploaded, errors };
}
