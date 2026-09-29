"use client"

import * as React from "react"

import { Table, TableBody, TableCell, TableHead, TableHeader } from "@/components/ui/table"
import { WindowScrollArea } from "@/components/ui/window"
import { cn } from "@/lib/utils"

import type { FinderItem } from "./disk"
import { Band, COLUMN, ColumnRow, ColumnSplit, FileIcon, FileRow, type FinderView } from "./files"
import type { Rect } from "./use-marquee-select"
import { dateValue } from "./names"
import { DESKTOP, useMediaQuery } from "./use-media-query"

/**
 * What a Finder window shows, without the window: the three views — icons,
 * list, columns — over a disk of FinderItems, with the columns' widths and
 * the strip's scrolling, and the paths, the search and the order that pick
 * what is on show. Here, apart from the window, so a desktop of your own
 * puts the Finder's files in a window of its own; finder.tsx puts them in
 * the pack's.
 */

export type SortCol = "label" | "created" | "size" | "kind"
export type Sort = { col: SortCol; dir: "ascending" | "descending" } | null

/** A click on a header: sort by it, or turn it round if it sorts already. */
export const toggleSort = (sort: Sort, col: SortCol): Sort =>
  sort?.col === col ? { col, dir: sort.dir === "ascending" ? "descending" : "ascending" } : { col, dir: "ascending" }

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

/** Two Finder paths to the same place. */
export const samePath = (a: string[], b: string[]) => a.length === b.length && a.every((label, i) => label === b[i])

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

export type FinderPlace = ReturnType<typeof resolveFinder>

/** A Finder item's selection key: the folder it is in and its name, so a
 *  selection made in one folder means nothing in another. */
export const finderKey = (placePath: string[], it: FinderItem) => `finder:${placePath.join("/")}/${it.label}`

/** What the last column says of an item: its name, Kind, size and date,
 *  then its entry's own `info` lines (a Version, a Client), then its
 *  comment, as Show Info's Comments. */
export const inspectorLines = (it: FinderItem) => [
  { label: "Name", value: it.label },
  { label: "Kind", value: it.kind },
  { label: "Size", value: it.size },
  { label: "Created", value: it.created },
  ...(it.info ?? []),
  ...(it.comment ? [{ label: "Comments", value: it.comment }] : []),
]

/** The last column: a 128px icon over plain "Label: value" lines, left-aligned
 *  — the reference prints them as running text, not as a label grid. */
function ColumnInspector({ icon, lines }: { icon: React.ReactNode; lines: { label: string; value: string }[] }) {
  return (
    <div data-finder-column className="flex w-44 shrink-0 flex-col items-center overflow-y-auto px-3 pt-6 pb-3">
      <span className="size-32 shrink-0 [&_svg]:size-full">{icon}</span>
      <div className="mt-4 w-full space-y-1 text-[12px] leading-[1.35]">
        {lines.map((line, i) => (
          <p key={`${i}-${line.label}`} className="break-words">
            {line.label}: {line.value}
          </p>
        ))}
      </div>
    </div>
  )
}

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

type FinderBodyProps = {
  volumes: FinderItem[]
  /** Where the Finder is: resolveFinder's answer for `path`. */
  at: FinderPlace
  path: string[]
  /** Go somewhere (leaving the place for Back); set the path without that
   *  (the column view picking a file). */
  onNavigate: (path: string[]) => void
  onSelectPath: (path: string[]) => void
  view: FinderView
  /** The search as typed, for the line that says nothing matches it. */
  query: string
  sort: Sort
  onSort: (col: SortCol) => void
  selected: Set<string>
  onSelect: (key: string) => void
  /** The Finder's own rubber band, scoped to its files. */
  band: Rect | null
  rootProps: React.ComponentProps<"div">
  /** Open an item as a double-click does; `at` is the folder it sits in. */
  onOpenItem: (item: FinderItem, at: string[]) => void
  /** A source list at the left of the files, in every view (finder.tsx's
   *  Kind filter). It lays itself out by the Finder's width, the
   *  `@container/finder` this sets. */
  sidebar?: React.ReactNode
}

export function FinderBody({
  volumes,
  at,
  path,
  onNavigate,
  onSelectPath,
  view,
  query,
  sort,
  onSort,
  selected,
  onSelect,
  band,
  rootProps,
  onOpenItem,
  sidebar,
}: FinderBodyProps) {
  const { chain, placePath, here, visible, narrowed } = at
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

  // Column widths by depth, dragged by the strips between them; a column not
  // yet dragged is COLUMN wide.
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
  // inspector. A folder further up keeps the list's order, so the one
  // clicked in it does not jump when the next column opens.
  const columns = [
    { items: volumes, on: chain[0]?.label, volume: true },
    ...chain.flatMap((it, i) =>
      it.contents ? [{ items: it === here ? visible : sorted(it.contents, sort), on: chain[i + 1]?.label, volume: false }] : []
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
    // The Finder lays itself out by its own width, not the screen's: under
    // 600px (a phone, a phone on its side, a tablet's narrower window, one
    // dragged narrow) the Kind column goes and the icons take three columns,
    // so the names keep their room.
    <div className="@container/finder flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 @max-[600px]/finder:flex-col">
        {sidebar}
        <WindowScrollArea viewportRef={viewportRef} className={cn("bg-white", view === "columns" && "overflow-hidden")}>
          {narrowed && visible.length === 0 ? (
            <p className="p-6 text-center text-[12px] text-(--y2k-ink-secondary)">{query.trim() ? <>No items match “{query}”.</> : "No items."}</p>
          ) : view === "columns" ? (
            // Aqua column view, rebuilt from the 10.2 reference. The FIRST
            // column lists volumes — double-height rows, 32px icons, a
            // disclosure arrow on every one — and each folder on the path
            // opens the next. Columns are COLUMN wide, parted by a 12px shade
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
              {columnShown && <ColumnInspector icon={columnShown.icon} lines={inspectorLines(columnShown)} />}
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
  )
}

/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
