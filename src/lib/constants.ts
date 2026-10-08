// Fallback class list — used only when /getClasses cannot be reached.
//
// The live list lives in the `vonisha_class` collection and is edited by admins at
// /master/classes; the server seeds it from the identical list in
// vonishaServer/config/class_incharges.js, which came from
// `excel_ref/Class list  center names with incharge.docx` (CENTER / LEVEL / CLASS /
// INCHARGE). Each doc row covers a group of grades sharing one incharge; we keep one
// entry per grade so rosters stay per-grade.
//
// Rows here carry `canEdit: false` — offline we cannot tell who the incharge is, so
// the UI stays read-only rather than guessing.
//
// NOTE ON EMAILS: `email` is the address the person signs in with. Vonisha logins are
// role mailboxes (grade8@ is Pavithra N), not the personal addresses in the employee
// list. Incharges without a login carry name + aliases only.

import type { ClassIncharge, ClassRow } from "@/types/classes";

const SAKSHI: ClassIncharge = { name: "Sakshi Suman" };
const ARCHANA: ClassIncharge = {
  name: "Archana Maria A",
  aliases: ["Archana", "Archana Maria"],
};
const SHRAVANTHI: ClassIncharge = {
  name: "M Shravanti",
    email: "obelevelc@vonishafoundation.org",
  aliases: ["Shravanti", "Shravanthi", "Shravanti M"],
};
const PAVITHRA: ClassIncharge = {
  name: "Pavithra N",
    email: "grade8@vonishafoundation.org",
  aliases: ["Pavithra"],
};
const KARTHIK: ClassIncharge = {
  name: "Karthik.M",
  aliases: ["Karthik", "Karthik M"],
};
const AKILESH: ClassIncharge = {
  name: "Akilesh.S",
  aliases: ["Akilesh", "Akilesh S"],
};
const SARASWATHI: ClassIncharge = {
  name: "Saraswathi",
};
const NANDINI: ClassIncharge = {
  name: "Nandini RR",
  aliases: ["Nandini", "Nandini R R"],
};
const SUDHA: ClassIncharge = {
  name: "Sudha.M",
    email: "obebetta@vonishafoundation.org",
  aliases: ["Sudha", "Sudha M"],
};
const KUSUMA: ClassIncharge = {
  name: "K.Kusuma Kumari",
  aliases: ["Kusuma", "Kusuma Kumari", "Koilada Kusuma Kumari"],
};
const RAJINA: ClassIncharge = { name: "Rajina.K", aliases: ["Rajina", "Rajina K"] };
const SWETHA: ClassIncharge = {
  name: "Swetha",
  aliases: ["Shwetha"],
};

// One row per grade, ordered center -> level -> grade (the order of the dropdown).
const SEED: Omit<ClassRow, "canEdit" | "canMarkAttendance">[] = [
  { id: "ECCE - LKG", center: "ECCE", incharge: SAKSHI },
  { id: "ECCE - UKG", center: "ECCE", incharge: SAKSHI },

  { id: "OBE Level A - Grade 1", center: "OBE", level: "A", incharge: ARCHANA },
  { id: "OBE Level A - Grade 2", center: "OBE", level: "A", incharge: ARCHANA },
  { id: "OBE Level A - Grade 3", center: "OBE", level: "A", incharge: ARCHANA },
  { id: "OBE Level B - Grade 4", center: "OBE", level: "B", incharge: SHRAVANTHI },
  { id: "OBE Level B - Grade 5", center: "OBE", level: "B", incharge: SHRAVANTHI },
  { id: "OBE Level C - Grade 6", center: "OBE", level: "C", incharge: PAVITHRA },
  { id: "OBE Level C - Grade 7", center: "OBE", level: "C", incharge: PAVITHRA },
  { id: "OBE Level C - Grade 8", center: "OBE", level: "C", incharge: PAVITHRA },

  { id: "Akshaya NIOS - Grade 9", center: "Akshaya", level: "NIOS", incharge: KARTHIK },
  { id: "Akshaya NIOS - Grade 10", center: "Akshaya", level: "NIOS", incharge: KARTHIK },
  { id: "Akshaya KSEAB - Grade 9", center: "Akshaya", level: "KSEAB", incharge: AKILESH },
  { id: "Akshaya KSEAB - Grade 10", center: "Akshaya", level: "KSEAB", incharge: AKILESH },
  { id: "Akshaya KSEAB - Grade 12", center: "Akshaya", level: "KSEAB", incharge: SARASWATHI },

  { id: "BDP ECCE - LKG", center: "BDP ECCE", incharge: NANDINI },
  { id: "BDP ECCE - UKG", center: "BDP ECCE", incharge: NANDINI },

  { id: "BDP Level A - Grade 1", center: "BDP", level: "A", incharge: SUDHA },
  { id: "BDP Level A - Grade 2", center: "BDP", level: "A", incharge: SUDHA },
  { id: "BDP Level A - Grade 3", center: "BDP", level: "A", incharge: SUDHA },
  { id: "BDP Level B - Grade 4", center: "BDP", level: "B", incharge: KUSUMA },
  { id: "BDP Level B - Grade 5", center: "BDP", level: "B", incharge: KUSUMA },
  { id: "BDP Level C - Grade 6", center: "BDP", level: "C", incharge: RAJINA },
  { id: "BDP Level C - Grade 7", center: "BDP", level: "C", incharge: RAJINA },
  { id: "BDP Level C - Grade 8", center: "BDP", level: "C", incharge: RAJINA },

  { id: "SEP - Grade 5", center: "SEP", incharge: SWETHA },
  { id: "SEP - Grade 6", center: "SEP", incharge: SWETHA },
  { id: "SEP - Grade 7", center: "SEP", incharge: SWETHA },
  { id: "SEP - Grade 8", center: "SEP", incharge: SWETHA },
  { id: "SEP - Grade 9 (NIOS/KSEAB)", center: "SEP", incharge: ARCHANA },
  { id: "SEP - Grade 10 (NIOS/KSEAB)", center: "SEP", incharge: ARCHANA },
];

export const FALLBACK_CLASSES: ClassRow[] = SEED.map((c, i) => ({
  ...c,
  order: (i + 1) * 10,
  // The fallback list carries no incharge information, so it cannot grant anything —
  // a degraded class list is read-only for both roster edits and attendance.
  canEdit: false,
  canMarkAttendance: false,
}));

/** Class names from the fallback list. Prefer `useClassesStore` for the live list. */
export const CLASS_TYPES = FALLBACK_CLASSES.map((c) => c.id);

export const SEX_OPTIONS = ["Male", "Female", "Other"];
// Student houses — ported verbatim from management_mobile.dart `houseTypes`.
export const HOUSE_TYPES = ["Red House", "Blue House", "Green House", "Yellow House"];
export const SALARY_SCHEMES = ["Monthly", "Consolidated", "Daily Wage", "Hourly"];
