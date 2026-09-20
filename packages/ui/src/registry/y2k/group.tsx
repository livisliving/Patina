"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Patina Group — DESIGN.md › Components › group boxes.
 *
 * The Aqua "group box": a faint rounded well with an inset hairline and a bold
 * 11px caption sitting on the top edge. This is Patina's answer to a Card —
 * there is NO neutral grey card; content is grouped in a sunken pinstripe-safe
 * well. (WindowGroup in window.tsx is the same box scoped to a dialog; this is
 * the standalone registry component for use anywhere.)
 *
 *   <Group label="Appearance"> … </Group>
 */
function Group({
  className,
  label,
  children,
  ...props
}: React.ComponentProps<"fieldset"> & { label?: React.ReactNode }) {
  return (
    <fieldset
      data-slot="group"
      className={cn(
        // control radius (5–6px), faint sunken fill, inset hairline + top rim.
        "min-w-0 rounded-[8px] bg-black/[0.04] px-3 pt-2 pb-3",
        "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]",
        "font-(family-name:--y2k-font-ui) text-[13px] leading-[1.45] text-(--y2k-ink)",
        className
      )}
      {...props}
    >
      {label != null && (
        <legend className="px-1 text-[11px] font-bold text-(--y2k-ink)">{label}</legend>
      )}
      {children}
    </fieldset>
  )
}

export { Group }
