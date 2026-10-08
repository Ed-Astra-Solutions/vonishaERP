"use client";

import Link from "next/link";
import {
  UserPlus,
  CheckSquare,
  Wallet,
  CalendarOff,
  Bell,
  Boxes,
  ArrowRight,
} from "lucide-react";

import { useUserStore } from "@/stores/user";
import { canVisit } from "@/lib/permissions";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const quickLinks = [
  { label: "New Admission Enquiry", href: "/admissions", icon: UserPlus },
  { label: "Mark Attendance", href: "/attendance", icon: CheckSquare },
  { label: "Run Payroll", href: "/salary", icon: Wallet },
  { label: "Review Leave Requests", href: "/leave-management", icon: CalendarOff },
  { label: "Send Notification", href: "/notifications", icon: Bell },
  { label: "Inventory & Assets", href: "/admin/inventory", icon: Boxes },
];

export default function DashboardPage() {
  const user = useUserStore((s) => s.user);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.firstName ?? ""}`.trim()}
        description="Here's what's happening across your institution today."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Enquiries" value="—" icon={UserPlus} tone="info" hint="This month" />
        <StatCard label="Staff Present Today" value="—" icon={CheckSquare} tone="success" />
        <StatCard label="Pending Approvals" value="—" icon={CalendarOff} tone="warning" />
        <StatCard label="Payroll This Month" value="—" icon={Wallet} tone="default" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {quickLinks.filter((link) => canVisit(user, link.href)).map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <span className="text-sm font-medium">{link.label}</span>
                  <ArrowRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Name" value={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()} />
            <Row label="Email" value={user?.email ?? "—"} />
            <Row label="Role" value={user?.roleName || "—"} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
