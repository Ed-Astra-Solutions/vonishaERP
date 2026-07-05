// Asset stock management — mirrors the backend models asset_stock / asset_request /
// asset_log. No valuation: quantities and centers only.

import type { MediaItem } from "./media";

export type AssetAction = "add" | "remove" | "damage" | "transfer";

export const assetActionLabel: Record<AssetAction, string> = {
  add: "Add",
  remove: "Remove",
  damage: "Mark damaged",
  transfer: "Transfer",
};

export type RequestStatus = "pending" | "approved" | "rejected" | "applied";

export const requestStatusLabel: Record<RequestStatus, string> = {
  pending: "Pending approval",
  approved: "Approved — confirm stock",
  rejected: "Rejected",
  applied: "Applied",
};

export interface AssetStock {
  _id: string;
  center: string;
  name: string;
  quantity: number;
  damagedQuantity: number;
  updatedAt: string;
}

export interface AssetRequest {
  _id: string;
  action: AssetAction;
  center: string;
  toCenter?: string;
  assetName: string;
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

export interface AssetLog {
  _id: string;
  action: AssetAction;
  center: string;
  toCenter?: string;
  assetName: string;
  quantityDelta?: number;
  quantityBefore?: number;
  quantityAfter?: number;
  damagedBefore?: number;
  damagedAfter?: number;
  actorEmail?: string;
  actorName?: string;
  actorRole?: string;
  requestId?: string;
  note?: string;
  media?: MediaItem[];
  timestamp: string;
}
