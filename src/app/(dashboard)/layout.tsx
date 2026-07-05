"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { bootstrapUser } from "@/lib/auth";
import { useUserStore } from "@/stores/user";
import { SidebarNav } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { Logo } from "@/components/brand/logo";
import { AssetApprovalBanner } from "@/components/assets/asset-approval-banner";
import { AdminApprovalsWatcher } from "@/components/assets/admin-approvals-watcher";
import { InventoryApprovalBanner } from "@/components/inventory/inventory-approval-banner";
import { AdminInventoryWatcher } from "@/components/inventory/admin-inventory-watcher";

// Authenticated shell. Bootstraps the current user via /getinfo (mirrors
// landing_page.dart), guards the route, and renders the sidebar + topbar.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading, setUser } = useUserStore();

  useEffect(() => {
    let active = true;
    bootstrapUser().then((info) => {
      if (!active) return;
      if (!info) {
        router.replace("/signin");
        return;
      }
      setUser(info);
    });
    return () => {
      active = false;
    };
  }, [router, setUser]);

  if (loading || !user) {
    return (
      <div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-6 bg-muted/30">
        <Logo showBeta />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading your workspace…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-1">
      <aside className="hidden w-72 shrink-0 border-r lg:block">
        <div className="sticky top-0 h-dvh">
          <SidebarNav />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 bg-muted/30 p-4 md:p-6 lg:p-8">
          <AdminApprovalsWatcher />
          <AdminInventoryWatcher />
          <AssetApprovalBanner />
          <InventoryApprovalBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
