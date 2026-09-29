"use client"

import * as React from "react"

import { PopupButton } from "@/components/ui/popup"
import { Table, TableBody, TableCell, TableHead, TableHeader } from "@/components/ui/table"
import { WindowScrollArea } from "@/components/ui/window"
import { WindowSidebar, WindowSidebarGroup, WindowSidebarItem } from "@/components/ui/window-sidebar"
import { cn } from "@/lib/utils"

import { ComputerIcon, FolderIcon } from "./icons"
import type { FinderItem } from "./disk"
import { Band, COLUMN, ColumnRow, ColumnSplit, FileIcon, FileRow, FinderToolbar, type FinderView, type Rect } from "./files"
import { dateValue } from "./names"
import { DESKTOP, useMediaQuery } from "./use-media-query"
import { DesktopWindow, type WinEntry } from "./windows"

/**
 * The Finder: a brushed-metal window titled after the folder it shows, the
 * 10.1 toolbar (Back, the view control, the places, Search), and the three
 * views — icons, list, columns — over the disk in disk.tsx. In a folder
 * whose items carry two categories or more, a source list at the left
 * filters them by Kind, in every view. Its
 * place, its selection and that filter belong to the desktop (the menus
 * need them); its column widths and the strip's scrolling are its own.
 */

export type SortCol = "label" | "created" | "size" | "kind"
export type Sort = { col: SortCol; dir: "ascending" | "descending" } | null

/** A size as a number, for sorting: "155 KB" → 155, "—" → 0. */
const sizeNum = (s: string) => parseFloat(s) || 0

/** The items in a column's order: the site's, unless a header was clicked. */
function sorted(items: FinderItem[], sort: Sort) {
  if (!sort) return items
  const by = {
    label: (a: FinderItem, b: FinderItem) => a.label.localeCompare(b.label),
    // By the date, not its words ("9 Apr" after "10 Mar"); undated last.
    created: (a: FinderItem, b: FinderItem) => {
      const [x, y] = [dateValue(a.created), dateValue(b.created)]
      if (Number.isNaN(x) || Number.isNaN(y)) return Number.isNaN(x) === Number.isNaN(y) ? a.created.localeCompare(b.created) : Number.isNaN(x) ? 1 : -1
      return x - y
    },
    size: (a: FinderItem, b: FinderItem) => sizeNum(a.size) - sizeNum(b.size),
    kind: (a: FinderItem, b: FinderItem) => a.kind.localeCompare(b.kind),
  }[sort.col]
  const out = [...items].sort(by)
  return sort.dir === "ascending" ? out : out.reverse()
}

/** Does the search find it: its name, its Kind, or one of its keywords. */
const finds = (it: FinderItem, q: string) => [it.label, it.kind, ...(it.keywords ?? [])].some((s) => s.toLowerCase().includes(q))

/** Where the Finder is, worked out from its path: the chain of items the
 *  path goes through, the folder the icon and list views show (the path,
 *  less a file it ends on), that folder's items, and the ones on show —
 *  those the search finds, of the Kind the sidebar picked (if it did). */
export function resolveFinder(volumes: FinderItem[], path: string[], query: string, sort: Sort, kind: string | null = null) {
  // The path, walked down from Computer; a label no longer there ends it.
  const chain: FinderItem[] = []
  let level: FinderItem[] | undefined = volumes
  for (const label of path) {
    const it: FinderItem | undefined = level?.find((c) => c.label === label)
    if (!it) break
    chain.push(it)
    level = it.contents
  }
  const place = chain.at(-1)?.contents ? chain : chain.slice(0, -1)
  const placePath = place.map((it) => it.label)
  const here = place.at(-1)
  const hereItems = here?.contents ?? volumes
  const q = query.trim().toLowerCase()
  const matching = hereItems.filter((it) => (!q || finds(it, q)) && (!kind || it.kind === kind))
  return { chain, place, placePath, here, hereItems, visible: sorted(matching, sort), q, narrowed: !!q || !!kind }
}

/** A Finder item's selection key: the folder it is in and its name, so a
 *  selection made in one folder means nothing in another. */
export const finderKey = (placePath: string[], it: FinderItem) => `finder:${placePath.join("/")}/${it.label}`

/* ── Parts ────────────────────────────────────────────────────────── */

/** The last column: a 128px icon over plain "Label: value" lines, left-aligned
 *  — the reference prints them as running text, not as a label grid. An
 *  entry's own `info` lines follow (its date is its Created), then its
 *  comment, as Show Info's Comments. */
