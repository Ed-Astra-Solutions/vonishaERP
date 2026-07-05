// API server configuration.
// Mirrors connect_server.dart: dev -> localhost:3000, prod -> vonishaapi.edastra.in
export const LOCAL_SERVER = "http://localhost:3000";
export const AWS_SERVER = "https://vonishaapi.edastra.in";

// Default to the local server in dev (as the Flutter client does: `String server = localServer`).
// Override with NEXT_PUBLIC_API_BASE at build/run time.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  (process.env.NODE_ENV === "production" ? AWS_SERVER : LOCAL_SERVER);

// Cookie key that stores the auth token (matches the Flutter app's `cookie.get('t')`).
export const TOKEN_COOKIE = "t";
