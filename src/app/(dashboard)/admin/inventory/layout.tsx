import type { ReactNode } from "react";
import { InventoryTabs } from "@/components/inventory/inventory-tabs";
import "../fixed-assets/wp.css";

// Inventory section shell — WordPress-admin styled (reuses the .wpfa skin). Sub-pages
// (Items, Approvals, Log) switch via wp-admin nav tabs.
export default function InventoryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="wpfa -m-4 min-h-[calc(100dvh-4rem)] p-4 md:-m-6 md:p-6 lg:-m-8 lg:p-8">
      <h1 className="wpfa-title mb-1">Inventory</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        SKUs, valuation, vendors and stock movements.
      </p>
      <InventoryTabs />
      {children}
    </div>
  );
}
