"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Phone, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { todayDDMMYYYY, formatDDMMYYYY } from "@/lib/format";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Enquiry shape from the server (vonisha_enquiry.js): date (ddMMyyyy), name, number, remarks.
interface Enquiry {
  name: string;
  number: string;
  date: string;
  remarks: string;
}

export default function AdmissionsPage() {
  const [data, setData] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [remarks, setRemarks] = useState("");

  // Ports getEnquiries: success => data reversed (newest first).
  const load = useCallback(async () => {
    setLoading(true);
    const token = getToken() ?? "";
    const res = await AuthService.getEnquiries(token);
    if (isErr(res)) {
      setLoading(false);
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; data?: Enquiry[] };
    if (body.success && Array.isArray(body.data)) {
      setData([...body.data].reverse());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Ports addEnquiry onPressed: require name + number, send today's date.
  async function save() {
    if (!name.trim() || !number.trim()) {
      toast.error("Fill All Fields");
      return;
    }
    setSaving(true);
    const token = getToken() ?? "";
    const res = await AuthService.addEnquiry(token, name, number, todayDDMMYYYY(), remarks);
    setSaving(false);
    if (isErr(res)) {
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; msg?: string };
    if (body.success) {
      toast.success("Enquiry Added");
      setName("");
      setNumber("");
      setRemarks("");
      load();
    } else {
      toast.error(body.msg ?? "Failed to add enquiry");
    }
  }

  const filtered = data.filter(
    (e) =>
      e.name?.toLowerCase().includes(query.toLowerCase()) ||
      e.number?.includes(query),
  );

  return (
    <div>
      <PageHeader
        title="Admissions"
        description="Capture and track admission enquiries."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Enquiries" value={loading ? "—" : data.length} icon={UserPlus} tone="info" />
        <StatCard
          label="Added Today"
          value={loading ? "—" : data.filter((e) => e.date === todayDDMMYYYY()).length}
          icon={UserPlus}
          tone="success"
        />
        <StatCard label="With Remarks" value={loading ? "—" : data.filter((e) => e.remarks?.trim()).length} icon={UserPlus} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* New enquiry form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>New enquiry</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="name">Student / Parent name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number">Contact number</Label>
                <Input id="number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Phone number" inputMode="tel" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Notes, class applied, source…" rows={4} />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />} Save enquiry
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Enquiries list */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle>Enquiries</CardTitle>
            <div className="relative w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search name or number" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState icon={UserPlus} title="No enquiries yet" description="New admission enquiries will appear here." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((e, i) => (
                      <TableRow key={`${e.number}-${i}`}>
                        <TableCell className="font-medium">{e.name}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="size-3.5" /> {e.number}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDDMMYYYY(e.date)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground">
                          {e.remarks || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
