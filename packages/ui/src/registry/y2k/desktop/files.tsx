"use client"

import * as React from "react"
import { DropdownMenu as Menu } from "radix-ui"

import { Button } from "@/components/ui/button"
import { SearchField } from "@/components/ui/forms"
import { menuContentClass, menuItemClass } from "@/components/ui/popup"
import { SegmentedControl } from "@/components/ui/segmented"
import { TableCell, TableRow } from "@/components/ui/table"
import { WindowToolbar, WindowToolbarControl, WindowToolbarItem, WindowToolbarSeparator } from "@/components/ui/window"
import { cn } from "@/lib/utils"

import { MiddleTruncate } from "./middle-truncate"
import { Chevron, useToolbarFit } from "./toolbar-fit"

/**
 * A file as the Finder and the desktop draw it: a row in the list view, a row
 * in a column, an icon in the icon view, an icon on the desktop — and the
 * rubber band a drag draws over them, the strip that sizes a column, and the
 * Finder's toolbar with its glyphs. Here, apart from the Finder, so a desktop
 * of your own draws its files the same way without taking the whole Finder
 * with it.
 */

/** What these read of an item: a FinderItem (disk.tsx) or a desktop icon has more. */
export type FileItem = { label: string; icon: React.ReactNode; disabled?: boolean; onClick?: () => void }

export type Rect = { x: number; y: number; w: number; h: number }

export type FinderView = "icons" | "list" | "columns"

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
 *  It lives at module scope on purpose, as ColumnSplit and the Finder's
 *  ColumnInspector do: defined inside the Finder's render it became a new
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

/** Column widths are dragged, so they get their own bounds — both on the 4px
 *  grid, like every other layout value in the pack. */
const COLUMN_MIN = 96
const COLUMN_MAX = 320
/** A column's width until it is dragged. */
export const COLUMN = 176

/** The strip between two columns: a soft 12px shade, lightest where the next
 *  column starts, with the Aqua column-resize grip at its foot — and, as in
 *  the real Finder, the drag handle that sizes the column to its LEFT. Arrow
 *  keys nudge it by one grid step. */
export function ColumnSplit({ width, onResize }: { width: number; onResize: (w: number) => void }) {
  const from = React.useRef<{ x: number; w: number } | null>(null)
  const clamp = (w: number) => Math.min(COLUMN_MAX, Math.max(COLUMN_MIN, Math.round(w / 4) * 4))

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize column"
      aria-valuenow={width}
      aria-valuemin={COLUMN_MIN}
      aria-valuemax={COLUMN_MAX}
      tabIndex={0}
      onPointerDown={(e) => {
        from.current = { x: e.clientX, w: width }
        e.currentTarget.setPointerCapture(e.pointerId)
        e.preventDefault()
      }}
      onPointerMove={(e) => {
        if (!from.current) return
        onResize(clamp(from.current.w + (e.clientX - from.current.x)))
      }}
      onPointerUp={(e) => {
        from.current = null
        e.currentTarget.releasePointerCapture(e.pointerId)
      }}
      onPointerCancel={() => {
        from.current = null
      }}
      onKeyDown={(e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
        e.preventDefault()
        onResize(clamp(width + (e.key === "ArrowRight" ? 8 : -8)))
      }}
      className={cn(
        "relative w-3 shrink-0 cursor-col-resize touch-none bg-[linear-gradient(to_right,#e0e0e0,#ebebeb_35%,#f5f5f5_70%,#fcfcfc)]",
        // The pack's focus halo, same as every other focusable surface.
        "outline-none focus-visible:shadow-[0_0_0_3px_var(--y2k-tone-focus)]"
      )}
    >
      <span aria-hidden className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-[2px]">
        <span className="block h-2 w-px bg-black/35" />
        <span className="block h-2 w-px bg-black/35" />
      </span>
    </div>
  )
}

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

/** Triple-dot / left-chevron back glyph, as on the Aqua Finder Back button:
 *  a left chevron followed by two dots ( ‹•• ). */
export const BackGlyph = () => (
  <svg viewBox="0 0 18 10" aria-hidden>
    <path d="M6 1L2 5l4 4" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="10.5" cy="5" r="1.15" fill="currentColor" />
    <circle cx="14.5" cy="5" r="1.15" fill="currentColor" />
  </svg>
)

/* The three Finder view glyphs, traced off the 10.2 reference at 1× (its 2×
   pixels halved). They are OUTLINES, not solid shapes: icons = four 4px
   squares stroked 1px, 3px apart across and 2px down; list = four 1px bars,
   11 wide, on a 3px pitch; columns = a stroked 13 × 10 box split by two
   dividers at x4 and x8. All are 10px tall and black in both states. */
