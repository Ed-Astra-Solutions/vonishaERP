"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GraduationCap, Search, Eye, Pencil, UserPlus, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { useClasses } from "@/lib/class-access";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface StudentUser {
  data?: string;
  [k: string]: unknown;
}
type StudentData = Record<string, unknown>;

// Hide the Flutter "Select"/"Select Date" sentinels when a field was never filled.
function display(v: unknown): string | undefined {
  const s = v == null ? "" : String(v);
  return s && s !== "Select" && s !== "Select Date" ? s : undefined;
}

// Student management — mirrors the Flutter staff_management flow: class dropdown,
// search, Add Student, and a list where each student opens the details sub-screen
// (/faculty/students/detail, a port of student_details.dart). Add/edit happens on
// the /faculty/students/manage sub-screen.
function StudentsView() {
  const params = useSearchParams();
  const { ids, editable, loading: classesLoading, inchargeFor, canEdit: canEditCls } = useClasses();
  const initialClass = params.get("class");
  const [cls, setCls] = useState(initialClass ?? "");
  const [pickedClass, setPickedClass] = useState(initialClass !== null);

  // The list arrives asynchronously; once it does, settle on a class. An incharge
  // lands on one of their own rather than on whatever happens to sort first.
  useEffect(() => {
    if (!ids.length) return;
    if (pickedClass && ids.includes(cls)) return;
    const preferred = editable.length ? editable[0] : ids[0];
    if (!ids.includes(cls)) setCls(preferred);
  }, [ids, editable, pickedClass, cls]);

  const incharge = inchargeFor(cls);
  const canEdit = canEditCls(cls);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async (c: string) => {
    setLoading(true);
    const res = await AuthService.getStudentDetails(getToken() ?? "", c);
    if (isErr(res)) {
      setLoading(false);
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; data?: StudentUser[] };
    const parsed = (body.data ?? []).map((s) => {
      try {
        return typeof s.data === "string" ? (JSON.parse(s.data) as StudentData) : (s as StudentData);
      } catch {
        return s as StudentData;
      }
    });
    setStudents(parsed);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (cls) load(cls);
  }, [cls, load]);

  const name = (s: StudentData) => `${s.f ?? ""} ${s.l ?? ""}`.trim() || "—";
  // Keep original indices through the search filter — class + array index is the
  // student's identity for both the detail and edit screens.
  const filtered = students
    .map((s, index) => ({ s, index }))
    .filter(({ s }) => name(s).toLowerCase().includes(query.toLowerCase()));

  const detailHref = (index: number) =>
    `/faculty/students/detail?class=${encodeURIComponent(cls)}&index=${index}`;
  const editHref = (index: number) =>
    `/faculty/students/manage?class=${encodeURIComponent(cls)}&index=${index}`;

  return (
    <div>
      <PageHeader
        title="Students"
        description="Student records by class."
        actions={
          canEdit ? (
            <Button render={<Link href={`/faculty/students/manage?class=${encodeURIComponent(cls)}`} />}>
              <UserPlus className="size-4" /> Add Student
            </Button>
          ) : (
            <Button disabled>
              <Lock className="size-4" /> Add Student
            </Button>
          )
        }
      />

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="w-full max-w-xs space-y-1.5">
              <Label className="text-xs">Class</Label>
              <Select
                value={cls}
                onValueChange={(v) => {
                  setPickedClass(true);
                  setCls(v ?? cls);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={classesLoading ? "Loading classes…" : "Select a class"} />
                </SelectTrigger>
                <SelectContent>
                  {ids.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="relative w-full max-w-xs">
              <Label className="text-xs">Search</Label>
              <div className="relative mt-1.5">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search student by name" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Who owns this class. Only the incharge (and admins) may edit it. */}
          {incharge && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              <ShieldCheck className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Person in charge:</span>
              <span className="font-medium">{incharge.name}</span>
              {incharge.email && (
                <span className="text-muted-foreground">({incharge.email})</span>
              )}
              <Badge variant={canEdit ? "secondary" : "outline"} className="ml-auto">
                {canEdit ? "You can edit this class" : "Read-only"}
              </Badge>
            </div>
          )}

          {loading || classesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={GraduationCap} title="No students found" description="Select another class or add a student." />
          ) : (
            <>
              {/* Mobile: tappable cards -> details sub-screen */}
              <div className="space-y-2 sm:hidden">
                {filtered.map(({ s, index }) => (
                  <Link
                    key={index}
                    href={detailHref(index)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{name(s)}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {[display(s.father), display(s.fnumber)].filter(Boolean).join(" · ") || "No contact details"}
                      </p>
                    </div>
                    <Eye className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden overflow-x-auto sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Father</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Sex</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(({ s, index }) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{name(s)}</TableCell>
                        <TableCell className="text-muted-foreground">{display(s.father) || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{display(s.fnumber) || "—"}</TableCell>
                        <TableCell>{display(s.sex) || "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon-sm" render={<Link href={detailHref(index)} />} aria-label="View">
                            <Eye className="size-4" />
                          </Button>
                          {canEdit && (
                            <Button variant="ghost" size="icon-sm" render={<Link href={editHref(index)} />} aria-label="Edit">
                              <Pencil className="size-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function StudentsPage() {
  // useSearchParams requires a Suspense boundary for prerendering.
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <StudentsView />
    </Suspense>
  );
}
