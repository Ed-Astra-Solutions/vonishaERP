"use client";

import type { EmployeeEnrollment } from "@/types/erp";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  DEPARTMENTS,
  EMPLOYMENT_TYPES,
  SEXES,
  STATUSES,
} from "@/lib/enrollment-data";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MediaUpload } from "@/components/common/media-upload";
import { DocumentsSection } from "./documents-section";
import { DateField, Field, NumberField, Section, SelectField } from "./fields";

export function EmployeeForm({
  form,
  update,
  updateBank,
}: {
  form: EmployeeEnrollment;
  update: (patch: Partial<EmployeeEnrollment>) => void;
  updateBank: (patch: Partial<EmployeeEnrollment["bankDetails"]>) => void;
}) {
  return (
    <div className="space-y-6">
      <Section title="Personal">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="First name" value={form.firstName} onChange={(v) => update({ firstName: v })} />
          <Field label="Last name" value={form.lastName} onChange={(v) => update({ lastName: v })} />
          {/* Passport photo — camera on phone/laptop, or a file from the gallery.
              `capture="user"` opens the front camera, matching the student form. */}
          <div className="sm:col-span-2">
            <MediaUpload
              purpose="profile"
              module="staff"
              value={form.profilePic ?? []}
              onChange={(next) => update({ profilePic: next })}
              label="Profile picture"
              description="Take a photo with the camera or pick one from the gallery."
              required
              maxItems={1}
              capture="user"
            />
          </div>
          <SelectField label="Sex" value={form.sex ?? ""} onChange={(v) => update({ sex: v })} options={SEXES} />
          <DateField label="Date of birth" value={form.dateOfBirth} onChange={(v) => update({ dateOfBirth: v })} />
          <Field label="Qualification" value={form.qualification ?? ""} onChange={(v) => update({ qualification: v })} className="sm:col-span-2" />
        </div>
      </Section>

      <Section title="Contact">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Email" value={form.email} onChange={(v) => update({ email: v })} />
          <Field label="Personal email" value={form.personalEmail ?? ""} onChange={(v) => update({ personalEmail: v })} />
          <Field label="Phone (primary)" value={form.phone} onChange={(v) => update({ phone: v })} />
          <Field label="Phone (alternate)" value={form.alternatePhone ?? ""} onChange={(v) => update({ alternatePhone: v })} />
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Address</Label>
            <Textarea value={form.address ?? ""} onChange={(e) => update({ address: e.target.value })} rows={2} />
          </div>
        </div>
      </Section>

      <Section title="Employment">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Designation" value={form.designation} onChange={(v) => update({ designation: v })} />
          <SelectField label="Center / department" value={form.department} onChange={(v) => update({ department: v })} options={DEPARTMENTS} />
          <SelectField label="Category" value={form.employeeCategory} onChange={(v) => update({ employeeCategory: v })} options={CATEGORIES} labels={CATEGORY_LABEL} />
          <SelectField label="Employment type" value={form.employmentType ?? ""} onChange={(v) => update({ employmentType: v })} options={EMPLOYMENT_TYPES} />
          <DateField label="Joining date" value={form.joiningDate} onChange={(v) => update({ joiningDate: v ?? new Date().toISOString() })} />
          <SelectField label="Status" value={form.status} onChange={(v) => update({ status: v })} options={STATUSES} />
          <Field label="Punch number" value={form.punchNumber ?? ""} onChange={(v) => update({ punchNumber: v })} />
        </div>
      </Section>

      <Section title="Compensation">
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField label="Salary" value={form.salary} onChange={(v) => update({ salary: v })} />
          <NumberField label="CTC" value={form.ctc} onChange={(v) => update({ ctc: v })} />
          <Field label="Salary scheme" value={form.salaryScheme ?? ""} onChange={(v) => update({ salaryScheme: v })} className="sm:col-span-2" />
        </div>
      </Section>

      <Section title="Statutory IDs">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Aadhaar number" value={form.aadharNumber ?? ""} onChange={(v) => update({ aadharNumber: v })} />
          <Field label="PAN number" value={form.panNumber ?? ""} onChange={(v) => update({ panNumber: v })} />
          <Field label="PF number" value={form.pfNumber ?? ""} onChange={(v) => update({ pfNumber: v })} />
          <Field label="UAN" value={form.uan ?? ""} onChange={(v) => update({ uan: v })} />
        </div>
      </Section>

      <Section title="Bank details">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Bank name" value={form.bankDetails?.bankName ?? ""} onChange={(v) => updateBank({ bankName: v })} />
          <Field label="Account number" value={form.bankDetails?.accountNumber ?? ""} onChange={(v) => updateBank({ accountNumber: v })} />
          <Field label="IFSC code" value={form.bankDetails?.ifscCode ?? ""} onChange={(v) => updateBank({ ifscCode: v })} className="sm:col-span-2" />
        </div>
      </Section>

      <DocumentsSection
        documents={form.documents ?? []}
        onChange={(next) => update({ documents: next })}
      />

      <Section title="Remarks">
        <Textarea value={form.remarks ?? ""} onChange={(e) => update({ remarks: e.target.value })} rows={2} />
      </Section>
    </div>
  );
}
