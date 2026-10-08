"use client";

import type { EmployeeEnrollment } from "@/types/erp";
import { CATEGORY_LABEL, fmtDate } from "@/lib/enrollment-data";
import { STAFF_DOCUMENTS } from "@/types/media";
import { MediaGallery } from "@/components/common/media-gallery";
import { Section, ViewRow } from "./fields";

export function EmployeeView({ emp }: { emp: EmployeeEnrollment }) {
  return (
    <div className="space-y-6">
      <Section title="Personal">
        {/* Stored as a private object key — the gallery resolves it to a signed URL. */}
        {(emp.profilePic ?? []).length > 0 && (
          <MediaGallery media={emp.profilePic} className="pb-2" />
        )}
        <ViewRow label="Full name" value={`${emp.firstName} ${emp.lastName}`.trim()} />
        <ViewRow label="Sex" value={emp.sex} />
        <ViewRow label="Date of birth" value={fmtDate(emp.dateOfBirth)} />
        <ViewRow label="Qualification" value={emp.qualification} />
      </Section>

      <Section title="Contact">
        <ViewRow label="Email" value={emp.email} />
        <ViewRow label="Personal email" value={emp.personalEmail} />
        <ViewRow label="Phone (primary)" value={emp.phone} />
        <ViewRow label="Phone (alternate)" value={emp.alternatePhone} />
        <ViewRow label="Address" value={emp.address} />
      </Section>

      <Section title="Employment">
        <ViewRow label="Designation" value={emp.designation} />
        <ViewRow label="Center / department" value={emp.department} />
        <ViewRow label="Category" value={CATEGORY_LABEL[emp.employeeCategory] ?? emp.employeeCategory} />
        <ViewRow label="Employment type" value={emp.employmentType} />
        <ViewRow label="Joining date" value={fmtDate(emp.joiningDate)} />
        <ViewRow label="Status" value={emp.status} />
        <ViewRow label="Punch number" value={emp.punchNumber} />
      </Section>

      <Section title="Compensation">
        <ViewRow label="Salary" value={emp.salary} />
        <ViewRow label="CTC" value={emp.ctc} />
        <ViewRow label="Salary scheme" value={emp.salaryScheme} />
      </Section>

      <Section title="Statutory IDs">
        <ViewRow label="Aadhaar number" value={emp.aadharNumber} />
        <ViewRow label="PAN number" value={emp.panNumber} />
        <ViewRow label="PF number" value={emp.pfNumber} />
        <ViewRow label="UAN" value={emp.uan} />
      </Section>

      <Section title="Bank details">
        <ViewRow label="Bank name" value={emp.bankDetails?.bankName} />
        <ViewRow label="Account number" value={emp.bankDetails?.accountNumber} />
        <ViewRow label="IFSC code" value={emp.bankDetails?.ifscCode} />
      </Section>

      {/* Paperwork, grouped by type. Each thumbnail resolves to a short-lived signed
          URL on demand — the bucket itself has no public access. */}
      <Section title="Documents">
        {(emp.documents ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents on file.</p>
        ) : (
          <div className="space-y-3">
            {STAFF_DOCUMENTS.map((doc) => {
              const files = (emp.documents ?? []).filter((d) => d.purpose === doc.purpose);
              if (files.length === 0) return null;
              return (
                <div key={doc.purpose}>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">{doc.label}</p>
                  <MediaGallery media={files} />
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {emp.remarks ? (
        <Section title="Remarks">
          <p className="text-sm">{emp.remarks}</p>
        </Section>
      ) : null}
    </div>
  );
}
