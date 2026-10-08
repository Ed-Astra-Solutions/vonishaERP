"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { EmployeeEnrollment } from "@/types/erp";
import { emptyEmployee } from "@/lib/enrollment-data";
import { useEnrollmentStore } from "@/stores/enrollment";
import { EmployeeForm } from "@/components/enrollment/employee-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Enrollment sub-page: add a new employee. Previously a right-hand Sheet whose body
// clipped on shorter viewports — a full page scrolls with the document instead.
export default function NewEnrollmentPage() {
  const router = useRouter();
  const addEmployee = useEnrollmentStore((s) => s.addEmployee);
  const [form, setForm] = useState<EmployeeEnrollment>(emptyEmployee());
  const [saving, setSaving] = useState(false);

  const update = (patch: Partial<EmployeeEnrollment>) => setForm((f) => ({ ...f, ...patch }));
  const updateBank = (patch: Partial<EmployeeEnrollment["bankDetails"]>) =>
    setForm((f) => ({ ...f, bankDetails: { ...f.bankDetails, ...patch } }));

  async function save() {
    if (!form.firstName.trim() || !form.email.trim()) {
      toast.error("First name and email are required");
      return;
    }
    if ((form.profilePic ?? []).length === 0) {
      toast.error("A profile picture is required");
      return;
    }
    // Aadhaar is the one compulsory document; the server re-checks it before saving.
    if (!(form.documents ?? []).some((d) => d.purpose === "aadhaar")) {
      toast.error("An Aadhaar card upload is required");
      return;
    }
    setSaving(true);
    const emp: EmployeeEnrollment = { ...form, id: form.id || `EMP-${Date.now()}` };
    const res = await addEmployee(emp);
    setSaving(false);
    if (!res.ok) {
      toast.error(res.msg ?? "Could not enroll employee");
      return;
    }
    toast.success(res.msg ?? "Employee enrolled");
    router.push(`/enrollment/${encodeURIComponent(emp.id)}`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-1 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/enrollment" className="hover:text-foreground">Enrollment</Link>
        <span>&gt;</span>
        <span className="text-primary">Add employee</span>
      </div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Enroll new employee</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Fields mirror the employee roster (Excel / server schema).
      </p>

      <Card>
        <CardContent className="p-5">
          <EmployeeForm form={form} update={update} updateBank={updateBank} />
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" render={<Link href="/enrollment" />}>
          <ArrowLeft className="size-4" /> Cancel
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Enroll employee
        </Button>
      </div>
    </div>
  );
}
