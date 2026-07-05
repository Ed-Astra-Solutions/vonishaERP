"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useInventoryStore } from "@/stores/inventory";

const TABS = [
  { label: "Items", href: "/admin/inventory", exact: true },
  { label: "Approvals", href: "/admin/inventory/approvals", exact: false, badge: "approvals" as const },
  { label: "Log", href: "/admin/inventory/log", exact: false },
];

/** WordPress-admin nav-tab header for the Inventory section (mirrors Fixed Assets). */
export function InventoryTabs() {
  const pathname = usePathname();
  const pending = useInventoryStore((s) => s.pendingApprovals);

  return (
    <nav className="mb-5 flex items-end gap-1 border-b border-border">
      {TABS.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        const showBadge = t.badge === "approvals" && pending > 0;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "-mb-px inline-flex items-center gap-2 rounded-t-[3px] border px-4 py-2 text-sm transition-colors",
              active
                ? "border-border border-b-transparent bg-background font-semibold text-foreground"
                : "border-transparent bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {showBadge && (
              <span
                className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold leading-none text-primary-foreground"
                aria-label={`${pending} pending`}
              >
                {pending}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
