"use client";

import { useMemo, useState } from "react";
import type { AssetStock } from "@/types/assets";

interface Cell {
  quantity: number;
  damaged: number;
  has: boolean;
}

/**
 * Category × center stock matrix — a heatmap (magnitude → single-hue sequential).
 * Rows are asset categories, columns are centers; cell intensity encodes quantity so
 * "the same category across all centers" reads at a glance. Row/column totals, a
 * per-cell hover tooltip, and click-to-change. Numbers stay in ink tokens; only the
 * cell wash carries the hue, flipping to white ink on the darkest cells for contrast.
 */
export function AssetMatrix({
  rows,
  onCellClick,
}: {
  rows: AssetStock[];
  onCellClick?: (center: string, assetName: string) => void;
}) {
  const [hover, setHover] = useState<{ r: string; c: string } | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const { categories, centers, lookup, colTotals, rowTotals, max } = useMemo(() => {
    const categories = Array.from(new Set(rows.map((r) => r.name))).sort();
    const centers = Array.from(new Set(rows.map((r) => r.center))).sort();
    const lookup = new Map<string, Cell>();
    const colTotals = new Map<string, number>();
    const rowTotals = new Map<string, number>();
    let max = 1;
    for (const r of rows) {
      lookup.set(`${r.name}|||${r.center}`, {
        quantity: r.quantity,
        damaged: r.damagedQuantity,
        has: true,
      });
      colTotals.set(r.center, (colTotals.get(r.center) ?? 0) + r.quantity);
      rowTotals.set(r.name, (rowTotals.get(r.name) ?? 0) + r.quantity);
      if (r.quantity > max) max = r.quantity;
    }
    return { categories, centers, lookup, colTotals, rowTotals, max };
  }, [rows]);

  if (categories.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No stock to show.</p>;
  }

  function cellFill(q: number): { bg: string; light: boolean } {
    if (q <= 0) return { bg: "transparent", light: false };
    const t = Math.min(q / max, 1); // 0..1
    const pct = Math.round(12 + t * 66); // 12%..78% wash of chart-1 over card
    return {
      bg: `color-mix(in oklab, var(--chart-1) ${pct}%, var(--card))`,
      light: pct > 48,
    };
  }

  const active = hover ? lookup.get(`${hover.r}|||${hover.c}`) : null;

  return (
    <div
      className="relative overflow-x-auto rounded-lg border bg-card"
      onMouseLeave={() => setHover(null)}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
    >
      <table className="w-full border-collapse text-sm [&_td]:border [&_td]:border-border [&_th]:border [&_th]:border-border">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-muted p-2 text-left text-xs font-semibold text-muted-foreground">
              Category
            </th>
            {centers.map((c) => (
              <th key={c} className="min-w-16 bg-muted p-2 text-center text-[11px] font-medium text-muted-foreground">
                <span className="line-clamp-2" title={c}>{c}</span>
              </th>
            ))}
            <th className="bg-muted p-2 text-center text-xs font-semibold text-muted-foreground">Total</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat}>
              <th
                scope="row"
                className="sticky left-0 z-10 bg-card p-2 text-left text-xs font-medium"
                title={cat}
              >
                <span className="line-clamp-1 max-w-40">{cat}</span>
              </th>
              {centers.map((center) => {
                const cell = lookup.get(`${cat}|||${center}`);
                const q = cell?.quantity ?? 0;
                const { bg, light } = cellFill(q);
                return (
                  <td key={center} className="p-0">
                    <button
                      type="button"
                      onClick={() => onCellClick?.(center, cat)}
                      onMouseEnter={() => setHover({ r: cat, c: center })}
                      onFocus={() => setHover({ r: cat, c: center })}
                      onBlur={() => setHover(null)}
                      className="relative flex h-9 w-full items-center justify-center text-xs tabular-nums outline-none transition-[filter] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      style={{
                        backgroundColor: bg,
                        color: light ? "white" : q > 0 ? "var(--foreground)" : "var(--muted-foreground)",
                      }}
                      aria-label={`${cat} at ${center}: ${q} in stock${cell?.damaged ? `, ${cell.damaged} damaged` : ""}`}
                    >
                      {cell?.has ? q : "·"}
                      {cell && cell.damaged > 0 && (
                        <span
                          className="absolute right-1 top-1 size-1.5 rounded-full"
                          style={{ backgroundColor: "var(--destructive)" }}
                        />
                      )}
                    </button>
                  </td>
                );
              })}
              <td className="bg-card p-2 text-center text-xs font-semibold tabular-nums">
                {(rowTotals.get(cat) ?? 0).toLocaleString()}
              </td>
            </tr>
          ))}
          <tr>
            <th className="sticky left-0 z-10 bg-muted p-2 text-left text-xs font-semibold text-muted-foreground">
              Total
            </th>
            {centers.map((c) => (
              <td key={c} className="bg-muted p-2 text-center text-xs font-semibold tabular-nums">
                {(colTotals.get(c) ?? 0).toLocaleString()}
              </td>
            ))}
            <td className="bg-muted p-2 text-center text-xs font-bold tabular-nums">
              {Array.from(rowTotals.values()).reduce((a, b) => a + b, 0).toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>

      {hover && active && (
        <div
          className="pointer-events-none absolute z-20 rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md"
          style={{ left: Math.min(pos.x + 12, 9999), top: pos.y + 12 }}
        >
          <div className="font-medium text-popover-foreground">{hover.r}</div>
          <div className="text-muted-foreground">{hover.c}</div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-[2px]" style={{ backgroundColor: "var(--chart-1)" }} />
            <span className="font-semibold tabular-nums">{active.quantity.toLocaleString()}</span>
            <span className="text-muted-foreground">in stock</span>
          </div>
          {active.damaged > 0 && (
            <div className="mt-0.5 flex items-center gap-1.5 text-destructive">
              <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: "var(--destructive)" }} />
              {active.damaged.toLocaleString()} damaged
            </div>
          )}
        </div>
      )}
    </div>
  );
}
