import { create } from "zustand";

import type { EmployeeEnrollment } from "@/types/erp";
import type { MediaItem } from "@/types/media";
import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";

/** Result of a write, so callers can toast the server's own message. */
export interface SaveResult {
  ok: boolean;
  msg?: string;
}

interface EnrollmentState {
  employees: EmployeeEnrollment[];
  loading: boolean;
  loaded: boolean;
  /** True when the server is unreachable and the offline seed roster is showing. */
  offline: boolean;
  load: (force?: boolean) => Promise<void>;
  addEmployee: (emp: EmployeeEnrollment) => Promise<SaveResult>;
  updateEmployee: (emp: EmployeeEnrollment) => Promise<SaveResult>;
  removeEmployee: (id: string) => Promise<SaveResult>;
  getEmployee: (id: string) => EmployeeEnrollment | undefined;
}

interface ServerRow extends Partial<EmployeeEnrollment> {
  _id?: string;
  employeeId?: string;
  profilePic?: MediaItem[];
  documents?: MediaItem[];
}

/** Normalise a server row into the shape the pages render. */
function fromServer(row: ServerRow): EmployeeEnrollment {
  return {
    ...(row as EmployeeEnrollment),
    id: row.employeeId || row._id || "",
    lastName: row.lastName ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    designation: row.designation ?? "",
    department: row.department ?? "",
    employeeCategory: row.employeeCategory ?? "teaching",
    joiningDate: row.joiningDate ?? new Date().toISOString(),
    bankDetails: row.bankDetails ?? {},
    profilePic: row.profilePic ?? [],
    documents: row.documents ?? [],
    status: row.status ?? "pending",
  };
}

/**
 * The staff roster. Records live on the server (vonisha_enrollments) because their
 * documents have to be reachable from the admin file browser — a client-only store
 * would leave uploaded files with nothing pointing at them. When the API is down the
 * roster is empty and writes are refused. There is deliberately no bundled fallback
 * list: it would ship staff Aadhaar / bank details to every browser.
 */
export const useEnrollmentStore = create<EnrollmentState>((set, get) => ({
  employees: [],
  loading: false,
  loaded: false,
  offline: false,

  load: async (force = false) => {
    if (get().loading) return;
    if (get().loaded && !force) return;
    set({ loading: true });
    const res = await AuthService.getEnrollment(getToken() ?? "");
    if (isErr(res)) {
      set({ employees: [], loading: false, loaded: true, offline: true });
      return;
    }
    const body = res.data as { success?: boolean; data?: ServerRow[] };
    if (!body.success) {
      set({ employees: [], loading: false, loaded: true, offline: true });
      return;
    }
    set({
      employees: (body.data ?? []).map(fromServer),
      loading: false,
      loaded: true,
      offline: false,
    });
  },

  addEmployee: async (emp) => {
    if (get().offline) return { ok: false, msg: "Server unavailable — cannot enroll right now" };
    const res = await AuthService.addEnrollment(getToken() ?? "", emp);
    if (isErr(res)) return { ok: false, msg: "Connection Error" };
    const body = res.data as { success?: boolean; msg?: string; data?: ServerRow };
    if (!body.success) return { ok: false, msg: body.msg };
    const saved = body.data ? fromServer(body.data) : emp;
    set((s) => ({ employees: [saved, ...s.employees] }));
    return { ok: true, msg: body.msg };
  },

  updateEmployee: async (emp) => {
    if (get().offline) return { ok: false, msg: "Server unavailable — cannot save right now" };
    const res = await AuthService.updateEnrollment(getToken() ?? "", emp);
    if (isErr(res)) return { ok: false, msg: "Connection Error" };
    const body = res.data as { success?: boolean; msg?: string; data?: ServerRow };
    if (!body.success) return { ok: false, msg: body.msg };
    const saved = body.data ? fromServer(body.data) : emp;
    set((s) => ({ employees: s.employees.map((e) => (e.id === emp.id ? saved : e)) }));
    return { ok: true, msg: body.msg };
  },

  removeEmployee: async (id) => {
    if (get().offline) return { ok: false, msg: "Server unavailable — cannot delete right now" };
    const res = await AuthService.removeEnrollment(getToken() ?? "", id);
    if (isErr(res)) return { ok: false, msg: "Connection Error" };
    const body = res.data as { success?: boolean; msg?: string };
    if (!body.success) return { ok: false, msg: body.msg };
    set((s) => ({ employees: s.employees.filter((e) => e.id !== id) }));
    return { ok: true, msg: body.msg };
  },

  getEmployee: (id) => get().employees.find((e) => e.id === id),
}));
