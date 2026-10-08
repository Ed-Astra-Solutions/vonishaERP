"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyRound, Loader2, MailWarning, ShieldCheck, UserCheck, Users } from "lucide-react";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { useUserStore } from "@/stores/user";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersPanel } from "@/components/access/users-panel";
import { RolesPanel, grantCeiling } from "@/components/access/roles-panel";
import type { AccountRow, RolesPayload } from "@/types/access";

// Users, Roles & Access. Every login and every role lives here: add staff (they get a
// set-password link), move people between roles, and build custom roles from the
// per-module Hidden / View / Edit matrix. The server enforces the same rules, including
// "you can't grant more than you have".
export default function UserRolesPage() {
  const user = useUserStore((s) => s.user);
  const [data, setData] = useState<RolesPayload | null>(null);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const token = getToken() ?? "";
    const [r, a] = await Promise.all([AuthService.getRoles(token), AuthService.getAccounts(token)]);
    if (isErr(r) || isErr(a)) {
      setError("Connection Error");
      return;
    }
    const rb = r.data as { success?: boolean; msg?: string } & RolesPayload;
    const ab = a.data as { success?: boolean; msg?: string; data?: AccountRow[] };
    if (!rb.success || !ab.success) {
      setError(rb.msg ?? ab.msg ?? "Could not load");
      return;
    }
    setError(null);
    setData(rb);
    setAccounts(ab.data ?? []);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Roles this admin may assign: none above their own access.
  const assignable = useMemo(() => {
    const out = new Set<string>();
    if (!data) return out;
    const master = data.myRole === "master";
    for (const r of data.roles) {
      const ok = data.modules.every((m) => {
        const need = { none: 0, view: 1, edit: 2 }[r.permissions[m.key] ?? "none"];
        return need <= grantCeiling(data.myPermissions, master, m.key);
      });
      if (ok) out.add(r.key);
    }
    return out;
  }, [data]);

  if (error) {
    return (
      <div>
        <PageHeader title="Users, Roles & Access" />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </div>
    );
  }

  const active = accounts.filter((a) => a.status === "active").length;
  const invited = accounts.filter((a) => a.status === "invited").length;

  return (
    <div>
      <PageHeader
        title="Users, Roles & Access"
        description="Who can sign in, what each role sees in the sidebar, and what it can change."
      />

      {!data.email.configured && (
        <p className="mb-4 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
          <MailWarning className="mt-0.5 size-4 shrink-0" />
          <span>
            Email isn&apos;t set up on the server yet, so invites can&apos;t be emailed. New users still
            get a link to copy or send on WhatsApp.
          </span>
        </p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Users" value={accounts.length} icon={Users} tone="info" />
        <StatCard label="Active" value={active} icon={UserCheck} tone="success" />
        <StatCard label="Invited" value={invited} icon={KeyRound} tone="default" />
        <StatCard label="Roles" value={data.roles.length} icon={ShieldCheck} tone="default" />
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles &amp; permissions</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          <UsersPanel
            accounts={accounts}
            roles={data.roles}
            assignable={assignable}
            canEdit={data.canEdit}
            myEmail={user?.email ?? ""}
            reload={reload}
          />
        </TabsContent>
        <TabsContent value="roles" className="mt-4">
          <RolesPanel
            roles={data.roles}
            modules={data.modules}
            myPermissions={data.myPermissions}
            myRole={data.myRole}
            canEdit={data.canEdit}
            reload={reload}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
