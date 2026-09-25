/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Patina Group — DESIGN.md › Components › Group box.
 *
 * The Aqua 10.0 group box — the theme's `.y2k-group`, as WindowGroup draws
 * it: a 1px #b6b6b6 rim with 5px corners around a faint grey well, and the
 * bold 12px caption set into the top border 20px in. This is Patina's answer
 * to a Card — there is NO neutral grey card. The caption is optional here.
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
      className={cn("y2k-group font-(family-name:--y2k-font-ui) text-[13px] text-(--y2k-ink)", className)}
      {...props}
    >
      {label != null && <legend>{label}</legend>}
      {children}
    </fieldset>
  )
}

export { Group }
