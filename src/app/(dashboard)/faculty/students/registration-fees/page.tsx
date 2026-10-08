"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Download, Printer, Receipt, Search } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { inr } from "@/lib/format";
import { useClasses } from "@/lib/class-access";
import { useUserStore } from "@/stores/user";
import {
  type RegistrationPayment,
  amountOf,
  asPayments,
  formatPaymentDate,
  totalPaid,
} from "@/types/registration-fees";
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

// Nominal registration fee report — the ERP replacement for the per-centre Google
// Sheet ("Nominal Registration cost 2026-27.xlsx") kept alongside the written
// challan book for the 10 BD submission.
//
// Data comes from the same student records the incharges already maintain; the fee
// fields (regStatus / regExpected / regPayments) are captured on the add/edit
// student form. Rows are emitted one-per-challan, in the sheet's column order, and
// students with nothing recorded still get a row so defaulters are visible in the
// submission rather than silently missing.

interface StudentRow {
  data?: string;
  [k: string]: unknown;
}
type StudentData = Record<string, unknown>;

/** Hide the Flutter "Select"/"Select Date" sentinels. */
function clean(v: unknown): string {
  const s = v == null ? "" : String(v).trim();
  return s && s !== "Select" && s !== "Select Date" ? s : "";
}

// One line of the report. `payment` is undefined for a student with no challan yet.
interface FeeRow {
  cls: string;
  index: number;
  name: string;
  status: string;
  phone: string;
  parent: string;
  parentId: string;
  address: string;
  expected: number;
  paidTotal: number;
  payment?: RegistrationPayment;
  /** Position of `payment` within the student's challan list — the receipt's id. */
  paymentIndex?: number;
}

type PaidFilter = "all" | "paid" | "unpaid";

function buildRows(cls: string, students: StudentData[]): FeeRow[] {
  const rows: FeeRow[] = [];
  students.forEach((s, index) => {
    const payments = asPayments(s.regPayments);
    // The sheet's "FATHER / MOTHER NAME" and "PARENT AADHAR \ PAN" are single
    // columns — prefer the father's details, falling back to the mother's.
    const base: Omit<FeeRow, "payment"> = {
      cls,
      index,
      name: `${clean(s.f)} ${clean(s.l)}`.trim() || "—",
      status: clean(s.regStatus),
      phone: clean(s.fnumber) || clean(s.mothernum),
      parent: clean(s.father) || clean(s.mother),
      parentId: clean(s.fatherAdhaar) || clean(s.motherAdhaar),
      address: clean(s.add),
      expected: Number(clean(s.regExpected).replace(/[^0-9.]/g, "")) || 0,
      paidTotal: totalPaid(payments),
    };
    if (payments.length === 0) {
      rows.push({ ...base });
      return;
    }
    payments.forEach((payment, paymentIndex) =>
      rows.push({ ...base, payment, paymentIndex }),
    );
  });
  return rows;
}

// Sheet column order, matching the Google Sheet tabs so the export drops straight
// into the existing 10 BD workbook. RECEIPT NO is new — it is the S.No handwritten
// on the Vonisha Service Foundation receipt, previously only on paper.
const COLUMNS = [
  "SL NO",
  "STUDENT NAME",
  "REGISTRATION / DEFAULTER",
  "CLASS",
  "PHONE NUMBER",
  "FATHER / MOTHER NAME",
  "PARENT AADHAR / PAN",
  "ADDRESS",
  "DATE OF PAYMENT",
  "MODE OF PAYMENT",
  "AMOUNT PAID",
  "RECEIPT NO",
  "REMARKS",
] as const;

function csvCell(v: string): string {
  // Quote everything: names carry commas, addresses carry newlines, and Aadhaar /
  // phone numbers must not be re-interpreted as numbers by Excel.
  return `"${v.replace(/"/g, '""')}"`;
}

function rowToCells(r: FeeRow, sl: number): string[] {
  return [
    String(sl),
    r.name,
    r.status,
    r.cls,
    r.phone,
    r.parent,
    r.parentId,
    r.address,
    r.payment ? formatPaymentDate(r.payment.date) : "",
    r.payment?.mode ?? "",
    r.payment ? String(amountOf(r.payment)) : "",
    r.payment?.challanNo ?? "",
    r.payment?.remarks ?? "",
  ];
}

