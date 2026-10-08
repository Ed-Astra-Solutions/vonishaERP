"use client";

import { useMemo, useState } from "react";
import { Ban, KeyRound, Loader2, Search, UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/common/empty-state";
import { NativeSelect } from "./native-select";
import { InviteDialog } from "./invite-dialog";
import type { AccountRow, InviteResult, RoleRow } from "@/types/access";

type Result = { success?: boolean; msg?: string; link?: string; emailSent?: boolean; emailError?: string };

async function call(p: ReturnType<typeof AuthService.assignRole>): Promise<Result | null> {
  const res = await p;
  if (isErr(res)) {
    toast.error("Connection Error");
    return null;
  }
  const body = res.data as Result;
  if (!body.success) toast.error(body.msg ?? "Something went wrong");
  return body.success ? body : null;
}

const STATUS: Record<AccountRow["status"], { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  invited: { label: "Invited", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  disabled: { label: "Disabled", className: "bg-muted text-muted-foreground" },
};

function lastSeen(iso: string | null) {
  if (!iso) return "Never signed in";
  return `Last sign-in ${new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`;
}

export function UsersPanel({
  accounts,
  roles,
  assignable,
  canEdit,
  myEmail,
  reload,
}: {
  accounts: AccountRow[];
  roles: RoleRow[];
  /** Roles this admin may hand out (none exceed their own access). */
  assignable: Set<string>;
  canEdit: boolean;
  myEmail: string;
  reload: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteResult | null>(null);
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts.filter(
      (a) =>
        (!roleFilter || a.role === roleFilter) &&
        (!q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)),
    );
  }, [accounts, query, roleFilter]);

  const token = getToken() ?? "";

  async function changeRole(a: AccountRow, roleKey: string) {
    setBusy(a.email);
    const ok = await call(AuthService.assignRole(token, a.email, roleKey));
    if (ok) {
      toast.success(ok.msg ?? "Role updated");
      await reload();
    }
    setBusy(null);
  }

  async function resend(a: AccountRow) {
    setBusy(a.email);
    const ok = await call(AuthService.resendInvite(token, a.email));
    if (ok?.link) {
      setInvite({ name: a.name, email: a.email, link: ok.link, emailSent: !!ok.emailSent, emailError: ok.emailError });
    }
    setBusy(null);
  }

  async function toggleDisabled(a: AccountRow) {
    setBusy(a.email);
    const ok = await call(AuthService.updateAccount(token, { email: a.email, disabled: a.status !== "disabled" }));
    if (ok) {
      toast.success(a.status === "disabled" ? "Account enabled" : "Account disabled");
      await reload();
    }
    setBusy(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <NativeSelect value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="sm:w-56" aria-label="Filter by role">
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r.key} value={r.key}>
              {r.name} ({r.userCount})
            </option>
          ))}
        </NativeSelect>
        {canEdit && (
          <Button onClick={() => setAdding(true)}>
            <UserPlus className="size-4" /> Add user
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="No users" description="Nobody matches this search." />
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {filtered.map((a) => {
              const self = a.email.toLowerCase() === myEmail.toLowerCase();
              // Accounts whose role this admin couldn't assign are above them.
              const locked = !canEdit || self || !assignable.has(a.role);
              const status = STATUS[a.status];
              return (
                <div key={a.email} className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{a.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}>
                        {status.label}
                      </span>
                      {self && <Badge variant="outline">You</Badge>}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{a.email}</p>
                    <p className="text-xs text-muted-foreground">{lastSeen(a.lastLoginAt)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <NativeSelect
                      value={a.role}
                      disabled={locked || busy === a.email}
                      onChange={(e) => changeRole(a, e.target.value)}
                      className="w-full sm:w-52"
                      aria-label={`Role for ${a.name}`}
                    >
                      {roles.map((r) => (
                        <option key={r.key} value={r.key} disabled={!assignable.has(r.key)}>
                          {r.name}
                        </option>
                      ))}
                    </NativeSelect>
                    {canEdit && !self && !locked && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resend(a)}
                          disabled={busy === a.email || a.status === "disabled"}
                          title="Generate a new set-password link"
                        >
                          <KeyRound className="size-4" />
                          {a.status === "invited" ? "Resend invite" : "Reset link"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDisabled(a)}
                          disabled={busy === a.email}
                        >
                          {a.status === "disabled" ? (
                            <>
                              <UserCheck className="size-4" /> Enable
                            </>
                          ) : (
                            <>
                              <Ban className="size-4" /> Disable
                            </>
                          )}
                        </Button>
                      </>
                    )}
                    {busy === a.email && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <AddUserDialog
        open={adding}
        roles={roles.filter((r) => assignable.has(r.key))}
        onClose={() => setAdding(false)}
        onCreated={async (result) => {
          setAdding(false);
          setInvite(result);
          await reload();
        }}
      />
      <InviteDialog invite={invite} onClose={() => setInvite(null)} />
    </div>
  );
}

function AddUserDialog({
  open,
  roles,
  onClose,
  onCreated,
}: {
  open: boolean;
  roles: RoleRow[];
  onClose: () => void;
  onCreated: (r: InviteResult) => void;
}) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", number: "", roleKey: "faculty" });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const roleKey = roles.some((r) => r.key === form.roleKey) ? form.roleKey : roles[0]?.key ?? "";

  async function submit() {
    setSaving(true);
    const email = form.email.trim().toLowerCase();
    const ok = await call(AuthService.createAccount(getToken() ?? "", { ...form, email, roleKey }));
    setSaving(false);
    if (ok?.link) {
      onCreated({
        name: `${form.firstName} ${form.lastName}`.trim(),
        email,
        link: ok.link,
        emailSent: !!ok.emailSent,
        emailError: ok.emailError,
      });
      setForm({ firstName: "", lastName: "", email: "", number: "", roleKey });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a user</DialogTitle>
          <DialogDescription>
            They&apos;ll get an email with a link to set their password. You can also share the link
            yourself.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nu-first">First name</Label>
              <Input id="nu-first" required value={form.firstName} onChange={set("firstName")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nu-last">Last name</Label>
              <Input id="nu-last" value={form.lastName} onChange={set("lastName")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nu-email">Email (their username)</Label>
            <Input
              id="nu-email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              required
              value={form.email}
              onChange={set("email")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nu-phone">Phone</Label>
              <Input id="nu-phone" type="tel" inputMode="tel" value={form.number} onChange={set("number")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nu-role">Role</Label>
              <NativeSelect id="nu-role" value={roleKey} onChange={set("roleKey")}>
                {roles.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Create &amp; send invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
