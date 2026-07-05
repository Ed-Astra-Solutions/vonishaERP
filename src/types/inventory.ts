// Inventory module — mirrors the backend inventory_item / inventory_request /
// inventory_log models. Single global SKU catalog with price, vendor and dates.

import type { MediaItem } from "./media";

export type InventoryAction = "add" | "remove" | "damage" | "return";
export type InventoryLogAction = InventoryAction | "create" | "update" | "delete";

export type RequestStatus = "pending" | "approved" | "rejected" | "applied";

export const requestStatusLabel: Record<RequestStatus, string> = {
  pending: "Pending approval",
  approved: "Approved — confirm stock",
  rejected: "Rejected",
  applied: "Applied",
};

export interface InventoryItem {
  _id: string;
  sku: string;
  name: string;
  category?: string;
  vendor?: string;
  unitPrice: number;
  quantity: number;
  damagedQuantity?: number;
  reorderLevel: number;
  unit?: string;
  location?: string;
  purchaseDate?: string;
  warrantyUntil?: string;
  lastRestocked?: string;
  media?: MediaItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryRequest {
  _id: string;
  action: InventoryAction;
  sku: string;
  itemName?: string;
  quantity: number;
  note?: string;
  requestedByEmail: string;
  requestedByName?: string;
  status: RequestStatus;
  resolvedByEmail?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  rejectReason?: string;
  appliedAt?: string;
  media?: MediaItem[];
  createdAt: string;
}

export interface InventoryLog {
  _id: string;
  action: InventoryLogAction;
  sku: string;
  itemName?: string;
  quantityDelta?: number;
  quantityBefore?: number;
  quantityAfter?: number;
  damagedBefore?: number;
  damagedAfter?: number;
  note?: string;
  actorEmail?: string;
  actorName?: string;
  actorRole?: string;
  requestId?: string;
  media?: MediaItem[];
  timestamp: string;
}

/** Value of stock on hand for an item. */
export function lineValue(i: InventoryItem): number {
  return i.unitPrice * i.quantity;
}

export function needsReorder(i: InventoryItem): boolean {
  return i.reorderLevel > 0 && i.quantity <= i.reorderLevel;
}
