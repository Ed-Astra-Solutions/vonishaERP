// Classes and their person-in-charge, as served by /getClasses.
//
// The list lives in the `vonisha_class` collection and is admin-editable at
// /master/classes. It is seeded from the class-list doc on first read; the static
// list in lib/constants.ts is only a fallback for when the request fails.

export interface ClassIncharge {
  /** Full name as it appears in the employee list. */
  name: string;
  /** Official address, when there is one. Primary match key for edit access. */
  email?: string;
  /** Name spellings that should also resolve to this person (login records vary). */
  aliases?: string[];
}

export interface ClassRow {
  /** Stored on the student record as `class`. Renaming migrates the roster. */
  id: string;
  center: string;
  level?: string;
  order?: number;
  incharge: ClassIncharge;
  /** Whether the *current* user may edit this class's roster. Computed server-side. */
  canEdit: boolean;
  /**
   * Whether the *current* user may mark this class's student attendance. A separate
   * power from `canEdit`: coordinators mark every class without being able to touch
   * any roster. Computed server-side by canMarkAttendance.
   */
  canMarkAttendance: boolean;
}

/** Fields an admin can set when adding or editing a class. */
export interface ClassPayload {
  id: string;
  center: string;
  level?: string;
  order?: number;
  inchargeName: string;
  inchargeEmail?: string;
  inchargeAliases?: string[];
}
