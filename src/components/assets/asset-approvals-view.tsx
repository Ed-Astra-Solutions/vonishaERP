"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { requestStatusLabel, type AssetRequest, type RequestStatus } from "@/types/assets";
import { describeRequest } from "@/components/assets/describe-request";
import { MediaGallery } from "@/components/common/media-gallery";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_VARIANT: Record<RequestStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  applied: "outline",
};

export function AssetApprovalsView({ hideHeader = false }: { hideHeader?: boolean }) {
  const [rows, setRows] = useState<AssetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const [rejecting, setRejecting] = useState<AssetRequest | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await AuthService.getAssetRequests(getToken() ?? "");
    if (isErr(res)) {
      setLoading(false);
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; data?: AssetRequest[] };
    if (body.success && Array.isArray(body.data)) setRows(body.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = rows.filter((r) => r.status === "pending");
  const visible = tab === "pending" ? pending : rows;

  async function approve(r: AssetRequest) {
    setBusyId(r._id);
    const res = await AuthService.resolveAssetRequest(getToken() ?? "", r._id, "approve");
    setBusyId(null);
    handleResult(res, "Approved");
  }

  async function reject(reason: string) {
    if (!rejecting) return;
    setBusyId(rejecting._id);
    const res = await AuthService.resolveAssetRequest(getToken() ?? "", rejecting._id, "reject", reason);
    setBusyId(null);
    setRejecting(null);
    handleResult(res, "Rejected");
  }

  function handleResult(res: Awaited<ReturnType<typeof AuthService.resolveAssetRequest>>, ok: string) {
    if (isErr(res)) {
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; msg?: string };
    if (body.success) {
      toast.success(ok);
      load();
    } else {
      toast.error(body.msg ?? "Failed");
    }
  }

  return (
    <div>
      {!hideHeader && (
        <PageHeader
          title="Asset Approvals"
          description="Review stock change requests raised by Assets Managers."
        />
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending" value={loading ? "—" : pending.length} icon={ClipboardCheck} tone="warning" />
        <StatCard label="Total Requests" value={loading ? "—" : rows.length} icon={ClipboardCheck} tone="info" />
        <StatCard label="Approved (awaiting)" value={loading ? "—" : rows.filter((r) => r.status === "approved").length} icon={ClipboardCheck} tone="default" />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab((v as "pending" | "all") ?? "pending")}>
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="all">All ({rows.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : visible.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Nothing to review" description="New requests will appear here." />
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <Card key={r._id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="min-w-0 space-y-1">
                  <div className="text-sm">{describeRequest(r)}</div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant={STATUS_VARIANT[r.status]}>{requestStatusLabel[r.status]}</Badge>
                    <span>by {r.requestedByName || r.requestedByEmail}</span>
                    {r.note && <span>· “{r.note}”</span>}
                    {r.rejectReason && <span className="text-red-600">· rejected: {r.rejectReason}</span>}
                  </div>
                  {r.media && r.media.length > 0 && <MediaGallery media={r.media} className="pt-1" />}
                </div>
                {r.status === "pending" && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => approve(r)} disabled={busyId === r._id}>
                      {busyId === r._id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRejecting(r)} disabled={busyId === r._id}>
                      <X className="size-4" /> Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RejectDialog request={rejecting} onOpenChange={(o) => !o && setRejecting(null)} onReject={reject} />
    </div>
  );
}

function RejectDialog({
  request,
  onOpenChange,
  onReject,
}: {
  request: AssetRequest | null;
  onOpenChange: (o: boolean) => void;
  onReject: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open={!!request} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Reject request</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label>Reason (optional)</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this rejected?" />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button variant="destructive" onClick={() => { onReject(reason); setReason(""); }}>
            Reject request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
