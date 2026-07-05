"use client";

import { useState } from "react";

export interface BarDatum {
  label: string;
  value: number;
  /** Optional secondary magnitude (e.g. damaged) shown in the tooltip only. */
  sub?: number;
}

/**
 * Horizontal bar chart for magnitude comparison — single-hue sequential (the job is
 * "compare low→high", not identity), thin capped bars with 4px rounded data-ends on a
 * hairline baseline, direct value labels at the tip, and a per-bar hover tooltip.
 * Text uses ink tokens; only the bar carries the hue. Caller pre-sorts and slices.
 */
export function BarChartH({
  data,
  formatValue = (n) => n.toLocaleString(),
  subLabel = "damaged",
  emptyLabel = "No data",
  color = "var(--chart-1)",
  labelWidth = "8rem",
}: {
  data: BarDatum[];
  formatValue?: (n: number) => string;
  subLabel?: string;
  emptyLabel?: string;
  /** Single hue for the bars. Defaults to the sequential chart hue. */
  color?: string;
  /** Width of the left label column. Widen for long category names. */
  labelWidth?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div
      className="relative"
      onMouseLeave={() => setHover(null)}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
    >
      <div className="space-y-2">
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          return (
            <div
              key={d.label}
              className="flex items-center gap-3"
              tabIndex={0}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
            >
              <div
                className="line-clamp-2 shrink-0 text-right text-xs leading-tight text-muted-foreground"
                style={{ width: labelWidth }}
                title={d.label}
              >
                {d.label}
              </div>
              {/* baseline: hairline on the left of the track */}
              <div className="relative h-4 flex-1 border-l border-border">
                <div
                  className="h-4 rounded-r-[4px] transition-[filter,opacity]"
                  style={{
                    width: `${Math.max(pct, d.value > 0 ? 2 : 0)}%`,
                    backgroundColor: color,
                    filter: hover === i ? "brightness(1.12)" : undefined,
                    opacity: hover === null || hover === i ? 1 : 0.55,
                  }}
                />
              </div>
              <div className="w-14 shrink-0 text-right text-xs font-semibold tabular-nums">
                {formatValue(d.value)}
              </div>
            </div>
          );
        })}
      </div>

      {hover !== null && (
        <div
          className="pointer-events-none absolute z-20 rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md"
          style={{ left: Math.min(pos.x + 12, 9999), top: pos.y + 12 }}
        >
          <div className="font-medium text-popover-foreground">{data[hover].label}</div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-[2px]" style={{ backgroundColor: color }} />
            <span className="font-semibold tabular-nums">{formatValue(data[hover].value)}</span>
            <span className="text-muted-foreground">units</span>
          </div>
          {data[hover].sub != null && data[hover].sub! > 0 && (
            <div className="mt-0.5 text-muted-foreground">
              {formatValue(data[hover].sub!)} {subLabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