function downloadCsv(rows: FeeRow[], label: string) {
  const lines = [
    COLUMNS.map(csvCell).join(","),
    ...rows.map((r, i) => rowToCells(r, i + 1).map(csvCell).join(",")),
  ];
  // BOM so Excel reads the ₹ / regional names as UTF-8.
  const blob = new Blob(["﻿" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nominal-registration-fees-${label}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function RegistrationFeesReport() {
  const params = useSearchParams();
  const user = useUserStore((s) => s.user);
  const { ids, editable, loading: classesLoading } = useClasses();

  // Admins run the 10 BD submission across every centre; an incharge sees only the
  // classes they own — the same boundary that governs editing the roster.
  const visibleClasses = useMemo(
    // Edit-level roles (admin, finance, front office) see every class; view-level
    // (faculty) only the classes they are in charge of.
    () => (can(user, "registration_fees", "edit") ? ids : editable),
    [user, ids, editable],
  );

  const [scope, setScope] = useState(params.get("class") ?? "ALL");
  const [rows, setRows] = useState<FeeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [paidFilter, setPaidFilter] = useState<PaidFilter>("all");

  const targets = useMemo(
    () => (scope === "ALL" ? visibleClasses : visibleClasses.filter((c) => c === scope)),
    [scope, visibleClasses],
  );

  const load = useCallback(async (classes: string[]) => {
    if (classes.length === 0) {
      setRows([]);
      return;
    }
    setLoading(true);
    const token = getToken() ?? "";
    const results = await Promise.all(
      classes.map(async (c) => {
        const res = await AuthService.getStudentDetails(token, c);
        if (isErr(res)) return { cls: c, ok: false, students: [] as StudentData[] };
        const body = res.data as { success?: boolean; data?: StudentRow[] };
        const students = (body.data ?? []).map((s) => {
          try {
            return typeof s.data === "string" ? (JSON.parse(s.data) as StudentData) : (s as StudentData);
          } catch {
            return s as StudentData;
          }
        });
        return { cls: c, ok: true, students };
      }),
    );
    const failed = results.filter((r) => !r.ok).map((r) => r.cls);
    if (failed.length) {
      toast.error(
        failed.length === results.length
          ? "Connection Error"
          : `Could not load ${failed.length} class(es): ${failed.join(", ")}`,
      );
    }
    setRows(results.flatMap((r) => buildRows(r.cls, r.students)));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (classesLoading) return;
    load(targets);
  }, [targets, classesLoading, load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (paidFilter === "paid" && !r.payment) return false;
      if (paidFilter === "unpaid" && r.payment) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.parent.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        (r.payment?.challanNo ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, query, paidFilter]);

  // Totals are computed over the filtered set so they always match what's on screen
  // (and what an export would contain).
  const stats = useMemo(() => {
    const collected = filtered.reduce((n, r) => n + (r.payment ? amountOf(r.payment) : 0), 0);
    const cash = filtered.reduce(
      (n, r) => n + (r.payment?.mode === "Cash" ? amountOf(r.payment) : 0),
      0,
    );
    const upi = filtered.reduce(
      (n, r) => n + (r.payment?.mode === "UPI" ? amountOf(r.payment) : 0),
      0,
    );
    const students = new Set(filtered.map((r) => `${r.cls}#${r.index}`));
    const withPayment = new Set(
      filtered.filter((r) => r.payment).map((r) => `${r.cls}#${r.index}`),
    );
    return {
      collected,
      cash,
      upi,
      challans: filtered.filter((r) => r.payment).length,
      students: students.size,
      pending: students.size - withPayment.size,
    };
  }, [filtered]);

  const detailHref = (r: FeeRow) =>
    `/faculty/students/detail?class=${encodeURIComponent(r.cls)}&index=${r.index}`;
  const receiptHref = (r: FeeRow) =>
    `/faculty/students/registration-fees/receipt?class=${encodeURIComponent(r.cls)}&index=${r.index}&p=${r.paymentIndex ?? 0}`;

  return (
    <div>
      <PageHeader
        title="Nominal Registration Fees"
        description="Registration fee challans by class — the ERP replacement for the 10 BD submission sheet."
        actions={
          <Button
            variant="outline"
            disabled={filtered.length === 0}
            onClick={() => downloadCsv(filtered, scope === "ALL" ? "all-classes" : scope)}
          >
            <Download className="size-4" /> Export CSV
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Class</Label>
            <Select value={scope} onValueChange={(v) => setScope(v ?? "ALL")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All classes</SelectItem>
                {visibleClasses.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Show</Label>
            <Select value={paidFilter} onValueChange={(v) => setPaidFilter((v ?? "all") as PaidFilter)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All students</SelectItem>
                <SelectItem value="paid">Paid only</SelectItem>
                <SelectItem value="unpaid">Nothing recorded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="q">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="q"
                className="pl-8"
                placeholder="Name, parent, phone or receipt no."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Total collected", inr(stats.collected)],
          ["By UPI / Cash", `${inr(stats.upi)} / ${inr(stats.cash)}`],
          ["Challans", `${stats.challans}`],
          ["Students pending", `${stats.pending} of ${stats.students}`],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading || classesLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : visibleClasses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No classes available"
          description="You are not in charge of any class, so there is no registration fee data to show."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Nothing to show"
          description="No student matches these filters. Registration fees are recorded on the student's add/edit form."
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Sl</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Father / Mother</TableHead>
                  <TableHead>Aadhaar / PAN</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Receipt No.</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="w-12 text-right">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r, i) => (
                  <TableRow key={`${r.cls}#${r.index}#${i}`}>
                    <TableCell className="text-muted-foreground tabular-nums">{i + 1}</TableCell>
                    <TableCell className="font-medium">
                      <Link href={detailHref(r)} className="hover:underline">
                        {r.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {r.status ? (
                        <Badge variant={r.status === "Defaulter" ? "destructive" : "secondary"}>
                          {r.status}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{r.cls}</TableCell>
                    <TableCell className="tabular-nums">{r.phone || "—"}</TableCell>
                    <TableCell>{r.parent || "—"}</TableCell>
                    <TableCell className="tabular-nums">{r.parentId || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {r.payment ? formatPaymentDate(r.payment.date) || "—" : "—"}
                    </TableCell>
                    <TableCell>{r.payment?.mode || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.payment ? inr(amountOf(r.payment)) : "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">{r.payment?.challanNo || "—"}</TableCell>
                    <TableCell className="max-w-56 truncate">
                      {r.payment?.remarks || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.payment ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Print receipt for ${r.name}`}
                          render={<Link href={receiptHref(r)} />}
                        >
                          <Printer className="size-4" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function RegistrationFeesPage() {
  // useSearchParams requires a Suspense boundary for prerendering.
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <RegistrationFeesReport />
    </Suspense>
  );
}
