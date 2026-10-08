// TypeScript ports of lib/models/erp/*.dart. Enums are numeric to preserve the
// Dart `.index` serialization used in toJson/fromJson. Label/color helpers and
// computed getters are ported as functions.

import type { MediaItem } from "./media";

/* ============================ Admissions ============================ */
export enum AdmissionStatus {
  enquiry,
  applied,
  documentsSubmitted,
  interviewScheduled,
  admitted,
  rejected,
  waitlisted,
}
export const admissionStatusLabel: Record<AdmissionStatus, string> = {
  [AdmissionStatus.enquiry]: "Enquiry",
  [AdmissionStatus.applied]: "Applied",
  [AdmissionStatus.documentsSubmitted]: "Documents Submitted",
  [AdmissionStatus.interviewScheduled]: "Interview Scheduled",
  [AdmissionStatus.admitted]: "Admitted",
  [AdmissionStatus.rejected]: "Rejected",
  [AdmissionStatus.waitlisted]: "Waitlisted",
};

export interface FollowUp {
  id: string;
  enquiryId: string;
  date: string; // ISO
  notes: string;
  contactedBy: string;
  method: string; // phone | email | whatsapp | in-person
  outcome: string; // interested | not_interested | callback | converted
}

export interface AdmissionEnquiry {
  id: string;
  studentName: string;
  parentName: string;
  phone: string;
  email?: string;
  classApplied: string;
  enquiryDate: string; // ISO
  status: AdmissionStatus;
  remarks?: string;
  assignedTo?: string;
  source: string; // walk-in | referral | online | phone
  followUps: FollowUp[];
}

export interface EnrollmentBankDetails {
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
}

export interface EmployeeEnrollment {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string; // primary
  alternatePhone?: string;
  designation: string;
  department: string; // center / location (Excel sheet)
  employeeCategory: string; // teaching | nonTeaching | management
  employmentType?: string; // Full-time | Part-time
  sex?: string;
  dateOfBirth?: string; // ISO
  joiningDate: string; // ISO
  salary?: number;
  ctc?: number;
  salaryScheme?: string;
  qualification?: string;
  aadharNumber?: string;
  panNumber?: string;
  pfNumber?: string;
  uan?: string;
  bankDetails: EnrollmentBankDetails;
  punchNumber?: string;
  address?: string;
  personalEmail?: string;
  remarks?: string;
  documentUrl?: string;
  /** Passport photo (camera or gallery) — one private S3 object, kept as an array
   *  so it shares the MediaItem plumbing with every other attachment. */
  profilePic?: MediaItem[];
  /** Enrollment paperwork (Aadhaar, PAN, passbook, mark sheets, photos, resume,
   *  other). Aadhaar is compulsory; the rest are optional. Each entry is a private
   *  S3 object key and also surfaces in the admin file browser. */
  documents?: MediaItem[];
  personalDetails?: Record<string, unknown>;
  status: string; // pending | active | inactive
}

/* ============================ Attendance ============================ */
export enum AttendanceStatus {
  present,
  absent,
  halfDay,
  late,
  onLeave,
  holiday,
  weekend,
}
export const attendanceStatusLabel: Record<AttendanceStatus, string> = {
  [AttendanceStatus.present]: "Present",
  [AttendanceStatus.absent]: "Absent",
  [AttendanceStatus.halfDay]: "Half Day",
  [AttendanceStatus.late]: "Late",
  [AttendanceStatus.onLeave]: "On Leave",
  [AttendanceStatus.holiday]: "Holiday",
  [AttendanceStatus.weekend]: "Weekend",
};

export interface AttendanceRecord {
  employeeId: string;
  employeeName: string;
  date: string;
  status: AttendanceStatus;
  punchInTime?: string;
  punchOutTime?: string;
  punchInSource?: string;
  punchOutSource?: string;
  totalHours?: number;
  isException: boolean;
  exceptionReason?: string;
}

export interface AttendanceSummary {
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  totalWorkingDays: number;
  daysPresent: number;
  daysAbsent: number;
  halfDays: number;
  lateDays: number;
  leaveDays: number;
  attendancePercentage: number;
  exceptionDates: string[];
}
export const hasExceptions = (s: AttendanceSummary) => s.exceptionDates.length > 0;
export const isBelowThreshold = (s: AttendanceSummary) => s.attendancePercentage < 85;

export interface ComplianceFlag {
  employeeId: string;
  employeeName: string;
  flagType: string;
  description: string;
  date: string;
  severity: string; // warning | critical | info
}

