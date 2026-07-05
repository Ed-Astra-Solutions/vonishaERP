"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Search, Users, GraduationCap, Eye } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { CLASS_TYPES, SEX_OPTIONS, SALARY_SCHEMES } from "@/lib/constants";
import { decodeStaffData, staffFullName, type StaffUser } from "@/lib/staff";
import { formatDDMMYYYY } from "@/lib/format";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

export default function StaffManagementPage() {
  return (
    <div>
      <PageHeader title="Manage Users" description="Staff directory and student records." />
      <Tabs defaultValue="staff">
        <TabsList>
          <TabsTrigger value="staff">
            <Users className="size-4" /> Staff
          </TabsTrigger>
          <TabsTrigger value="students">
            <GraduationCap className="size-4" /> Students
          </TabsTrigger>
        </TabsList>
        <TabsContent value="staff">
          <StaffTab />
        </TabsContent>
        <TabsContent value="students">
          <StudentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------------- Staff tab ------------------------------- */
function StaffTab() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState<StaffUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await AuthService.getUserDetails(getToken() ?? "");
    if (isErr(res)) {
      setLoading(false);
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; data?: StaffUser[] };
    if (body.success && Array.isArray(body.data)) setUsers(body.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = users.filter((u) =>
    staffFullName(u).toLowerCase().includes(query.toLowerCase()) ||
    (u.email ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Staff" value={loading ? "—" : users.length} icon={Users} tone="info" />
        <StatCard
          label="Teaching"
          value={loading ? "—" : users.filter((u) => decodeStaffData(u.data).Erole?.toLowerCase().includes("teach")).length}
          icon={Users}
          tone="success"
        />
        <StatCard label="Roles" value={loading ? "—" : new Set(users.map((u) => decodeStaffData(u.data).role)).size} icon={Users} />
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search staff" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <AddStaffDialog onAdded={load} />
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Users} title="No staff found" description="Add your first staff member to get started." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Number</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u, i) => {
                    const d = decodeStaffData(u.data);
                    return (
                      <TableRow key={`${u.email}-${i}`}>
                        <TableCell className="font-medium">{staffFullName(u)}</TableCell>
                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                        <TableCell className="text-muted-foreground">{u.number}</TableCell>
                        <TableCell>{d.Erole || d.role ? <Badge variant="secondary">{d.Erole || d.role}</Badge> : "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon-sm" onClick={() => setViewing(u)} aria-label="View">
                            <Eye className="size-4" />
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

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewing ? staffFullName(viewing) : ""}</DialogTitle>
          </DialogHeader>
          {viewing && <StaffDetails user={viewing} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StaffDetails({ user }: { user: StaffUser }) {
  const d = decodeStaffData(user.data);
  const rows: [string, string | undefined][] = [
    ["Email", user.email],
    ["Number", user.number],
    ["Role", d.Erole || d.role],
    ["Sex", d.sex],
    ["Date of Birth", d.dob ? formatDDMMYYYY(d.dob) : undefined],
    ["Date of Joining", d.doj ? formatDDMMYYYY(d.doj) : undefined],
    ["Employment", d.t],
    ["Qualification", d.q],
    ["CTC", d.ctc],
    ["Salary Scheme", d.salaryScheme],
    ["Punch Number", d.punchNumber],
    ["Aadhaar", d.adhaar],
    ["PAN", d.pan],
    ["PF", d.pf],
    ["UAN", d.uan],
    ["Account", d.acc],
    ["Bank", d.bn],
    ["IFSC", d.ifsc],
    ["Address", d.add],
  ];
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex flex-col border-b pb-2">
          <dt className="text-xs text-muted-foreground">{k}</dt>
          <dd className="text-sm font-medium">{v || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function AddStaffDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState<Record<string, string>>({});
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit() {
    if (!f.firstName || !f.email || !f.number) {
      toast.error("Fill All Fields");
      return;
    }
    // Data object matches management_desktop.dart addVonishaUser payload.
    const data = {
      role: f.role ?? "",
      sex: f.sex ?? "",
      dob: f.dob ? f.dob.split("-").reverse().join("") : "",
      doj: f.doj ? f.doj.split("-").reverse().join("") : "",
      pics: [""],
      t: f.employment ?? "",
      Erole: f.erole ?? f.role ?? "",
      adhaar: f.adhaar ?? "",
      q: f.q ?? "",
      acc: f.acc ?? "",
      bn: f.bn ?? "",
      ifsc: f.ifsc ?? "",
      add: f.add ?? "",
      s: f.s ?? "",
      ctc: f.ctc ?? "",
      notes: "",
      pan: f.pan ?? "",
      pf: f.pf ?? "",
      uan: f.uan ?? "",
      salaryScheme: f.salaryScheme ?? "",
      punchNumber: f.punchNumber ?? "",
    };
    setSaving(true);
    const res = await AuthService.addVonishaUser(
      f.email, f.firstName, f.lastName ?? "", f.type ?? "s", data, f.number, getToken() ?? "",
    );
    setSaving(false);
    if (isErr(res)) {
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; msg?: string };
    if (body.success) {
      toast.success("Added User Successfully");
      setOpen(false);
      setF({});
      onAdded();
    } else {
      toast.error(body.msg ?? "Failed to add user");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" /> Add staff
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add new staff member</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <TField label="First name" onChange={set("firstName")} />
          <TField label="Last name" onChange={set("lastName")} />
          <TField label="Email" onChange={set("email")} />
          <TField label="Number" onChange={set("number")} />
          <TField label="Role / Designation" onChange={set("erole")} />
          <div className="space-y-2">
            <Label>System role</Label>
            <Select value={f.type ?? "s"} onValueChange={(v) => setF((p) => ({ ...p, type: v ?? "s" }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="s">Staff</SelectItem>
                <SelectItem value="am">Assets Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Sex</Label>
            <Select value={f.sex ?? ""} onValueChange={(v) => setF((p) => ({ ...p, sex: v ?? "" }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {SEX_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DField label="Date of birth" onChange={set("dob")} />
          <DField label="Date of joining" onChange={set("doj")} />
          <TField label="Qualification" onChange={set("q")} />
          <TField label="CTC" onChange={set("ctc")} />
          <div className="space-y-2">
            <Label>Salary scheme</Label>
            <Select value={f.salaryScheme ?? ""} onValueChange={(v) => setF((p) => ({ ...p, salaryScheme: v ?? "" }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {SALARY_SCHEMES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <TField label="Punch number" onChange={set("punchNumber")} />
          <TField label="Aadhaar" onChange={set("adhaar")} />
          <TField label="PAN" onChange={set("pan")} />
          <TField label="PF" onChange={set("pf")} />
          <TField label="UAN" onChange={set("uan")} />
          <TField label="Account number" onChange={set("acc")} />
          <TField label="Bank name" onChange={set("bn")} />
          <TField label="IFSC" onChange={set("ifsc")} />
          <TField label="Address" onChange={set("add")} className="sm:col-span-2" />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />} Add staff
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------- Students tab ----------------------------- */
interface StudentUser {
  data?: string;
  [k: string]: unknown;
}

function StudentsTab() {
  const [cls, setCls] = useState(CLASS_TYPES[0]);
  const [students, setStudents] = useState<Record<string, unknown>[]>([]);
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
      try {
        return typeof s.data === "string" ? (JSON.parse(s.data) as Record<string, unknown>) : (s as Record<string, unknown>);
      } catch {
        return s as Record<string, unknown>;
      }
    });
    setStudents(parsed);
    setLoading(false);
  }, []);

  useEffect(() => {
    load(cls);
  }, [cls, load]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="w-full max-w-xs space-y-1.5">
              <Label className="text-xs">Class</Label>
              <Select value={cls} onValueChange={(v) => setCls(v ?? CLASS_TYPES[0])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLASS_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : students.length === 0 ? (
            <EmptyState icon={GraduationCap} title="No students in this class" description="Select another class or add students." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Father</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Sex</TableHead>
                    <TableHead>DOB</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{`${s.f ?? ""} ${s.l ?? ""}`.trim() || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{(s.father as string) || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{(s.fnumber as string) || "—"}</TableCell>
                      <TableCell>{(s.sex as string) || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{s.dob ? formatDDMMYYYY(s.dob as string) : "—"}</TableCell>
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

/* ------------------------------- helpers ------------------------------- */
function TField({
  label, onChange, className,
}: {
  label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      <Input onChange={onChange} />
    </div>
  );
}
function DField({
  label, onChange,
}: {
  label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="date" onChange={onChange} />
    </div>
  );
}
