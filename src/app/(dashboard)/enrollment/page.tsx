"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Boxes, ClipboardList, Plus, UserCheck } from "lucide-react";

import { CATEGORY_LABEL } from "@/lib/enrollment-data";
import { isAssetManager, useStaffRoles } from "@/lib/staff-roles";
import { useEnrollmentStore } from "@/stores/enrollment";
import { can } from "@/lib/permissions";
import { useUserStore } from "@/stores/user";
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

const TABS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "teaching", label: "Teaching" },
  { key: "nonTeaching", label: "Non-Teaching" },
  { key: "management", label: "Management" },
];

export default function EnrollmentPage() {
  const canEnroll = can(useUserStore((s) => s.user), "enrollment", "edit");
  const router = useRouter();
  const employees = useEnrollmentStore((s) => s.employees);
  const load = useEnrollmentStore((s) => s.load);
  const offline = useEnrollmentStore((s) => s.offline);
  const { staff } = useStaffRoles();

  useEffect(() => {
    void load();
  }, [load]);

  // Login accounts currently holding the Assets Manager role, keyed by email so the
  // roster can badge the matching enrollment records.
  const managerEmails = useMemo(
    () => new Set(staff.filter(isAssetManager).map((s) => s.email.toLowerCase())),
    [staff],
  );

  const counts = useMemo(
    () => ({
      total: employees.length,
      active: employees.filter((e) => e.status === "active").length,
      pending: employees.filter((e) => e.status === "pending").length,
    }),
    [employees],
  );

  return (
    <div>
      <PageHeader
        title="Enrollment"
        description="Onboard and enroll staff."
        actions={
          canEnroll && (
            <>
              <Button variant="outline" render={<Link href="/admin/fixed-assets/managers" />}>
                <Boxes className="size-4" /> Asset managers
              </Button>
              <Button render={<Link href="/enrollment/new" />}>
                <Plus className="size-4" /> Add employee
              </Button>
            </>
          )
        }
      />

      {offline && (
        <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400">
          Couldn&apos;t load the staff roster — the server is unreachable, so enrolling and
          editing are disabled until it comes back.
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Staff" value={counts.total} icon={ClipboardList} tone="info" />
        <StatCard label="Active" value={counts.active} icon={UserCheck} tone="success" />
        <StatCard label="Pending" value={counts.pending} icon={ClipboardList} tone="warning" />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((t) => {
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
                            <TableHead>Center</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.map((e) => {
                            const href = `/enrollment/${encodeURIComponent(e.id)}`;
                            return (
                              <TableRow
                                key={e.id}
                                className="cursor-pointer"
                                onClick={() => router.push(href)}
                              >
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{e.firstName} {e.lastName}</span>
                                    {managerEmails.has(e.email.toLowerCase()) && (
                                      <Badge variant="secondary" className="gap-1">
                                        <Boxes className="size-3" /> Asset Manager
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">{e.email || "—"}</div>
                                </TableCell>
                                <TableCell>{e.designation || "—"}</TableCell>
                                <TableCell>{e.department}</TableCell>
                                <TableCell>{CATEGORY_LABEL[e.employeeCategory] ?? e.employeeCategory}</TableCell>
                                <TableCell>
                                  <Badge variant={e.status === "active" ? "default" : "secondary"}>
                                    {e.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(ev) => ev.stopPropagation()}
                                    render={<Link href={href} />}
                                  >
                                    View
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
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
