"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Boxes, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { EmployeeEnrollment } from "@/types/erp";
import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { isAssetManager, useStaffRoles } from "@/lib/staff-roles";
import { useEnrollmentStore } from "@/stores/enrollment";
import { EmployeeForm } from "@/components/enrollment/employee-form";
import { EmployeeView } from "@/components/enrollment/employee-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

// Enrollment sub-page replacing the old right-hand detail drawer: the record renders
// as a normal page so long profiles scroll with the document instead of being clipped
// inside a fixed-height Sheet.
export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(String(params.id ?? ""));

  const employees = useEnrollmentStore((s) => s.employees);
  const updateEmployee = useEnrollmentStore((s) => s.updateEmployee);
  const removeEmployee = useEnrollmentStore((s) => s.removeEmployee);
  const load = useEnrollmentStore((s) => s.load);
  const loading = useEnrollmentStore((s) => s.loading);
  const loaded = useEnrollmentStore((s) => s.loaded);
  const emp = useMemo(() => employees.find((e) => e.id === id), [employees, id]);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [form, setForm] = useState<EmployeeEnrollment | null>(emp ?? null);

  // Deep-linking straight to a record (or a hard refresh) arrives with an empty
  // store, so pull the roster before deciding the employee doesn't exist.
  useEffect(() => {
    void load();
  }, [load]);

  // Re-seed the draft whenever the record loads or the edit session restarts, so
  // cancelling an edit reverts to the stored values.
  useEffect(() => {
    if (!editing) setForm(emp ?? null);
  }, [emp, editing]);

  const update = (patch: Partial<EmployeeEnrollment>) =>
    setForm((f) => (f ? { ...f, ...patch } : f));
  const updateBank = (patch: Partial<EmployeeEnrollment["bankDetails"]>) =>
    setForm((f) => (f ? { ...f, bankDetails: { ...f.bankDetails, ...patch } } : f));

  async function save() {
    if (!form) return;
    if (!form.firstName.trim() || !form.email.trim()) {
      toast.error("First name and email are required");
      return;
    }
    // Dropping every Aadhaar upload would leave the record without proof of
    // identity; the server refuses it too.
    if (!(form.documents ?? []).some((d) => d.purpose === "aadhaar")) {
      toast.error("An Aadhaar card upload is required");
      return;
    }
    setSaving(true);
    const res = await updateEmployee(form);
    setSaving(false);
    if (!res.ok) {
      toast.error(res.msg ?? "Could not save changes");
      return;
    }
    setEditing(false);
    toast.success(res.msg ?? "Employee updated");
  }

  // Deleting the record also deletes its documents from S3 (server-side, once no
  // other record references them).
  async function remove() {
    if (!emp) return;
    setRemoving(true);
    const res = await removeEmployee(emp.id);
    setRemoving(false);
    if (!res.ok) {
      toast.error(res.msg ?? "Could not remove employee");
      return;
    }
    toast.success(res.msg ?? "Employee removed");
    router.push("/enrollment");
  }

  if (!emp) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            {loading || !loaded ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Loading employee…
              </span>
            ) : (
              <>
                Employee not found.{" "}
                <Link href="/enrollment" className="text-primary underline">
                  Back to Enrollment
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const name = `${emp.firstName} ${emp.lastName}`.trim();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-1 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <span>Staff &amp; HR</span>
        <span>&gt;</span>
        <Link href="/enrollment" className="hover:text-foreground">Enrollment</Link>
        <span>&gt;</span>
        <span className="text-primary">{name || emp.id}</span>
      </div>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {editing ? "Edit employee" : name || emp.id}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {emp.designation || "—"} · {emp.department}
          </p>
        </div>
        {!editing && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={remove} disabled={removing}>
              {removing ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Remove
            </Button>
            <Button onClick={() => setEditing(true)}>
              <Pencil className="size-4" /> Edit
            </Button>
          </div>
        )}
      </div>

      <AssetManagerCard email={emp.email} name={name} />

      <Card>
        <CardContent className="p-5">
          {editing && form ? (
            <EmployeeForm form={form} update={update} updateBank={updateBank} />
          ) : (
            <EmployeeView emp={emp} />
          )}
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-end gap-2">
        {editing ? (
          <>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => router.push("/enrollment")}>
            <ArrowLeft className="size-4" /> Back
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Assets Manager access for this employee. The role lives on the *login* account
 * (vonisha_users.type === 'am'), not on the enrollment record, so it is matched by
 * email — an employee with no login account can't hold it and the toggle explains why.
 */
function AssetManagerCard({ email, name }: { email: string; name: string }) {
  const { staff, loading, reload } = useStaffRoles();
  const [busy, setBusy] = useState(false);

  const account = useMemo(
    () => staff.find((s) => s.email.toLowerCase() === email.trim().toLowerCase()),
    [staff, email],
  );
  const assigned = account ? isAssetManager(account) : false;

  async function toggle(next: boolean) {
    if (!account) return;
    setBusy(true);
    const res = await AuthService.setAssetManager(getToken() ?? "", account.email, next);
    setBusy(false);
    if (isErr(res)) {
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; msg?: string };
    if (!body.success) {
      toast.error(body.msg ?? "Could not update role");
      return;
    }
    toast.success(body.msg ?? "Role updated");
    reload();
  }

  return (
    <Card className="mb-4">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Boxes className="size-4 text-muted-foreground" />
            <p className="font-medium">Assets Manager</p>
            {assigned && <Badge variant="secondary">Assigned</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading
              ? "Checking access…"
              : !email.trim()
                ? "Add a work email before granting asset access."
                : !account
                  ? `No login account exists for ${email} — create one before assigning the role.`
                  : `Grants ${name || account.name} the asset stock and inventory modules.`}
          </p>
        </div>
        <Switch
          checked={assigned}
          disabled={loading || busy || !account}
          onCheckedChange={toggle}
          aria-label="Assets Manager access"
        />
      </CardContent>
    </Card>
  );
}
