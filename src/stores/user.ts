import { create } from "zustand";
import type { UserInfo } from "@/lib/auth";

interface UserState {
  user: UserInfo | null;
  loading: boolean;
  setUser: (user: UserInfo | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

// Current authenticated user — replaces the Flutter widget-tree prop drilling
// of f/l/e/t/type through HomeScreen.
export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  clear: () => set({ user: null, loading: false }),
}));
