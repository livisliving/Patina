"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { SearchField } from "@/components/ui/forms"
import { PopupButton } from "@/components/ui/popup"
import { SegmentedControl } from "@/components/ui/segmented"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { WindowScrollArea, WindowToolbar, WindowToolbarControl, WindowToolbarItem, WindowToolbarSeparator } from "@/components/ui/window"
import { WindowSidebar, WindowSidebarGroup, WindowSidebarItem } from "@/components/ui/window-sidebar"
import { cn } from "@/lib/utils"

import { ComputerIcon, FolderIcon } from "./icons"
import type { FinderItem } from "./disk"
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

export type FinderView = "icons" | "list" | "columns"
export type SortCol = "label" | "created" | "size" | "kind"
export type Sort = { col: SortCol; dir: "ascending" | "descending" } | null
export type Rect = { x: number; y: number; w: number; h: number }

/** A size as a number, for sorting: "155 KB" → 155, "—" → 0. */
const sizeNum = (s: string) => parseFloat(s) || 0

/** The items in a column's order: the site's, unless a header was clicked. */
function sorted(items: FinderItem[], sort: Sort) {
  if (!sort) return items
  const by = {
    label: (a: FinderItem, b: FinderItem) => a.label.localeCompare(b.label),
    created: (a: FinderItem, b: FinderItem) => a.created.localeCompare(b.created),
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

/** A file in a list: selects on click, opens on double-click or Enter, dims
 *  when disabled. Its first cell is the icon and the name; pass the rest. */
function FileRow({
  item,
  onSelect,
  onOpen,
  className,
  children,
  ...props
}: React.ComponentProps<typeof TableRow> & { item: FinderItem; onSelect: () => void; onOpen: () => void }) {
  return (
    <TableRow
      aria-disabled={item.disabled || undefined}
      onClick={() => !item.disabled && onSelect()}
      onOpen={item.disabled ? undefined : onOpen}
      className={cn("cursor-default aria-disabled:opacity-45", className)}
      {...props}
    >
      <TableCell>
        <span className="flex items-center gap-2">
          <span className="size-4 shrink-0 [&_svg]:size-full">{item.icon}</span>
          <FileName name={item.label} />
        </span>
      </TableCell>
      {children}
    </TableRow>
  )
}

/** A file's name that keeps its suffix when it must shorten: the end of the
 *  name gives way, never the `.rtf`. */
function FileName({ name }: { name: string }) {
  const dot = name.lastIndexOf(".")
  if (dot <= 0) return <span className="min-w-0 truncate">{name}</span>
  return (
    <span className="flex min-w-0" title={name}>
      <span className="truncate">{name.slice(0, dot)}</span>
      <span className="shrink-0">{name.slice(dot)}</span>
    </span>
  )
}

/** Triple-dot / left-chevron back glyph, as on the Aqua Finder Back button:
 *  a left chevron followed by two dots ( ‹•• ). */
const BackGlyph = () => (
  <svg viewBox="0 0 18 10" aria-hidden>
    <path d="M6 1L2 5l4 4" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="10.5" cy="5" r="1.15" fill="currentColor" />
    <circle cx="14.5" cy="5" r="1.15" fill="currentColor" />
  </svg>
)

/** A row in a Finder column: 20px tall, 16px icon, 12px label, and a
 *  disclosure triangle when it opens a further column. Aqua tints the
 *  selection only in the focused column and greys it everywhere else.
 *
 *  These three live at module scope on purpose: defined inside the Finder's
 *  render they became a new component type on every state change, React
 *  remounted the row between pointerdown and mouseup, and the click was lost. */
function ColumnRow({
  item,
  on,
  focused,
  chevron,
  volume,
  onSelect,
}: {
  item: FinderItem
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
      className={cn(
        "flex w-full cursor-default items-center gap-1 px-2 text-left text-[12px] outline-none",
        volume ? "h-10 gap-2" : "h-5",
        on && focused && "bg-(--y2k-tone-selection) text-(--y2k-tone-selection-text)",
        on && !focused && "bg-[#dedede]"
      )}
    >
      <span className={cn("shrink-0 [&_svg]:size-full", volume ? "size-8" : "size-4")}>{item.icon}</span>
      <span className="flex min-w-0 flex-1">
        <FileName name={item.label} />
      </span>
      {chevron && <DisclosureGlyph />}
    </button>
  )
}

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

/** Column widths are dragged, so they get their own bounds — both on the 4px
 *  grid, like every other layout value in the pack. */
const COLUMN_MIN = 96
const COLUMN_MAX = 320
const COLUMN = 176

/** The strip between two columns: a light bevel with the Aqua column-resize
 *  grip at its foot — and, as in the real Finder, the drag handle that sizes
 *  the column to its LEFT. Arrow keys nudge it by one grid step. */
function ColumnSplit({ width, onResize }: { width: number; onResize: (w: number) => void }) {
  const from = React.useRef<{ x: number; w: number } | null>(null)
  const clamp = (w: number) => Math.min(COLUMN_MAX, Math.max(COLUMN_MIN, Math.round(w / 4) * 4))

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize column"
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
        "relative w-2 shrink-0 cursor-col-resize touch-none bg-[linear-gradient(to_right,#d6d6d6,#e7e7e7,#f7f7f7)]",
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

/** The column view's disclosure triangle: a row that drills further right. */
const DisclosureGlyph = () => (
  <svg viewBox="0 0 6 8" width="6" height="8" className="shrink-0" aria-hidden>
    <path d="M1 0.5L5 4 1 7.5z" fill="currentColor" />
  </svg>
)
/* The three Finder view glyphs, traced off the 10.2 reference at 1× (its 2×
   pixels halved). They are OUTLINES, not solid shapes: icons = four 4px
   squares stroked 1px, 3px apart across and 2px down; list = four 1px bars,
   11 wide, on a 3px pitch; columns = a stroked 13 × 10 box split by two
   dividers at x4 and x8. All are 10px tall and black in both states. */
const GridGlyph = () => (
  <svg viewBox="0 0 11 10" width="11" height="10" shapeRendering="crispEdges" aria-hidden>
    <g fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="0.5" y="0.5" width="3" height="3" />
      <rect x="7.5" y="0.5" width="3" height="3" />
      <rect x="0.5" y="6.5" width="3" height="3" />
      <rect x="7.5" y="6.5" width="3" height="3" />
    </g>
  </svg>
)
const ListGlyph = () => (
  <svg viewBox="0 0 11 10" width="11" height="10" shapeRendering="crispEdges" aria-hidden>
    <path d="M0 0h11v1H0zM0 3h11v1H0zM0 6h11v1H0zM0 9h11v1H0z" fill="currentColor" />
  </svg>
)
const ColGlyph = () => (
  <svg viewBox="0 0 13 10" width="13" height="10" shapeRendering="crispEdges" aria-hidden>
    <g fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="0.5" y="0.5" width="12" height="9" />
      <path d="M4.5 0.5v9M8.5 0.5v9" />
    </g>
  </svg>
)

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
  // A phone has room for three columns; Kind goes.
  { col: "kind", label: "Kind", className: "w-32 max-sm:hidden" },
  { col: "size", label: "Size", className: "w-16" },
]

/** The Kinds a folder's items fall into, in the order they first come;
 *  none when fewer than two of its items' categories differ. */
export function kindsOf(items: FinderItem[]): string[] {
  const categories = new Set(items.flatMap((it) => (it.category ? [it.category] : [])))
  return categories.size < 2 ? [] : [...new Set(items.map((it) => it.kind))]
}

/** A folder's source list: its items by Kind, the picked one in the tone,
 *  each with its count. A phone has no room for the column, so there it is
 *  a pop-up over the files. */
function KindFilter({ items, kinds, value, onChange }: { items: FinderItem[]; kinds: string[]; value: string | null; onChange: (kind: string | null) => void }) {
  const rows = [
    { kind: null, label: `All items (${items.length})` },
    ...kinds.map((kind) => ({ kind, label: `${kind} (${items.filter((it) => it.kind === kind).length})` })),
  ]
  const current = rows.find((r) => r.kind === value) ?? rows[0]
  return (
    <>
      <WindowSidebar aria-label="Kind" className="max-sm:hidden">
        <WindowSidebarGroup label="Kind" />
        {rows.map((r) => (
          <WindowSidebarItem key={r.label} icon={<FolderIcon />} selected={r === current} onClick={() => onChange(r.kind)}>
            {r.label}
          </WindowSidebarItem>
        ))}
      </WindowSidebar>
      <div className="flex items-center gap-2 border-b border-(--y2k-separator) px-2 py-1 sm:hidden">
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
  // Its size when it first opens: 768 × 400, narrower or shorter on a small screen
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
  // Clicking a folder descends into it; clicking a file only selects it.
  const selectColumn = (depth: number, it: FinderItem) => {
    const next = [...path.slice(0, depth), it.label]
    if (it.contents) onNavigate(next)
    else onSelectPath(next)
  }

  return (
    <DesktopWindow
      win={win}
      // The window is named for the folder it shows, its icon before the
      // name, as 10.1 titles a Finder window.
      title={
        <>
          <span className="mr-1 inline-block size-4 align-middle [&_svg]:size-full">{here?.icon ?? <ComputerIcon />}</span>
          {here?.label ?? "Computer"}
        </>
      }
      material="metal"
      onToolbarToggle={onToolbarToggle}
      defaultSize={size}
      className="md:h-[400px] md:w-[768px]"
      status={narrowed ? `${visible.length} of ${hereItems.length} items` : `${hereItems.length} ${hereItems.length === 1 ? "item" : "items"}`}
      toolbar={
        toolbar && (
          <WindowToolbar className="flex-wrap">
            <WindowToolbarControl label="Back">
              <Button size="icon" aria-label="Back" disabled={!canGoBack} onClick={onBack} className="[&_svg]:h-2 [&_svg]:w-[13px]">
                <BackGlyph />
              </Button>
            </WindowToolbarControl>
            <WindowToolbarControl label="View">
              <SegmentedControl
                items={[
                  { label: "Icons", icon: <GridGlyph />, active: view === "icons", onClick: () => onView("icons") },
                  { label: "List", icon: <ListGlyph />, active: view === "list", onClick: () => onView("list") },
                  { label: "Columns", icon: <ColGlyph />, active: view === "columns", onClick: () => onView("columns") },
                ]}
              />
            </WindowToolbarControl>
            <WindowToolbarSeparator />
            {places.map((place) => (
              <WindowToolbarItem key={place.label} icon={place.icon} onClick={place.onClick}>
                {place.label}
              </WindowToolbarItem>
            ))}
            <WindowToolbarControl label="Search" className="order-last w-full sm:order-none sm:ml-auto sm:w-40">
              <SearchField ref={searchRef} value={query} onChange={onQuery} placeholder="" className="w-full" />
            </WindowToolbarControl>
          </WindowToolbar>
        )
      }
    >
      {/* A folder of several Kinds gets its source list at the left, in every view. */}
      <div className="flex min-h-0 flex-1 max-sm:flex-col">
        {kindFilter && <KindFilter items={hereItems} kinds={kindFilter.kinds} value={kindFilter.value} onChange={kindFilter.onChange} />}
        <WindowScrollArea viewportRef={viewportRef} className={cn("bg-white", view === "columns" && "overflow-hidden")}>
          {narrowed && visible.length === 0 ? (
            <p className="p-6 text-center text-[12px] text-(--y2k-ink-secondary)">{query.trim() ? <>No items match “{query}”.</> : "No items."}</p>
          ) : view === "columns" ? (
            // Aqua column view, rebuilt from the 10.2 reference. The FIRST
            // column lists volumes — double-height rows, 32px icons, a
            // disclosure arrow on every one — and each folder on the path
            // opens the next. Columns are 176px, parted by an 8px bevel
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
                        className={cn("cursor-default select-none", h.className)}
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
                        onSelect={() => onSelect(key)}
                        onOpen={() => onOpenItem(it, placePath)}
                        className="relative z-[2]"
                      >
                        <TableCell>{it.created}</TableCell>
                        <TableCell className="truncate max-sm:hidden">{it.kind}</TableCell>
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
            <div className="relative grid min-h-full grid-cols-3 content-start gap-y-3 p-3 select-none sm:grid-cols-4" {...rootProps}>
              <Band rect={band} z />
              {visible.map((it) => {
                const key = finderKey(placePath, it)
                return (
                  <button
                    key={it.label}
                    type="button"
                    data-select-item={key}
                    disabled={it.disabled}
                    aria-pressed={selected.has(key)}
                    onClick={() => !it.disabled && onSelect(key)}
                    onDoubleClick={() => onOpenItem(it, placePath)}
                    className="group relative z-[2] flex max-w-full cursor-default flex-col items-center gap-1 justify-self-center outline-none disabled:opacity-45"
                  >
                    <span className="size-12 [&_svg]:size-full">{it.icon}</span>
                    <span
                      className={cn(
                        "rounded-[3px] px-1.5 py-[1px] text-center text-[12px]",
                        // The light tone under black ink, the same in every tone.
                        selected.has(key) && "bg-(--y2k-tone-focus) text-(--y2k-ink)"
                      )}
                    >
                      {it.label}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </WindowScrollArea>
      </div>
    </DesktopWindow>
  )
}
