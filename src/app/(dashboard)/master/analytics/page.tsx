"use client";

import { Users, GraduationCap, Wallet, TrendingUp } from "lucide-react";

import { inr } from "@/lib/format";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Local analytics dashboard (analytics_desk.dart had no server calls).
const ATTENDANCE_TREND = [
  { label: "Feb", value: 88 },
  { label: "Mar", value: 91 },
  { label: "Apr", value: 86 },
  { label: "May", value: 93 },
  { label: "Jun", value: 90 },
  { label: "Jul", value: 94 },
];

const STAFF_MIX = [
  { label: "Teaching", value: 62, color: "var(--chart-1)" },
  { label: "Non-Teaching", value: 28, color: "var(--chart-2)" },
  { label: "Management", value: 10, color: "var(--chart-3)" },
];

export default function AnalyticsPage() {
  const maxTrend = Math.max(...ATTENDANCE_TREND.map((d) => d.value));

  return (
    <div>
      <PageHeader title="Analytics" description="Institution-wide performance overview." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Staff" value={64} icon={Users} tone="info" />
        <StatCard label="Total Students" value={551} icon={GraduationCap} tone="success" />
        <StatCard label="Total Salary" value={inr(2480000)} icon={Wallet} tone="warning" hint="Monthly payroll" />
        <StatCard label="Avg Attendance" value="90.3%" icon={TrendingUp} tone="default" hint="Last 6 months" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Attendance trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-56 items-end gap-4">
              {ATTENDANCE_TREND.map((d) => (
                <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md bg-[var(--chart-1)] transition-all"
                      style={{ height: `${(d.value / maxTrend) * 100}%` }}
                      title={`${d.value}%`}
                    />
                  </div>
                  <span className="text-xs font-medium">{d.value}%</span>
                  <span className="text-xs text-muted-foreground">{d.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {STAFF_MIX.map((s) => (
              <div key={s.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ background: s.color }} />
                    {s.label}
                  </span>
                  <span className="font-medium">{s.value}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${s.value}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
