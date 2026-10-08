import { getCookie, removeCookie, setCookie } from "./cookies";
import { TOKEN_COOKIE } from "./config";
import { AuthService } from "./api/auth";
import type { Permissions } from "./permissions";
import { isErr } from "./api/client";

export function getToken(): string | null {
  return getCookie(TOKEN_COOKIE);
}

export function setToken(token: string): void {
  setCookie(TOKEN_COOKIE, token);
}

export function clearToken(): void {
  removeCookie(TOKEN_COOKIE);
}

// Shape returned by /getinfo.
export interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  // Legacy role code kept for the old Flutter client: "f", "am", "c", "x" (a role
  // with no legacy code) or a space-encoded admin string like "A M S P".
  type: string;
  /** RBAC role key, e.g. "admin", "faculty", "finance" or a custom role. */
  role: string;
  roleName: string;
  /** Per-module access from the user's role. See lib/permissions.ts. */
  permissions: Permissions;
  token: string;
}

/**
 * Bootstraps the current user from the token cookie via /getinfo, which carries the
 * user's role and per-module permissions. Returns null when the token is missing or
 * invalid (caller should redirect), or OFFLINE when the server couldn't be reached —
 * the session may be fine, so callers offer a retry instead of signing the user out.
 */
export const OFFLINE = "offline" as const;

export async function bootstrapUser(): Promise<UserInfo | null | typeof OFFLINE> {
  const token = getToken();
  if (!token) return null;

  const res = await AuthService.getInfo(token);
  if (isErr(res)) {
    // Keep the cookie: a flaky phone connection shouldn't sign the user out.
    return OFFLINE;
  }
  const data = res.data as {
    success?: boolean;
    firstName?: string;
    lastName?: string;
    email?: string;
    type?: string;
    role?: string;
    roleName?: string;
    permissions?: Permissions;
  };
  if (!data?.success) {
    clearToken();
    return null;
  }
  return {
    firstName: data.firstName ?? "",
    lastName: data.lastName ?? "",
    email: data.email ?? "",
    type: data.type ?? "",
    role: data.role ?? "",
    roleName: data.roleName ?? data.role ?? "",
    permissions: data.permissions ?? {},
    token,
  };
}

// Legacy role-code helper, still used to badge Assets Manager accounts. Access
// decisions use `can` from lib/permissions.ts.
export function isAssetsManager(type: string | undefined): boolean {
  return type === "am";
}
