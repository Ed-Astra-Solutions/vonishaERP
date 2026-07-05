"use client";

import { useCallback, useEffect } from "react";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken, isAdmin } from "@/lib/auth";
import { useUserStore } from "@/stores/user";
import { useInventoryStore } from "@/stores/inventory";
import type { InventoryRequest } from "@/types/inventory";

const POLL_MS = 20000;

/** Renders nothing. For admins, polls the pending inventory-approval count into the store. */
export function AdminInventoryWatcher() {
  const user = useUserStore((s) => s.user);
  const admin = isAdmin(user?.type);
  const setPending = useInventoryStore((s) => s.setPendingApprovals);

  const load = useCallback(async () => {
    const res = await AuthService.getInventoryRequests(getToken() ?? "", { status: "pending" });
    if (isErr(res)) return;
    const body = res.data as { success?: boolean; data?: InventoryRequest[] };
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
