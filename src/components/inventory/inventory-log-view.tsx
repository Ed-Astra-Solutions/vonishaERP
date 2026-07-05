"use client";

import { useCallback, useEffect, useState } from "react";
import { ScrollText, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import type { InventoryLog } from "@/types/inventory";
import { INV_ACTION_META } from "@/components/inventory/inv-action-meta";
import { PageHeader } from "@/components/common/page-header";
import { MediaGallery } from "@/components/common/media-gallery";
import { EmptyState } from "@/components/common/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function when(s: string): string {
  const d = new Date(s);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export function InventoryLogView({ description, hideHeader = false }: { description: string; hideHeader?: boolean }) {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await AuthService.getInventoryLog(getToken() ?? "");
    if (isErr(res)) {
      setLoading(false);
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; data?: InventoryLog[] };
    if (body.success && Array.isArray(body.data)) setLogs(body.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      {!hideHeader && <PageHeader title="Inventory Audit Log" description={description} />}

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No changes yet" description="Item and stock changes will appear here." />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>By</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Files</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => {
                const m = INV_ACTION_META[l.action];
                return (
                  <TableRow key={l._id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{when(l.timestamp)}</TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", m?.badge)}>
                        <span className={cn("size-1.5 rounded-full", m?.dot)} />
                        {m?.label ?? l.action}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{l.itemName || l.sku}</div>
                      <div className="font-mono text-xs text-muted-foreground">{l.sku}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-sm tabular-nums">
                      {l.quantityBefore ?? 0}
                      <ArrowRight className="mx-1 inline size-3 text-muted-foreground" />
                      <span className="font-semibold">{l.quantityAfter ?? 0}</span>
                      {l.action === "damage" && (
                        <span className="ml-2 text-xs text-amber-600">
                          (dmg {l.damagedBefore ?? 0}→{l.damagedAfter ?? 0})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {l.actorName || l.actorEmail || "—"}
                      {l.actorRole && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({l.actorRole === "assets_manager" ? "AM" : "Admin"})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-sm text-muted-foreground">{l.note || "—"}</TableCell>
                    <TableCell>
                      {l.media && l.media.length > 0 ? <MediaGallery media={l.media} /> : <span className="text-sm text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
