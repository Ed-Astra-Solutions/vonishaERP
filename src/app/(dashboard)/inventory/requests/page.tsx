"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Send, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { requestStatusLabel, type InventoryRequest, type RequestStatus } from "@/types/inventory";
import { describeInvRequest } from "@/components/inventory/inv-describe-request";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_VARIANT: Record<RequestStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  applied: "outline",
};

export default function InventoryRequestsPage() {
  const [rows, setRows] = useState<InventoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await AuthService.getInventoryRequests(getToken() ?? "", { mine: true });
    if (isErr(res)) {
      setLoading(false);
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; data?: InventoryRequest[] };
    if (body.success && Array.isArray(body.data)) setRows(body.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function apply(r: InventoryRequest) {
    setBusyId(r._id);
    const res = await AuthService.applyInventoryRequest(getToken() ?? "", r._id);
    setBusyId(null);
    if (isErr(res)) {
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; msg?: string };
    if (body.success) {
      toast.success("Stock updated");
      load();
    } else {
      toast.error(body.msg ?? "Failed");
    }
  }

  return (
    <div>
      <PageHeader
        title="My Inventory Requests"
        description="Track your stock requests. Approved ones need you to confirm the physical change."
        actions={<Button render={<Link href="/inventory" />}><Send className="size-4" /> New request</Button>}
      />

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : rows.length === 0 ? (
        <EmptyState icon={Send} title="No requests yet" description="Raise a change from the Inventory page." />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r._id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="min-w-0 space-y-1">
                  <div className="text-sm">{describeInvRequest(r)}</div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant={STATUS_VARIANT[r.status]}>{requestStatusLabel[r.status]}</Badge>
                    {r.note && <span>· “{r.note}”</span>}
                    {r.rejectReason && <span className="text-red-600">· {r.rejectReason}</span>}
                  </div>
                </div>
                {r.status === "approved" && (
                  <Button size="sm" onClick={() => apply(r)} disabled={busyId === r._id}>
                    {busyId === r._id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    Confirm stock change
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
