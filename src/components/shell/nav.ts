import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  UserPlus,
  ClipboardList,
  CalendarDays,
  CalendarClock,
  Bell,
  CheckSquare,
  Wallet,
  CalendarOff,
  Users,
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
} from "lucide-react";

export type Role = "all" | "master" | "faculty";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  role?: Role; // undefined/"all" => everyone (non-faculty); "master" => master admin; "faculty" => faculty only
  badge?: "approvals" | "inventory-approvals"; // dynamic count badge driven by a store
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

// Non-faculty (Admin/Master/Staff/Principal) navigation — mirrors home_desktop.dart.
export const adminNav: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Asset Management",
    items: [
      { label: "Fixed Assets", href: "/admin/fixed-assets", icon: Boxes, badge: "approvals" },
      { label: "Inventory", href: "/admin/inventory", icon: Package, badge: "inventory-approvals" },
    ],
  },
  {
    title: "Academics",
    items: [
      { label: "Admissions", href: "/admissions", icon: UserPlus },
      { label: "Enrollment", href: "/enrollment", icon: ClipboardList },
      { label: "Calendar", href: "/calendar", icon: CalendarDays },
      { label: "Time Table", href: "/time-table", icon: CalendarClock },
      { label: "Events", href: "/time-table/events", icon: CalendarDays },
      { label: "Notifications", href: "/notifications", icon: Bell },
    ],
  },
  {
    title: "Staff & HR",
    items: [
      { label: "Attendance", href: "/attendance", icon: CheckSquare },
      { label: "Salary", href: "/salary", icon: Wallet },
      { label: "Leave Management", href: "/leave-management", icon: CalendarOff },
      { label: "Manage Users", href: "/staff", icon: Users },
      { label: "Surveys", href: "/surveys", icon: ListChecks },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "File Storage", href: "/admin/file-storage", icon: FolderOpen },
      { label: "Documents", href: "/admin/documents", icon: FileText },
    ],
  },
  {
    title: "Master Admin",
    items: [
      { label: "Analytics", href: "/master/analytics", icon: BarChart3, role: "master" },
      { label: "Approvals", href: "/master/approvals", icon: ShieldCheck, role: "master" },
      { label: "Archives", href: "/master/archives", icon: Archive, role: "master" },
      { label: "Compliance", href: "/master/compliance", icon: Scale, role: "master" },
      { label: "User Roles", href: "/master/user-roles", icon: UserCog, role: "master" },
    ],
  },
  {
    title: "Support",
    items: [{ label: "Help Center", href: "/help-center", icon: LifeBuoy }],
  },
];

// Assets Manager navigation — asset stock module (email/password role "am").
export const assetsManagerNav: NavSection[] = [
  {
    title: "Assets",
    items: [
      { label: "Asset Stock", href: "/assets", icon: Boxes },
      { label: "My Requests", href: "/assets/requests", icon: Send },
      { label: "Audit Log", href: "/assets/log", icon: ScrollText },
    ],
  },
  {
    title: "Inventory",
    items: [
      { label: "Inventory", href: "/inventory", icon: Package },
      { label: "My Requests", href: "/inventory/requests", icon: Send },
      { label: "Audit Log", href: "/inventory/log", icon: ScrollText },
    ],
  },
  {
    title: "Support",
    items: [{ label: "Help Center", href: "/help-center", icon: LifeBuoy }],
  },
];

// Faculty navigation — mirrors faculty_desktop.dart.
export const facultyNav: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/faculty", icon: LayoutDashboard }],
  },
  {
    title: "Teaching",
    items: [
      { label: "Academic Records", href: "/faculty/academic-records", icon: BookOpen },
      { label: "Students", href: "/faculty/students", icon: GraduationCap },
      { label: "Attendance", href: "/attendance", icon: CheckSquare },
      { label: "Calendar", href: "/calendar", icon: CalendarDays },
      { label: "Time Table", href: "/time-table", icon: CalendarClock },
      { label: "Events", href: "/time-table/events", icon: CalendarDays },
      { label: "Notifications", href: "/notifications", icon: Bell },
    ],
  },
  {
    title: "Support",
    items: [{ label: "Help Center", href: "/help-center", icon: LifeBuoy }],
  },
];
