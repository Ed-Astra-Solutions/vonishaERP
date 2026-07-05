"use client";

import { useMemo, useState } from "react";
import { Bell, Mail, MessageSquare, Smartphone, Send } from "lucide-react";
import { toast } from "sonner";

import {
  NotificationChannel,
  NotificationStatus,
  notificationChannelLabel,
  notificationStatusLabel,
  type ERPNotification,
} from "@/types/erp";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SEED: ERPNotification[] = [
  { id: "N1", title: "Attendance Reminder", message: "Please mark your attendance for today.", channel: NotificationChannel.whatsapp, status: NotificationStatus.sent, recipientId: "R1", recipientName: "Ravi Kumar", recipientContact: "+91 98765 43210", createdAt: "2026-07-01T09:00:00.000Z", category: "attendance" },
  { id: "N2", title: "Leave Approved", message: "Your leave application for 20-21 Feb has been approved.", channel: NotificationChannel.email, status: NotificationStatus.sent, recipientId: "R2", recipientName: "Priya Sharma", recipientContact: "priya@school.com", createdAt: "2026-07-01T10:00:00.000Z", category: "leave" },
  { id: "N3", title: "Salary Credited", message: "Your salary for June has been credited.", channel: NotificationChannel.whatsapp, status: NotificationStatus.sent, recipientId: "R3", recipientName: "Suresh M", recipientContact: "+91 98765 43211", createdAt: "2026-07-01T11:00:00.000Z", category: "salary" },
  { id: "N4", title: "New Admission Enquiry", message: "A new admission enquiry has been received.", channel: NotificationChannel.inApp, status: NotificationStatus.read, recipientId: "R4", recipientName: "Admin", createdAt: "2026-07-02T08:00:00.000Z", category: "admission" },
  { id: "N5", title: "Attendance Alert", message: "Attendance below threshold for some staff.", channel: NotificationChannel.email, status: NotificationStatus.failed, recipientId: "R5", recipientName: "Admin", recipientContact: "admin@school.com", createdAt: "2026-07-02T12:00:00.000Z", category: "attendance" },
];

const CHANNEL_ICON = {
  [NotificationChannel.whatsapp]: MessageSquare,
  [NotificationChannel.email]: Mail,
  [NotificationChannel.inApp]: Smartphone,
};
const STATUS_VARIANT: Record<NotificationStatus, "default" | "secondary" | "destructive" | "outline"> = {
  [NotificationStatus.pending]: "secondary",
  [NotificationStatus.sent]: "default",
  [NotificationStatus.failed]: "destructive",
  [NotificationStatus.read]: "outline",
};

export default function NotificationsPage() {
  const [items, setItems] = useState<ERPNotification[]>(SEED);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("");
  const [contact, setContact] = useState("");
  const [channel, setChannel] = useState<string>(String(NotificationChannel.whatsapp));

  const stats = useMemo(
    () => ({
      sent: items.filter((n) => n.status === NotificationStatus.sent).length,
      failed: items.filter((n) => n.status === NotificationStatus.failed).length,
      total: items.length,
    }),
    [items],
  );

  function send() {
    if (!title.trim() || !message.trim() || !recipient.trim()) {
      toast.error("Fill All Fields");
      return;
    }
    const n: ERPNotification = {
      id: `N${Date.now()}`,
      title, message,
      channel: Number(channel) as NotificationChannel,
      status: NotificationStatus.sent,
      recipientId: `R${Date.now()}`,
      recipientName: recipient,
      recipientContact: contact,
      createdAt: new Date().toISOString(),
      category: "general",
    };
    setItems((prev) => [n, ...prev]);
    setTitle(""); setMessage(""); setRecipient(""); setContact("");
    toast.success("Notification sent");
  }

  const tabs = [
    { key: "all", label: "All", rows: items },
    { key: "whatsapp", label: "WhatsApp", rows: items.filter((n) => n.channel === NotificationChannel.whatsapp) },
    { key: "email", label: "Email", rows: items.filter((n) => n.channel === NotificationChannel.email) },
    { key: "inApp", label: "In-App", rows: items.filter((n) => n.channel === NotificationChannel.inApp) },
  ];

  return (
    <div>
      <PageHeader title="Notifications" description="WhatsApp, email and in-app messages." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Sent" value={stats.sent} icon={Send} tone="success" />
        <StatCard label="Failed" value={stats.failed} icon={Bell} tone="danger" />
        <StatCard label="All Notifications" value={stats.total} icon={Bell} tone="info" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Compose</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); send(); }}>
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={channel} onValueChange={(v) => setChannel(v ?? channel)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(NotificationChannel).filter((v) => typeof v === "number").map((v) => (
                      <SelectItem key={v} value={String(v)}>{notificationChannelLabel[v as NotificationChannel]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
              <div className="space-y-2"><Label>Recipient name</Label><Input value={recipient} onChange={(e) => setRecipient(e.target.value)} /></div>
              <div className="space-y-2"><Label>Contact (phone / email)</Label><Input value={contact} onChange={(e) => setContact(e.target.value)} /></div>
              <div className="space-y-2"><Label>Message</Label><Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} /></div>
              <Button type="submit" className="w-full"><Send className="size-4" /> Send notification</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Sent notifications</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                {tabs.map((t) => <TabsTrigger key={t.key} value={t.key}>{t.label}</TabsTrigger>)}
              </TabsList>
              {tabs.map((t) => (
                <TabsContent key={t.key} value={t.key}>
                  {t.rows.length === 0 ? (
                    <EmptyState icon={Bell} title="No notifications" />
                  ) : (
                    <ul className="divide-y">
                      {t.rows.map((n) => {
                        const Icon = CHANNEL_ICON[n.channel];
                        return (
                          <li key={n.id} className="flex gap-3 py-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Icon className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate font-medium">{n.title}</p>
                                <Badge variant={STATUS_VARIANT[n.status]}>{notificationStatusLabel[n.status]}</Badge>
                              </div>
                              <p className="line-clamp-1 text-sm text-muted-foreground">{n.message}</p>
                              <p className="text-xs text-muted-foreground">
                                {n.recipientName}{n.recipientContact ? ` · ${n.recipientContact}` : ""}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
