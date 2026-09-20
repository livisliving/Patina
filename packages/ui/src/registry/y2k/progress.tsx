"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Patina Progress — DESIGN.md › Components › Progress.
 *
 * A tone gel bar in a sunken white track. Two modes:
 *   • determinate: pass `value` (0–100) → a tone gel fill.
 *   • indeterminate: omit `value` → the Aqua "barber pole" (45° stripes
 *     scrolling left at 28px/s, via the y2k-barber keyframe in the theme).
 */
function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const indeterminate = value == null
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn(
        // Sunken white well, pill-shaped, 15px tall.
        "relative h-[15px] w-full overflow-hidden rounded-full bg-(--y2k-input-bg)",
        "shadow-[inset_0_1px_2px_rgba(0,0,0,0.3),0_0_0_1px_var(--y2k-input-border),0_1px_0_rgba(255,255,255,0.6)]",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full rounded-full transition-[width] duration-300 ease-out",
          // Tone gel fill + a gloss cap on the top half.
          "bg-(image:--y2k-tone-button) shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),inset_0_-2px_3px_var(--y2k-tone-button-inner)]",
          indeterminate &&
            "w-full bg-[repeating-linear-gradient(-45deg,var(--y2k-tone)_0_10px,color-mix(in_srgb,var(--y2k-tone)_70%,white)_10px_20px)] bg-[length:28px_28px] animate-[y2k-barber_1s_linear_infinite] motion-reduce:animate-none"
        )}
        style={indeterminate ? undefined : { width: `${value}%` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
