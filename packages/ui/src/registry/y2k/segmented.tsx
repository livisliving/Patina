"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Patina segmented control — DESIGN.md › Components › Segmented control.
 *
 * Aqua 10.0 (Finder's View control): 20px of face with 4px round ends and a
 * soft shadow hanging 4px below; segments 9px either side of 11px text, at
 * least 25px (an icon segment is exactly 25), parted by a 1px divider that
 * fades dark → light down its height. Unselected = the white rows; selected =
 * the tone control rows, its glyph staying black.
 *
 * Each item is independent (aria-pressed), so the same control serves a
 * one-of-many choice (Finder's View) and free toggles (Bold / Italic): the
 * caller decides which items are `active`.
 */

type Segment = {
  /** Accessible name; also the visible text when there is no `icon`. */
  label: string
  icon?: React.ReactNode
  active?: boolean
  disabled?: boolean
  onClick?: () => void
}

function SegmentedControl({ items, className, ...props }: Omit<React.ComponentProps<"div">, "children"> & { items: Segment[] }) {
  return (
    <div
      role="group"
      data-slot="segmented-control"
      className={cn(
        "inline-flex h-(--y2k-segment-h) overflow-hidden rounded-[4px]",
        "shadow-[0_1px_0.5px_rgba(0,0,0,0.5),0_2px_1.5px_rgba(0,0,0,0.2),0_-1px_1px_rgba(0,0,0,0.05)]",
        className
      )}
      {...props}
    >
      {items.map((it) => (
          <button
            key={it.label}
            type="button"
            aria-label={it.icon ? it.label : undefined}
            aria-pressed={it.active}
            disabled={it.disabled}
            onClick={it.onClick}
            className={cn(
              "relative flex h-full cursor-default items-center justify-center gap-1 outline-none",
              it.icon ? "w-(--y2k-segment-w) px-0" : "min-w-(--y2k-segment-w) px-[9px]",
              "font-(family-name:--y2k-font-ui) text-[11px] text-black",
              // The fill; the round ends' rim; the divider down all but the last.
              it.active
                ? "bg-(image:--y2k-tone-control) active:bg-[image:var(--y2k-gel-pressed),var(--y2k-tone-control)] [--rim:color-mix(in_srgb,var(--y2k-tone-control-edge)_70%,transparent)]"
                : "bg-(image:--y2k-segment-white) active:bg-(image:--y2k-segment-pressed) [--rim:rgba(0,0,0,0.16)]",
              "first:shadow-[inset_1px_0_0_var(--rim)] last:shadow-[inset_-1px_0_0_var(--rim)]",
              "not-last:after:absolute not-last:after:inset-y-0 not-last:after:right-0 not-last:after:w-px not-last:after:bg-(image:--y2k-segment-divider) not-last:after:content-['']",
              "disabled:text-(--y2k-ink-disabled) disabled:[&_svg]:opacity-50",
              "focus-visible:z-[2] focus-visible:outline-3 focus-visible:outline-solid focus-visible:-outline-offset-3 focus-visible:outline-(--y2k-tone-focus)",
              "[&_svg]:h-2.5 [&_svg]:w-auto [&_svg]:text-black"
            )}
          >
            <span className="relative z-[1]">{it.icon ?? it.label}</span>
          </button>
      ))}
    </div>
  )
}

export { SegmentedControl, type Segment }

/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
