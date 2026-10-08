"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, GraduationCap, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { useClassesStore } from "@/stores/classes";
import { useUserStore } from "@/stores/user";
import type { ClassPayload, ClassRow } from "@/types/classes";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Admin screen for the class list and each class's person-in-charge — the thing that
// decides who may edit a class's student roster. Renaming a class migrates its roster
// and attendance document server-side, so names can be corrected safely.

interface StaffAccount {
  email: string;
  name: string;
  role: string;
}

const MANUAL = "__manual__";

const EMPTY: ClassPayload = {
  id: "",
  center: "",
  level: "",
  inchargeName: "",
  inchargeEmail: "",
  inchargeAliases: [],
};

function toPayload(c: ClassRow): ClassPayload {
  return {
    id: c.id,
    center: c.center,
    level: c.level ?? "",
    order: c.order,
    inchargeName: c.incharge?.name ?? "",
    inchargeEmail: c.incharge?.email ?? "",
    inchargeAliases: c.incharge?.aliases ?? [],
  };
}

export default function ManageClassesPage() {
  const user = useUserStore((s) => s.user);
  const userLoading = useUserStore((s) => s.loading);
  const classes = useClassesStore((s) => s.classes);
  const loading = useClassesStore((s) => s.loading);
  const loaded = useClassesStore((s) => s.loaded);
  const refresh = useClassesStore((s) => s.refresh);

  const [dialogOpen, setDialogOpen] = useState(false);
  // The class being edited, or null when adding a new one.
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ClassPayload>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmForce, setConfirmForce] = useState<{ id: string; count: number } | null>(null);
  // Staff logins, so the incharge is picked from a real account rather than typed.
  // Edit access is matched on the account's e-mail, so a free-typed address that is
  // not a login would silently grant nobody anything.
  const [accounts, setAccounts] = useState<StaffAccount[]>([]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    (async () => {
      const res = await AuthService.getStaffRoles(getToken() ?? "");
      if (isErr(res)) return;
      const body = res.data as { success?: boolean; data?: StaffAccount[] };
      if (body?.success && Array.isArray(body.data)) setAccounts(body.data);
    })();
  }, []);

  const admin = can(user, "classes", "edit");

  // Group by center so a long list stays readable.
  const grouped = useMemo(() => {
    const out = new Map<string, ClassRow[]>();
    for (const c of classes) {
      const k = c.center || "—";
      out.set(k, [...(out.get(k) ?? []), c]);
    }
    return Array.from(out.entries());
  }, [classes]);

  // The dropdown shows the account only when the stored e-mail really is a login.
  const selectedAccount = useMemo(() => {
    const e = (form.inchargeEmail ?? "").toLowerCase();
    return accounts.some((a) => a.email.toLowerCase() === e) ? e : MANUAL;
  }, [form.inchargeEmail, accounts]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY);
    setDialogOpen(true);
  }

  function openEdit(c: ClassRow) {
    setEditing(c.id);
    setForm(toPayload(c));
    setDialogOpen(true);
  }

  async function save() {
    if (!form.id.trim()) {
      toast.error("Enter a class name");
      return;
    }
    if (!form.inchargeName.trim()) {
      toast.error("Enter the person in charge");
      return;
    }
    const payload: ClassPayload = { ...form, id: form.id.trim() };
    setSaving(true);
    const res = editing
      ? await AuthService.updateClass(getToken() ?? "", editing, payload)
      : await AuthService.addClass(getToken() ?? "", payload);
    setSaving(false);
    if (isErr(res)) {
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; msg?: string };
    if (!body.success) {
      toast.error(body.msg ?? "Failed to save");
      return;
    }
    toast.success(editing ? "Class updated" : "Class added");
    setDialogOpen(false);
    refresh();
  }

  async function remove(id: string, force: boolean) {
    setBusy(id);
    const res = await AuthService.removeClass(getToken() ?? "", id, force);
    setBusy(null);
    if (isErr(res)) {
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; msg?: string; needsForce?: boolean; count?: number };
    if (body.success) {
      toast.success(body.msg ?? "Class removed");
      setConfirmForce(null);
      refresh();
    } else if (body.needsForce) {
      setConfirmForce({ id, count: body.count ?? 0 });
    } else {
      toast.error(body.msg ?? "Failed");
    }
  }

  if (userLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (!admin) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="Admins only"
        description="Only an admin can change the class list or reassign a person in charge."
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Classes & Incharges"
        description="The class list used across the app, and who may edit each class's students."
        actions={
          <Button onClick={openAdd}>
            <Plus className="size-4" /> Add Class
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4 sm:p-6">
          {loading && !loaded ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : classes.length === 0 ? (
            <EmptyState icon={GraduationCap} title="No classes yet" description="Add the first class to get started." />
          ) : (
            <div className="space-y-6">
              {grouped.map(([center, rows]) => (
                <div key={center}>
                  <h2 className="mb-2 text-sm font-medium text-muted-foreground">{center}</h2>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Class</TableHead>
                          <TableHead>Level</TableHead>
                          <TableHead>Person in charge</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.id}</TableCell>
                            <TableCell className="text-muted-foreground">{c.level || "—"}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{c.incharge?.name || <span className="text-muted-foreground">Unassigned</span>}</span>
                                {c.incharge?.email ? (
                                  <span className="text-xs text-muted-foreground">{c.incharge.email}</span>
                                ) : c.incharge?.name ? (
                                  <Badge variant="outline" className="mt-1 w-fit">Matched by name</Badge>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              <Button variant="ghost" size="icon-sm" onClick={() => openEdit(c)} aria-label="Edit class">
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                disabled={busy === c.id}
                                onClick={() => remove(c.id, false)}
                                aria-label="Remove class"
                              >
                                {busy === c.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Class" : "Add Class"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cid">Class name *</Label>
              <Input
                id="cid"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                placeholder="e.g. OBE Level A - Grade 1"
              />
              {editing && editing !== form.id.trim() && (
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  Renaming moves the existing students and attendance record from
                  &ldquo;{editing}&rdquo; to the new name.
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="center">Center</Label>
                <Input
                  id="center"
                  value={form.center}
                  onChange={(e) => setForm({ ...form, center: e.target.value })}
                  placeholder="e.g. OBE"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="level">Level</Label>
                <Input
                  id="level"
                  value={form.level ?? ""}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  placeholder="e.g. A, NIOS"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Person in charge *</Label>
              <Select
                value={selectedAccount}
                onValueChange={(v) => {
                  if (!v || v === MANUAL) {
                    setForm({ ...form, inchargeEmail: "" });
                    return;
                  }
                  const a = accounts.find((x) => x.email === v);
                  if (a) setForm({ ...form, inchargeName: a.name, inchargeEmail: a.email });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pick a staff login" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.email} value={a.email}>
                      {a.name} — {a.email}
                    </SelectItem>
                  ))}
                  <SelectItem value={MANUAL}>Not a login yet — match by name</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Edit access is matched on this account. Pick the login the teacher
                actually signs in with, not their personal address.
              </p>
            </div>

            {/* Only when the incharge has no ERP account yet. Name matching is a
                weaker fallback, so it is spelled out rather than silently allowed. */}
            {!form.inchargeEmail && (
              <div className="space-y-4 rounded-lg border border-dashed p-3">
                <div className="space-y-1.5">
                  <Label htmlFor="incharge">Name *</Label>
                  <Input
                    id="incharge"
                    value={form.inchargeName}
                    onChange={(e) => setForm({ ...form, inchargeName: e.target.value })}
                    placeholder="Full name as in the employee list"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="aliases">Alternate name spellings</Label>
                  <Input
                    id="aliases"
                    value={(form.inchargeAliases ?? []).join(", ")}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        inchargeAliases: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="Comma separated, e.g. Rajina, Rajina K"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Until they have a login, nobody but an admin can edit this class —
                  the name is only recorded so it shows on the Students screen.
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button disabled={saving} onClick={save}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                {editing ? "Save Changes" : "Add Class"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Removing a class that still has students */}
      <Dialog open={confirmForce !== null} onOpenChange={(o) => !o && setConfirmForce(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" /> Remove {confirmForce?.id}?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This class still has {confirmForce?.count} student record(s). Removing it takes
            the class out of every dropdown. The student records themselves are kept, but
            they will no longer be reachable from the app until a class of the same name
            exists again.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfirmForce(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={busy !== null}
              onClick={() => confirmForce && remove(confirmForce.id, true)}
            >
              Remove anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
