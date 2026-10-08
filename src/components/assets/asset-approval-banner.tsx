"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { useUserStore } from "@/stores/user";
import { assetActionLabel, type AssetRequest } from "@/types/assets";
import { type MediaItem } from "@/types/media";
import { MediaUpload } from "@/components/common/media-upload";
import { Button } from "@/components/ui/button";

const POLL_MS = 20000;

/**
 * Persistent notification for Assets Managers: an approved request stays visible here
 * until the AM confirms the physical stock change (applyAssetRequest). Polls so a fresh
 * approval surfaces without a reload. Renders nothing for non-AM users or when empty.
 */
export function AssetApprovalBanner() {
  const user = useUserStore((s) => s.user);
  const isAM = can(user, "asset_stock", "edit");
  const [items, setItems] = useState<AssetRequest[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Optional extra media the AM attaches at confirmation time, keyed by request id.
  const [media, setMedia] = useState<Record<string, MediaItem[]>>({});

  const load = useCallback(async () => {
    const res = await AuthService.getAssetRequests(getToken() ?? "", {
      mine: true,
      status: "approved",
    });
    if (isErr(res)) return;
    const body = res.data as { success?: boolean; data?: AssetRequest[] };
    if (body.success && Array.isArray(body.data)) setItems(body.data);
  }, []);

  useEffect(() => {
    if (!isAM) return;
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [isAM, load]);

  async function apply(r: AssetRequest) {
    setBusyId(r._id);
    const res = await AuthService.applyAssetRequest(getToken() ?? "", r._id, media[r._id] ?? []);
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
          className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-500/40 dark:bg-amber-500/10"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
              <BellRing className="size-4 shrink-0" />
              <span>
                Approved —{" "}
                <span className="font-semibold">{assetActionLabel[r.action] ?? r.action}</span>{" "}
                {r.quantity} × {r.assetName} @ {r.center}
                {r.action === "transfer" && r.toCenter && (
                  <span className="inline-flex items-center gap-1">
                    <ArrowRight className="size-3" />
                    {r.toCenter}
                  </span>
                )}
                . Confirm the physical change to update stock.
              </span>
            </div>
            <Button size="sm" onClick={() => apply(r)} disabled={busyId === r._id}>
              {busyId === r._id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Confirm stock change
            </Button>
          </div>
          <MediaUpload
            purpose={r.action === "damage" ? "damage" : "evidence"}
            module="asset"
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
