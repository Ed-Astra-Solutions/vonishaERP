"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckSquare, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { todayDDMMYYYY } from "@/lib/format";
import { staffFullName, type StaffUser } from "@/lib/staff";
import { can } from "@/lib/permissions";
import { useUserStore } from "@/stores/user";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Status = "present" | "absent" | "halfDay" | "onLeave";
const STATUSES: { key: Status; label: string; cls: string }[] = [
  { key: "present", label: "Present", cls: "bg-emerald-500 text-white" },
  { key: "absent", label: "Absent", cls: "bg-red-500 text-white" },
  { key: "halfDay", label: "Half Day", cls: "bg-amber-500 text-white" },
  { key: "onLeave", label: "Leave", cls: "bg-sky-500 text-white" },
];

// Staff attendance marking. Loads staff via getUserDetails and submits a marked
// set via updateStaffAttendance (date = today ddMMyyyy), preserving the Flutter flow.
export default function AttendancePage() {
  const canMark = can(useUserStore((s) => s.user), "staff_attendance", "edit");
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [marks, setMarks] = useState<Record<string, Status>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await AuthService.getUserDetails(getToken() ?? "");
    if (isErr(res)) {
      setLoading(false);
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; data?: StaffUser[] };
    if (body.success && Array.isArray(body.data)) {
      setStaff(body.data);
      const init: Record<string, Status> = {};
      body.data.forEach((u) => u.email && (init[u.email] = "present"));
      setMarks(init);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, halfDay: 0, onLeave: 0 };
    Object.values(marks).forEach((s) => (c[s] += 1));
    return c;
  }, [marks]);

  async function submit() {
    const date = todayDDMMYYYY();
    const payload = staff
      .filter((u) => u.email)
      .map((u) => ({
        email: u.email,
        name: staffFullName(u),
        date,
        status: marks[u.email!] ?? "present",
      }));
    setSaving(true);
    const res = await AuthService.updateStaffAttendance(getToken() ?? "", payload);
    setSaving(false);
    if (isErr(res)) {
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; msg?: string };
    if (body.success) toast.success("Updated Attendance");
    else toast.error(body.msg ?? "Failed to update attendance");
  }

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Mark today's staff attendance."
        actions={
          canMark &&
          !loading &&
          staff.length > 0 && (
            <Button onClick={submit} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save attendance
            </Button>
          )
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Present" value={counts.present} icon={CheckSquare} tone="success" />
        <StatCard label="Absent" value={counts.absent} icon={CheckSquare} tone="danger" />
        <StatCard label="Half Day" value={counts.halfDay} icon={CheckSquare} tone="warning" />
        <StatCard label="On Leave" value={counts.onLeave} icon={CheckSquare} tone="info" />
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : staff.length === 0 ? (
            <EmptyState icon={CheckSquare} title="No staff to mark" description="Add staff members first." />
          ) : (
            <ul className="divide-y">
              {staff.map((u, i) => (
                <li key={`${u.email}-${i}`} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{staffFullName(u)}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUSES.map((s) => {
                      const active = (marks[u.email ?? ""] ?? "present") === s.key;
                      return (
                        <button
                          key={s.key}
                          onClick={() => u.email && setMarks((p) => ({ ...p, [u.email!]: s.key }))}
                          className={cn(
                            "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                            active ? s.cls + " border-transparent" : "bg-background hover:bg-muted",
                          )}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
