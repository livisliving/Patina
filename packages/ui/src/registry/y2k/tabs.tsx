"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Patina Tabs — DESIGN.md › Components › Tabs.
 *
 * Aqua 10.0 folder tabs: 24px tabs with 7px top corners standing on a
 * pinstriped panel (1px #9a9a9a rim, 5px corners, 12px padding). An
 * unselected tab is the white push-button fill; the selected one is the light
 * tone tab gel with a dark rim — and BLACK ink, which the original's white
 * label on that light gel does not give (it fails WCAG AA).
 *
 *   <Tabs defaultValue="a">
 *     <TabsList><TabsTrigger value="a">A</TabsTrigger>…</TabsList>
 *     <TabsContent value="a">…</TabsContent>
 *   </Tabs>
 */

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col", className)} {...props} />
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("relative z-[1] flex items-end pl-[10px]", className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative flex h-(--y2k-tab-h) cursor-default items-center justify-center rounded-t-[7px] px-4 outline-none",
        "font-(family-name:--y2k-font-ui) text-[13px] whitespace-nowrap text-(--y2k-ink) select-none",
        "bg-(image:--face) shadow-[inset_0_0_0_1px_var(--rim)] active:bg-[image:var(--y2k-gel-pressed),var(--face)]",
        "[--face:var(--y2k-gel-white)] [--rim:#8a8a8a]",
        "data-[state=active]:[--face:var(--y2k-tone-tab)] data-[state=active]:[--rim:var(--y2k-tone-tab-edge)]",
        "disabled:text-(--y2k-ink-disabled)",
        "focus-visible:outline-3 focus-visible:outline-solid focus-visible:-outline-offset-3 focus-visible:outline-(--y2k-tone-focus)",
        className
      )}
      {...props}
    />
  )
}

/** The panel the tabs stand on. */
function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "rounded-[5px] border border-[#9a9a9a] bg-(image:--y2k-pinstripe) p-3",
        "font-(family-name:--y2k-font-ui) text-[13px] text-(--y2k-ink) outline-none",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }

/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
