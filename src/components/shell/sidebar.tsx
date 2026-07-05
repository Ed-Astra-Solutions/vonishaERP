"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { adminNav, facultyNav, assetsManagerNav, type NavSection } from "./nav";
import { isFaculty, isMaster, isAssetsManager } from "@/lib/auth";
import { useUserStore } from "@/stores/user";
import { useAssetsStore } from "@/stores/assets";
import { useInventoryStore } from "@/stores/inventory";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

function sectionsForUser(type: string | undefined): NavSection[] {
  if (isFaculty(type)) return facultyNav;
  if (isAssetsManager(type)) return assetsManagerNav;
  const master = isMaster(type);
  return adminNav
    .map((section) => ({
      ...section,
      items: section.items.filter((i) => (i.role === "master" ? master : true)),
    }))
    .filter((section) => section.items.length > 0);
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const user = useUserStore((s) => s.user);
  const pendingApprovals = useAssetsStore((s) => s.pendingApprovals);
  const pendingInventory = useInventoryStore((s) => s.pendingApprovals);
  const sections = sectionsForUser(user?.type);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Logo />
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      item.href !== "/faculty" &&
                      pathname.startsWith(item.href));
                  const Icon = item.icon;
                  const badgeCount =
                    item.badge === "approvals"
                      ? pendingApprovals
                      : item.badge === "inventory-approvals"
                        ? pendingInventory
                        : 0;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {badgeCount > 0 && (
                          <span
                            className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold leading-none text-primary-foreground"
                            aria-label={`${badgeCount} pending approvals`}
                          >
                            {badgeCount}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}
