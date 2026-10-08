import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  UserPlus,
  ClipboardList,
  CalendarDays,
  CalendarClock,
  CalendarCheck,
  Bell,
  CheckSquare,
  Wallet,
  CalendarOff,
  ListChecks,
  Boxes,
  Package,
  FolderOpen,
  FileText,
  BarChart3,
  ShieldCheck,
  Archive,
  Scale,
  UserCog,
  BookOpen,
  GraduationCap,
  LifeBuoy,
  Send,
  ScrollText,
  Receipt,
  KeyRound,
} from "lucide-react";
import type { ModuleKey } from "@/lib/permissions";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  // Shown when the user's role grants at least view on any of these modules.
  // Omitted => every signed-in user (help, support).
  module?: ModuleKey | ModuleKey[];
  badge?: "approvals" | "inventory-approvals"; // dynamic count badge driven by a store
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

// One navigation for every role — the role's permissions decide which entries show
// (see sectionsFor in sidebar.tsx). The Dashboard href is swapped for /faculty for
// the Faculty role.
export const nav: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, module: "dashboard" }],
  },
  {
    title: "Assets",
    items: [
      { label: "Fixed Assets", href: "/admin/fixed-assets", icon: Boxes, module: "fixed_assets", badge: "approvals" },
      { label: "Inventory", href: "/admin/inventory", icon: Package, module: "inventory", badge: "inventory-approvals" },
      // The Assets Manager's request-for-approval flow.
      { label: "Asset Stock", href: "/assets", icon: Boxes, module: "asset_stock" },
      { label: "Asset Requests", href: "/assets/requests", icon: Send, module: "asset_stock" },
      { label: "Asset Audit Log", href: "/assets/log", icon: ScrollText, module: "asset_stock" },
      { label: "Inventory Stock", href: "/inventory", icon: Package, module: "asset_stock" },
      { label: "Inventory Requests", href: "/inventory/requests", icon: Send, module: "asset_stock" },
      { label: "Inventory Audit Log", href: "/inventory/log", icon: ScrollText, module: "asset_stock" },
    ],
  },
  {
    title: "Students",
    items: [
      { label: "Students", href: "/faculty/students", icon: GraduationCap, module: "students" },
      // Per-class access is decided server-side (canMarkAttendance).
      { label: "Student Attendance", href: "/attendance/students", icon: CalendarCheck, module: "student_attendance" },
      { label: "Registration Fees", href: "/faculty/students/registration-fees", icon: Receipt, module: "registration_fees" },
      { label: "Academic Records", href: "/faculty/academic-records", icon: BookOpen, module: "academic_records" },
      { label: "Classes & Incharges", href: "/master/classes", icon: BookOpen, module: "classes" },
    ],
  },
  {
    title: "Academics",
    items: [
      { label: "Admissions", href: "/admissions", icon: UserPlus, module: "admissions" },
      { label: "Calendar", href: "/calendar", icon: CalendarDays, module: "calendar" },
      { label: "Time Table", href: "/time-table", icon: CalendarClock, module: "timetable" },
      { label: "Events", href: "/time-table/events", icon: CalendarDays, module: "timetable" },
      { label: "Notifications", href: "/notifications", icon: Bell, module: "notifications" },
    ],
  },
  {
    title: "Staff & HR",
    items: [
      { label: "Enrollment", href: "/enrollment", icon: ClipboardList, module: "enrollment" },
      { label: "Staff Attendance", href: "/attendance", icon: CheckSquare, module: "staff_attendance" },
      { label: "Salary", href: "/salary", icon: Wallet, module: "salary" },
      { label: "Leave Management", href: "/leave-management", icon: CalendarOff, module: "leave" },
      { label: "Surveys", href: "/surveys", icon: ListChecks, module: "surveys" },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Users, Roles & Access", href: "/master/user-roles", icon: KeyRound, module: "roles" },
      { label: "Coordinators", href: "/master/coordinators", icon: UserCog, module: "roles" },
      { label: "File Storage", href: "/admin/file-storage", icon: FolderOpen, module: "file_storage" },
      { label: "Documents", href: "/admin/documents", icon: FileText, module: "documents" },
    ],
  },
  {
    title: "Master Admin",
    items: [
      { label: "Analytics", href: "/master/analytics", icon: BarChart3, module: "analytics" },
      { label: "Approvals", href: "/master/approvals", icon: ShieldCheck, module: "approvals" },
      { label: "Archives", href: "/master/archives", icon: Archive, module: "archives" },
      { label: "Compliance", href: "/master/compliance", icon: Scale, module: "compliance" },
    ],
  },
  {
    title: "Support",
    items: [{ label: "Help Center", href: "/help-center", icon: LifeBuoy }],
  },
];