/* ============================ Calendar ============================ */
export enum CalendarEventType {
  holiday,
  specialEvent,
  exam,
  meeting,
  deadline,
  training,
  googleSync,
}
export const calendarTypeLabel: Record<CalendarEventType, string> = {
  [CalendarEventType.holiday]: "Holiday",
  [CalendarEventType.specialEvent]: "Special Event",
  [CalendarEventType.exam]: "Examination",
  [CalendarEventType.meeting]: "Meeting",
  [CalendarEventType.deadline]: "Deadline",
  [CalendarEventType.training]: "Training",
  [CalendarEventType.googleSync]: "Google Calendar",
};
export const calendarTypeColor: Record<CalendarEventType, string> = {
  [CalendarEventType.holiday]: "#E53935",
  [CalendarEventType.specialEvent]: "#8E24AA",
  [CalendarEventType.exam]: "#FB8C00",
  [CalendarEventType.meeting]: "#1E88E5",
  [CalendarEventType.deadline]: "#D81B60",
  [CalendarEventType.training]: "#43A047",
  [CalendarEventType.googleSync]: "#4285F4",
};

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO
  endDate?: string;
  type: CalendarEventType;
  isAllDay: boolean;
  isRecurring: boolean;
  recurrenceRule?: string;
  googleCalendarId?: string;
  location?: string;
  attendees: string[];
  createdBy: string;
  color?: string;
}

/* ============================ Documents ============================ */
export enum DocumentCategory { policy, template, report, form, certificate, other }
export enum DocumentPermission { viewOnly, edit, admin }
export const documentCategoryLabel: Record<DocumentCategory, string> = {
  [DocumentCategory.policy]: "Policies",
  [DocumentCategory.template]: "Templates",
  [DocumentCategory.report]: "Reports",
  [DocumentCategory.form]: "Forms",
  [DocumentCategory.certificate]: "Certificates",
  [DocumentCategory.other]: "Other",
};
export const documentPermissionLabel: Record<DocumentPermission, string> = {
  [DocumentPermission.viewOnly]: "View Only",
  [DocumentPermission.edit]: "Edit",
  [DocumentPermission.admin]: "Admin",
};

export interface ERPDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  googleDriveUrl?: string;
  googleDocId?: string;
  uploadedBy: string;
  uploadedAt: string;
  lastModified?: string;
  sharedWith: string[];
  defaultPermission: DocumentPermission;
  description?: string;
  fileType?: string;
  fileSize?: number;
}

/* ============================ Inventory ============================ */
export enum InventoryStatus { available, lowStock, outOfStock, reorderPlaced }
export const inventoryStatusLabel: Record<InventoryStatus, string> = {
  [InventoryStatus.available]: "Available",
  [InventoryStatus.lowStock]: "Low Stock",
  [InventoryStatus.outOfStock]: "Out of Stock",
  [InventoryStatus.reorderPlaced]: "Reorder Placed",
};

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  unit: string;
  unitPrice: number;
  location?: string;
  supplier?: string;
  lastUpdated: string;
  status: InventoryStatus;
}
export const needsReorder = (i: InventoryItem) => i.quantity <= i.reorderLevel;
export const totalValue = (i: InventoryItem) => i.quantity * i.unitPrice;

export interface FixedAsset {
  id: string;
  name: string;
  category: string;
  location: string;
  purchasePrice: number;
  purchaseDate: string;
  depreciationRate: number; // default 10
  currentValue: number;
  condition: string; // good | fair | poor | needs_repair
  serialNumber?: string;
  assignedTo?: string;
  lastAuditDate: string;
}
export function depreciatedValue(a: FixedAsset): number {
  const yearsOld = Math.floor(
    (Date.now() - new Date(a.purchaseDate).getTime()) / (365 * 864e5),
  );
  let value = a.purchasePrice;
  for (let i = 0; i < yearsOld; i++) value -= value * (a.depreciationRate / 100);
  return value;
}

export interface InventoryRequest {
  id: string;
  requestedBy: string;
  itemId: string;
  itemName: string;
  quantity: number;
  reason: string;
  status: string; // pending | approved | rejected | fulfilled
  requestDate: string;
  approvedBy?: string;
  approvedDate?: string;
}

