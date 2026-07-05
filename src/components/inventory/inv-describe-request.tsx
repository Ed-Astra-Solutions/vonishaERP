import { INV_ACTION_META } from "@/components/inventory/inv-action-meta";
import type { InventoryRequest } from "@/types/inventory";

/** One-line summary of an inventory request, e.g. "Receive 20 × A4 Paper (STA-1001)". */
export function describeInvRequest(r: InventoryRequest): React.ReactNode {
  const m = INV_ACTION_META[r.action];
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className="font-medium">{m?.label ?? r.action}</span>
      <span className="font-semibold">{r.quantity}</span>×<span>{r.itemName || r.sku}</span>
      <span className="text-muted-foreground">({r.sku})</span>
    </span>
  );
}
