import { getCookie, removeCookie, setCookie } from "./cookies";
import { TOKEN_COOKIE } from "./config";
import { AuthService } from "./api/auth";
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

// Shape returned by /getinfo (see landing_page.dart usage).
export interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  type: string; // "f" (faculty) or space-encoded roles e.g. "A M S P"
  token: string;
}

/**
 * Bootstraps the current user from the token cookie, mirroring the logic in
 * landing_page.dart: call getInfo, and on `success` build the user object.
 * Faculty ("f") keeps its type; everyone else is normalised to "A M S P".
 * Returns null when the token is missing/invalid (caller should redirect).
 */
export async function bootstrapUser(): Promise<UserInfo | null> {
  const token = getToken();
  if (!token) return null;

  const res = await AuthService.getInfo(token);
  if (isErr(res)) {
    clearToken();
    return null;
  }
  const data = res.data as {
    success?: boolean;
    firstName?: string;
    lastName?: string;
    email?: string;
    type?: string;
  };
  if (!data?.success) {
    clearToken();
    return null;
  }
  return {
    firstName: data.firstName ?? "",
    lastName: data.lastName ?? "",
    email: data.email ?? "",
    // Preserve faculty ("f") and assets manager ("am"); everyone else keeps the
    // existing space-encoded admin/master default so their gating is unchanged.
    type: data.type === "f" ? "f" : data.type === "am" ? "am" : "A M S P",
    token,
  };
}

// Role helpers, preserving the Flutter role model.
export function isFaculty(type: string | undefined): boolean {
  return type === "f";
}

// Assets Manager — a dedicated role for the asset stock module.
export function isAssetsManager(type: string | undefined): boolean {
  return type === "am";
}

// Admin — everyone who is neither faculty nor assets manager (approves asset requests).
export function isAdmin(type: string | undefined): boolean {
  return !isFaculty(type) && !isAssetsManager(type);
}

// Master-admin gate: `type.split(" ")[1] == "m"` in home_desktop.dart.
export function isMaster(type: string | undefined): boolean {
  if (!type) return false;
  return type.split(" ")[1] === "m";
}
