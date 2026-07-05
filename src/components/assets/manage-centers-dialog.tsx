"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import type { AssetStock } from "@/types/assets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ManageCentersDialog({
  open,
  onOpenChange,
  rows,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  rows: AssetStock[];
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmForce, setConfirmForce] = useState<string | null>(null);

  const centers = useMemo(() => {
    const units = new Map<string, number>();
    for (const r of rows) units.set(r.center, (units.get(r.center) ?? 0) + r.quantity + r.damagedQuantity);
    return Array.from(units.entries())
      .map(([center, total]) => ({ center, total }))
      .sort((a, b) => a.center.localeCompare(b.center));
  }, [rows]);

  async function add() {
    if (name.trim().length < 1) {
      toast.error("Enter a center name");
      return;
    }
    setAdding(true);
    const res = await AuthService.addCenter(getToken() ?? "", name.trim());
    setAdding(false);
    handle(res, "Center added", () => setName(""));
  }

  async function remove(center: string, force: boolean) {
    setBusy(center);
    const res = await AuthService.removeCenter(getToken() ?? "", center, force);
    setBusy(null);
    if (isErr(res)) {
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; msg?: string; needsForce?: boolean };
    if (body.success) {
      toast.success(body.msg ?? "Center removed");
      setConfirmForce(null);
      onDone();
    } else if (body.needsForce) {
      setConfirmForce(center); // ask to confirm force-delete
    } else {
      toast.error(body.msg ?? "Failed");
    }
  }

  function handle(res: Awaited<ReturnType<typeof AuthService.addCenter>>, ok: string, after: () => void) {
    if (isErr(res)) {
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; msg?: string };
    if (body.success) {
      toast.success(body.msg ?? ok);
      after();
      onDone();
    } else {
      toast.error(body.msg ?? "Failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage centers</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label>Add a center</Label>
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. New Campus"
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <Button onClick={add} disabled={adding}>
              {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            New centers start with every existing category at zero.
          </p>
        </div>

        <div className="mt-2 space-y-1">
          <Label>Existing centers ({centers.length})</Label>
          <ul className="divide-y rounded-md border">
            {centers.map((c) => (
              <li key={c.center} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{c.center}</div>
                  <div className="text-xs text-muted-foreground">{c.total.toLocaleString()} units</div>
                </div>
                {confirmForce === c.center ? (
                  <div className="flex items-center gap-2">
                    <span className="hidden items-center gap-1 text-xs text-amber-600 sm:flex">
                      <AlertTriangle className="size-3.5" /> Delete with stock?
                    </span>
                    <Button size="sm" variant="destructive" onClick={() => remove(c.center, true)} disabled={busy === c.center}>
                      {busy === c.center ? <Loader2 className="size-4 animate-spin" /> : "Delete anyway"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirmForce(null)}>Cancel</Button>
                  </div>
                ) : (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => remove(c.center, false)}
                    disabled={busy === c.center}
                    aria-label={`Remove ${c.center}`}
                  >
                    {busy === c.center ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
