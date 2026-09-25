/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Patina VisitorCounter — the millennium "You are visitor #000042" hit counter.
 *
 * A row of odometer digits: bright digits on a dark inset LCD panel, each digit
 * boxed with a hairline, like the GeoCities/Webcounter graphics of the era.
 * `count` is zero-padded to `digits` places.
 *
 *   <VisitorCounter count={1337} />
 */
function VisitorCounter({
  className,
  count,
  digits = 6,
  ...props
}: React.ComponentProps<"div"> & { count: number; digits?: number }) {
  const str = String(Math.max(0, Math.floor(count))).padStart(digits, "0").slice(-digits)
  return (
    <div
      data-slot="visitor-counter"
      role="img"
      aria-label={`Visitor number ${count}`}
      className={cn(
        // Dark sunken LCD panel with a thin bezel.
        "inline-flex items-center gap-px rounded-[3px] bg-[#111] p-[3px]",
        "shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_0_0_1px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.4)]",
        className
      )}
      {...props}
    >
      {str.split("").map((d, i) => (
        <span
          key={i}
          className={cn(
            "flex h-6 w-4 items-center justify-center rounded-[1px] tabular-nums",
            "bg-[linear-gradient(#2a2a2a,#151515)] font-(family-name:--y2k-font-mono) text-[13px] leading-none font-bold",
            // Glowing tone digits, like a lit segment display.
            "text-(--y2k-tone) [text-shadow:0_0_4px_var(--y2k-tone-glow)]",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          )}
        >
          {d}
        </span>
      ))}
    </div>
  )
}

export { VisitorCounter }
