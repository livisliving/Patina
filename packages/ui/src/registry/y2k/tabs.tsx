"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Patina Tabs — DESIGN.md › Components › Tabs.
 *
 * A white gel segmented control: a pill-shaped track of segments, the selected
 * one filled with the tone gel (white ink), the rest white gel. Same visual
 * language as the toolbar segmented buttons.
 *
 *   <Tabs defaultValue="a">
 *     <TabsList><TabsTrigger value="a">A</TabsTrigger>…</TabsList>
 *     <TabsContent value="a">…</TabsContent>
 *   </Tabs>
 */

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-3", className)} {...props} />
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        // The segmented track: a white gel pill with a hairline + gloss.
        "inline-flex h-[22px] items-stretch overflow-hidden rounded-full p-px",
        "bg-(image:--y2k-gel-white) shadow-(--y2k-popup-shadow)",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative flex cursor-default items-center justify-center rounded-full px-3 outline-none",
        "font-(family-name:--y2k-font-ui) text-[12px] text-(--y2k-ink) select-none",
        // Selected segment: tone gel fill, white ink, gloss cap.
        "data-[state=active]:bg-(image:--y2k-tone-button) data-[state=active]:text-white",
        "data-[state=active]:shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_0_0_0.5px_var(--y2k-tone-button-edge)]",
        "data-[state=active]:[text-shadow:0_1px_1px_rgba(0,0,0,0.3)]",
        "focus-visible:ring-2 focus-visible:ring-(--y2k-tone-focus) active:brightness-95",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("font-(family-name:--y2k-font-ui) text-[13px] text-(--y2k-ink) outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
