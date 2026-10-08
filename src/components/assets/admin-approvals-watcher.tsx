"use client";

import { useCallback, useEffect } from "react";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { useUserStore } from "@/stores/user";
import { useAssetsStore } from "@/stores/assets";
import type { AssetRequest } from "@/types/assets";

const POLL_MS = 20000;

/**
 * Renders nothing. For admins, polls the pending asset-approval count into the assets
 * store so the sidebar item and Approvals tab can badge it. Cheap and self-clearing.
 */
export function AdminApprovalsWatcher() {
  const user = useUserStore((s) => s.user);
  const admin = can(user, "fixed_assets", "edit");
  const setPending = useAssetsStore((s) => s.setPendingApprovals);

  const load = useCallback(async () => {
    const res = await AuthService.getAssetRequests(getToken() ?? "", { status: "pending" });
    if (isErr(res)) return;
    const body = res.data as { success?: boolean; data?: AssetRequest[] };
    if (body.success && Array.isArray(body.data)) setPending(body.data.length);
  }, [setPending]);

  useEffect(() => {
    if (!user || !admin) {
      setPending(0);
      return;
    }
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [user, admin, load, setPending]);

  return null;
}
