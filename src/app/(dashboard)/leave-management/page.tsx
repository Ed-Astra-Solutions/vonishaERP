"use client";

import { useMemo, useState } from "react";
import { CalendarOff, Check, Plus, X } from "lucide-react";
import { toast } from "sonner";

import {
  LeaveStatus,
  LeaveType,
  EmployeeCategory,
  leaveTypeLabel,
  leaveCategoryLabel,
  leaveTotalDays,
  type LeaveApplication,
} from "@/types/erp";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { formatDDMMYYYY } from "@/lib/format";

const SEED: LeaveApplication[] = [
  {
    id: "L001", employeeId: "EMP001", employeeName: "Anitha K",
    category: EmployeeCategory.teaching, leaveType: LeaveType.casual,
    fromDate: "2026-07-06", toDate: "2026-07-07", reason: "Personal work",
    status: LeaveStatus.pending,
  },
  {
    id: "L002", employeeId: "EMP002", employeeName: "Ramesh S",
    category: EmployeeCategory.nonTeaching, leaveType: LeaveType.sick,
    fromDate: "2026-07-02", toDate: "2026-07-03", reason: "Fever",
    status: LeaveStatus.approved, approverName: "Principal",
  },
];

const STATUS_META: Record<LeaveStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  [LeaveStatus.pending]: { label: "Pending", variant: "secondary" },
  [LeaveStatus.approved]: { label: "Approved", variant: "default" },
  [LeaveStatus.rejected]: { label: "Rejected", variant: "destructive" },
  [LeaveStatus.cancelled]: { label: "Cancelled", variant: "outline" },
};

function toDDMMYYYY(iso: string) {
  const [y, m, d] = iso.split("T")[0].split("-");
  return d && m && y ? `${d}${m}${y}` : iso;
}

export default function LeaveManagementPage() {
  const [apps, setApps] = useState<LeaveApplication[]>(SEED);

  const counts = useMemo(
    () => ({
      pending: apps.filter((a) => a.status === LeaveStatus.pending).length,
      approved: apps.filter((a) => a.status === LeaveStatus.approved).length,
      rejected: apps.filter((a) => a.status === LeaveStatus.rejected).length,
    }),
    [apps],
  );

  function decide(id: string, status: LeaveStatus) {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status, approverName: "You" } : a)));
    toast.success(status === LeaveStatus.approved ? "Leave approved" : "Leave rejected");
  }

  function addApplication(a: LeaveApplication) {
    setApps((prev) => [a, ...prev]);
  }

  const tabs = [
    { key: "all", label: "All", rows: apps },
    { key: "pending", label: "Pending", rows: apps.filter((a) => a.status === LeaveStatus.pending) },
    { key: "approved", label: "Approved", rows: apps.filter((a) => a.status === LeaveStatus.approved) },
  ];

  return (
    <div>
      <PageHeader
        title="Leave Management"
        description="Applications, approvals and balances."
        actions={<ApplyDialog onApply={addApplication} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending" value={counts.pending} icon={CalendarOff} tone="warning" />
        <StatCard label="Approved" value={counts.approved} icon={CalendarOff} tone="success" />
        <StatCard label="Rejected" value={counts.rejected} icon={CalendarOff} tone="danger" />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t) => (
          <TabsContent key={t.key} value={t.key}>
            <Card>
              <CardContent className="p-0">
                {t.rows.length === 0 ? (
                  <EmptyState icon={CalendarOff} title="No applications" />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {t.rows.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell>
                              <div className="font-medium">{a.employeeName}</div>
                              <div className="text-xs text-muted-foreground">{leaveCategoryLabel[a.category]}</div>
                            </TableCell>
                            <TableCell>{leaveTypeLabel[a.leaveType]}</TableCell>
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                              {formatDDMMYYYY(toDDMMYYYY(a.fromDate))} – {formatDDMMYYYY(toDDMMYYYY(a.toDate))}
                            </TableCell>
                            <TableCell>{leaveTotalDays(a)}</TableCell>
                            <TableCell className="max-w-xs truncate text-muted-foreground">{a.reason}</TableCell>
                            <TableCell>
                              <Badge variant={STATUS_META[a.status].variant}>{STATUS_META[a.status].label}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {a.status === LeaveStatus.pending ? (
                                <div className="flex justify-end gap-1">
                                  <Button size="icon-sm" variant="ghost" className="text-emerald-600" onClick={() => decide(a.id, LeaveStatus.approved)} aria-label="Approve">
                                    <Check className="size-4" />
                                  </Button>
                                  <Button size="icon-sm" variant="ghost" className="text-red-600" onClick={() => decide(a.id, LeaveStatus.rejected)} aria-label="Reject">
                                    <X className="size-4" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">{a.approverName ?? "—"}</span>
                              )}
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
        ))}
      </Tabs>
    </div>
  );
}

function ApplyDialog({ onApply }: { onApply: (a: LeaveApplication) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<string>(String(LeaveType.casual));
  const [category, setCategory] = useState<string>(String(EmployeeCategory.teaching));
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");

  function submit() {
    if (!name || !from || !to) {
      toast.error("Fill All Fields");
      return;
    }
    onApply({
      id: `L${Date.now()}`,
      employeeId: `EMP${Date.now()}`,
      employeeName: name,
      category: Number(category) as EmployeeCategory,
      leaveType: Number(type) as LeaveType,
      fromDate: `${from}T00:00:00.000Z`,
      toDate: `${to}T00:00:00.000Z`,
      reason,
      status: LeaveStatus.pending,
    });
    toast.success("Leave application submitted");
    setOpen(false);
    setName(""); setFrom(""); setTo(""); setReason("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" /> Apply for leave
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply for leave</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Employee name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v ?? category)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(EmployeeCategory).filter((v) => typeof v === "number").map((v) => (
                  <SelectItem key={v} value={String(v)}>{leaveCategoryLabel[v as EmployeeCategory]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Leave type</Label>
            <Select value={type} onValueChange={(v) => setType(v ?? type)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(LeaveType).filter((v) => typeof v === "number").map((v) => (
                  <SelectItem key={v} value={String(v)}>{leaveTypeLabel[v as LeaveType]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Reason</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={submit}>Submit application</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
