"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Building2,
  Loader2,
  Plus,
  AlertTriangle,
  Layers,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { type AssetAction, type AssetStock } from "@/types/assets";
import { type MediaItem } from "@/types/media";
import { MediaUpload } from "@/components/common/media-upload";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { BarChartH } from "@/components/charts/bar-chart-h";
import { AssetMatrix } from "@/components/assets/asset-matrix";
import { ActionPicker } from "@/components/assets/action-picker";
import { ManageCentersDialog } from "@/components/assets/manage-centers-dialog";
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
const TOP_N = 10;

function sumBy(rows: AssetStock[], key: (r: AssetStock) => string) {
  const q = new Map<string, number>();
  const d = new Map<string, number>();
  for (const r of rows) {
    const k = key(r);
    q.set(k, (q.get(k) ?? 0) + r.quantity);
    d.set(k, (d.get(k) ?? 0) + r.damagedQuantity);
  }
  return Array.from(q.entries())
    .map(([label, value]) => ({ label, value, sub: d.get(label) ?? 0 }))
    .sort((a, b) => b.value - a.value);
}

/** Fold everything past TOP_N into a single "Other" bar so the chart stays legible. */
function topN(data: { label: string; value: number; sub: number }[]) {
  if (data.length <= TOP_N) return data;
  const head = data.slice(0, TOP_N);
  const tail = data.slice(TOP_N);
  return [
    ...head,
    {
      label: `Other (${tail.length})`,
      value: tail.reduce((n, d) => n + d.value, 0),
      sub: tail.reduce((n, d) => n + d.sub, 0),
    },
  ];
}

