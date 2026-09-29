"use client"

import * as React from "react"

import { TableCell, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

import { MiddleTruncate } from "./middle-truncate"

/**
 * A file as the Finder and the desktop draw it: a row in the list view, a row
 * in a column, an icon in the icon view, an icon on the desktop — and the
 * rubber band a drag draws over them. Here, apart from the Finder, so a
 * desktop of your own draws its files the same way without taking the whole
 * Finder with it.
 */

/** What these read of an item: a FinderItem (disk.tsx) or a desktop icon has more. */
export type FileItem = { label: string; icon: React.ReactNode; disabled?: boolean; onClick?: () => void }

export type Rect = { x: number; y: number; w: number; h: number }

/** A file in a list: selects on click, opens on double-click or Enter, dims
 *  when disabled. Its first cell is the icon and the name; pass the rest. */
export function FileRow({
  item,
  onSelect,
  onOpen,
  className,
  children,
  ...props
}: React.ComponentProps<typeof TableRow> & { item: FileItem; onSelect: () => void; onOpen: () => void }) {
  return (
    <TableRow
      aria-disabled={item.disabled || undefined}
      onClick={() => !item.disabled && onSelect()}
      onOpen={item.disabled ? undefined : onOpen}
      className={cn("aria-disabled:opacity-45", className)}
      {...props}
    >
      {/* The name takes the width the other columns leave (max-w-0 keeps
          it from widening the table), 96px at least, and is cut from the
          middle to fit; narrower still, the list scrolls sideways. */}
      <TableCell className="w-full max-w-0 min-w-24">
        <span className="flex items-center gap-2">
          <span className="size-4 shrink-0 [&_svg]:size-full">{item.icon}</span>
          <MiddleTruncate text={item.label} lines={1} className="flex-1" />
        </span>
      </TableCell>
      {children}
    </TableRow>
  )
}

/** A row in a Finder column: 20px tall, 16px icon, 12px label, and a
 *  disclosure triangle when it opens a further column. Aqua tints the
 *  selection only in the focused column and greys it everywhere else.
 *
 *  It lives at module scope on purpose, as the Finder's ColumnInspector and
 *  ColumnSplit do: defined inside the Finder's render it became a new
 *  component type on every state change, React remounted the row between
 *  pointerdown and mouseup, and the click was lost. */
export function ColumnRow({
  item,
  on,
  focused,
  chevron,
  volume,
  onSelect,
}: {
  item: FileItem
  on: boolean
  focused: boolean
  chevron?: boolean
  /** Volume rows (the first column) are twice the height with twice the icon,
   *  as the reference draws them. */
  volume?: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onDoubleClick={item.onClick}
      onKeyDown={(e) => e.key === "Enter" && item.onClick?.()}
      className={cn(
        "flex w-full cursor-default items-center gap-1 px-2 text-left text-[12px] outline-none focus-visible:y2k-focus-ring focus-visible:-outline-offset-3",
        volume ? "h-10 gap-2" : "h-5",
        on && focused && "bg-(--y2k-tone-selection) text-(--y2k-tone-selection-text)",
        on && !focused && "bg-[#dedede]"
      )}
    >
      <span className={cn("shrink-0 [&_svg]:size-full", volume ? "size-8" : "size-4")}>{item.icon}</span>
      <MiddleTruncate text={item.label} lines={1} className="flex-1" />
      {chevron && <DisclosureGlyph />}
    </button>
  )
}

/** The column view's disclosure triangle: a row that drills further right. */
const DisclosureGlyph = () => (
  <svg viewBox="0 0 6 8" width="6" height="8" className="shrink-0" aria-hidden>
    <path d="M1 0.5L5 4 1 7.5z" fill="currentColor" />
  </svg>
)

/** A file in the icon view: its 48px icon over its name. Selects on click,
 *  opens on double-click or Enter, dims when disabled. Only the icon and the
 *  name answer a click (it is only as wide as its name, centred in its grid
 *  cell), so a drag from the rest of the cell draws the rubber band. */
export function FileIcon({
  item,
  selected,
  onSelect,
  onOpen,
  className,
  ...props
}: React.ComponentProps<"button"> & { item: FileItem; selected: boolean; onSelect: () => void; onOpen: () => void }) {
  return (
    <button
      type="button"
      disabled={item.disabled}
      aria-pressed={selected}
      onClick={() => !item.disabled && onSelect()}
      onDoubleClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && !item.disabled && onOpen()}
      className={cn(
        "group relative z-[2] flex max-w-full cursor-default flex-col items-center gap-1 justify-self-center outline-none focus-visible:y2k-focus-ring focus-visible:outline-offset-1 disabled:opacity-45",
        className
      )}
      {...props}
    >
      <span className="size-12 [&_svg]:size-full">{item.icon}</span>
      {/* Two lines at most, then cut from the middle, as the
          Finder cuts a name: the start and the suffix stay. */}
      <MiddleTruncate
        text={item.label}
        lines={2}
        className="w-full text-center"
        labelClassName={cn(
          "inline-block max-w-full rounded-[3px] px-1.5 py-[1px] text-[12px]",
          // The light tone under black ink, the same in every tone.
          selected && "bg-(--y2k-tone-focus) text-(--y2k-ink)"
        )}
      />
    </button>
  )
}

/** An icon on the desktop: its 56px icon, shadowed, over its name in white.
 *  Single click selects; double click, or Enter on the keyboard, opens. */
export function DesktopIcon({
  item,
  selected,
  onSelect,
  onOpen,
  className,
  ...props
}: React.ComponentProps<"button"> & { item: FileItem; selected: boolean; onSelect: () => void; onOpen: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      onDoubleClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className={cn(
        "group flex w-[84px] cursor-default flex-col items-center gap-0.5 outline-none focus-visible:y2k-focus-ring focus-visible:outline-offset-1",
        className
      )}
      {...props}
    >
      <span className="size-14 [&_svg]:size-full [&_svg]:drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]">{item.icon}</span>
      {/* Two lines at most, then cut from the middle, as in the Finder. */}
      <MiddleTruncate
        text={item.label}
        lines={2}
        className="w-full text-center"
        labelClassName={cn(
          "inline-block max-w-full rounded-[3px] px-1.5 py-[1px] text-[12px] text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]",
          selected && "bg-(--y2k-tone-selection)"
        )}
      />
    </button>
  )
}

/** The rubber-band selection rectangle drawn over a marquee surface. `z` lifts
 *  it above in-flow content (the Finder file grids); the desktop surface omits
 *  it. Renders nothing until a drag is in progress. */
export function Band({ rect, z }: { rect: Rect | null; z?: boolean }) {
  if (!rect) return null
  return (
    <div
      className={cn(
        "pointer-events-none absolute border border-(--y2k-tone-selection) bg-(--y2k-tone-selection)/20",
        z && "z-[1]"
      )}
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
    />
  )
}

/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
