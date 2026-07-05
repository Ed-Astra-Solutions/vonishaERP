import { redirect } from "next/navigation";

// Entry point. The proxy guard redirects based on the token cookie; this is the
// fallback for the authenticated case.
export default function RootPage() {
  redirect("/dashboard");
}
