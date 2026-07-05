"use client";

import { useMemo, useState } from "react";
import { ShieldCheck, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Decision = "pending" | "approved" | "rejected";
interface ApprovalRequest {
  id: string;
  name: string;
  role: string;
  type: string;
  requestedOn: string;
  status: Decision;
}

// Local approval workflow (approvals_desk.dart had no server calls).
const SEED: ApprovalRequest[] = [
  { id: "A1", name: "Srinidhi N", role: "Faculty", type: "New user access", requestedOn: "05 Jul 2026", status: "pending" },
  { id: "A2", name: "Ramesh S", role: "Admin", type: "Salary revision", requestedOn: "04 Jul 2026", status: "pending" },
  { id: "A3", name: "Deepa N", role: "Faculty", type: "Leave (5 days)", requestedOn: "03 Jul 2026", status: "pending" },
  { id: "A4", name: "Anitha K", role: "Master Admin", type: "Document access", requestedOn: "01 Jul 2026", status: "approved" },
];

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>(SEED);

  const counts = useMemo(
    () => ({
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
    }),
    [requests],
  );

  function decide(id: string, status: Decision) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success(status === "approved" ? "Request approved" : "Request rejected");
  }

  const tabs = [
    { key: "pending", label: "Pending", rows: requests.filter((r) => r.status === "pending") },
    { key: "approved", label: "Approved", rows: requests.filter((r) => r.status === "approved") },
    { key: "rejected", label: "Rejected", rows: requests.filter((r) => r.status === "rejected") },
  ];

  return (
    <div>
      <PageHeader title="Approvals" description="Review and action approval requests." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending" value={counts.pending} icon={Clock} tone="warning" />
        <StatCard label="Approved" value={counts.approved} icon={ShieldCheck} tone="success" />
        <StatCard label="Rejected" value={counts.rejected} icon={X} tone="danger" />
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          {tabs.map((t) => <TabsTrigger key={t.key} value={t.key}>{t.label}</TabsTrigger>)}
        </TabsList>
        {tabs.map((t) => (
          <TabsContent key={t.key} value={t.key}>
            <Card>
              <CardContent className="p-0">
                {t.rows.length === 0 ? (
                  <EmptyState icon={ShieldCheck} title="Nothing here" description="No requests in this state." />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Request</TableHead>
                          <TableHead>Requested on</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {t.rows.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.name}</TableCell>
                            <TableCell><Badge variant="secondary">{r.role}</Badge></TableCell>
                            <TableCell>{r.type}</TableCell>
                            <TableCell className="text-muted-foreground">{r.requestedOn}</TableCell>
                            <TableCell className="text-right">
                              {r.status === "pending" ? (
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" onClick={() => decide(r.id, "approved")}>
                                    <Check className="size-4" /> Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => decide(r.id, "rejected")}>
                                    <X className="size-4" /> Reject
                                  </Button>
                                </div>
                              ) : (
                                <Badge variant={r.status === "approved" ? "default" : "destructive"}>
                                  {r.status}
                                </Badge>
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
