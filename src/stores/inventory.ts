import { create } from "zustand";

// Pending inventory-approval count, polled for admins and surfaced as a badge on the
// Inventory sidebar item and the Approvals tab.
interface InventoryState {
  pendingApprovals: number;
  setPendingApprovals: (n: number) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  pendingApprovals: 0,
  setPendingApprovals: (pendingApprovals) => set({ pendingApprovals }),
}));