/* ============================ Leave ============================ */
export enum EmployeeCategory { teaching, nonTeaching, management }
export enum LeaveType { casual, sick, earned, maternity, paternity, unpaid, compensatory }
export enum LeaveStatus { pending, approved, rejected, cancelled }
export const leaveCategoryLabel: Record<EmployeeCategory, string> = {
  [EmployeeCategory.teaching]: "Teaching Staff",
  [EmployeeCategory.nonTeaching]: "Non-Teaching Staff",
  [EmployeeCategory.management]: "Management",
};
export const leaveTypeLabel: Record<LeaveType, string> = {
  [LeaveType.casual]: "Casual Leave",
  [LeaveType.sick]: "Sick Leave",
  [LeaveType.earned]: "Earned Leave",
  [LeaveType.maternity]: "Maternity Leave",
  [LeaveType.paternity]: "Paternity Leave",
  [LeaveType.unpaid]: "Unpaid Leave",
  [LeaveType.compensatory]: "Compensatory Off",
};

export interface LeavePolicy {
  category: EmployeeCategory;
  annualEntitlement: Partial<Record<LeaveType, number>>;
  maxCarryForward: number;
  maxConsecutiveDays: number;
  requiresDocument: boolean;
}
export function defaultLeavePolicies(): LeavePolicy[] {
  return [
    {
      category: EmployeeCategory.teaching,
      annualEntitlement: {
        [LeaveType.casual]: 12, [LeaveType.sick]: 10, [LeaveType.earned]: 15,
        [LeaveType.maternity]: 180, [LeaveType.paternity]: 15,
      },
      maxCarryForward: 5, maxConsecutiveDays: 3, requiresDocument: true,
    },
    {
      category: EmployeeCategory.nonTeaching,
      annualEntitlement: {
        [LeaveType.casual]: 10, [LeaveType.sick]: 8, [LeaveType.earned]: 12,
        [LeaveType.maternity]: 180, [LeaveType.paternity]: 15,
      },
      maxCarryForward: 3, maxConsecutiveDays: 3, requiresDocument: true,
    },
    {
      category: EmployeeCategory.management,
      annualEntitlement: {
        [LeaveType.casual]: 15, [LeaveType.sick]: 12, [LeaveType.earned]: 20,
        [LeaveType.maternity]: 180, [LeaveType.paternity]: 15,
      },
      maxCarryForward: 10, maxConsecutiveDays: 5, requiresDocument: true,
    },
  ];
}

export interface LeaveApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  category: EmployeeCategory;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  reason: string;
  status: LeaveStatus;
  approverName?: string;
  approvedAt?: string;
  remarks?: string;
  documentUrl?: string;
}
export function leaveTotalDays(l: LeaveApplication): number {
  return (
    Math.floor(
      (new Date(l.toDate).getTime() - new Date(l.fromDate).getTime()) / 864e5,
    ) + 1
  );
}

/* ============================ Notifications ============================ */
export enum NotificationChannel { whatsapp, email, inApp }
export enum NotificationStatus { pending, sent, failed, read }
export const notificationChannelLabel: Record<NotificationChannel, string> = {
  [NotificationChannel.whatsapp]: "WhatsApp",
  [NotificationChannel.email]: "Email",
  [NotificationChannel.inApp]: "In-App",
};
export const notificationStatusLabel: Record<NotificationStatus, string> = {
  [NotificationStatus.pending]: "Pending",
  [NotificationStatus.sent]: "Sent",
  [NotificationStatus.failed]: "Failed",
  [NotificationStatus.read]: "Read",
};

export interface ERPNotification {
  id: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  recipientId: string;
  recipientName: string;
  recipientContact?: string;
  createdAt: string;
  sentAt?: string;
  templateId?: string;
  category?: string; // attendance | leave | salary | admission | general
}

export interface NotificationTemplate {
  id: string;
  name: string;
  channel: NotificationChannel;
  subject: string;
  body: string;
  category?: string;
}

/* ============================ Salary ============================ */
export enum SalaryComponent { basic, hra, incentives, variable, pf, tds, lop }

export interface SalaryRule {
  id: string;
  name: string;
  hraPercentage: number; // default 40
  pfPercentage: number; // default 12
  tdsPercentage: number;
  incentiveAmount: number;
  variablePercentage: number; // default 10
  isPfApplicable: boolean;
  isTdsApplicable: boolean;
}

export interface AttendanceMismatch {
  date: string;
  type: string; // absent_no_leave | leave_but_present | partial_day
  description: string;
}

export interface SalarySlip {
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  basicSalary: number;
  hra: number;
  incentives: number;
  variablePay: number;
  grossSalary: number;
  pfDeduction: number;
  tdsDeduction: number;
  lopDeduction: number;
  netSalary: number;
  totalWorkingDays: number;
  daysPresent: number;
  lopDays: number;
  approvedLeaves: number;
  mismatches: AttendanceMismatch[];
}
