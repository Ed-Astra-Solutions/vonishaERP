"use client";

import { useCallback, useEffect, useState } from "react";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";

// A login account from /getStaffRoles. `type` is the raw stored role ('am' for an
// Assets Manager, 'f' for faculty, 'c' for a Coordinator, a space-encoded admin
// string otherwise).
export interface StaffRole {
  email: string;
  name: string;
  number?: string;
  type?: string;
  role?: "admin" | "faculty" | "assets_manager" | "coordinator";
}

export function isAssetManager(s: StaffRole): boolean {
  return s.type === "am";
}

export function isCoordinatorRole(s: StaffRole): boolean {
  return s.type === "c";
}

/**
 * Loads the staff directory with each account's login role. Admin-only on the
 * server; a rejection just yields an empty list so non-admin surfaces degrade to
 * "no badges" rather than erroring.
 */
export function useStaffRoles() {
  const [staff, setStaff] = useState<StaffRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const res = await AuthService.getStaffRoles(getToken() ?? "");
    if (isErr(res)) {
      setError("Connection Error");
      setStaff([]);
      setLoading(false);
      return;
    }
    const body = res.data as { success?: boolean; msg?: string; data?: StaffRole[] };
    if (!body.success) {
      setError(body.msg ?? "Could not load staff");
      setStaff([]);
    } else {
      setError(null);
      setStaff(body.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { staff, loading, error, reload };
}
