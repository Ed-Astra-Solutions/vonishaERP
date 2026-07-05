"use client";

import { useCallback, useEffect, useState } from "react";
import { GraduationCap, Search, Eye } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { CLASS_TYPES } from "@/lib/constants";
import { formatDDMMYYYY } from "@/lib/format";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
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

interface StudentUser {
  data?: string;
  [k: string]: unknown;
}
type StudentData = Record<string, unknown>;

// Ports student_details.dart fields: f, l, dob, fnumber, sex, father, mother,
// adhaar, caste, email. Loads via getStudentDetails (live API).
export default function StudentsPage() {
  const [cls, setCls] = useState(CLASS_TYPES[0]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState<StudentData | null>(null);

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
    load(cls);
  }, [cls, load]);

  const name = (s: StudentData) => `${s.f ?? ""} ${s.l ?? ""}`.trim() || "—";
  const filtered = students.filter((s) => name(s).toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <PageHeader title="Students" description="Student records by class." />

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="w-full max-w-xs space-y-1.5">
              <Label className="text-xs">Class</Label>
              <Select value={cls} onValueChange={(v) => setCls(v ?? CLASS_TYPES[0])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLASS_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={GraduationCap} title="No students found" description="Select another class." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Father</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Sex</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{name(s)}</TableCell>
                      <TableCell className="text-muted-foreground">{(s.father as string) || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{(s.fnumber as string) || "—"}</TableCell>
                      <TableCell>{(s.sex as string) || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewing(s)} aria-label="View">
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewing ? name(viewing) : ""}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {([
                ["Date of Birth", viewing.dob ? formatDDMMYYYY(String(viewing.dob)) : undefined],
                ["Sex", viewing.sex as string],
                ["Father", viewing.father as string],
                ["Mother", viewing.mother as string],
                ["Contact", viewing.fnumber as string],
                ["Email", viewing.email as string],
                ["Aadhaar", viewing.adhaar as string],
                ["Caste", viewing.caste as string],
                ["Address", viewing.add as string],
              ] as [string, string | undefined][]).map(([k, v]) => (
                <div key={k} className="flex flex-col border-b pb-2">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="text-sm font-medium">{v || "—"}</dd>
                </div>
              ))}
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
