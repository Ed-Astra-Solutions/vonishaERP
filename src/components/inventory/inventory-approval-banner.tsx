"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { useUserStore } from "@/stores/user";
import { INV_ACTION_META } from "@/components/inventory/inv-action-meta";
import type { InventoryRequest } from "@/types/inventory";
import { type MediaItem } from "@/types/media";
import { MediaUpload } from "@/components/common/media-upload";
import { Button } from "@/components/ui/button";

const POLL_MS = 20000;

/**
 * Persistent notification for Assets Managers: an approved inventory request stays
 * visible until the AM confirms the physical stock change. Mirrors the assets banner.
 */
export function InventoryApprovalBanner() {
  const user = useUserStore((s) => s.user);
  const isAM = can(user, "asset_stock", "edit");
  const [items, setItems] = useState<InventoryRequest[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [media, setMedia] = useState<Record<string, MediaItem[]>>({});

  const load = useCallback(async () => {
    const res = await AuthService.getInventoryRequests(getToken() ?? "", { mine: true, status: "approved" });
    if (isErr(res)) return;
    const body = res.data as { success?: boolean; data?: InventoryRequest[] };
    if (body.success && Array.isArray(body.data)) setItems(body.data);
  }, []);

  useEffect(() => {
    if (!isAM) return;
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [isAM, load]);

  async function apply(r: InventoryRequest) {
    setBusyId(r._id);
    const res = await AuthService.applyInventoryRequest(getToken() ?? "", r._id, media[r._id] ?? []);
    setBusyId(null);
    if (isErr(res)) {
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; msg?: string };
    if (body.success) {
      toast.success("Stock updated");
      setItems((prev) => prev.filter((x) => x._id !== r._id));
    } else {
      toast.error(body.msg ?? "Failed");
    }
  }

  if (!isAM || items.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      {items.map((r) => (
        <div
          key={r._id}
          className="space-y-3 rounded-lg border border-sky-300 bg-sky-50 px-4 py-3 text-sm dark:border-sky-500/40 dark:bg-sky-500/10"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sky-900 dark:text-sky-200">
              <BellRing className="size-4 shrink-0" />
              <span>
                Inventory approved —{" "}
                <span className="font-semibold">{INV_ACTION_META[r.action]?.label ?? r.action}</span>{" "}
                {r.quantity} × {r.itemName || r.sku}. Confirm to update stock.
              </span>
            </div>
            <Button size="sm" onClick={() => apply(r)} disabled={busyId === r._id}>
              {busyId === r._id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Confirm stock change
            </Button>
          </div>
          <MediaUpload
            purpose={r.action === "damage" ? "damage" : "evidence"}
            module="inventory"
            value={media[r._id] ?? []}
            onChange={(next) => setMedia((m) => ({ ...m, [r._id]: next }))}
            label="Add photo / video"
            description="Optional — attach proof captured while confirming this change."
          />
        </div>
      ))}
    </div>
  );
}
