"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Wallet, FileText } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { inr } from "@/lib/format";
import { decodeStaffData, staffFullName, type StaffUser } from "@/lib/staff";
import { MONTHS } from "@/lib/date";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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

// Default salary rule (salary_model.dart SalaryRule defaults).
const RULE = { hra: 0.4, pf: 0.12, tds: 0, variable: 0.1, basicOfGross: 0.5 };

interface Payslip {
  name: string;
  email: string;
  scheme: string;
  gross: number;
  basic: number;
  hra: number;
  variable: number;
  pf: number;
  tds: number;
  net: number;
}

function computePayslip(u: StaffUser): Payslip {
  const d = decodeStaffData(u.data);
  const gross = Number(String(d.ctc ?? "0").replace(/[^\d.]/g, "")) || 0;
  const basic = gross * RULE.basicOfGross;
  const hra = basic * RULE.hra;
  const variable = basic * RULE.variable;
  const pf = basic * RULE.pf;
  const tds = gross * RULE.tds;
  const net = gross - pf - tds;
  return {
    name: staffFullName(u),
    email: u.email ?? "",
    scheme: d.salaryScheme ?? "—",
    gross, basic, hra, variable, pf, tds, net,
  };
}

export default function SalaryPage() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selected, setSelected] = useState<Payslip | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await AuthService.getUserDetails(getToken() ?? "");
    if (isErr(res)) {
      setLoading(false);
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; data?: StaffUser[] };
    if (body.success && Array.isArray(body.data)) setStaff(body.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const slips = useMemo(() => staff.map(computePayslip), [staff]);
  const totals = useMemo(
    () => ({
      gross: slips.reduce((n, s) => n + s.gross, 0),
      net: slips.reduce((n, s) => n + s.net, 0),
      pf: slips.reduce((n, s) => n + s.pf, 0),
    }),
    [slips],
  );

  return (
    <div>
      <PageHeader
        title="Salary"
        description="Payroll and payslips computed from staff CTC."
        actions={
          <Select value={month} onValueChange={(v) => setMonth(v ?? month)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Gross" value={loading ? "—" : inr(totals.gross)} icon={Wallet} tone="info" />
        <StatCard label="Total Net Payable" value={loading ? "—" : inr(totals.net)} icon={Wallet} tone="success" />
        <StatCard label="Total PF" value={loading ? "—" : inr(totals.pf)} icon={Wallet} tone="warning" />
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : slips.length === 0 ? (
            <EmptyState icon={Wallet} title="No payroll data" description="Add staff with CTC to generate payslips." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Scheme</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Deductions</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead className="text-right">Payslip</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slips.map((s, i) => (
                    <TableRow key={`${s.email}-${i}`}>
                      <TableCell>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.email}</div>
                      </TableCell>
                      <TableCell>{s.scheme}</TableCell>
                      <TableCell className="text-right">{inr(s.gross)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{inr(s.pf + s.tds)}</TableCell>
                      <TableCell className="text-right font-medium">{inr(s.net)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => setSelected(s)} aria-label="View payslip">
                          <FileText className="size-4" />
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

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payslip — {month}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{selected.name}</p>
                <p className="text-xs text-muted-foreground">{selected.email}</p>
              </div>
              <div className="rounded-lg border">
                <PayRow label="Basic" value={selected.basic} />
                <PayRow label="HRA" value={selected.hra} />
                <PayRow label="Variable Pay" value={selected.variable} />
                <PayRow label="Gross Salary" value={selected.gross} bold />
                <PayRow label="PF Deduction" value={-selected.pf} />
                <PayRow label="TDS Deduction" value={-selected.tds} />
                <PayRow label="Net Salary" value={selected.net} bold highlight />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PayRow({
  label, value, bold, highlight,
}: {
  label: string;
  value: number;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between border-b px-4 py-2.5 last:border-0 ${
        highlight ? "bg-primary/5" : ""
      }`}
    >
      <span className={bold ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className={bold ? "font-semibold" : ""}>{inr(value)}</span>
    </div>
  );
}
