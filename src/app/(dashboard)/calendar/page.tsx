"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Loader2, Plus, PartyPopper, Palmtree } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { getMonth } from "@/lib/date";
import { formatDDMMYYYY } from "@/lib/format";
import { can } from "@/lib/permissions";
import { useUserStore } from "@/stores/user";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Server shape (vonisha_calender.js): [{ month: "MM", data: [<json event string>] }].
// Each event: { date: ddMMyyyy, name, type, description }.
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

const EVENT_TYPES = ["Holiday", "Special Event"];

export default function CalendarPage() {
  const canAdd = can(useUserStore((s) => s.user), "calendar", "edit");
  const [data, setData] = useState<MonthBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const [dateStr, setDateStr] = useState(""); // yyyy-mm-dd from <input type=date>
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await AuthService.getCalender(getToken() ?? "");
    if (isErr(res)) {
      setLoading(false);
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; data?: MonthBucket[] };
    if (body.success && Array.isArray(body.data)) setData(body.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Ports updateCalender add flow: build event, send month = ddMMyyyy.substring(2,4).
  async function addEvent() {
    if (!name.trim() || !type || !dateStr) {
      toast.error("Fill All Fields");
      return;
    }
    const [y, m, d] = dateStr.split("-");
    const formatedDate = `${d}${m}${y}`; // ddMMyyyy
    const event: CalEvent = { date: formatedDate, name, type, description };

    setSaving(true);
    const res = await AuthService.updateCalender(getToken() ?? "", event, m);
    setSaving(false);
    if (isErr(res)) {
      toast.error("Connection error");
      return;
    }
    const body = res.data as { success?: boolean; msg?: string };
    if (body.success) {
      toast.success("Added Event");
      setName("");
      setType("");
      setDescription("");
      setDateStr("");
      setOpen(false);
      load();
    } else {
      toast.error(body.msg ?? "Failed to add event");
    }
  }

  const totalEvents = data.reduce((n, m) => n + (m.data?.length ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Holidays, special events and important dates."
        actions={
          canAdd && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="size-4" /> Add event
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add calendar event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ename">Title</Label>
                  <Input id="ename" value={name} onChange={(e) => setName(e.target.value)} placeholder="Event title" />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edesc">Description</Label>
                  <Textarea id="edesc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                <Button onClick={addEvent} disabled={saving}>
                  {saving && <Loader2 className="size-4 animate-spin" />} Add to calendar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          )
        }
      />

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : totalEvents === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events yet"
          description="Add holidays and special events to build your institutional calendar."
        />
      ) : (
        <div className="space-y-6">
          {data.map((bucket) => {
            const events = (bucket.data ?? [])
              .map((s) => {
                try {
                  return JSON.parse(s) as CalEvent;
                } catch {
                  return null;
                }
              })
              .filter((e): e is CalEvent => e !== null);
            if (events.length === 0) return null;
            return (
              <Card key={bucket.month}>
                <CardHeader>
                  <CardTitle>{getMonth(parseInt(bucket.month, 10))}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {events.map((ev, i) => {
                    const holiday = ev.type === "Holiday";
                    return (
                      <div
                        key={i}
                        className="flex gap-3 rounded-lg border bg-card p-4"
                      >
                        <div
                          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                            holiday
                              ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {holiday ? <Palmtree className="size-5" /> : <PartyPopper className="size-5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium">{ev.name}</p>
                            <Badge variant={holiday ? "secondary" : "default"} className="shrink-0">
                              {ev.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{formatDDMMYYYY(ev.date)}</p>
                          {ev.description && (
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                              {ev.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
