import { Plus, Minus, AlertTriangle, Undo2, PackagePlus, Pencil, Trash2, type LucideIcon } from "lucide-react";
import type { ActionMeta } from "@/components/assets/action-meta";
import type { InventoryAction, InventoryLogAction } from "@/types/inventory";

// Actions offered in the change picker, clearly marked and color-coded:
// add = green, remove = rose, damage = amber, return to vendor = violet.
export const INV_ACTION_ORDER: InventoryAction[] = ["add", "remove", "damage", "return"];

interface Meta extends ActionMeta {
  icon: LucideIcon;
}

export const INV_ACTION_META: Record<InventoryLogAction, Meta> = {
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
  return: {
    label: "Return to Vendor",
    icon: Undo2,
    selected: "bg-violet-600 text-white border-violet-600 shadow-sm",
    idle: "border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-500/40 dark:text-violet-400 dark:hover:bg-violet-500/10",
    badge: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
    dot: "bg-violet-500",
  },
  create: {
    label: "Created",
    icon: PackagePlus,
    selected: "bg-sky-600 text-white border-sky-600",
    idle: "border-sky-300 text-sky-700",
    badge: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
    dot: "bg-sky-500",
  },
  update: {
    label: "Updated",
    icon: Pencil,
    selected: "bg-slate-600 text-white border-slate-600",
    idle: "border-slate-300 text-slate-700",
    badge: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
    dot: "bg-slate-500",
  },
  delete: {
    label: "Deleted",
    icon: Trash2,
    selected: "bg-rose-700 text-white border-rose-700",
    idle: "border-rose-300 text-rose-700",
    badge: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
    dot: "bg-rose-600",
  },
};
