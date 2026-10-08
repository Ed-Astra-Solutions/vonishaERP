// Student attendance, as served by /getStudentAttendance and friends.
//
// Stored one document per class per day in the `student_attendance` collection. A
// student is identified by `index` into the class roster (`students.data`) — the same
// identity the roster and detail screens use.

export const ATTENDANCE_STATUSES = ["present", "absent", "late", "excused"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export interface AttendanceRecord {
  /** Position in the class roster. */
  index: number;
  /** Denormalised at save time, so a marked day survives a roster edit. */
  name: string;
  status: AttendanceStatus;
}

/** One class-day, as returned for the marking screen. */
export interface AttendanceDay {
  class: string;
  /** ISO yyyy-mm-dd. */
  date: string;
  /** Whether this user may save changes to this class. Computed server-side. */
  canMark: boolean;
  /** False when the day has never been saved — every row then defaults to present. */
  marked: boolean;
  markedBy?: string;
  markedAt?: string | null;
  data: AttendanceRecord[];
}

/** Per-day totals for the history view — no per-student rows except absentees. */
export interface AttendanceDaySummary {
  date: string;
  total: number;
  counts: Record<AttendanceStatus, number>;
  absentees: string[];
  markedBy: string;
  markedAt?: string | null;
}

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused",
};
