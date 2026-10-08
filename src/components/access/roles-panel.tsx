"use client";

import { useMemo, useState } from "react";
import { Copy, Loader2, Lock, Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import type { AccessLevel, ModuleKey, Permissions } from "@/lib/permissions";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { NativeSelect } from "./native-select";
import type { ModuleInfo, RoleRow } from "@/types/access";

const RANK: Record<AccessLevel, number> = { none: 0, view: 1, edit: 2 };
const LEVEL_LABEL: Record<AccessLevel, string> = { none: "Hidden", view: "View", edit: "Edit" };

// Mirrors GRANT_IMPLIED_BY in vonishaServer/config/rbac.js.
const GRANT_IMPLIED_BY: Partial<Record<ModuleKey, ModuleKey[]>> = {
  asset_stock: ["fixed_assets", "inventory"],
};

/** Highest level this admin may grant on a module (their own, unless master). */
export function grantCeiling(mine: Permissions, isMaster: boolean, m: ModuleKey): number {
  if (isMaster) return RANK.edit;
  return [m, ...(GRANT_IMPLIED_BY[m] ?? [])].reduce((best, k) => Math.max(best, RANK[mine[k] ?? "none"]), 0);
}

function summary(role: RoleRow, modules: ModuleInfo[]) {
  const edit = modules.filter((m) => role.permissions[m.key] === "edit").length;
  const view = modules.filter((m) => role.permissions[m.key] === "view").length;
  return `${edit} edit · ${view} view · ${modules.length - edit - view} hidden`;
}

interface Draft {
  key?: string;
  name: string;
  description: string;
  permissions: Permissions;
  system: boolean;
}

export function RolesPanel({
  roles,
  modules,
  myPermissions,
  myRole,
  canEdit,
  reload,
}: {
  roles: RoleRow[];
  modules: ModuleInfo[];
  myPermissions: Permissions;
  myRole: string;
  canEdit: boolean;
  reload: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<RoleRow | null>(null);
  const isMaster = myRole === "master";

  function blank(from?: RoleRow): Draft {
    return {
      name: from ? `${from.name} (copy)` : "",
      description: from?.description ?? "",
      permissions: { ...(from?.permissions ?? {}) },
      system: false,
    };
  }

  async function confirmDelete() {
    if (!deleting) return;
    const res = await AuthService.deleteRole(getToken() ?? "", deleting.key);
    if (isErr(res)) return toast.error("Connection Error");
    const body = res.data as { success?: boolean; msg?: string };
    if (!body.success) return toast.error(body.msg ?? "Could not delete");
    toast.success("Role deleted");
    setDeleting(null);
    await reload();
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <Button onClick={() => setDraft(blank())}>
            <Plus className="size-4" /> New role
          </Button>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((r) => {
          const editable =
            canEdit && !r.locked && (isMaster || r.key !== myRole) &&
            modules.every((m) => RANK[r.permissions[m.key] ?? "none"] <= grantCeiling(myPermissions, isMaster, m.key));
          return (
            <Card key={r.key} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold">{r.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge variant={r.system ? "secondary" : "outline"}>{r.system ? "Built-in" : "Custom"}</Badge>
                      {r.locked && (
                        <Badge variant="secondary">
                          <Lock className="size-3" /> Locked
                        </Badge>
                      )}
                      {r.key === myRole && <Badge variant="outline">Your role</Badge>}
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                    <Users className="size-4" /> {r.userCount}
                  </span>
                </div>
                {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                <p className="text-xs text-muted-foreground">{summary(r, modules)}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setDraft({ key: r.key, name: r.name, description: r.description, permissions: { ...r.permissions }, system: r.system })
                    }
                  >
                    <Pencil className="size-4" /> {editable ? "Edit" : "View"}
                  </Button>
                  {canEdit && (
                    <Button size="sm" variant="ghost" onClick={() => setDraft(blank(r))}>
                      <Copy className="size-4" /> Duplicate
                    </Button>
                  )}
                  {editable && !r.system && (
                    <Button size="sm" variant="ghost" onClick={() => setDeleting(r)} aria-label={`Delete ${r.name}`}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <RoleEditor
        draft={draft}
        modules={modules}
        roles={roles}
        readOnly={
          !!draft?.key &&
          !(
            canEdit &&
            !roles.find((r) => r.key === draft.key)?.locked &&
            (isMaster || draft.key !== myRole)
          )
        }
        ceiling={(m) => grantCeiling(myPermissions, isMaster, m)}
        onClose={() => setDraft(null)}
        onSaved={async () => {
          setDraft(null);
          await reload();
        }}
      />

      <Dialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleting?.name}?</DialogTitle>
            <DialogDescription>
              {deleting?.userCount
                ? `${deleting.userCount} user(s) still have this role. Move them to another role first.`
                : "This can't be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={!!deleting?.userCount} onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RoleEditor({
  draft,
  modules,
  roles,
  readOnly,
  ceiling,
  onClose,
  onSaved,
}: {
  draft: Draft | null;
  modules: ModuleInfo[];
  roles: RoleRow[];
  readOnly: boolean;
  ceiling: (m: ModuleKey) => number;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  // Re-seeded whenever a different draft opens.
  const [state, setState] = useState<Draft | null>(draft);
  const [seed, setSeed] = useState<Draft | null>(draft);
  const [saving, setSaving] = useState(false);
  if (draft !== seed) {
    setSeed(draft);
    setState(draft);
  }

  const groups = useMemo(() => {
    const out = new Map<string, ModuleInfo[]>();
    for (const m of modules) out.set(m.group, [...(out.get(m.group) ?? []), m]);
    return [...out.entries()];
  }, [modules]);

  if (!state) return null;
  const isNew = !state.key;

  function setLevel(m: ModuleKey, level: AccessLevel) {
    setState((s) => (s ? { ...s, permissions: { ...s.permissions, [m]: level } } : s));
  }

  function setGroup(group: ModuleInfo[], level: AccessLevel) {
    setState((s) => {
      if (!s) return s;
      const p = { ...s.permissions };
      for (const m of group) {
        p[m.key] = RANK[level] <= ceiling(m.key) ? level : (["none", "view", "edit"] as AccessLevel[])[ceiling(m.key)];
      }
      return { ...s, permissions: p };
    });
  }

  async function save() {
    if (!state) return;
    setSaving(true);
    const res = await AuthService.saveRole(getToken() ?? "", {
      key: state.key,
      name: state.name.trim(),
      description: state.description.trim(),
      permissions: state.permissions,
    });
    setSaving(false);
    if (isErr(res)) return toast.error("Connection Error");
    const body = res.data as { success?: boolean; msg?: string };
    if (!body.success) return toast.error(body.msg ?? "Could not save");
    toast.success(body.msg ?? "Saved");
    await onSaved();
  }

  return (
    <Dialog open={draft !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isNew ? "New role" : readOnly ? state.name : `Edit ${state.name}`}</DialogTitle>
          <DialogDescription>
            <strong>Hidden</strong> removes the page from the sidebar. <strong>View</strong> is read-only.{" "}
            <strong>Edit</strong> allows changes. For student pages, View still lets a class incharge
            edit their own classes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="role-name">Name</Label>
              <Input
                id="role-name"
                value={state.name}
                disabled={readOnly || state.system}
                onChange={(e) => setState({ ...state, name: e.target.value })}
                placeholder="e.g. Librarian"
              />
            </div>
            {isNew && (
              <div className="space-y-1.5">
                <Label htmlFor="role-from">Start from</Label>
                <NativeSelect
                  id="role-from"
                  defaultValue=""
                  onChange={(e) => {
                    const src = roles.find((r) => r.key === e.target.value);
                    const p: Permissions = {};
                    for (const m of modules) {
                      const lvl = src?.permissions[m.key] ?? "none";
                      p[m.key] = RANK[lvl] <= ceiling(m.key) ? lvl : "none";
                    }
                    setState({ ...state, permissions: p });
                  }}
                >
                  <option value="">Nothing (blank)</option>
                  {roles.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role-desc">Description</Label>
            <Textarea
              id="role-desc"
              rows={2}
              value={state.description}
              disabled={readOnly}
              onChange={(e) => setState({ ...state, description: e.target.value })}
              placeholder="What this role is for"
            />
          </div>

          {groups.map(([group, items]) => (
            <div key={group} className="rounded-lg border">
              <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group}</span>
                {!readOnly && (
                  <div className="flex gap-1">
                    {(["none", "view", "edit"] as AccessLevel[]).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setGroup(items, l)}
                        className="rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        All {LEVEL_LABEL[l].toLowerCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="divide-y">
                {items.map((m) => {
                  const current = state.permissions[m.key] ?? "none";
                  return (
                    <div key={m.key} className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm">{m.label}</span>
                      <div className="inline-flex shrink-0 self-start rounded-md border p-0.5 sm:self-auto" role="radiogroup" aria-label={m.label}>
                        {(["none", "view", "edit"] as AccessLevel[]).map((l) => {
                          const tooHigh = RANK[l] > ceiling(m.key);
                          return (
                            <button
                              key={l}
                              type="button"
                              role="radio"
                              aria-checked={current === l}
                              disabled={readOnly || tooHigh}
                              title={tooHigh ? "You can't grant more access than you have" : undefined}
                              onClick={() => setLevel(m.key, l)}
                              className={cn(
                                "min-w-16 rounded px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed",
                                current === l
                                  ? l === "edit"
                                    ? "bg-primary text-primary-foreground"
                                    : l === "view"
                                      ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                                      : "bg-muted text-foreground"
                                  : "text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent",
                              )}
                            >
                              {LEVEL_LABEL[l]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {readOnly ? "Close" : "Cancel"}
          </Button>
          {!readOnly && (
            <Button onClick={save} disabled={saving || (isNew && !state.name.trim())}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {isNew ? "Create role" : "Save changes"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