function ColumnInspector({ item }: { item: FinderItem }) {
  return (
    <div data-finder-column className="flex w-44 shrink-0 flex-col items-center overflow-y-auto px-3 pt-6 pb-3">
      <span className="size-32 shrink-0 [&_svg]:size-full">{item.icon}</span>
      <div className="mt-4 w-full space-y-1 text-[12px] leading-[1.35]">
        <p className="break-words">Name: {item.label}</p>
        <p>Kind: {item.kind}</p>
        <p>Size: {item.size}</p>
        <p>Created: {item.created}</p>
        {item.info?.map((i) => (
          <p key={i.label} className="break-words">
            {i.label}: {i.value}
          </p>
        ))}
        {item.comment && (
          <p data-comment className="break-words">
            Comments: {item.comment}
          </p>
        )}
      </div>
    </div>
  )
}

/* ── The window ───────────────────────────────────────────────────── */

/** The list's columns: Name takes whatever the others leave. Each of those
 *  is as wide as its longest line (measured in Lucida Grande 12px) plus the
 *  cell's 8px either side — and, for its header, the sort triangle's 8px —
 *  on the 4px grid: "Date Created" 76 → 100, "TextEdit document" 111 → 128,
 *  "155 KB" 42 → 64. The table is fixed-layout, so a long name shortens
 *  (keeping its suffix) instead of pushing the columns about. */
const HEADERS: { col: SortCol; label: string; className?: string }[] = [
  { col: "label", label: "Name" },
  { col: "created", label: "Date Created", className: "w-[100px]" },
  // A Finder under 600px wide has room for three columns; Kind goes.
  { col: "kind", label: "Kind", className: "w-32 @max-[600px]/finder:hidden" },
  { col: "size", label: "Size", className: "w-16" },
]

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

