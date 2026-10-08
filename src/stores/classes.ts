import { create } from "zustand";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { FALLBACK_CLASSES } from "@/lib/constants";
import type { ClassRow } from "@/types/classes";

// The class list, fetched once per session from /getClasses and shared by every class
// dropdown. Admins edit it at /master/classes; `refresh()` re-pulls after a change.
//
// `canEdit` on each row is computed server-side from the class's incharge, so screens
// never re-derive the rule. If the request fails we fall back to the static list from
// the class-list doc so the dropdowns still work — but everything is read-only then,
// since we cannot know who the incharge is.
interface ClassesState {
  classes: ClassRow[];
  loading: boolean;
  loaded: boolean;
  /** True when the list came from the static fallback rather than the server. */
  degraded: boolean;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
}

async function fetchClasses(): Promise<{ rows: ClassRow[]; degraded: boolean }> {
  const res = await AuthService.getClasses(getToken() ?? "");
  if (isErr(res)) return { rows: FALLBACK_CLASSES, degraded: true };
  const body = res.data as { success?: boolean; data?: ClassRow[] };
  if (!body?.success || !Array.isArray(body.data)) {
    return { rows: FALLBACK_CLASSES, degraded: true };
  }
  return { rows: body.data, degraded: false };
}

export const useClassesStore = create<ClassesState>((set, get) => ({
  classes: [],
  loading: false,
  loaded: false,
  degraded: false,

  // Idempotent: safe to call from every screen that needs the list.
  load: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    const { rows, degraded } = await fetchClasses();
    set({ classes: rows, loading: false, loaded: true, degraded });
  },

  refresh: async () => {
    set({ loading: true });
    const { rows, degraded } = await fetchClasses();
    set({ classes: rows, loading: false, loaded: true, degraded });
  },
}));
