// Media attached to asset/inventory operations (invoice, evidence, damage proof),
// to students, and to staff enrollment records (Aadhaar, PAN, passbook, …).
// Mirrors the backend `media` embedded sub-schema (models/media.js). We persist only
// the private S3 object key — viewing always goes through a freshly presigned GET URL
// resolved via AuthService.getMediaUrls. Nothing here is ever a public URL.

export type MediaKind = "image" | "video" | "pdf";
export type MediaPurpose =
  | "invoice"
  | "evidence"
  | "damage"
  | "profile"
  | "aadhaar"
  | "challan"
  | "pan"
  | "passbook"
  | "marksheet"
  | "photo"
  | "resume"
  | "other";
export type MediaModule = "asset" | "inventory" | "student" | "staff";

export interface MediaItem {
  key: string;
  kind: MediaKind;
  purpose: MediaPurpose;
  contentType?: string;
  size?: number;
  /** Filename as the user uploaded it — shown in the admin file browser. */
  originalName?: string;
  uploadedByEmail?: string;
  uploadedAt?: string;
}

export const mediaPurposeLabel: Record<MediaPurpose, string> = {
  invoice: "Invoice",
  evidence: "Evidence",
  damage: "Damage proof",
  profile: "Profile picture",
  aadhaar: "Aadhaar card",
  challan: "Registration challan",
  pan: "PAN card",
  passbook: "Passbook (1st page)",
  marksheet: "Mark sheet / certificate",
  photo: "Photo",
  resume: "Resume",
  other: "Other document",
};

// Scanned paperwork: a photo or a PDF.
const SCAN = "image/jpeg,image/png,image/webp,image/heic,application/pdf";
// Photo only.
const PHOTO = "image/jpeg,image/png,image/webp,image/heic";
// Proof of a physical event: photo or a short video.
const PROOF = "image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm";

// Accept attributes for the file picker, per purpose. Mirrors `typesFor` on the
// server (methods/actions.js) — keep the two in step.
export const acceptFor: Record<MediaPurpose, string> = {
  invoice: SCAN,
  evidence: PROOF,
  damage: PROOF,
  profile: PHOTO,
  aadhaar: SCAN,
  challan: SCAN,
  pan: SCAN,
  passbook: SCAN,
  marksheet: SCAN,
  photo: SCAN,
  resume: SCAN,
  other: SCAN,
};

/**
 * Staff enrollment paperwork, in form order. Aadhaar is the only compulsory
 * document — the server enforces the same rule in assertStaffDocuments, so a
 * hand-rolled request can't skip it.
 */
export const STAFF_DOCUMENTS: {
  purpose: MediaPurpose;
  label: string;
  description: string;
  required: boolean;
  maxItems?: number;
}[] = [
  {
    purpose: "aadhaar",
    label: "Aadhaar card",
    description: "Photo or scan of both sides. Required for every staff member.",
    required: true,
  },
  { purpose: "pan", label: "PAN card", description: "Photo or scan.", required: false },
  {
    purpose: "passbook",
    label: "Bank passbook (1st page)",
    description: "The page showing account number and IFSC.",
    required: false,
  },
  {
    purpose: "marksheet",
    label: "Mark sheets / certificates",
    description: "Highest qualification and any relevant certifications.",
    required: false,
  },
  { purpose: "photo", label: "Photos", description: "Additional passport photos.", required: false },
  { purpose: "resume", label: "Resume", description: "CV as a PDF or scan.", required: false },
  {
    purpose: "other",
    label: "Other uploads",
    description: "Anything else worth keeping on file.",
    required: false,
  },
];

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

/** Human-readable byte size for file listings. */
export function formatBytes(bytes?: number): string {
  if (!bytes || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return mb < 10 ? `${mb.toFixed(1)} MB` : `${Math.round(mb)} MB`;
}

/** Best available display name for a stored object. */
export function fileDisplayName(m: Pick<MediaItem, "key" | "originalName">): string {
  return m.originalName || m.key.split("/").pop() || m.key;
}
