import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { API_BASE } from "@/lib/config";

// Single shared axios instance pointed at the same Express backend the Flutter
// app used. All ERP endpoints expect application/x-www-form-urlencoded bodies
// and an `Authorization: Bearer <token>` header — exactly as in connect_server.dart.
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
});

// Sentinel returned by the Flutter client on network/Dio errors (`return 'e'`).
// Screens branch on this, so we preserve it here.
export const ERR = "e" as const;
export type ApiResult<T = unknown> = { data: T } | typeof ERR;

// Encode a body as form-urlencoded (Dio's Headers.formUrlEncodedContentType).
function formConfig(token?: string, extraAuth?: string): AxiosRequestConfig {
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (token) {
    headers["Authorization"] = extraAuth ? `Bearer ${token} ${extraAuth}` : `Bearer ${token}`;
  }
  return { headers };
}

// Serialize a flat body to x-www-form-urlencoded. Nested values are JSON-encoded
// by callers (matching Dio's `json.encode(data)`), so values here are strings.
function encodeBody(body: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined || v === null) continue;
    params.append(k, typeof v === "string" ? v : String(v));
  }
  return params.toString();
}

/**
 * POST form-urlencoded. Returns the axios response on success or the `'e'`
 * sentinel on error, matching the Flutter AuthService behaviour.
 */
export async function postForm<T = unknown>(
  path: string,
  body: Record<string, unknown>,
  token?: string,
  extraAuth?: string,
): Promise<ApiResult<T>> {
  try {
    const res = await api.post<T>(path, encodeBody(body), formConfig(token, extraAuth));
    return { data: res.data };
  } catch {
    return ERR;
  }
}

/** GET with optional Bearer token. Returns response or `'e'` on error. */
export async function getWithAuth<T = unknown>(
  path: string,
  token?: string,
  extraAuth?: string,
): Promise<ApiResult<T>> {
  try {
    const res = await api.get<T>(path, formConfig(token, extraAuth));
    return { data: res.data };
  } catch {
    return ERR;
  }
}

export function isErr<T>(r: ApiResult<T>): r is typeof ERR {
  return r === ERR;
}
