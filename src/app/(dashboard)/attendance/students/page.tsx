"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarCheck,
  CheckSquare,
  Clock,
  Loader2,
  Lock,
  Save,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { useClasses } from "@/lib/class-access";
import { cn } from "@/lib/utils";
import {
  STATUS_LABELS,
  type AttendanceDay,
  type AttendanceDaySummary,
  type AttendanceRecord,
  type AttendanceStatus,
} from "@/types/attendance";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// Statuses in the order they appear on each student's row. Colours match the staff
// attendance screen so the two read the same way.
const STATUSES: { key: AttendanceStatus; cls: string }[] = [
  { key: "present", cls: "bg-emerald-500 text-white" },
  { key: "absent", cls: "bg-red-500 text-white" },
  { key: "late", cls: "bg-amber-500 text-white" },
  { key: "excused", cls: "bg-sky-500 text-white" },
];

function todayISO(d = new Date()): string {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** First day of the month `iso` falls in — the default start of the history range. */
function monthStart(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

function prettyDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Student attendance — mark one class for one day, and review what has already been
// marked. Who may mark which class is decided server-side (canMarkAttendance on each
// /getClasses row): admins and coordinators get every class, faculty only the classes
// they are the person-in-charge of. The same guard runs again on save, so this screen
// never has to be the only thing standing between a faculty member and someone else's
// class.
function StudentAttendanceView() {
  const router = useRouter();
  const params = useSearchParams();
  const { ids, markable, loading: classesLoading, canMark, inchargeFor, degraded } = useClasses();

  const initialClass = params.get("class");
  const [cls, setCls] = useState(initialClass ?? "");
  const [pickedClass, setPickedClass] = useState(initialClass !== null);
  const [date, setDate] = useState(params.get("date") ?? todayISO());

  // The class list arrives asynchronously; once it does, settle on a class the user
  // can actually mark rather than on whatever happens to sort first.
  useEffect(() => {
    if (!ids.length) return;
    if (pickedClass && ids.includes(cls)) return;
    const preferred = markable.length ? markable[0] : ids[0];
    if (!ids.includes(cls)) setCls(preferred);
  }, [ids, markable, pickedClass, cls]);

  const editable = canMark(cls);
  const incharge = inchargeFor(cls);

  const [day, setDay] = useState<AttendanceDay | null>(null);
  const [marks, setMarks] = useState<Record<number, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Keep the URL in step so a class-day can be linked to and survives a reload.
  useEffect(() => {
    if (!cls) return;
    const qs = new URLSearchParams({ class: cls, date });
    router.replace(`/attendance/students?${qs.toString()}`, { scroll: false });
  }, [cls, date, router]);

  const load = useCallback(async (c: string, d: string) => {
    setLoading(true);
    setError(null);
    const res = await AuthService.getStudentAttendance(getToken() ?? "", c, d);
    if (isErr(res)) {
      setLoading(false);
      setDay(null);
      setError("Connection Error");
      toast.error("Connection Error");
      return;
    }
    const body = res.data as AttendanceDay & { success?: boolean; msg?: string };
    if (!body.success) {
      setDay(null);
      setMarks({});
      setError(body.msg ?? "Could not load attendance");
      setLoading(false);
      return;
    }
    setDay(body);
    const init: Record<number, AttendanceStatus> = {};
    (body.data ?? []).forEach((r) => (init[r.index] = r.status));
    setMarks(init);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (cls && date) load(cls, date);
  }, [cls, date, load]);

  const roster: AttendanceRecord[] = useMemo(() => day?.data ?? [], [day]);

  const counts = useMemo(() => {
    const c: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, excused: 0 };
    roster.forEach((r) => (c[marks[r.index] ?? "present"] += 1));
    return c;
  }, [roster, marks]);

  const filtered = useMemo(
    () => roster.filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase())),
    [roster, query],
  );

  const isFuture = date > todayISO();

  function setAll(status: AttendanceStatus) {
    const next: Record<number, AttendanceStatus> = {};
    roster.forEach((r) => (next[r.index] = status));
    setMarks(next);
  }

  async function save() {
    const payload = roster.map((r) => ({ index: r.index, status: marks[r.index] ?? "present" }));
    if (payload.length === 0) {
      toast.error("No students to mark");
      return;
    }
    setSaving(true);
    const res = await AuthService.saveStudentAttendance(getToken() ?? "", cls, date, payload);
    setSaving(false);
    if (isErr(res)) {
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; msg?: string };
    if (!body.success) {
      toast.error(body.msg ?? "Could not save attendance");
      return;
    }
    toast.success(body.msg ?? "Attendance saved");
    // Re-read so `markedBy` / `markedAt` reflect this save.
    load(cls, date);
  }

  return (
    <div>
      <PageHeader
        title="Student Attendance"
        description="Mark and review attendance for a class, one day at a time."
        actions={
          editable &&
          !loading &&
          roster.length > 0 && (
            <Button onClick={save} disabled={saving || isFuture}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save attendance
            </Button>
          )
        }
      />

      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-end gap-3 p-4 sm:p-5">
          <div className="min-w-64 flex-1 space-y-1.5">
            <Label className="text-xs">Class</Label>
            <Select
              value={cls}
              onValueChange={(v) => {
                setPickedClass(true);
                setCls((v as string) ?? "");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={classesLoading ? "Loading classes…" : "Select class"} />
              </SelectTrigger>
              <SelectContent>
                {ids.map((id) => (
                  <SelectItem key={id} value={id}>
                    {id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="att-date">
              Date
            </Label>
            <Input
              id="att-date"
              type="date"
              max={todayISO()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 pb-1.5">
            {day?.marked && (
              <Badge variant="secondary">
                <CalendarCheck className="size-3.5" /> Marked
                {day.markedBy ? ` by ${day.markedBy}` : ""}
              </Badge>
            )}
            {!editable && cls && (
              <Badge variant="outline">
                <Lock className="size-3.5" /> Read only
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {degraded && (
        <p className="mb-4 text-sm text-muted-foreground">
          The class list could not be loaded, so attendance is unavailable. Reload to try again.
        </p>
      )}

      {!editable && cls && !classesLoading && (
        <p className="mb-4 text-sm text-muted-foreground">
          {incharge?.name
            ? `Only ${incharge.name} (person in charge), a coordinator or an admin can mark attendance for ${cls}.`
            : `You do not have attendance access to ${cls}.`}
        </p>
      )}

      <Tabs defaultValue="mark">
        <TabsList>
          <TabsTrigger value="mark">Mark</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="mark">
          <div className="mb-6 grid gap-4 sm:grid-cols-4">
            <StatCard label="Present" value={counts.present} icon={UserCheck} tone="success" />
            <StatCard label="Absent" value={counts.absent} icon={UserX} tone="danger" />
            <StatCard label="Late" value={counts.late} icon={Clock} tone="warning" />
            <StatCard label="Excused" value={counts.excused} icon={CheckSquare} tone="info" />
          </div>

          <Card>
            <CardContent className="p-4 sm:p-6">
              {loading || classesLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : error ? (
                <EmptyState icon={Lock} title="Attendance unavailable" description={error} />
              ) : roster.length === 0 ? (
                <EmptyState
                  icon={CheckSquare}
                  title="No students on this roster"
                  description={`Add students to ${cls || "this class"} first.`}
                />
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <Input
                      placeholder="Search students…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="max-w-64"
                    />
                    {editable && (
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => setAll("present")}>
                          Mark all present
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setAll("absent")}>
                          Mark all absent
                        </Button>
                      </div>
                    )}
                    <span className="ml-auto text-sm text-muted-foreground">
                      {prettyDate(date)} · {roster.length} students
                    </span>
                  </div>

                  {filtered.length === 0 ? (
                    <EmptyState icon={CheckSquare} title="No students match that search" />
                  ) : (
                    <ul className="divide-y">
                      {filtered.map((r) => {
                        const current = marks[r.index] ?? "present";
                        return (
                          <li
                            key={r.index}
                            className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 shrink-0 text-xs text-muted-foreground">
                                {r.index + 1}
                              </span>
                              <p className="font-medium">{r.name || "—"}</p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {STATUSES.map((s) => {
                                const active = current === s.key;
                                return (
                                  <button
                                    key={s.key}
                                    type="button"
                                    disabled={!editable}
                                    onClick={() =>
                                      setMarks((p) => ({ ...p, [r.index]: s.key }))
                                    }
                                    className={cn(
                                      "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                                      active
                                        ? `${s.cls} border-transparent`
                                        : "bg-background hover:bg-muted",
                                      !editable && "cursor-not-allowed opacity-70 hover:bg-background",
                                    )}
                                  >
                                    {STATUS_LABELS[s.key]}
                                  </button>
                                );
                              })}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <HistoryView cls={cls} anchorDate={date} canView={editable} onPickDate={setDate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Every day already marked for the class in a date range, as per-day totals. Picking a
// row jumps the Mark tab to that day so a mistake can be corrected in place.
function HistoryView({
  cls,
  anchorDate,
  canView,
  onPickDate,
}: {
  cls: string;
  anchorDate: string;
  canView: boolean;
  onPickDate: (d: string) => void;
}) {
  const [from, setFrom] = useState(monthStart(anchorDate));
  const [to, setTo] = useState(anchorDate);
  const [days, setDays] = useState<AttendanceDaySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (c: string, f: string, t: string) => {
    setLoading(true);
    setError(null);
    const res = await AuthService.getStudentAttendanceRange(getToken() ?? "", c, f, t);
    if (isErr(res)) {
      setDays([]);
      setError("Connection Error");
      setLoading(false);
      return;
    }
    const body = res.data as { success?: boolean; msg?: string; data?: AttendanceDaySummary[] };
    if (!body.success) {
      setDays([]);
      setError(body.msg ?? "Could not load history");
      setLoading(false);
      return;
    }
    setDays(body.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (cls && canView && from <= to) load(cls, from, to);
  }, [cls, canView, from, to, load]);

  if (!canView) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={Lock}
            title="No access to this class"
            description="Pick a class you are the person in charge of."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="hist-from">
              From
            </Label>
            <Input
              id="hist-from"
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="hist-to">
              To
            </Label>
            <Input
              id="hist-to"
              type="date"
              value={to}
              min={from}
              max={todayISO()}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState icon={Lock} title="History unavailable" description={error} />
        ) : days.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="Nothing marked in this range"
            description="Days appear here once attendance is saved for them."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Present</TableHead>
                  <TableHead className="text-right">Absent</TableHead>
                  <TableHead className="text-right">Late</TableHead>
                  <TableHead className="text-right">Excused</TableHead>
                  <TableHead>Absentees</TableHead>
                  <TableHead>Marked by</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {days.map((d) => (
                  <TableRow
                    key={d.date}
                    className="cursor-pointer"
                    onClick={() => onPickDate(d.date)}
                  >
                    <TableCell className="font-medium">{prettyDate(d.date)}</TableCell>
                    <TableCell className="text-right">{d.counts.present}</TableCell>
                    <TableCell className="text-right">{d.counts.absent}</TableCell>
                    <TableCell className="text-right">{d.counts.late}</TableCell>
                    <TableCell className="text-right">{d.counts.excused}</TableCell>
                    <TableCell className="max-w-72 truncate text-muted-foreground">
                      {d.absentees.length ? d.absentees.join(", ") : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{d.markedBy || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function StudentAttendancePage() {
  return (
    <Suspense fallback={null}>
      <StudentAttendanceView />
    </Suspense>
  );
}