export function AssetStockView({ mode, hideHeader = false }: { mode: "admin" | "am"; hideHeader?: boolean }) {
  const [rows, setRows] = useState<AssetStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "inventory">("overview");
  const [search, setSearch] = useState("");
  const [centerFilter, setCenterFilter] = useState<string>(ALL);
  const [changeOpen, setChangeOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [centersOpen, setCentersOpen] = useState(false);
  const [prefill, setPrefill] = useState<{ center: string; assetName: string } | null>(null);

  const isAdmin = mode === "admin";

  const load = useCallback(async () => {
    setLoading(true);
    const res = await AuthService.getAssetStock(getToken() ?? "");
    if (isErr(res)) {
      setLoading(false);
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; data?: AssetStock[] };
    if (body.success && Array.isArray(body.data)) setRows(body.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const centers = useMemo(
    () => Array.from(new Set(rows.map((r) => r.center))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (centerFilter !== ALL && r.center !== centerFilter) return false;
      if (q && !r.name.toLowerCase().includes(q) && !r.center.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, centerFilter]);

  const byCategory = useMemo(() => topN(sumBy(filtered, (r) => r.name)), [filtered]);
  const byCenter = useMemo(() => sumBy(filtered, (r) => r.center), [filtered]);
  const damagedByCategory = useMemo(
    () => sumBy(filtered, (r) => r.name).filter((d) => d.sub > 0).map((d) => ({ label: d.label, value: d.sub })),
    [filtered],
  );

  const totalUnits = filtered.reduce((n, r) => n + r.quantity, 0);
  const damagedUnits = filtered.reduce((n, r) => n + r.damagedQuantity, 0);
  const categoryCount = new Set(filtered.map((r) => r.name)).size;
  const centerCount = new Set(filtered.map((r) => r.center)).size;

  function openChange(center?: string, assetName?: string) {
    setPrefill(center && assetName ? { center, assetName } : null);
    setChangeOpen(true);
  }

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      {isAdmin && (
        <>
          <Button variant="outline" onClick={() => setCentersOpen(true)}>
            <Building2 className="size-4" /> Centers
          </Button>
          <Button variant="outline" onClick={() => setCategoryOpen(true)}>
            <Layers className="size-4" /> Add category
          </Button>
        </>
      )}
      <Button onClick={() => openChange()}>
        <Plus className="size-4" /> {isAdmin ? "New change" : "Request change"}
      </Button>
    </div>
  );

  return (
    <div>
      {!hideHeader && (
        <PageHeader
          title="Asset Stock"
          description={
            isAdmin
              ? "Stock by category and center. Add categories everywhere at once, or change a single cell."
              : "Stock by category and center. Propose changes for admin approval."
          }
          actions={actions}
        />
      )}

      {/* KPI row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total units" value={loading ? "—" : totalUnits.toLocaleString()} icon={Boxes} tone="info" />
        <StatCard label="Categories" value={loading ? "—" : categoryCount} icon={Layers} tone="default" />
        <StatCard label="Centers" value={loading ? "—" : centerCount} icon={Building2} tone="success" />
        <StatCard
          label="Damaged"
          value={loading ? "—" : damagedUnits.toLocaleString()}
          icon={AlertTriangle}
          tone="danger"
          hint={totalUnits > 0 ? `${((damagedUnits / (totalUnits + damagedUnits)) * 100 || 0).toFixed(1)}% of all units` : undefined}
        />
      </div>

      {/* Controls: one row above the content */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab((v as "overview" | "inventory") ?? "overview")}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search category or center…"
            className="w-56 pl-8"
          />
        </div>
        <Select value={centerFilter} onValueChange={(v) => setCenterFilter(v ?? ALL)}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All centers</SelectItem>
            {centers.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        {hideHeader && actions}
      </div>

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Boxes} title="Nothing matches" description="Try clearing the search or center filter." />
      ) : tab === "overview" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Units by category</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChartH data={byCategory} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Units by center</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChartH data={byCenter} labelWidth="11rem" />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="size-4 text-destructive" /> Damaged stock by category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {damagedByCategory.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No damaged assets recorded. 🎉
                </p>
              ) : (
                <BarChartH data={damagedByCategory} color="var(--destructive)" subLabel="" />
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Cell shade shows relative quantity · red dot marks damaged stock ·{" "}
            {isAdmin ? "click a cell to change it" : "click a cell to request a change"}
          </p>
          <AssetMatrix rows={filtered} onCellClick={(center, assetName) => openChange(center, assetName)} />
        </div>
      )}

      <ChangeDialog
        key={changeOpen ? (prefill ? `${prefill.center}:${prefill.assetName}` : "new") : "closed"}
        open={changeOpen}
        onOpenChange={setChangeOpen}
        mode={mode}
        centers={centers}
        prefill={prefill}
        onDone={load}
      />

      {isAdmin && (
        <>
          <AddCategoryDialog open={categoryOpen} onOpenChange={setCategoryOpen} onDone={load} />
          <ManageCentersDialog open={centersOpen} onOpenChange={setCentersOpen} rows={rows} onDone={load} />
        </>
      )}
    </div>
  );
}

function AddCategoryDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (name.trim().length < 1) {
      toast.error("Enter a category name");
      return;
    }
    setSaving(true);
    const res = await AuthService.addAssetCategory(getToken() ?? "", name.trim(), Number(qty) || 0);
    setSaving(false);
    if (isErr(res)) {
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; msg?: string };
    if (body.success) {
      toast.success(body.msg ?? "Category added");
      onOpenChange(false);
      setName("");
      setQty("");
      onDone();
    } else {
      toast.error(body.msg ?? "Failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add category to all centers</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Category name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. White Board" />
            <p className="text-xs text-muted-foreground">
              Creates this asset in every center at once. Centers that already have it are skipped.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Starting quantity (all centers)</Label>
            <Input type="number" min={0} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />} Add everywhere
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChangeDialog({
  open,
  onOpenChange,
  mode,
  centers,
  prefill,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: "admin" | "am";
  centers: string[];
  prefill: { center: string; assetName: string } | null;
  onDone: () => void;
}) {
  const [action, setAction] = useState<AssetAction>("add");
  const [center, setCenter] = useState(prefill?.center ?? "");
  const [toCenter, setToCenter] = useState("");
  const [assetName, setAssetName] = useState(prefill?.assetName ?? "");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [invoice, setInvoice] = useState<MediaItem[]>([]);
  const [evidence, setEvidence] = useState<MediaItem[]>([]);
  const [damage, setDamage] = useState<MediaItem[]>([]);
  const [saving, setSaving] = useState(false);

  const isAdmin = mode === "admin";
  const needsDest = action === "transfer";
  const isDamage = action === "damage";

  // Media actually sent depends on the action: purchase invoice only when adding;
  // damage proof (mandatory) when marking damaged, otherwise optional evidence.
  const media: MediaItem[] = [
    ...(action === "add" ? invoice : []),
    ...(isDamage ? damage : evidence),
  ];

  async function submit() {
    const q = Number(quantity);
    if (!center || !assetName.trim() || !(q > 0)) {
      toast.error("Fill center, asset and a positive quantity");
      return;
    }
    if (needsDest && (!toCenter || toCenter === center)) {
      toast.error("Choose a different destination center");
      return;
    }
    if (isDamage && damage.length === 0) {
      toast.error("Attach a photo or video of the damage");
      return;
    }
    const payload = {
      action,
      center,
      toCenter: needsDest ? toCenter : undefined,
      assetName: assetName.trim(),
      quantity: q,
      note: note.trim() || undefined,
      media,
    };
    setSaving(true);
    const res = isAdmin
      ? await AuthService.adminAssetChange(getToken() ?? "", payload)
      : await AuthService.createAssetRequest(getToken() ?? "", payload);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isAdmin ? "Change stock" : "Request stock change"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Action</Label>
            <ActionPicker value={action} onChange={setAction} />
          </div>

          <div className="space-y-2">
            <Label>{needsDest ? "From center" : "Center"}</Label>
            <Select value={center} onValueChange={(v) => setCenter(v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Select center" /></SelectTrigger>
              <SelectContent>
                {centers.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {needsDest && (
            <div className="space-y-2">
              <Label>To center</Label>
              <Select value={toCenter} onValueChange={(v) => setToCenter(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
                <SelectContent>
                  {centers.filter((c) => c !== center).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Asset</Label>
            <Input
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="e.g. White Board"
            />
            {action === "add" && (
              <p className="text-xs text-muted-foreground">
                Enter a new or existing asset name for this center.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label>Note {isAdmin ? "(optional)" : "(reason)"}</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>

          {action === "add" && (
            <MediaUpload
              purpose="invoice"
              module="asset"
              value={invoice}
              onChange={setInvoice}
              label="Invoice"
              description="Photo or PDF of the purchase invoice."
            />
          )}

          {isDamage ? (
            <MediaUpload
              purpose="damage"
              module="asset"
              value={damage}
              onChange={setDamage}
              label="Damage proof"
              description="A photo or video of the damage is required."
              required
            />
          ) : (
            <MediaUpload
              purpose="evidence"
              module="asset"
              value={evidence}
              onChange={setEvidence}
              label="Photo / video evidence"
              description="Optional photo or short video of the asset."
            />
          )}
        </div>
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
