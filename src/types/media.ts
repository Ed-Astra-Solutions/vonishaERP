// Media attached to asset/inventory operations (invoice, evidence, damage proof).
// Mirrors the backend `media` embedded sub-schema (models/media.js). We persist only
// the private S3 object key — viewing always goes through a freshly presigned GET URL
// resolved via AuthService.getMediaUrls. Nothing here is ever a public URL.

export type MediaKind = "image" | "video" | "pdf";
export type MediaPurpose = "invoice" | "evidence" | "damage";
export type MediaModule = "asset" | "inventory";

export interface MediaItem {
  key: string;
  kind: MediaKind;
  purpose: MediaPurpose;
  contentType?: string;
  size?: number;
  uploadedByEmail?: string;
  uploadedAt?: string;
}

export const mediaPurposeLabel: Record<MediaPurpose, string> = {
  invoice: "Invoice",
  evidence: "Evidence",
  damage: "Damage proof",
};

// Accept attributes for the file picker, per purpose. Invoices allow PDFs; evidence
// and damage proof allow photos and short videos.
export const acceptFor: Record<MediaPurpose, string> = {
  invoice: "image/jpeg,image/png,image/webp,image/heic,application/pdf",
  evidence: "image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm",
  damage: "image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm",
};

// Client-side size ceilings (bytes), mirrored server-side in methods/actions.js.
export const MAX_IMAGE = 15 * 1024 * 1024;
export const MAX_PDF = 20 * 1024 * 1024;
export const MAX_VIDEO = 50 * 1024 * 1024;

export function kindOfContentType(contentType: string): MediaKind {
  if (contentType.startsWith("video/")) return "video";
  if (contentType === "application/pdf") return "pdf";
  return "image";
}

export function maxSizeFor(kind: MediaKind): number {
  return kind === "video" ? MAX_VIDEO : kind === "pdf" ? MAX_PDF : MAX_IMAGE;
}

/** Derive a file extension from a filename, lowercased, alnum only. */
export function extFromName(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot === -1) return "";
  return name.slice(dot + 1).replace(/[^a-z0-9]/gi, "").toLowerCase();
}
