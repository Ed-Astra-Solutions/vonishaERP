// Client side of the role-based access model in vonishaServer/config/rbac.js.
//
// The server sends the signed-in user's role and per-module levels on /getinfo; this
// module answers "may they see / edit X" from that, and maps every route onto its
// module so the sidebar and the route guard agree. The server re-checks every write,
// so this is about not *showing* what would be refused.

export type AccessLevel = "none" | "view" | "edit";

export type ModuleKey =
  | "dashboard"
  | "students"
  | "student_attendance"
  | "registration_fees"
  | "classes"
  | "academic_records"
  | "admissions"
  | "calendar"
  | "timetable"
  | "notifications"
  | "enrollment"
  | "staff_attendance"
  | "salary"
  | "leave"
  | "surveys"
  | "fixed_assets"
  | "inventory"
  | "asset_stock"
  | "file_storage"
  | "documents"
  | "roles"
  | "analytics"
  | "approvals"
  | "archives"
  | "compliance";

export type Permissions = Partial<Record<ModuleKey, AccessLevel>>;

const RANK: Record<AccessLevel, number> = { none: 0, view: 1, edit: 2 };

interface WithPermissions {
  permissions?: Permissions;
}

/** Does the user hold at least `level` on `module` (or on any of `module`)? */
export function can(
  user: WithPermissions | null | undefined,
  module: ModuleKey | ModuleKey[],
  level: Exclude<AccessLevel, "none"> = "view",
): boolean {
  const perms = user?.permissions ?? {};
  const list = Array.isArray(module) ? module : [module];
  return list.some((m) => RANK[perms[m] ?? "none"] >= RANK[level]);
}

// Route prefix → module(s) that unlock it. Longest prefix wins. Routes not listed
// here (help, terms) are open to every signed-in user.
const ROUTE_MODULES: [string, ModuleKey[]][] = [
  ["/dashboard", ["dashboard"]],
  ["/faculty/students/registration-fees", ["registration_fees"]],
  ["/faculty/students", ["students"]],
  ["/faculty/academic-records", ["academic_records"]],
  ["/faculty", ["dashboard"]],
  ["/attendance/students", ["student_attendance"]],
  ["/attendance", ["staff_attendance"]],
  ["/master/classes", ["classes"]],
  ["/master/coordinators", ["roles"]],
  ["/master/user-roles", ["roles"]],
  ["/master/analytics", ["analytics"]],
  ["/master/approvals", ["approvals"]],
  ["/master/archives", ["archives"]],
  ["/master/compliance", ["compliance"]],
  ["/admissions", ["admissions"]],
  ["/calendar", ["calendar"]],
  ["/time-table", ["timetable"]],
  ["/notifications", ["notifications"]],
  ["/enrollment", ["enrollment"]],
  ["/salary", ["salary"]],
  ["/leave-management", ["leave"]],
  ["/surveys", ["surveys"]],
  ["/admin/fixed-assets", ["fixed_assets"]],
  ["/admin/inventory", ["inventory"]],
  ["/assets", ["asset_stock"]],
  ["/inventory", ["asset_stock"]],
  ["/admin/file-storage", ["file_storage"]],
  ["/admin/documents", ["documents"]],
];

export function modulesForPath(pathname: string): ModuleKey[] | null {
  let best: [string, ModuleKey[]] | null = null;
  for (const entry of ROUTE_MODULES) {
    const [prefix] = entry;
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      if (!best || prefix.length > best[0].length) best = entry;
    }
  }
  return best ? best[1] : null;
}

export function canVisit(user: WithPermissions | null | undefined, pathname: string): boolean {
  const modules = modulesForPath(pathname);
  return modules === null || can(user, modules);
}

// Built-in role defaults for a server that predates RBAC (no `permissions` on
// /getinfo). Mirrors SYSTEM_ROLES in vonishaServer/config/rbac.js.
const ALL_MODULES: ModuleKey[] = [
  "dashboard", "students", "student_attendance", "registration_fees", "classes",
  "academic_records", "admissions", "calendar", "timetable", "notifications",
  "enrollment", "staff_attendance", "salary", "leave", "surveys", "fixed_assets",
  "inventory", "asset_stock", "file_storage", "documents", "roles", "analytics",
  "approvals", "archives", "compliance",
];
const MASTER_ONLY: ModuleKey[] = ["analytics", "approvals", "archives", "compliance"];

export function legacyRole(type: string | undefined): {
  key: string;
  name: string;
  permissions: Permissions;
} {
  const v: Permissions = {};
  if (type === "f") {
    for (const m of ["dashboard", "students", "registration_fees", "student_attendance", "staff_attendance", "calendar", "timetable", "notifications"] as ModuleKey[]) v[m] = "view";
    v.academic_records = "edit";
    return { key: "faculty", name: "Faculty", permissions: v };
  }
  if (type === "am") return { key: "assets_manager", name: "Assets Manager", permissions: { asset_stock: "edit" } };
  if (type === "c") {
    for (const m of ["dashboard", "students", "academic_records", "calendar", "timetable", "notifications"] as ModuleKey[]) v[m] = "view";
    v.student_attendance = "edit";
    return { key: "coordinator", name: "Coordinator", permissions: v };
  }
  const master = (type ?? "").split(" ")[1] === "m";
  for (const m of ALL_MODULES) v[m] = "edit";
  if (!master) {
    for (const m of MASTER_ONLY) v[m] = "none";
    v.asset_stock = "none";
  }
  return master
    ? { key: "master", name: "Master Admin", permissions: v }
    : { key: "admin", name: "Admin", permissions: v };
}

// Faculty keep their own dashboard; everyone else with dashboard access gets the
// institution one.
export function dashboardHref(role: string | undefined): string {
  return role === "faculty" ? "/faculty" : "/dashboard";
}

// Fallback landing pages, in preference order, for roles without a dashboard.
const LANDING: [ModuleKey, string][] = [
  ["asset_stock", "/assets"],
  ["fixed_assets", "/admin/fixed-assets"],
  ["inventory", "/admin/inventory"],
  ["salary", "/salary"],
  ["enrollment", "/enrollment"],
  ["admissions", "/admissions"],
  ["students", "/faculty/students"],
  ["student_attendance", "/attendance/students"],
  ["documents", "/admin/documents"],
  ["calendar", "/calendar"],
];

/** Where a user lands after signing in (and where a refused route sends them). */
export function homeFor(user: (WithPermissions & { role?: string }) | null | undefined): string {
  if (user?.role === "assets_manager") return "/assets";
  if (can(user, "dashboard")) return dashboardHref(user?.role);
  for (const [m, href] of LANDING) if (can(user, m)) return href;
  return "/help-center";
}
