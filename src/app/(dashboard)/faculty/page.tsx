"use client";

import Link from "next/link";
import { BookOpen, GraduationCap, CheckSquare, CalendarDays, Bell, ArrowRight } from "lucide-react";

import { useUserStore } from "@/stores/user";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const quickLinks = [
  { label: "Academic Records", href: "/faculty/academic-records", icon: BookOpen },
  { label: "My Students", href: "/faculty/students", icon: GraduationCap },
  { label: "Mark Attendance", href: "/attendance", icon: CheckSquare },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

export default function FacultyHomePage() {
  const user = useUserStore((s) => s.user);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.firstName ?? ""}`.trim()}
        description="Your teaching dashboard."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="My Classes" value="—" icon={BookOpen} tone="info" />
        <StatCard label="Students" value="—" icon={GraduationCap} tone="success" />
        <StatCard label="Today's Periods" value="—" icon={CalendarDays} tone="default" />
        <StatCard label="Pending Marks" value="—" icon={CheckSquare} tone="warning" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {quickLinks.map((link) => {
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
          <CardHeader><CardTitle>Your profile</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Name" value={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()} />
            <Row label="Email" value={user?.email ?? "—"} />
            <Row label="Role" value="Faculty" />
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
