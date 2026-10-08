import { redirect } from "next/navigation";

// Manage Users was removed from the app. Any lingering /staff URL (stale tab,
// bookmark) bounces to the dashboard so it never renders the old screen.
export default function StaffPage() {
  redirect("/dashboard");
}
