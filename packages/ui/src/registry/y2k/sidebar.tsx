/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Patina Window Sidebar — DESIGN.md › Components › Window › Source list.
 *
 * The Mac OS X Aqua "source list": the recessed white column down the left of a
 * Finder/iTunes/Mail window. Cross-verified against ryOS + the Figma Aqua design
 * system (see ~/Desktop/reports/y2k-aqua-window-fidelity-spec.md, tier C):
 *
 *   • 175px wide, WHITE (not pinstripe, not a grey card)
 *   • recessed: inset top-shadow + a bright inner rim on the top edge
 *   • a hairline --y2k-separator on the right edge, against the content pane
 *   • selected rows are full-bleed, square (radius 0), filled with the 3-stop
 *     --y2k-tone-list gradient so the highlight follows the active data-tone;
 *     white ink with a 1px dark text-shadow, exactly like real Aqua
 *   • group headers: 11px bold, sentence-case, secondary ink
 *
 * Row metrics (20px tall / 8px inset / 16px icon) aren't pinned by any surviving
 * Aqua reference; this is the compact 10.x Finder density Olivia chose.
 *
 *   <WindowSidebar>
 *     <WindowSidebarGroup label="Devices" />
 *     <WindowSidebarItem icon={…} selected>Patina HD</WindowSidebarItem>
 *     <WindowSidebarItem icon={…}>Applications</WindowSidebarItem>
 *   </WindowSidebar>
 */

/** The recessed white source-list column. */
function WindowSidebar({ className, style, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      data-slot="window-sidebar"
      className={cn(
        // 175px per the spec; white fill, never pinstripe. Recessed well with a
        // bright top rim, plus a hairline right edge against the content pane.
        "flex w-[176px] shrink-0 flex-col gap-px overflow-y-auto py-1",
        "border-r border-(--y2k-separator) bg-(--y2k-input-bg)",
        "shadow-[inset_0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.6)]",
        "font-(family-name:--y2k-font-ui)",
        className
      )}
      style={style}
      {...props}
    />
  )
}

/** A group header: 11px bold, sentence-case, secondary ink. */
function WindowSidebarGroup({
  className,
  label,
  ...props
}: React.ComponentProps<"div"> & { label: React.ReactNode }) {
  return (
    <div
      data-slot="window-sidebar-group"
      className={cn(
        "px-2 pt-2 pb-0.5 text-[11px] leading-none font-bold text-(--y2k-ink-secondary) select-none",
        className
      )}
      {...props}
    >
      {label}
    </div>
  )
}

type WindowSidebarItemProps = React.ComponentProps<"button"> & {
  icon?: React.ReactNode
  /** Highlighted with the active tone (the current source). */
  selected?: boolean
}

/** A source row. Full-bleed square selection filled with the tone gradient. */
function WindowSidebarItem({
  className,
  icon,
  selected = false,
  children,
  ...props
}: WindowSidebarItemProps) {
  return (
    <button
      type="button"
      data-slot="window-sidebar-item"
      data-selected={selected || undefined}
      aria-current={selected ? "true" : undefined}
      className={cn(
        // Square, full-width, 20px tall, 8px inset, 16px icon.
        "flex h-5 w-full cursor-default items-center gap-1.5 px-2 text-left outline-none",
        // The row's own height as the line height: the label is a flex item,
        // so its `truncate` clips to its line box, and at leading-none a
        // 12px line box cut off Lucida Grande's descenders.
        "text-[12px] leading-5 whitespace-nowrap",
        selected
          ? // Full-bleed 3-stop tone gradient + white ink w/ dark 1px shadow.
            "bg-(image:--y2k-tone-list) text-(--y2k-tone-selection-text) [text-shadow:0_1px_1px_rgba(0,0,0,0.3)]"
          : "text-(--y2k-ink) hover:bg-black/[0.05]",
        "outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:-outline-offset-3 focus-visible:outline-(--y2k-tone-focus)",
        className
      )}
      {...props}
    >
      {icon != null && (
        <span className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-full">
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
    </button>
  )
}

export { WindowSidebar, WindowSidebarGroup, WindowSidebarItem }
