import type { EmployeeEnrollment } from "@/types/erp";

// The staff roster itself lives on the server only (getEnrollment) — never bundle
// employee records here: anything in this file ships to every browser.

export const CATEGORY_LABEL: Record<string, string> = {
  teaching: "Teaching Staff",
  nonTeaching: "Non-Teaching Staff",
  management: "Management",
};

export const DEPARTMENTS = ["office", "Akshaya", "FULL TIME- SEP", "PART TIME", "OBE", "SEP-Anekal", "BDP"];
export const CATEGORIES = ["teaching", "nonTeaching", "management"];
export const EMPLOYMENT_TYPES = ["Full-time", "Part-time"];
export const SEXES = ["Female", "Male", "Other"];
export const STATUSES = ["pending", "active", "inactive"];

export function emptyEmployee(): EmployeeEnrollment {
  return {
    id: "",
    firstName: "", lastName: "", email: "", phone: "",
    designation: "", department: DEPARTMENTS[0], employeeCategory: "teaching",
    joiningDate: new Date().toISOString(), bankDetails: {}, status: "pending",
  };
}

// ISO <-> <input type="date"> helpers.
export function toDateInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}
export function fromDateInput(v: string): string | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}
export function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}
