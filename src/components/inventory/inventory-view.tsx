"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Package,
  IndianRupee,
  Boxes,
  AlertTriangle,
  Plus,
  Search,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { inr } from "@/lib/format";
import {
  lineValue,
  needsReorder,
  type InventoryAction,
  type InventoryItem,
} from "@/types/inventory";
import { type MediaItem } from "@/types/media";
import { INV_ACTION_META, INV_ACTION_ORDER } from "@/components/inventory/inv-action-meta";
import { MediaUpload } from "@/components/common/media-upload";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { BarChartH } from "@/components/charts/bar-chart-h";
import { ActionPicker } from "@/components/assets/action-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ALL = "__all__";

function fmtDate(s?: string): string {
  if (!s) return "—";
  const d = new Date(s);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function statusOf(i: InventoryItem): { label: string; cls: string } {
  if (i.quantity <= 0) return { label: "Out of stock", cls: "bg-rose-500/15 text-rose-700 dark:text-rose-400" };
  if (needsReorder(i)) return { label: "Low", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-500" };
  return { label: "In stock", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" };
}

type SortKey = "name" | "value" | "qty" | "reorder";

export function InventoryView({ mode, hideHeader = false }: { mode: "admin" | "am"; hideHeader?: boolean }) {
  const [rows, setRows] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "items">("items");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [sort, setSort] = useState<SortKey>("name");
  const [change, setChange] = useState<InventoryItem | null>(null);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [del, setDel] = useState<InventoryItem | null>(null);

  const isAdmin = mode === "admin";

  const load = useCallback(async () => {
    setLoading(true);
    const res = await AuthService.getInventory(getToken() ?? "");
    if (isErr(res)) {
      setLoading(false);
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; data?: InventoryItem[] };
    if (body.success && Array.isArray(body.data)) setRows(body.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(
    () => Array.from(new Set(rows.map((r) => r.category).filter(Boolean) as string[])).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (categoryFilter !== ALL && r.category !== categoryFilter) return false;
      if (
        q &&
        ![r.name, r.sku, r.vendor, r.category].some((v) => (v ?? "").toLowerCase().includes(q))
      )
        return false;
      return true;
    });
    const by: Record<SortKey, (a: InventoryItem, b: InventoryItem) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      value: (a, b) => lineValue(b) - lineValue(a),
      qty: (a, b) => a.quantity - b.quantity,
      reorder: (a, b) => Number(needsReorder(b)) - Number(needsReorder(a)),
    };
    return [...list].sort(by[sort]);
  }, [rows, search, categoryFilter, sort]);

  const totalValue = filtered.reduce((n, i) => n + lineValue(i), 0);
  const totalUnits = filtered.reduce((n, i) => n + i.quantity, 0);
  const reorderCount = filtered.filter(needsReorder).length;

  const valueByCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of filtered) m.set(i.category || "Uncategorized", (m.get(i.category || "Uncategorized") ?? 0) + lineValue(i));
    return Array.from(m.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const valueByVendor = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of filtered) m.set(i.vendor || "—", (m.get(i.vendor || "—") ?? 0) + lineValue(i));
    return Array.from(m.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      {isAdmin && (
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="size-4" /> Add item
        </Button>
      )}
    </div>
  );

  return (
    <div>
      {!hideHeader && (
        <PageHeader
          title="Inventory"
          description="SKUs, valuation, vendors and stock movements."
          actions={actions}
        />
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="SKUs" value={loading ? "—" : filtered.length} icon={Package} tone="info" />
        <StatCard label="Stock value" value={loading ? "—" : inr(totalValue)} icon={IndianRupee} tone="success" />
        <StatCard label="Total units" value={loading ? "—" : totalUnits.toLocaleString()} icon={Boxes} tone="default" />
        <StatCard label="Needs reorder" value={loading ? "—" : reorderCount} icon={AlertTriangle} tone="warning" />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab((v as "overview" | "items") ?? "items")}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search SKU, item, vendor…" className="w-60 pl-8" />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? ALL)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort((v as SortKey) ?? "name")}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort: Name</SelectItem>
            <SelectItem value="value">Sort: Value</SelectItem>
            <SelectItem value="qty">Sort: Quantity</SelectItem>
            <SelectItem value="reorder">Sort: Reorder first</SelectItem>
          </SelectContent>
        </Select>
        {hideHeader && isAdmin && (
          <Button onClick={() => setAddOpen(true)}><Plus className="size-4" /> Add item</Button>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Package} title="No items" description={isAdmin ? "Add your first SKU to get started." : "No inventory to show."} />
      ) : tab === "overview" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Stock value by category</CardTitle></CardHeader>
            <CardContent><BarChartH data={valueByCategory} formatValue={inr} subLabel="" /></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Stock value by vendor</CardTitle></CardHeader>
            <CardContent><BarChartH data={valueByVendor} formatValue={inr} subLabel="" labelWidth="9rem" /></CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="size-4 text-amber-500" /> Reorder alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reorderCount === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Everything is above its reorder level. 🎉</p>
              ) : (
                <ul className="divide-y text-sm">
                  {filtered.filter(needsReorder).map((i) => (
                    <li key={i._id} className="flex items-center justify-between py-2">
                      <span><span className="font-medium">{i.name}</span> <span className="text-muted-foreground">({i.sku})</span></span>
                      <span className="text-amber-600">{i.quantity}{i.unit ? ` ${i.unit}` : ""} · reorder at {i.reorderLevel}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <ItemsTable
          rows={filtered}
          isAdmin={isAdmin}
          onChange={(i) => setChange(i)}
          onEdit={(i) => setEditItem(i)}
          onDelete={(i) => setDel(i)}
        />
      )}

      <ChangeDialog item={change} mode={mode} onOpenChange={(o) => !o && setChange(null)} onDone={load} />
      {isAdmin && (
        <>
          <ItemDialog open={addOpen} item={null} onOpenChange={setAddOpen} onDone={load} />
          <ItemDialog open={!!editItem} item={editItem} onOpenChange={(o) => !o && setEditItem(null)} onDone={load} />
          <DeleteDialog item={del} onOpenChange={(o) => !o && setDel(null)} onDone={load} />
        </>
      )}
    </div>
  );
}

function ItemsTable({
  rows,
  isAdmin,
  onChange,
  onEdit,
  onDelete,
}: {
  rows: InventoryItem[];
  isAdmin: boolean;
  onChange: (i: InventoryItem) => void;
  onEdit: (i: InventoryItem) => void;
  onDelete: (i: InventoryItem) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-[3px] border border-border bg-card">
      <table className="w-full border-collapse text-sm [&_td]:border [&_td]:border-border [&_th]:border [&_th]:border-border">
        <thead>
          <tr className="[&_th]:bg-muted [&_th]:p-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:text-muted-foreground">
            <th>SKU</th>
            <th>Item</th>
            <th>Vendor</th>
            <th className="!text-right">Unit price</th>
            <th className="!text-right">Qty</th>
            <th className="!text-right">Value</th>
            <th>Purchased</th>
            <th>Warranty</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((i) => {
            const st = statusOf(i);
            return (
              <tr key={i._id} className="[&_td]:p-2 [&_td]:align-top">
                <td className="font-mono text-xs">{i.sku}</td>
                <td>
                  <div className="font-medium">{i.name}</div>
                  <div className="text-xs text-muted-foreground">{i.category || "—"}{i.location ? ` · ${i.location}` : ""}</div>
                </td>
                <td>{i.vendor || "—"}</td>
                <td className="text-right tabular-nums">{inr(i.unitPrice)}</td>
                <td className="text-right tabular-nums">
                  {i.quantity}{i.unit ? <span className="text-muted-foreground"> {i.unit}</span> : null}
                  {(i.damagedQuantity ?? 0) > 0 && (
                    <div className="text-xs text-amber-600">{i.damagedQuantity} damaged</div>
                  )}
                </td>
                <td className="text-right font-medium tabular-nums">{inr(lineValue(i))}</td>
                <td className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(i.purchaseDate)}</td>
                <td className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(i.warrantyUntil)}</td>
                <td><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span></td>
                <td className="whitespace-nowrap text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => onChange(i)}>{isAdmin ? "Change" : "Request"}</Button>
                    {isAdmin && (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => onEdit(i)} aria-label="Edit"><Pencil className="size-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-red-600" onClick={() => onDelete(i)} aria-label="Delete"><Trash2 className="size-4" /></Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ChangeDialog({
  item,
  mode,
  onOpenChange,
  onDone,
}: {
  item: InventoryItem | null;
  mode: "admin" | "am";
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) {
  const [action, setAction] = useState<InventoryAction>("add");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [invoice, setInvoice] = useState<MediaItem[]>([]);
  const [evidence, setEvidence] = useState<MediaItem[]>([]);
  const [damage, setDamage] = useState<MediaItem[]>([]);
  const [saving, setSaving] = useState(false);
  const isAdmin = mode === "admin";
  const isDamage = action === "damage";

  // reset when a new item opens
  useEffect(() => {
    if (item) {
      setAction("add");
      setQuantity("");
      setNote("");
      setInvoice([]);
      setEvidence([]);
      setDamage([]);
    }
  }, [item]);

  async function submit() {
    if (!item) return;
    const q = Number(quantity);
    if (!(q > 0)) {
      toast.error("Enter a positive quantity");
      return;
    }
    if (action !== "add" && q > item.quantity) {
      toast.error(`Only ${item.quantity} in stock`);
      return;
    }
    if (isDamage && damage.length === 0) {
      toast.error("Attach a photo or video of the damage");
      return;
    }
    const media: MediaItem[] = [
      ...(action === "add" ? invoice : []),
      ...(isDamage ? damage : evidence),
    ];
    const payload = { action, sku: item.sku, quantity: q, note: note.trim() || undefined, media };
    setSaving(true);
    const res = isAdmin
      ? await AuthService.adminInventoryChange(getToken() ?? "", payload)
      : await AuthService.createInventoryRequest(getToken() ?? "", payload);
    setSaving(false);
    if (isErr(res)) {
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; msg?: string };
    if (body.success) {
      toast.success(isAdmin ? "Stock updated" : "Request submitted for approval");
      onOpenChange(false);
      onDone();
    } else {
      toast.error(body.msg ?? "Failed");
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isAdmin ? "Change stock" : "Request stock change"}{item ? ` — ${item.name}` : ""}</DialogTitle>
        </DialogHeader>
        {item && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {item.sku} · in stock: <span className="font-medium text-foreground">{item.quantity}{item.unit ? ` ${item.unit}` : ""}</span>
              {(item.damagedQuantity ?? 0) > 0 && <span className="text-amber-600"> · {item.damagedQuantity} damaged</span>}
            </p>
            <div className="space-y-2">
              <Label>Action</Label>
              <ActionPicker<InventoryAction>
                value={action}
                onChange={setAction}
                order={INV_ACTION_ORDER}
                meta={INV_ACTION_META}
              />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Note {isAdmin ? "(optional)" : "(reason)"}</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
            </div>

            {action === "add" && (
              <MediaUpload
                purpose="invoice"
                module="inventory"
                value={invoice}
                onChange={setInvoice}
                label="Invoice"
                description="Photo or PDF of the purchase invoice."
              />
            )}

            {isDamage ? (
              <MediaUpload
                purpose="damage"
                module="inventory"
                value={damage}
                onChange={setDamage}
                label="Damage proof"
                description="A photo or video of the damage is required."
                required
              />
            ) : (
              <MediaUpload
                purpose="evidence"
                module="inventory"
                value={evidence}
                onChange={setEvidence}
                label="Photo / video evidence"
                description="Optional photo or short video of the item."
              />
            )}
          </div>
        )}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={submit} disabled={saving || (isDamage && damage.length === 0)}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {isAdmin ? "Apply change" : "Submit request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ItemDialog({
  open,
  item,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  item: InventoryItem | null;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) {
  const editing = !!item;
  const [f, setF] = useState<Record<string, string>>({});
  const [invoice, setInvoice] = useState<MediaItem[]>([]);
  const [evidence, setEvidence] = useState<MediaItem[]>([]);
  const [saving, setSaving] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    if (open) {
      setInvoice([]);
      setEvidence([]);
      setF(
        item
          ? {
              sku: item.sku,
              name: item.name,
              category: item.category ?? "",
              vendor: item.vendor ?? "",
              unitPrice: String(item.unitPrice ?? ""),
              reorderLevel: String(item.reorderLevel ?? ""),
              unit: item.unit ?? "",
              location: item.location ?? "",
              purchaseDate: item.purchaseDate ? item.purchaseDate.slice(0, 10) : "",
              warrantyUntil: item.warrantyUntil ? item.warrantyUntil.slice(0, 10) : "",
            }
          : {},
      );
    }
  }, [open, item]);

  async function submit() {
    if (!f.sku?.trim() || !f.name?.trim()) {
      toast.error("SKU and name are required");
      return;
    }
    setSaving(true);
    const payload = {
      sku: f.sku.trim(),
      name: f.name.trim(),
      category: f.category ?? "",
      vendor: f.vendor ?? "",
      unitPrice: Number(f.unitPrice) || 0,
      reorderLevel: Number(f.reorderLevel) || 0,
      unit: f.unit ?? "",
      location: f.location ?? "",
      purchaseDate: f.purchaseDate ?? "",
      warrantyUntil: f.warrantyUntil ?? "",
      ...(editing ? {} : { quantity: Number(f.quantity) || 0 }),
    };
    const res = editing
      ? await AuthService.updateInventoryItem(getToken() ?? "", payload)
      : await AuthService.addInventoryItem(getToken() ?? "", payload, [...invoice, ...evidence]);
    setSaving(false);
    if (isErr(res)) {
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; msg?: string };
    if (body.success) {
      toast.success(body.msg ?? "Saved");
      onOpenChange(false);
      onDone();
    } else {
      toast.error(body.msg ?? "Failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit item" : "Add inventory item"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="SKU"><Input value={f.sku ?? ""} onChange={set("sku")} disabled={editing} placeholder="e.g. STA-1001" /></Field>
          <Field label="Name"><Input value={f.name ?? ""} onChange={set("name")} /></Field>
          <Field label="Category"><Input value={f.category ?? ""} onChange={set("category")} /></Field>
          <Field label="Vendor"><Input value={f.vendor ?? ""} onChange={set("vendor")} /></Field>
          <Field label="Unit price (₹)"><Input type="number" min={0} value={f.unitPrice ?? ""} onChange={set("unitPrice")} /></Field>
          <Field label="Unit"><Input value={f.unit ?? ""} onChange={set("unit")} placeholder="pcs / boxes" /></Field>
          {!editing && <Field label="Opening quantity"><Input type="number" min={0} value={f.quantity ?? ""} onChange={set("quantity")} /></Field>}
          <Field label="Reorder level"><Input type="number" min={0} value={f.reorderLevel ?? ""} onChange={set("reorderLevel")} /></Field>
          <Field label="Location"><Input value={f.location ?? ""} onChange={set("location")} placeholder="Store Room" /></Field>
          <Field label="Purchase date"><Input type="date" value={f.purchaseDate ?? ""} onChange={set("purchaseDate")} /></Field>
          <Field label="Warranty until"><Input type="date" value={f.warrantyUntil ?? ""} onChange={set("warrantyUntil")} /></Field>
        </div>
        {!editing && (
          <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
            <MediaUpload
              purpose="invoice"
              module="inventory"
              value={invoice}
              onChange={setInvoice}
              label="Invoice"
              description="Photo or PDF of the purchase invoice."
            />
            <MediaUpload
              purpose="evidence"
              module="inventory"
              value={evidence}
              onChange={setEvidence}
              label="Photo / video evidence"
              description="Optional photo or short video of the item."
            />
          </div>
        )}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />} {editing ? "Save changes" : "Add item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function DeleteDialog({
  item,
  onOpenChange,
  onDone,
}: {
  item: InventoryItem | null;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) {
  const [saving, setSaving] = useState(false);

  async function remove(force: boolean) {
    if (!item) return;
    setSaving(true);
    const res = await AuthService.removeInventoryItem(getToken() ?? "", item.sku, force);
    setSaving(false);
    if (isErr(res)) {
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; msg?: string; needsForce?: boolean };
    if (body.success) {
      toast.success("Item removed");
      onOpenChange(false);
      onDone();
    } else if (body.needsForce) {
      // fall through — the button below already offers force via confirm state
      toast.error(body.msg ?? "Item has stock");
    } else {
      toast.error(body.msg ?? "Failed");
    }
  }

  const hasStock = !!item && item.quantity > 0;

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Delete item</DialogTitle>
        </DialogHeader>
        {item && (
          <p className="py-2 text-sm text-muted-foreground">
            Delete <span className="font-medium text-foreground">{item.name}</span> ({item.sku})?
            {hasStock && (
              <span className="mt-2 flex items-center gap-1 text-amber-600">
                <AlertTriangle className="size-4" /> This item still holds {item.quantity} units.
              </span>
            )}
          </p>
        )}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button variant="destructive" onClick={() => remove(hasStock)} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />} {hasStock ? "Delete anyway" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
