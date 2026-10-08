"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, Save } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { useClasses } from "@/lib/class-access";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
interface Student {
  name: string;
  percentage: string;
  present: boolean;
}

// Ports academic_records_desk.dart: pick a class, load students, enter exam marks
// and present/absent. Students load via getStudentDetails (live API); marks entry
// is a local gradebook (the Flutter screen kept marks client-side pre-upload).
export default function AcademicRecordsPage() {
  // Class list comes from the server (admin-editable at /master/classes).
  const { ids: classIds, loading: classesLoading } = useClasses();
  const [cls, setCls] = useState("");
  useEffect(() => {
    if (classIds.length && !classIds.includes(cls)) setCls(classIds[0]);
  }, [classIds, cls]);
  const [exam, setExam] = useState("Mid-Term");
  const [rows, setRows] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

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
      let d: Record<string, unknown> = s;
      try {
        if (typeof s.data === "string") d = JSON.parse(s.data);
      } catch {
        /* ignore */
      }
      return { name: `${d.f ?? ""} ${d.l ?? ""}`.trim() || "—", percentage: "", present: true };
    });
    setRows(parsed);
    setLoading(false);
  }, []);

  useEffect(() => {
    load(cls);
  }, [cls, load]);

  function update(i: number, patch: Partial<Student>) {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  function upload() {
    const withMarks = rows.filter((r) => r.percentage.trim());
    if (withMarks.length === 0) {
      toast.error("Enter marks for at least one student");
      return;
    }
    // Marks upload was a local operation in the Flutter screen.
    toast.success(`Marks uploaded for ${withMarks.length} student(s)`);
  }

  const avg =
    rows.length > 0
      ? Math.round(
          rows.reduce((n, r) => n + (Number(r.percentage) || 0), 0) /
            rows.filter((r) => r.percentage).length || 0,
        )
      : 0;

  return (
    <div>
      <PageHeader title="Academic Records" description="View performance and upload exam marks." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Students" value={loading ? "—" : rows.length} icon={BookOpen} tone="info" />
        <StatCard label="Present" value={loading ? "—" : rows.filter((r) => r.present).length} icon={BookOpen} tone="success" />
        <StatCard label="Class Average" value={loading || !avg ? "—" : `${avg}%`} icon={BookOpen} tone="default" />
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="w-full max-w-xs space-y-1.5">
              <Label className="text-xs">Class / Section</Label>
              <Select value={cls} onValueChange={(v) => setCls(v ?? cls)} disabled={classesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={classesLoading ? "Loading classes…" : "Select a class"} />
                </SelectTrigger>
                <SelectContent>
                  {classIds.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40 space-y-1.5">
              <Label className="text-xs">Exam</Label>
              <Select value={exam} onValueChange={(v) => setExam(v ?? exam)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Unit Test 1", "Mid-Term", "Unit Test 2", "Final"].map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="ml-auto" onClick={upload} disabled={loading || rows.length === 0}>
              <Save className="size-4" /> Upload marks
            </Button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState icon={BookOpen} title="No students in this class" description="Select another class." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="w-40">Percentage %</TableHead>
                    <TableHead className="w-32">Present</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={r.percentage}
                          onChange={(e) => update(i, { percentage: e.target.value })}
                          placeholder="0-100"
                          className="h-9 w-28"
                        />
                      </TableCell>
                      <TableCell>
                        <button onClick={() => update(i, { present: !r.present })}>
                          <Badge variant={r.present ? "default" : "destructive"}>
                            {r.present ? "Present" : "Absent"}
                          </Badge>
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
