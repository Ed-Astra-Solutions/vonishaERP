"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, ShieldCheck, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { isCoordinatorRole, useStaffRoles, type StaffRole } from "@/lib/staff-roles";
import { useUserStore } from "@/stores/user";
import { useEnrollmentStore } from "@/stores/enrollment";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

// Grants / revokes the Coordinator login role (vonisha_users.type === 'c'), which
// lets a staff member mark student attendance for every class without gaining any
// admin write power. Mirrors the Assets Manager screen; the server enforces the same
// admin-only check on /setCoordinator, so this gate is convenience, not security.
export default function CoordinatorsPage() {
  const user = useUserStore((s) => s.user);
  const admin = can(user, "roles", "edit");
  const { staff, loading, error, reload } = useStaffRoles();
  const employees = useEnrollmentStore((s) => s.employees);
  const loadEmployees = useEnrollmentStore((s) => s.load);

  // Only for the designation / center columns — the page works without it, so a
  // failure here just falls the dropdown back to bare emails.
  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const [selected, setSelected] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // Enrollment roster keyed by email, so the dropdown shows each account's
  // designation / center rather than a bare name.
  const roster = useMemo(() => {
    const m = new Map<string, { designation: string; department: string }>();
    for (const e of employees) {
      if (e.email) {
        m.set(e.email.toLowerCase(), { designation: e.designation, department: e.department });
      }
    }
    return m;
  }, [employees]);

  const coordinators = useMemo(() => staff.filter(isCoordinatorRole), [staff]);
  const candidates = useMemo(
    () => staff.filter((s) => !isCoordinatorRole(s) && s.email !== user?.email),
    [staff, user?.email],
  );

  function describe(s: StaffRole): string {
    const info = roster.get(s.email.toLowerCase());
    const suffix = info
      ? [info.designation, info.department].filter(Boolean).join(" · ")
      : s.email;
    return suffix ? `${s.name} — ${suffix}` : s.name;
  }

  async function setRole(email: string, assign: boolean) {
    const res = await AuthService.setCoordinator(getToken() ?? "", email, assign);
    if (isErr(res)) {
      toast.error("Connection Error");
      return false;
    }
    const body = res.data as { success?: boolean; msg?: string };
    if (!body.success) {
      toast.error(body.msg ?? "Could not update role");
      return false;
    }
    toast.success(body.msg ?? "Role updated");
    reload();
    return true;
  }

  async function assign() {
    if (!selected) {
      toast.error("Select a staff member");
      return;
    }
    setAssigning(true);
    const ok = await setRole(selected, true);
    setAssigning(false);
    if (ok) setSelected("");
  }

  async function revoke(email: string) {
    setBusy(email);
    await setRole(email, false);
    setBusy(null);
  }

  if (!admin) {
    return (
      <div>
        <PageHeader title="Coordinators" description="Academic coordinators and their access." />
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={ShieldCheck}
              title="Admins only"
              description="Only an admin can assign or revoke the Coordinator role."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coordinators"
        description="Academic coordinators can mark student attendance for every class."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Coordinators" value={coordinators.length} icon={ShieldCheck} tone="info" />
        <StatCard label="Staff Accounts" value={staff.length} icon={Users} tone="default" />
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-1 font-semibold">Assign a Coordinator</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            A coordinator can mark and amend student attendance for every class, but gains no
            admin powers — they cannot edit rosters, manage classes or approve requests.
            Revoking restores their previous access. Staff are enrolled on the{" "}
            <Link href="/enrollment" className="text-primary underline">
              Staff Enrollment
            </Link>{" "}
            tab.
          </p>

          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-64 flex-1 space-y-1.5">
              <Label className="text-xs">Staff member</Label>
              <Select value={selected} onValueChange={(v) => setSelected((v as string) ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loading ? "Loading staff…" : "Select staff"} />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((s) => (
                    <SelectItem key={s.email} value={s.email}>
                      {describe(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={assign} disabled={assigning || loading || !selected}>
              {assigning ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserPlus className="size-4" />
              )}
              Assign
            </Button>
          </div>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          {!loading && !error && candidates.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              No other staff account is available to assign.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : coordinators.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No coordinators assigned yet" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Center</TableHead>
                    <TableHead className="text-right">Access</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coordinators.map((c) => {
                    const info = roster.get(c.email.toLowerCase());
                    return (
                      <TableRow key={c.email}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{c.name}</span>
                            <Badge variant="secondary">Coordinator</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{c.email}</TableCell>
                        <TableCell>{info?.designation || "—"}</TableCell>
                        <TableCell>{info?.department || "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busy === c.email}
                            onClick={() => revoke(c.email)}
                          >
                            {busy === c.email && <Loader2 className="size-4 animate-spin" />}
                            Revoke
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
