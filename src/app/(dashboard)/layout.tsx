"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, WifiOff } from "lucide-react";

import { bootstrapUser, OFFLINE } from "@/lib/auth";
import { canVisit, homeFor } from "@/lib/permissions";
import { useUserStore } from "@/stores/user";
import { SidebarNav } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { AssetApprovalBanner } from "@/components/assets/asset-approval-banner";
import { AdminApprovalsWatcher } from "@/components/assets/admin-approvals-watcher";
import { InventoryApprovalBanner } from "@/components/inventory/inventory-approval-banner";
import { AdminInventoryWatcher } from "@/components/inventory/admin-inventory-watcher";

// Authenticated shell. Bootstraps the current user (role + permissions) via /getinfo,
// keeps them off routes their role doesn't grant, and renders the sidebar + topbar.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, setUser } = useUserStore();
  const [offline, setOffline] = useState(false);

  const load = useCallback(() => {
    let active = true;
    setOffline(false);
    bootstrapUser().then((info) => {
      if (!active) return;
      if (info === OFFLINE) {
        setOffline(true);
        return;
      }
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

  useEffect(() => load(), [load]);

  const allowed = !user || canVisit(user, pathname);
  useEffect(() => {
    if (user && !allowed) router.replace(homeFor(user));
  }, [user, allowed, router]);

  if (offline) {
    return (
      <div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-4 bg-muted/30 px-6 text-center">
        <Logo showBeta />
        <WifiOff className="size-6 text-muted-foreground" />
        <p className="max-w-xs text-sm text-muted-foreground">
          Couldn&apos;t reach the server. Check your connection and try again.
        </p>
        <Button onClick={load}>Retry</Button>
      </div>
    );
  }

  if (loading || !user || !allowed) {
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
        <main className="min-w-0 flex-1 bg-muted/30 p-4 md:p-6 lg:p-8">
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