type FinderProps = {
  win: WinEntry
  volumes: FinderItem[]
  /** Where the Finder is, worked out by resolveFinder from the desktop's path. */
  at: ReturnType<typeof resolveFinder>
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
  places: { label: string; icon: React.ReactNode; onClick: () => void }[]
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
  const { chain, placePath, here, hereItems, visible, narrowed } = at
  // A phone, or any screen without a pointer that hovers (a touch screen):
  // a tap opens a file, as a double-click does with a mouse — there is no
  // double-tap to find out about.
  const tapOpens = useMediaQuery(`not all and ${DESKTOP}, (hover: none)`)
  // A click in the list or icon view: select the item, and open it too
  // where a tap is the only click there is.
  const choose = (key: string, it: FinderItem) => {
    onSelect(key)
    if (tapOpens) onOpenItem(it, placePath)
  }
  // Its size when it first opens: 640 × 400, narrower or shorter on a small screen
  // (see loadLayout).
  const [size] = React.useState(initialSize)

  // Column widths by depth, dragged by the strips between them; a column not
  // yet dragged is 176.
  const [columnWidths, setColumnWidths] = React.useState<number[]>([])
  // A drag fires per pointer move, but `clamp` snaps to the 4px grid, so most
  // moves resolve to the width already set — returning `prev` unchanged lets
  // React skip the re-render.
  const setColumnWidth = React.useCallback(
    (i: number, w: number) =>
      setColumnWidths((prev) => {
        if (prev[i] === w) return prev
        const next = [...prev]
        next[i] = w
        return next
      }),
    []
  )
  // Opening a folder pushes a column past the window's width; the Finder
  // scrolls the strip so the newest one shows whole, at the right. Not to the
  // very end: the empty column after it would push the first one off a phone.
  const viewportRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = viewportRef.current
    const newest = el?.querySelectorAll("[data-finder-column]")
    const last = newest?.[newest.length - 1]
    if (!el || view !== "columns" || !last) return
    el.scrollLeft = Math.max(0, last.getBoundingClientRect().right - el.getBoundingClientRect().left + el.scrollLeft - el.clientWidth)
  }, [view, path])

  // The column view: the volumes, then a column for each folder on the path,
  // marking the row the path goes through. The focused column is the deepest,
  // where the last click landed; a file at the end of the path gets the
  // inspector.
  const columns = [
    { items: volumes, on: chain[0]?.label, volume: true },
    ...chain.flatMap((it, i) =>
      it.contents ? [{ items: it === here ? visible : it.contents, on: chain[i + 1]?.label, volume: false }] : []
    ),
  ]
  // …or a folder with a comment, after its contents, where the column view
  // otherwise leaves an empty one: the folder's own line has a place to be read.
  const last = chain.at(-1)
  const columnShown = !last?.contents || (chain.length > 1 && last.comment) ? last : undefined
  // Clicking a folder descends into it; clicking a file selects it (and, on
  // a touch screen, opens it).
  const selectColumn = (depth: number, it: FinderItem) => {
    const next = [...path.slice(0, depth), it.label]
    if (it.contents) onNavigate(next)
    else {
      onSelectPath(next)
      if (tapOpens) it.onClick?.()
    }
  }

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
          view. The Finder lays itself out by its own width, not the
          screen's: under 600px (a phone, a phone on its side, a tablet's
          narrower window, one dragged narrow) the Kind sidebar becomes a
          pop-up over the files and the Kind column goes, so the names keep
          their room. */}
      <div className="@container/finder flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 @max-[600px]/finder:flex-col">
          {kindFilter && <KindFilter items={hereItems} kinds={kindFilter.kinds} value={kindFilter.value} onChange={kindFilter.onChange} />}
          <WindowScrollArea viewportRef={viewportRef} className={cn("bg-white", view === "columns" && "overflow-hidden")}>
            {narrowed && visible.length === 0 ? (
              <p className="p-6 text-center text-[12px] text-(--y2k-ink-secondary)">{query.trim() ? <>No items match “{query}”.</> : "No items."}</p>
            ) : view === "columns" ? (
              // Aqua column view, rebuilt from the 10.2 reference. The FIRST
              // column lists volumes — double-height rows, 32px icons, a
              // disclosure arrow on every one — and each folder on the path
              // opens the next. Columns are 176px, parted by a 12px shade
              // with a grip at its foot; the strip scrolls sideways once the
              // path runs past the window, as the real Finder does.
              <div className="flex min-h-full w-max min-w-full">
                {columns.map((col, depth) => (
                  <React.Fragment key={depth}>
                    <div data-finder-column className="shrink-0 overflow-y-auto py-1" style={{ width: columnWidths[depth] ?? COLUMN }}>
                      {col.items.map((it) => (
                        <ColumnRow
                          key={it.label}
                          item={it}
                          volume={col.volume}
                          on={col.on === it.label}
                          focused={depth === chain.length - 1}
                          chevron={it.contents !== undefined}
                          onSelect={() => selectColumn(depth, it)}
                        />
                      ))}
                    </div>
                    <ColumnSplit width={columnWidths[depth] ?? COLUMN} onResize={(w) => setColumnWidth(depth, w)} />
                  </React.Fragment>
                ))}
                {columnShown && <ColumnInspector item={columnShown} />}
                {/* The reference pads the rest of the width with an empty
                    column, ready for the next level. */}
                <div className="w-44 min-w-0 flex-1 border-l border-black/10" />
              </div>
            ) : view === "list" ? (
              // Aqua list view: the pack's Table — the list header, 12px
              // rows, every other row pale blue, the selection in the tone.
              // A click on a header sorts by it; another turns it round.
              <div className="relative min-h-full select-none" {...rootProps}>
                <Band rect={band} z />
                <Table className="table-fixed">
                  <TableHeader>
                    <tr>
                      {HEADERS.map((h) => (
                        <TableHead
                          key={h.col}
                          sorted={sort?.col === h.col ? sort.dir : undefined}
                          onClick={() => onSort(h.col)}
                          className={cn("select-none", h.className)}
                        >
                          {h.label}
                        </TableHead>
                      ))}
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {visible.map((it) => {
                      const key = finderKey(placePath, it)
                      return (
                        <FileRow
                          key={it.label}
                          item={it}
                          data-select-item={key}
                          selected={selected.has(key)}
                          onSelect={() => choose(key, it)}
                          onOpen={() => onOpenItem(it, placePath)}
                          className="relative z-[2]"
                        >
                          <TableCell>{it.created}</TableCell>
                          <TableCell className="truncate @max-[600px]/finder:hidden">{it.kind}</TableCell>
                          <TableCell>{it.size}</TableCell>
                        </FileRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              // A drag from anywhere that is not an icon or its name — the
              // padding, the gaps, the sides of a cell, the space under the
              // last row — draws the rubber band (an icon is only as wide as
              // its name, centred in its cell, so the rest of the cell is free).
              <div className="relative grid min-h-full grid-cols-3 content-start gap-y-3 p-3 select-none @min-[600px]/finder:grid-cols-4" {...rootProps}>
                <Band rect={band} z />
                {visible.map((it) => {
                  const key = finderKey(placePath, it)
                  return (
                    <FileIcon
                      key={it.label}
                      item={it}
                      data-select-item={key}
                      selected={selected.has(key)}
                      onSelect={() => choose(key, it)}
                      onOpen={() => onOpenItem(it, placePath)}
                    />
                  )
                })}
              </div>
            )}
          </WindowScrollArea>
        </div>
      </div>
    </DesktopWindow>
  )
}

/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
