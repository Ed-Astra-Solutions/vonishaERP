"use client";

import { ACTION_META, ACTION_ORDER, type ActionMeta } from "@/components/assets/action-meta";
import { cn } from "@/lib/utils";

/**
 * Color-coded segmented control showing every action at once. Generic over the action
 * set — defaults to the asset actions; pass `order`/`meta` for inventory (or any set).
 */
export function ActionPicker<T extends string>({
  value,
  onChange,
  order = ACTION_ORDER as unknown as T[],
  meta = ACTION_META as unknown as Record<T, ActionMeta>,
}: {
  value: T;
  onChange: (a: T) => void;
  order?: T[];
  meta?: Record<T, ActionMeta>;
}) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}
    >
      {order.map((a) => {
        const m = meta[a];
        const Icon = m.icon;
        const active = value === a;
        return (
          <button
            key={a}
            type="button"
            onClick={() => onChange(a)}
            aria-pressed={active}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-center text-sm font-medium leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? m.selected : m.idle,
            )}
          >
            <Icon className="size-4" />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
