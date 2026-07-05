// Helpers for the staff/user records returned by /getvonishauserdetails.
// Each record: { name?, email, number, type, data: <json string> }.
// The decoded `data` object holds HR fields (see management_desktop.dart):
//   role, sex, dob, doj, t, Erole, adhaar, q, acc, bn, ifsc, add, s, ctc,
//   pan, pf, uan, salaryScheme, punchNumber, notes, pics.

export interface StaffData {
  role?: string;
  sex?: string;
  dob?: string;
  doj?: string;
  t?: string;
  Erole?: string;
  adhaar?: string;
  q?: string;
  acc?: string;
  bn?: string;
  ifsc?: string;
  add?: string;
  s?: string;
  ctc?: string;
  pan?: string;
  pf?: string;
  uan?: string;
  salaryScheme?: string;
  punchNumber?: string;
  notes?: string;
  [k: string]: unknown;
}

export interface StaffUser {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  number?: string;
  type?: string;
  data?: string | StaffData;
}

export function decodeStaffData(raw: string | StaffData | undefined): StaffData {
  if (!raw) return {};
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw) as StaffData;
  } catch {
    return {};
  }
}

export function staffFullName(u: StaffUser): string {
  if (u.name) return u.name;
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || "—";
}
