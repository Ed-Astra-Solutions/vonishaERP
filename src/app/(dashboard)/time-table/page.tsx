"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, PartyPopper } from "lucide-react";

import { CLASS_TYPES } from "@/lib/constants";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PERIODS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00"];

type Grid = Record<string, Record<string, string>>;

// Local timetable builder (time_table_desktop.dart had no server calls).
export default function TimeTablePage() {
  const [cls, setCls] = useState(CLASS_TYPES[0]);
  const [grids, setGrids] = useState<Record<string, Grid>>({});

  const grid = grids[cls] ?? {};
  function setCell(day: string, period: string, value: string) {
    setGrids((prev) => ({
      ...prev,
      [cls]: { ...(prev[cls] ?? {}), [day]: { ...(prev[cls]?.[day] ?? {}), [period]: value } },
    }));
  }

  return (
    <div>
      <PageHeader
        title="Time Table"
        description="Manage the weekly time table for each class."
        actions={
          <Button variant="outline" render={<Link href="/time-table/events" />}>
            <PartyPopper className="size-4" /> View events
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-5 text-primary" /> Weekly schedule
          </CardTitle>
          <Select value={cls} onValueChange={(v) => setCls(v ?? CLASS_TYPES[0])}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CLASS_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-1">
              <thead>
                <tr>
                  <th className="w-20 p-2 text-left text-xs font-semibold text-muted-foreground">Time</th>
                  {DAYS.map((d) => (
                    <th key={d} className="p-2 text-center text-xs font-semibold text-muted-foreground">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((p) => (
                  <tr key={p}>
                    <td className="p-2 text-sm font-medium text-muted-foreground">{p}</td>
                    {DAYS.map((d) => (
                      <td key={d} className="p-1">
                        <Input
                          value={grid[d]?.[p] ?? ""}
                          onChange={(e) => setCell(d, p, e.target.value)}
                          placeholder="—"
                          className="h-9 min-w-28 text-center text-sm"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Enter subject / teacher per slot. Schedules are kept per class.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