export const GridGlyph = () => (
  <svg viewBox="0 0 11 10" width="11" height="10" shapeRendering="crispEdges" aria-hidden>
    <g fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="0.5" y="0.5" width="3" height="3" />
      <rect x="7.5" y="0.5" width="3" height="3" />
      <rect x="0.5" y="6.5" width="3" height="3" />
      <rect x="7.5" y="6.5" width="3" height="3" />
    </g>
  </svg>
)
export const ListGlyph = () => (
  <svg viewBox="0 0 11 10" width="11" height="10" shapeRendering="crispEdges" aria-hidden>
    <path d="M0 0h11v1H0zM0 3h11v1H0zM0 6h11v1H0zM0 9h11v1H0z" fill="currentColor" />
  </svg>
)
export const ColGlyph = () => (
  <svg viewBox="0 0 13 10" width="13" height="10" shapeRendering="crispEdges" aria-hidden>
    <g fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="0.5" y="0.5" width="12" height="9" />
      <path d="M4.5 0.5v9M8.5 0.5v9" />
    </g>
  </svg>
)

/**
 * The Finder's toolbar: Back, the view control, the places, Search. Sized to
 * its window, as the 10.1 Finder's is: the search field gives up its width
 * (160px down to 96px), then goes; then the places go from the right into
 * the » menu at the end. Never a second row. Measured, not set at a
 * breakpoint: each place at its own width, with its label or (on a phone)
 * without, by useToolbarFit.
 */
export function FinderToolbar({
  canGoBack,
  onBack,
  view,
  onView,
  places,
  searchRef,
  query,
  onQuery,
}: {
  canGoBack: boolean
  onBack: () => void
  view: FinderView
  onView: (view: FinderView) => void
  places: { label: string; icon: React.ReactNode; onClick: () => void }[]
  searchRef: React.Ref<HTMLInputElement>
  query: string
  onQuery: (query: string) => void
}) {
  const { fit, barRef, rulerRef } = useToolbarFit()
  const shown = Math.min(fit.places, places.length)
  return (
    <WindowToolbar ref={barRef} className="relative overflow-hidden">
      <WindowToolbarControl data-fixed label="Back" className="shrink-0">
        <Button size="icon" aria-label="Back" disabled={!canGoBack} onClick={onBack} className="[&_svg]:h-2 [&_svg]:w-[13px]">
          <BackGlyph />
        </Button>
      </WindowToolbarControl>
      <WindowToolbarControl data-fixed label="View" className="shrink-0">
        <SegmentedControl
          items={[
            { label: "Icons", icon: <GridGlyph />, active: view === "icons", onClick: () => onView("icons") },
            { label: "List", icon: <ListGlyph />, active: view === "list", onClick: () => onView("list") },
            { label: "Columns", icon: <ColGlyph />, active: view === "columns", onClick: () => onView("columns") },
          ]}
        />
      </WindowToolbarControl>
      <WindowToolbarSeparator data-fixed />
      {places.slice(0, shown).map((place) => (
        <WindowToolbarItem key={place.label} icon={place.icon} onClick={place.onClick} className="shrink-0">
          {place.label}
        </WindowToolbarItem>
      ))}
      <WindowToolbarControl label="Search" className={cn("ml-auto w-40 min-w-24", !fit.search && "hidden")}>
        <SearchField ref={searchRef} value={query} onChange={onQuery} placeholder="" className="w-full" />
      </WindowToolbarControl>
      {shown < places.length && (
        <Menu.Root modal={false}>
          <Menu.Trigger asChild>
            <Chevron className="ml-auto" />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Content align="end" sideOffset={2} className={menuContentClass}>
              {places.slice(shown).map((place) => (
                <Menu.Item key={place.label} className={cn(menuItemClass, "justify-start gap-2 pl-2")} onSelect={place.onClick}>
                  <span className="size-4 shrink-0 [&_svg]:size-full">{place.icon}</span>
                  {place.label}
                </Menu.Item>
              ))}
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>
      )}
      {/* The ruler: the chevron and every place at its own width, out of
          sight, for useToolbarFit to measure. */}
      <div ref={rulerRef} aria-hidden inert className="pointer-events-none invisible absolute top-0 left-0 flex w-max">
        <Chevron tabIndex={-1} />
        {places.map((place) => (
          <WindowToolbarItem key={place.label} icon={place.icon} tabIndex={-1} className="shrink-0">
            {place.label}
          </WindowToolbarItem>
        ))}
      </div>
    </WindowToolbar>
  )
}

/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
