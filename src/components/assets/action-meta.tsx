import { Plus, Minus, AlertTriangle, ArrowLeftRight, type LucideIcon } from "lucide-react";
import type { AssetAction } from "@/types/assets";

export const ACTION_ORDER: AssetAction[] = ["add", "remove", "damage", "transfer"];

export interface ActionMeta {
  label: string;
  icon: LucideIcon;
  /** Filled style when this action is the selected one. */
  selected: string;
  /** Outline style when idle/selectable. */
  idle: string;
  /** Soft badge (label chip) style, e.g. in tables. */
  badge: string;
  /** Small status dot color. */
  dot: string;
}

// One color per action, reused across the picker, badges, and legends so the mapping
// is learnable: add = green, remove = rose, damage = amber, transfer = blue.
export const ACTION_META: Record<AssetAction, ActionMeta> = {
  add: {
    label: "Add",
    icon: Plus,
    selected: "bg-emerald-600 text-white border-emerald-600 shadow-sm",
    idle: "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/40 dark:text-emerald-400 dark:hover:bg-emerald-500/10",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  remove: {
    label: "Remove",
    icon: Minus,
    selected: "bg-rose-600 text-white border-rose-600 shadow-sm",
    idle: "border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-400 dark:hover:bg-rose-500/10",
    badge: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  damage: {
    label: "Damage",
    icon: AlertTriangle,
    selected: "bg-amber-500 text-white border-amber-500 shadow-sm",
    idle: "border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-500/40 dark:text-amber-400 dark:hover:bg-amber-500/10",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-500",
    dot: "bg-amber-500",
  },
  transfer: {
    label: "Transfer",
    icon: ArrowLeftRight,
    selected: "bg-sky-600 text-white border-sky-600 shadow-sm",
    idle: "border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-500/40 dark:text-sky-400 dark:hover:bg-sky-500/10",
    badge: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
    dot: "bg-sky-500",
  },
};
