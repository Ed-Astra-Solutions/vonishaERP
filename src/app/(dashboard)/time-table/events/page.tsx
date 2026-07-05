"use client";

import { useCallback, useEffect, useState } from "react";
import { PartyPopper, CalendarDays } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { getMonth } from "@/lib/date";
import { formatDDMMYYYY } from "@/lib/format";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CalEvent {
  date: string;
  name: string;
  type: string;
  description: string;
}
interface MonthBucket {
  month: string;
  data: string[];
}

// Ports events_desktop.dart: read the calendar and surface only "Special Event" entries.
export default function EventsPage() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await AuthService.getCalender(getToken() ?? "");
    if (isErr(res)) {
      setLoading(false);
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; data?: MonthBucket[] };
    const found: CalEvent[] = [];
    (body.data ?? []).forEach((bucket) => {
      (bucket.data ?? []).forEach((s) => {
        try {
          const ev = JSON.parse(s) as CalEvent;
          if (ev.type === "Special Event") found.push(ev);
        } catch {
          /* ignore malformed */
        }
      });
    });
    setEvents(found);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader title="Events" description="Special events across the institutional calendar." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Special Events" value={loading ? "—" : events.length} icon={PartyPopper} tone="info" />
        <StatCard label="Upcoming Months" value={loading ? "—" : new Set(events.map((e) => e.date.slice(2, 4))).size} icon={CalendarDays} tone="success" />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : events.length === 0 ? (
        <EmptyState icon={PartyPopper} title="No special events" description="Special events added in the calendar will appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((ev, i) => (
            <Card key={i}>
              <CardContent className="flex gap-3 p-5">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <PartyPopper className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{ev.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDDMMYYYY(ev.date)} · {getMonth(parseInt(ev.date.slice(2, 4), 10))}
                  </p>
                  {ev.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{ev.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
