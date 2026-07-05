"use client";

import { useMemo } from "react";
import { Scale, AlertTriangle, ShieldAlert, Info } from "lucide-react";

import type { ComplianceFlag } from "@/types/erp";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Ported ComplianceFlag seed from compliance_desktop.dart.
const FLAGS: ComplianceFlag[] = [
  { employeeId: "E004", employeeName: "Lakshmi N", flagType: "Consecutive Absence", description: "Absent for 3+ days without approved leave", date: "15/02/2026", severity: "critical" },
  { employeeId: "E001", employeeName: "Ravi Kumar", flagType: "Attendance Below Threshold", description: "Monthly attendance at 72% (below 85% threshold)", date: "01/02/2026", severity: "warning" },
  { employeeId: "E003", employeeName: "Priya Sharma", flagType: "Punch Mismatch", description: "Punch-in/out mismatch on multiple days", date: "28/01/2026", severity: "warning" },
  { employeeId: "E007", employeeName: "Mohan T", flagType: "Document Pending", description: "PF/UAN documents not submitted", date: "20/01/2026", severity: "info" },
];

const SEVERITY: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Info }> = {
  critical: { label: "Critical", variant: "destructive", icon: ShieldAlert },
  warning: { label: "Warning", variant: "secondary", icon: AlertTriangle },
  info: { label: "Info", variant: "outline", icon: Info },
};

export default function CompliancePage() {
  const counts = useMemo(
    () => ({
      critical: FLAGS.filter((f) => f.severity === "critical").length,
      warning: FLAGS.filter((f) => f.severity === "warning").length,
      info: FLAGS.filter((f) => f.severity === "info").length,
    }),
    [],
  );

  return (
    <div>
      <PageHeader title="Compliance" description="Attendance and policy compliance flags." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Critical" value={counts.critical} icon={ShieldAlert} tone="danger" />
        <StatCard label="Warnings" value={counts.warning} icon={AlertTriangle} tone="warning" />
        <StatCard label="Info" value={counts.info} icon={Info} tone="info" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="size-5 text-primary" /> Compliance flags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Flag</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {FLAGS.map((f, i) => {
                  const meta = SEVERITY[f.severity] ?? SEVERITY.info;
                  const Icon = meta.icon;
                  return (
                    <TableRow key={`${f.employeeId}-${i}`}>
                      <TableCell>
                        <div className="font-medium">{f.employeeName}</div>
                        <div className="text-xs text-muted-foreground">{f.employeeId}</div>
                      </TableCell>
                      <TableCell className="font-medium">{f.flagType}</TableCell>
                      <TableCell className="max-w-xs text-muted-foreground">{f.description}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{f.date}</TableCell>
                      <TableCell>
                        <Badge variant={meta.variant} className="gap-1">
                          <Icon className="size-3" /> {meta.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
