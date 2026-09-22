"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Patina Progress — DESIGN.md › Components › Progress.
 *
 * The Aqua 10.0 bar, square-ended: a 16px grooved grey track (the measured
 * rows, its 4px shadow underneath, the last 2px at each end a shade darker)
 * under an 18px fill.
 *   • determinate: pass `value` (0–100) → the tone progress rows with the
 *     original's ribs — a 16px light–dark–light wave — sliding right a pixel
 *     a frame. At 100 the bar is done and stops moving.
 *   • indeterminate: omit `value` → the barber pole, tone and white stripes at
 *     45°, 32px apart, stepping right, with the gel lighting over them.
 */
function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const indeterminate = value == null
  const done = !indeterminate && value >= 100
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn("relative h-(--y2k-progress-h) w-full overflow-hidden", className)}
      {...props}
    >
      <span aria-hidden className="absolute inset-0 bg-[image:var(--y2k-progress-ends),var(--y2k-progress-track)]" />
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "absolute top-0 left-0 h-[18px] overflow-hidden",
          indeterminate ? "w-full after:absolute after:inset-0 after:bg-(image:--y2k-barber-shade) after:content-['']" : "bg-(image:--y2k-tone-progress)"
        )}
        style={indeterminate ? undefined : { width: `${Math.min(100, Math.max(0, value))}%` }}
      >
        {/* The moving layer is one period wider than the bar and slides by
            one period, so its motion stays on the compositor. */}
        {indeterminate ? (
          <span aria-hidden className="absolute inset-y-0 -left-8 right-0 bg-(image:--y2k-tone-barber) animate-[y2k-barber_1.07s_steps(32)_infinite] motion-reduce:animate-none" />
        ) : (
          !done && <span aria-hidden className="absolute inset-y-0 -left-4 right-0 bg-(image:--y2k-progress-ribs) animate-[y2k-ribs_0.53s_steps(16)_infinite] motion-reduce:animate-none" />
        )}
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  )
}

export { Progress }
