import { create } from "zustand";

// Pending asset-approval count, polled for admins and surfaced as a badge on the
// Fixed Assets sidebar item and the Approvals tab.
interface AssetsState {
  pendingApprovals: number;
  setPendingApprovals: (n: number) => void;
}

export const useAssetsStore = create<AssetsState>((set) => ({
  pendingApprovals: 0,
  setPendingApprovals: (pendingApprovals) => set({ pendingApprovals }),
}));
