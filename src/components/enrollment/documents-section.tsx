"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

import { type MediaItem, STAFF_DOCUMENTS } from "@/types/media";
import { MediaUpload } from "@/components/common/media-upload";
import { Section } from "./fields";

/**
 * Staff enrollment paperwork. The whole set lives in one `documents` array — each
 * upload field owns the slice matching its purpose, so adding or removing a mark
 * sheet never disturbs the Aadhaar scan next to it.
 *
 * Aadhaar is the only compulsory document. The rule is enforced again server-side
 * (assertStaffDocuments) so it can't be bypassed by a hand-rolled request.
 */
export function DocumentsSection({
  documents,
  onChange,
}: {
  documents: MediaItem[];
  onChange: (next: MediaItem[]) => void;
}) {
  const hasAadhaar = documents.some((d) => d.purpose === "aadhaar");

  // Swap in a new slice for one purpose, keeping every other purpose untouched and
  // preserving the display order defined by STAFF_DOCUMENTS.
  function setSlice(purpose: MediaItem["purpose"], next: MediaItem[]) {
    const others = documents.filter((d) => d.purpose !== purpose);
    const merged = [...others, ...next];
    const order = STAFF_DOCUMENTS.map((d) => d.purpose);
    merged.sort((a, b) => order.indexOf(a.purpose) - order.indexOf(b.purpose));
    onChange(merged);
  }

  return (
    <Section title="Documents">
      <div
        className={`mb-4 flex items-start gap-2 rounded-md border p-3 text-sm ${
          hasAadhaar
            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
            : "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400"
        }`}
      >
        {hasAadhaar ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
        ) : (
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
        )}
        <p>
          {hasAadhaar
            ? "Aadhaar is on file. Every other document is optional."
            : "An Aadhaar card upload is required before this employee can be saved. Everything else is optional."}
        </p>
      </div>

      <div className="space-y-5">
        {STAFF_DOCUMENTS.map((doc) => (
          <MediaUpload
            key={doc.purpose}
            purpose={doc.purpose}
            module="staff"
            value={documents.filter((d) => d.purpose === doc.purpose)}
            onChange={(next) => setSlice(doc.purpose, next)}
            label={doc.label}
            description={doc.description}
            required={doc.required}
            maxItems={doc.maxItems}
            // A resume is a file, never a camera shot.
            allowCamera={doc.purpose !== "resume"}
          />
        ))}
      </div>
    </Section>
  );
}
