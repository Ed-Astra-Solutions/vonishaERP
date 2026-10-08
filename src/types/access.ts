import type { AccessLevel, ModuleKey, Permissions } from "@/lib/permissions";

export interface ModuleInfo {
  key: ModuleKey;
  label: string;
  group: string;
}

export interface RoleRow {
  key: string;
  name: string;
  description: string;
  system: boolean;
  locked: boolean;
  permissions: Permissions;
  userCount: number;
}

export interface RolesPayload {
  modules: ModuleInfo[];
  levels: AccessLevel[];
  roles: RoleRow[];
  myRole: string;
  myPermissions: Permissions;
  canEdit: boolean;
  email: { configured: boolean; via: "zeptomail" | "smtp" | null };
}

export interface AccountRow {
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  number: string;
  role: string;
  roleName: string;
  status: "active" | "invited" | "disabled";
  lastLoginAt: string | null;
}

export interface InviteResult {
  name: string;
  email: string;
  link: string;
  emailSent: boolean;
  emailError?: string;
}
