"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu, User as UserIcon } from "lucide-react";

import { clearToken } from "@/lib/auth";
import { useUserStore } from "@/stores/user";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar";

function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "U";
}

export function Topbar() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const clear = useUserStore((s) => s.clear);

  function signOut() {
    clearToken();
    clear();
    router.replace("/signin");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      {/* Mobile nav trigger */}
      <Sheet>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" />
          }
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav />
        </SheetContent>
      </Sheet>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          render={<Link href="/notifications" />}
        >
          <Bell className="size-5" />
        </Button>
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="gap-2 px-2" />}>
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {initials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">
              {user ? `${user.firstName} ${user.lastName}` : "Account"}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span>{user ? `${user.firstName} ${user.lastName}` : "Account"}</span>
              <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/help-center" />}>
              <UserIcon className="size-4" /> Help Center
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={signOut}>
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
