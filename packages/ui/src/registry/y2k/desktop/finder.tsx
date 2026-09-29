"use client"

import * as React from "react"

import { PopupButton } from "@/components/ui/popup"
import { WindowSidebar, WindowSidebarGroup, WindowSidebarItem } from "@/components/ui/window-sidebar"

import { ComputerIcon, FolderIcon } from "./icons"
import type { FinderItem } from "./disk"
import { FinderToolbar, type FinderView, type Place } from "./files"
import { FinderBody, type FinderPlace, type Sort, type SortCol } from "./finder-body"
import type { Rect } from "./use-marquee-select"
import { DesktopWindow, type WinEntry } from "./windows"

/**
 * The Finder: a brushed-metal window titled after the folder it shows, the
 * 10.1 toolbar (Back, the view control, the places, Search), and the three
 * views — icons, list, columns — over the disk in disk.tsx, drawn by
 * finder-body.tsx. In a folder whose items carry two categories or more, a
 * source list at the left filters them by Kind, in every view. Its place,
 * its selection and that filter belong to the desktop (the menus need
 * them); its column widths and the strip's scrolling are its own.
 */

// Where they were before finder-body.tsx, for a desktop.tsx of your own.
export { finderKey, resolveFinder, type Sort, type SortCol } from "./finder-body"

/* ── Parts ────────────────────────────────────────────────────────── */

/** The Kinds a folder's items fall into, in the order they first come;
 *  none when fewer than two of its items' categories differ. */
export function kindsOf(items: FinderItem[]): string[] {
  const categories = new Set(items.flatMap((it) => (it.category ? [it.category] : [])))
  return categories.size < 2 ? [] : [...new Set(items.map((it) => it.kind))]
}

/** A folder's source list: its items by Kind, the picked one in the tone,
 *  each with its count. A Finder under 600px wide has no room for the
 *  column, so there it is a pop-up over the files. */
function KindFilter({ items, kinds, value, onChange }: { items: FinderItem[]; kinds: string[]; value: string | null; onChange: (kind: string | null) => void }) {
  const rows = [
    { kind: null, label: `All items (${items.length})` },
    ...kinds.map((kind) => ({ kind, label: `${kind} (${items.filter((it) => it.kind === kind).length})` })),
  ]
  const current = rows.find((r) => r.kind === value) ?? rows[0]
  return (
    <>
      <WindowSidebar aria-label="Kind" className="@max-[600px]/finder:hidden">
        <WindowSidebarGroup label="Kind" />
        {rows.map((r) => (
          <WindowSidebarItem key={r.label} icon={<FolderIcon />} selected={r === current} onClick={() => onChange(r.kind)}>
            {r.label}
          </WindowSidebarItem>
        ))}
      </WindowSidebar>
      <div className="flex items-center gap-2 border-b border-(--y2k-separator) px-2 py-1 @min-[600px]/finder:hidden">
        <span className="text-[12px]">Kind:</span>
        <PopupButton
          aria-label="Kind"
          value={current.label}
          options={rows.map((r) => r.label)}
          onChange={(label) => onChange(rows.find((r) => r.label === label)?.kind ?? null)}
        />
      </div>
    </>
  )
}

/* ── The window ───────────────────────────────────────────────────── */

type FinderProps = {
  win: WinEntry
  volumes: FinderItem[]
  /** Where the Finder is, worked out by resolveFinder from the desktop's path. */
  at: FinderPlace
  path: string[]
  canGoBack: boolean
  onBack: () => void
  /** Go somewhere (leaving the place for Back); set the path without that
   *  (the column view picking a file). */
  onNavigate: (path: string[]) => void
  onSelectPath: (path: string[]) => void
  view: FinderView
  onView: (view: FinderView) => void
  toolbar: boolean
  onToolbarToggle: () => void
  query: string
  onQuery: (query: string) => void
  searchRef: React.Ref<HTMLInputElement>
  sort: Sort
  onSort: (col: SortCol) => void
  /** The folder's Kind filter; null where its items have one category or none. */
  kindFilter: { kinds: string[]; value: string | null; onChange: (kind: string | null) => void } | null
  selected: Set<string>
  onSelect: (key: string) => void
  /** The Finder's own rubber band, scoped to its files. */
  band: Rect | null
  rootProps: React.ComponentProps<"div">
  /** Open an item as a double-click does; `at` is the folder it sits in. */
  onOpenItem: (item: FinderItem, at: string[]) => void
  /** The toolbar's places, after the separator. */
  places: Place[]
  /** Its size when it first opens (context.tsx's loadLayout). */
  initialSize: () => { w: number; h: number }
}

export function Finder({
  win,
  volumes,
  at,
  path,
  canGoBack,
  onBack,
  onNavigate,
  onSelectPath,
  view,
  onView,
  toolbar,
  onToolbarToggle,
  query,
  onQuery,
  searchRef,
  sort,
  onSort,
  kindFilter,
  selected,
  onSelect,
  band,
  rootProps,
  onOpenItem,
  places,
  initialSize,
}: FinderProps) {
  const { here, hereItems, visible, narrowed } = at
  // Its size when it first opens: 640 × 400, narrower or shorter on a small screen
  // (see loadLayout).
  const [size] = React.useState(initialSize)

  return (
    <DesktopWindow
      win={win}
      // The window is named for the folder it shows, its icon before the
      // name, as 10.1 titles a Finder window.
      title={
        // A row, so the icon is centred on the title bar, as the name's
        // capitals are (`align-middle` centres it on the x-height instead,
        // a pixel low); the name alone gives way to an ellipsis.
        <span className="flex h-full items-center gap-1">
          <span className="size-4 shrink-0 [&_svg]:size-full">{here?.icon ?? <ComputerIcon />}</span>
          <span className="truncate">{here?.label ?? "Computer"}</span>
        </span>
      }
      material="metal"
      onToolbarToggle={onToolbarToggle}
      defaultSize={size}
      // Its load-time size before the page wakes (the window's `place`),
      // else 640 × 400; the px of `size` take over once awake.
      className="desk:h-[var(--win-h,400px)] desk:w-[var(--win-w,640px)]"
      status={narrowed ? `${visible.length} of ${hereItems.length} items` : `${hereItems.length} ${hereItems.length === 1 ? "item" : "items"}`}
      toolbar={
        toolbar && (
          <FinderToolbar
            canGoBack={canGoBack}
            onBack={onBack}
            view={view}
            onView={onView}
            places={places}
            searchRef={searchRef}
            query={query}
            onQuery={onQuery}
          />
        )
      }
    >
      {/* A folder of several Kinds gets its source list at the left, in every
          view: under 600px, a pop-up over the files. */}
      <FinderBody
        volumes={volumes}
        at={at}
        path={path}
        onNavigate={onNavigate}
        onSelectPath={onSelectPath}
        view={view}
        query={query}
        sort={sort}
        onSort={onSort}
        selected={selected}
        onSelect={onSelect}
        band={band}
        rootProps={rootProps}
        onOpenItem={onOpenItem}
        sidebar={kindFilter && <KindFilter items={hereItems} kinds={kindFilter.kinds} value={kindFilter.value} onChange={kindFilter.onChange} />}
      />
    </DesktopWindow>
  )
}

/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
