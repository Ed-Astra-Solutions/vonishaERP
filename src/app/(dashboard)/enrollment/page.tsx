"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Loader2, Plus, UserCheck } from "lucide-react";
import { toast } from "sonner";

import type { EmployeeEnrollment } from "@/types/erp";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

// Faithful port of enrollment_desktop.dart: a local staff-onboarding list with an
// add form. (No server call in the original screen.)
const SEED: EmployeeEnrollment[] = [
  {
    id: "EMP001", firstName: "Anitha", lastName: "K", email: "anitha@school.com",
    phone: "+91 98765 44444", designation: "Teacher", department: "Teaching",
    employeeCategory: "teaching", joiningDate: "2026-03-01T00:00:00.000Z",
    personalDetails: {}, bankDetails: {}, status: "pending",
  },
  {
    id: "EMP002", firstName: "Ramesh", lastName: "S", email: "ramesh@school.com",
    phone: "+91 98765 55555", designation: "Accountant", department: "Finance",
    employeeCategory: "nonTeaching", joiningDate: "2026-02-15T00:00:00.000Z",
    personalDetails: {}, bankDetails: {}, status: "active",
  },
  {
    id: "EMP003", firstName: "Deepa", lastName: "N", email: "deepa@school.com",
    phone: "+91 98765 66666", designation: "Lab Assistant", department: "Science",
    employeeCategory: "nonTeaching", joiningDate: "2026-02-20T00:00:00.000Z",
    personalDetails: {}, bankDetails: {}, status: "pending",
  },
];

const CATEGORY_LABEL: Record<string, string> = {
  teaching: "Teaching Staff",
  nonTeaching: "Non-Teaching Staff",
  management: "Management",
};

const DEPARTMENTS = ["Teaching", "Finance", "Science", "Administration", "Support"];

export default function EnrollmentPage() {
  const [employees, setEmployees] = useState<EmployeeEnrollment[]>(SEED);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [category, setCategory] = useState("teaching");

  const counts = useMemo(
    () => ({
      total: employees.length,
      active: employees.filter((e) => e.status === "active").length,
      pending: employees.filter((e) => e.status === "pending").length,
    }),
    [employees],
  );

  function addEmployee() {
    if (!firstName.trim() || !email.trim()) {
      toast.error("First name and email are required");
      return;
    }
    setSaving(true);
    const emp: EmployeeEnrollment = {
      id: `EMP${Date.now()}`,
      firstName, lastName, email, phone, designation,
      department, employeeCategory: category,
      joiningDate: new Date().toISOString(),
      personalDetails: {}, bankDetails: {}, status: "pending",
    };
    setEmployees((prev) => [...prev, emp]);
    setSaving(false);
    setOpen(false);
    setFirstName(""); setLastName(""); setEmail(""); setPhone(""); setDesignation("");
    toast.success("Employee added");
  }

  const tabs: { key: string; label: string }[] = [
    { key: "all", label: "All" },
    { key: "teaching", label: "Teaching" },
    { key: "nonTeaching", label: "Non-Teaching" },
    { key: "management", label: "Management" },
  ];

  return (
    <div>
      <PageHeader
        title="Enrollment"
        description="Onboard and enroll staff."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="size-4" /> Add employee
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enroll new employee</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2 sm:grid-cols-2">
                <Field label="First name" value={firstName} onChange={setFirstName} />
                <Field label="Last name" value={lastName} onChange={setLastName} />
                <Field label="Email" value={email} onChange={setEmail} className="sm:col-span-2" />
                <Field label="Phone" value={phone} onChange={setPhone} />
                <Field label="Designation" value={designation} onChange={setDesignation} />
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={department} onValueChange={(v) => setDepartment(v ?? "")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teaching">Teaching Staff</SelectItem>
                      <SelectItem value="nonTeaching">Non-Teaching Staff</SelectItem>
                      <SelectItem value="management">Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                <Button onClick={addEmployee} disabled={saving}>
                  {saving && <Loader2 className="size-4 animate-spin" />} Add employee
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Staff" value={counts.total} icon={ClipboardList} tone="info" />
        <StatCard label="Active" value={counts.active} icon={UserCheck} tone="success" />
        <StatCard label="Pending" value={counts.pending} icon={ClipboardList} tone="warning" />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t) => {
          const rows =
            t.key === "all" ? employees : employees.filter((e) => e.employeeCategory === t.key);
          return (
            <TabsContent key={t.key} value={t.key}>
              <Card>
                <CardContent className="p-0">
                  {rows.length === 0 ? (
                    <EmptyState icon={ClipboardList} title="No staff in this category" />
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Designation</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.map((e) => (
                            <TableRow key={e.id}>
                              <TableCell>
                                <div className="font-medium">{e.firstName} {e.lastName}</div>
                                <div className="text-xs text-muted-foreground">{e.email}</div>
                              </TableCell>
                              <TableCell>{e.designation || "—"}</TableCell>
                              <TableCell>{e.department}</TableCell>
                              <TableCell>{CATEGORY_LABEL[e.employeeCategory] ?? e.employeeCategory}</TableCell>
                              <TableCell>
                                <Badge variant={e.status === "active" ? "default" : "secondary"}>
                                  {e.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

function Field({
  label, value, onChange, className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
