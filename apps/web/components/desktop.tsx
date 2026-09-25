"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import {
  Button,
  Window,
  WindowBody,
  WindowClose,
  WindowContent,
  WindowFooter,
  WindowFrame,
  WindowScrollArea,
  WindowToolbar,
  WindowToolbarItem,
  WindowToolbarControl,
  WindowToolbarSeparator,
  WindowTrigger,
  WindowWell,
  Checkbox,
  TextField,
  SearchField,
  Table,
  TableHead,
  TableBody,
  TableHeader,
  TableRow,
  TableCell,
  PopupButton,
  SegmentedControl,
  cn,
  Dock,
  Wallpaper,
  genie,
} from "@patina/ui"

import { ComputerIcon, DiskIcon, DocIcon, FaceIcon, FolderIcon, HeartIcon, HomeIcon, InfoIcon, IPodIcon, loadPackIcons, LogoIcon, NoteIcon, PillIcon, PrefsIcon, TerminalIcon, TrashIcon } from "./aqua-icons"
import { IPod } from "./ipod"
import { MenuBar, type MenuRow, type MenuSpec } from "./menubar"
import { TONES, type Tone } from "./tones"
import { useDrag } from "./use-drag"
import { useMarqueeSelect } from "./use-marquee-select"
import { prefersReducedMotion, useMediaQuery } from "./use-media-query"
import { MiddleTruncate } from "./middle-truncate"
import { useResize } from "./use-resize"
import { Stars } from "./stars"
import { asset } from "./asset"
import { INIT } from "./install"
import { Mono } from "./mono"

/** The Design System window's contents, the heaviest part of the desktop:
 *  loaded when the window opens, or a few seconds in (below). */
const loadDesignSystem = () => import("./design-system")
const DesignSystem = dynamic(() => loadDesignSystem().then((m) => m.DesignSystem))

/** Olivia's photo wallpapers, a 16:9 one and a phone one per tone. */
const WALLPAPERS = Object.fromEntries(
  TONES.map((t) => [t.id, { desktop: asset(`/wallpapers/${t.id}.webp`), mobile: asset(`/wallpapers/${t.id}-mobile.webp`) }])
)
/** The phone wallpaper is made for 3×; a phone up to 430px wide at 2× or less
 *  draws it at most 860 pixels across, so it gets a copy that size in AVIF
 *  (scripts/site-images.mjs), half the download. Plain CSS, not the
 *  wallpaper's custom properties: a browser that can't read image-set()
 *  drops the rule and keeps the full picture. The tone picks it, as it picks
 *  the full one (pink when unset). */
const SMALL_WALLPAPER_CSS = `@media (max-width: 430px) and (max-resolution: 2dppx) {
${TONES.map(
  (t) =>
    `${t.id === "pink" ? "html" : `html[data-tone="${t.id}"]`} div[data-slot="wallpaper"]{background-image:image-set(url(${asset(`/wallpapers/${t.id}-mobile-small.avif`)}) type("image/avif"), url(${WALLPAPERS[t.id].mobile}) type("image/webp"))}`
).join("\n")}
}`

/** The Changelog window: the releases worth a line, newest first, as their
 *  notes on GitHub put them. A release too small to mention (0.2.1) has no
 *  entry; nothing before 0.1.0 is listed. */
const CHANGELOG: { version: string; date: string; items: string[] }[] = [
  {
    version: "0.4.2",
    date: "26 September 2026",
    items: [
      "No terminal needed: send your AI agent github.com/livisliving/Patina and ask it to put Patina on your site. It runs init --setup, and the Setup Assistant opens in your browser for you to answer.",
    ],
  },
  {
    version: "0.4.1",
    date: "26 September 2026",
    items: [
      "The Setup Assistant opens in every browser: its files no longer arrive cut short.",
      "Where no answer fits, choose Other, and your agent settles it with you. Run init again and the page asks whether to replace the files already there, never the terminal.",
      "The desktop the pack installs catches up with this one: the Finder's toolbar keeps to one row, long names are cut from the middle, folders show a date, Enter opens, and a phone held sideways shows two windows.",
      "White text on the menu highlight in every tone.",
      "Every desktop built with Patina says so in the ★ menu's About Patina OS.",
    ],
  },
  {
    version: "0.4.0",
    date: "25 September 2026",
    items: [
      "npx @pat1na/cli init opens the Patina Setup Assistant: a few questions about your site — who it is about, what a visitor does first, how much becomes a desktop, where the content is, the tone and the extras — then it installs what the answers ask for, with a true progress bar.",
      "The answers are saved in patina.json, and /y2k-ify reads them before it starts. An agent that runs init without a terminal gets the unanswered questions to ask you in chat.",
      "The installer on npm is the pack's own version from now on: @pat1na/cli 0.4.0.",
    ],
  },
  {
    version: "0.3.1",
    date: "25 September 2026",
    items: [
      "The demo's first load is less than half the size: icons at the size they are drawn, a phone-sized wallpaper, and the Design System's code when its window opens.",
      "The pack's inlined pictures are WebP, half the bytes, and the desktop icons show the artwork's own colours.",
      "check-y2k leaves out what .gitignore leaves out, such as a Studio built into public/.",
    ],
  },
  {
    version: "0.3.0",
    date: "25 September 2026",
    items: [
      "Any site can be a desktop, not only a portfolio: a page's old address opens its window.",
      "New blocks for a site's words: a callout (a note or a caution) and code for each step.",
      "check-y2k warns about an empty document and about pack files changed since they were installed.",
      "The desktop opens with About Patina at the top right, beside the icons, and the iPod at the bottom left.",
      "Patina has a star for its icon, and a card for when it is shared.",
    ],
  },
  {
    version: "0.2.2",
    date: "24 September 2026",
    items: [
      "Keyboard focus shows on every control, and a header that sorts can be reached with Tab and sorted with Return.",
      "Windows are named for screen readers, and the volume menu opens with its slider focused.",
      "Minimising no longer stalls in Safari.",
      "The wallpaper and the folders pick their tone in CSS: the first paint is right, and only the picture in use is downloaded.",
      "On a phone the desktop scrolls to a window as it opens, and not when one closes.",
    ],
  },
  {
    version: "0.2.0",
    date: "24 September 2026",
    items: [
      "The iPod's Video screen is a visualiser after Winamp's Tripex and Windows Media Player, in each song's own tone.",
      "On a phone or a touch screen, one tap opens a file in the Finder.",
      "On a phone, a window you open comes to the top.",
      "Window toolbars set their items at the top.",
    ],
  },
  {
    version: "0.1.0",
    date: "24 September 2026",
    items: [
      "The first release: npx @pat1na/cli init installs DESIGN.md, the theme, the components and the agent skills.",
      "init --desktop also builds a site as a desktop: Finder, TextEdit, Preview, QuickTime Player and the iPod.",
      "patina update brings a project up to a new release.",
    ],
  },
]

/** Rounded down to the 4px grid. */
const down4 = (n: number) => Math.floor(n / 4) * 4
/** The desktop icons' column: its w-[84px], and right-3 from the edge. */
const ICON_COLUMN = 84 + 12

/** Patina's version, as the About boxes and the Finder show it: the newest
 *  release, listed in the Changelog or not. Bump it with every release. */
const VERSION = "0.4.2"

/* ── Window manager ───────────────────────────────────────────────── */

type WinId = "about" | "appinfo" | "readme" | "help" | "finder" | "buttons" | "tone" | "window" | "design" | "changelog" | "terminal" | "ipod"
/** `opened` counts up each time a window is opened or brought back (from
 *  the Dock, a menu, the Finder); the windows there at load have none. A
 *  focus does not change it: on a phone that is a tap to scroll. */
type WinState = Record<WinId, { open: boolean; z: number; minimized: boolean; zoomed?: boolean; opened?: number }>

/** Each window's facts: the app it belongs to (the menu bar's bold name
 *  while it is in front — About Patina is the Finder's, as About This Mac is),
 *  its title (the Finder's follows its folder, so that one is looked up live),
 *  its Dock tile when minimized, whether it is open from the start, and
 *  whether it only closes, as About This Mac does: yellow and green greyed,
 *  nothing minimizes or zooms it. */
const WINDOWS: Record<WinId, { app: string; title: string; icon: React.ReactNode; open?: boolean; closeOnly?: boolean }> = {
  finder: { app: "Finder", title: "Computer", icon: <FaceIcon /> },
  about: { app: "Finder", title: "About Patina", icon: <LogoIcon />, open: true, closeOnly: true },
  // About <the front app>: its app and title are looked up live, as the Finder's are.
  appinfo: { app: "Finder", title: "About The Finder", icon: <FaceIcon />, closeOnly: true },
  readme: { app: "TextEdit", title: "Read Me", icon: <NoteIcon /> },
  help: { app: "Help Viewer", title: "Patina Help", icon: <InfoIcon /> },
  buttons: { app: "Design System", title: "Design System", icon: <PillIcon /> },
  tone: { app: "Tone Preferences", title: "Tone", icon: <PrefsIcon /> },
  window: { app: "Design System", title: "Window", icon: <PillIcon /> },
  design: { app: "TextEdit", title: "DESIGN.md", icon: <DocIcon /> },
  changelog: { app: "TextEdit", title: "Changelog", icon: <DocIcon /> },
  terminal: { app: "Terminal", title: "Terminal — bash", icon: <TerminalIcon /> },
  // Resident: the iPod is on the desktop from the start, bottom left.
  ipod: { app: "iPod", title: "iPod", icon: <IPodIcon />, open: true },
}

// About opens in front.
const INITIAL = Object.fromEntries(
  (Object.keys(WINDOWS) as WinId[]).map((id) => [id, { open: !!WINDOWS[id].open, z: id === "about" ? 1 : 0, minimized: false }])
) as WinState

function useWindows() {
  const [wins, setWins] = React.useState<WinState>(INITIAL)
  const top = React.useRef(1)
  const opened = React.useRef(0)
  const focus = React.useCallback((id: WinId) => {
    setWins((w) => (w[id].z === top.current ? w : { ...w, [id]: { ...w[id], z: ++top.current } }))
  }, [])
  // Open (or, if minimized, restore) a window and bring it to the front.
  const open = React.useCallback((id: WinId) => {
    setWins((w) => ({ ...w, [id]: { open: true, z: ++top.current, minimized: false, opened: ++opened.current } }))
  }, [])
  const close = React.useCallback((id: WinId) => {
    setWins((w) => ({ ...w, [id]: { ...w[id], open: false, minimized: false } }))
  }, [])
  // Minimize: the window stays "open" (still runs, keeps its Dock triangle) but
  // is hidden until re-opened from the Dock.
  const minimize = React.useCallback((id: WinId) => {
    setWins((w) => ({ ...w, [id]: { ...w[id], minimized: true } }))
  }, [])
  // Zoom (the green light, a title-bar double-click, Window › Zoom Window)
  // toggles the window between its own size and the whole desktop.
  const zoom = React.useCallback((id: WinId) => {
    setWins((w) => ({ ...w, [id]: { ...w[id], zoomed: !w[id].zoomed, z: ++top.current } }))
  }, [])
  // The frontmost VISIBLE window (minimized windows don't drive the menu bar).
  const frontId = (Object.keys(wins) as WinId[]).reduce<WinId | null>(
    (best, id) =>
      wins[id].open && !wins[id].minimized && (best === null || wins[id].z > wins[best].z) ? id : best,
    null
  )
  return { wins, focus, open, close, minimize, zoom, frontId }
}

/* ── A draggable, zoomable desktop window ─────────────────────────── */

type DesktopWindowProps = Omit<
  React.ComponentProps<typeof WindowFrame>,
  "onFocus" | "onClose" | "onMinimize" | "onZoom" | "active" | "title"
> & {
  id: WinId
  /** Defaults to the window's title in WINDOWS. */
  title?: React.ReactNode
  /** Where it first opens; a function when that depends on the screen. */
  initial: { x: number; y: number } | (() => { x: number; y: number })
  z: number
  zoomed?: boolean
  /** How recently it was opened; on a phone the latest goes to the top. */
  opened?: number
  active: boolean
  onRaise: (id: WinId) => void
  onDismiss: (id: WinId) => void
  onMinimize: (id: WinId) => void
  onZoom: (id: WinId) => void
}

function DesktopWindow({ id, title, initial, z, zoomed, opened, active, onRaise, onDismiss, onMinimize, onZoom, className, style, ...props }: DesktopWindowProps) {
  const fixed = WINDOWS[id].closeOnly
  const raise = React.useCallback(() => onRaise(id), [onRaise, id])
  const { pos, handleProps } = useDrag(initial, raise)
  const { size, gripProps } = useResize({ w: 260, h: 180 }, raise)
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const toggleZoom = React.useCallback(() => onZoom(id), [onZoom, id])
  // On a phone the windows are one column, and a window just opened (or
  // brought back) goes to its top, the latest first — else it would land
  // under all the others and the tap seem to do nothing (the desktop scrolls
  // to it). `order` moves it without moving it in the DOM, so nothing in it
  // restarts.
  // Only float (apply left/top/size) on desktop. Below md the window is in
  // normal flow (w-full) — applying the drag offsets to a relative element
  // would push it off-screen.
  const placement = !isDesktop
    ? {}
    : zoomed
      ? { left: 8, top: 33, width: "calc(100vw - 16px)", height: "calc(100dvh - 33px - 68px)" }
      : { left: pos.x, top: pos.y, ...(size ? { width: size.w, height: size.h } : null) }
  // When zoomed, the maximized geometry comes from inline `placement`. The
  // per-window fixed-size classes (md:w-[...]/md:h-[...]) are NOT !important, so
  // inline width/height already override them — we just must not re-assert an
  // !important width/height here, or it would beat the inline maximized size.
  return (
    <WindowFrame
      data-window-id={id}
      title={title ?? WINDOWS[id].title}
      active={active}
      onClose={() => onDismiss(id)}
      onMinimize={() => onMinimize(id)}
      onZoom={toggleZoom}
      minimizable={!fixed}
      zoomable={!fixed}
      titleBarProps={handleProps}
      resizeGripProps={isDesktop && !zoomed ? gripProps : undefined}
      onPointerDownCapture={raise}
      className={cn(
        // scroll-mt: scrolled to on a phone, it clears the menu bar.
        "w-full scroll-mt-8 animate-[y2k-window-in_var(--y2k-duration-window)_var(--y2k-ease-aqua)] motion-reduce:animate-none md:absolute",
        className
      )}
      style={{ ...placement, zIndex: z, ...(isDesktop ? null : { order: -(opened ?? 0) }), ...style }}
      {...props}
    />
  )
}

/* ── Aqua controls used by the demo ───────────────────────────────── */

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

/** Triple-dot / left-chevron back glyph, as on the Aqua Finder Back button:
 *  a left chevron followed by two dots ( ‹•• ). */
const BackGlyph = () => (
  <svg viewBox="0 0 18 10" aria-hidden>
    <path d="M6 1L2 5l4 4" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="10.5" cy="5" r="1.15" fill="currentColor" />
    <circle cx="14.5" cy="5" r="1.15" fill="currentColor" />
  </svg>
)

/** One row of the Finder: what the list and column views render, and what the
 *  column inspector describes. */
type FinderItem = {
  label: string
  icon: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  kind: string
  size: string
  created: string
  modified: string
  version?: string
  /** A folder's contents: opening it shows them (a further column, in the
   *  column view). An empty array is still a folder — it just opens empty. */
  contents?: FinderItem[]
}

/** An empty system folder, as 10.1 installs them. */
const folder = (label: string, contents: FinderItem[] = [], icon: React.ReactNode = <FolderIcon />): FinderItem => ({
  label,
  icon,
  kind: "Folder",
  size: "—",
  created: "24/03/01",
  modified: "24/03/01",
  contents,
})

/** Macintosh HD: the machine's own disk, with Olivia's home folder under
 *  Users. None of it depends on state, so it is built once. */
const macFolders: FinderItem[] = [
  folder("Applications"),
  folder("Library"),
  folder("System"),
  folder("Users", [
    folder("olivia", ["Desktop", "Documents", "Library", "Movies", "Music", "Pictures", "Public", "Sites"].map((l) => folder(l)), <HomeIcon />),
  ]),
]

/** Which of the Finder's items the Favourites folder collects. */
const FAVOURITE_LABELS = ["Read Me", "Design System", "Tone", "DESIGN.md"]

/** Finder locations, as paths from Computer: the toolbar's Home and Favourites. */
const HOME = ["Macintosh HD", "Users", "olivia"]
const FAVOURITES = ["Patina HD", "Favourites"]

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
      <MiddleTruncate text={item.label} lines={1} className="flex-1" />
      {chevron && <DisclosureGlyph />}
    </button>
  )
}

/** The last column: a 128px icon over plain "Label: value" lines, left-aligned
 *  — the reference prints them as running text, not as a label grid. */
function ColumnInspector({ item }: { item: FinderItem }) {
  return (
    <div data-finder-column className="flex w-44 shrink-0 flex-col items-center overflow-y-auto px-3 pt-6 pb-3">
      <span className="size-32 shrink-0 [&_svg]:size-full">{item.icon}</span>
      <div className="mt-4 w-full space-y-1 text-[12px] leading-[1.35]">
        <p className="break-words">Name: {item.label}</p>
        <p>Kind: {item.kind}</p>
        <p>Size: {item.size}</p>
        <p>Created: {item.created}</p>
        <p>Modified: {item.modified}</p>
        {item.version && <p>Version: {item.version}</p>}
      </div>
    </div>
  )
}

/** Column widths are dragged, so they get their own bounds — both on the 4px
 *  grid, like every other layout value in the pack. */
const COLUMN_MIN = 96
const COLUMN_MAX = 320

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

/* ── Save dialog: the modal window ────────────────────────────────── */

function SaveDialog({
  defaultName = "Untitled Document",
  onSaved,
  children,
}: {
  defaultName?: string
  onSaved?: (info: { name: string; where: string }) => void
  children: React.ReactNode
}) {
  const [where, setWhere] = React.useState("Documents")
  const [name, setName] = React.useState(defaultName)
  return (
    <Window>
      <WindowTrigger asChild>{children}</WindowTrigger>
      <WindowContent
        title="Untitled"
        description="Save this document. Cancel closes without saving."
        className="w-[min(calc(100%-2rem),27rem)]"
      >
        <WindowBody className="flex flex-col gap-3 pt-5">
          <div className="grid grid-cols-[76px_1fr] items-center gap-x-2 gap-y-3">
            <label htmlFor="save-as" className="justify-self-end">Save As:</label>
            <TextField id="save-as" value={name} onChange={(e) => setName(e.target.value)} />
            <span className="justify-self-end">Where:</span>
            <PopupButton value={where} onChange={setWhere} options={["Documents", "Desktop", "Home", "Applications", "Patina HD"]} className="w-[200px]" />
          </div>
          <div className="pl-[84px]">
            <Checkbox label="Save Image Preview" defaultChecked />
          </div>
        </WindowBody>
        <WindowFooter>
          <WindowClose asChild>
            <Button>Cancel</Button>
          </WindowClose>
          <WindowClose asChild>
            <Button isDefault disabled={!name.trim()} onClick={() => onSaved?.({ name: name.trim(), where })}>Save</Button>
          </WindowClose>
        </WindowFooter>
      </WindowContent>
    </Window>
  )
}

/* ── Desktop ──────────────────────────────────────────────────────── */

/** Fixed login banner for the Terminal window — a plausible constant (not a live
 *  clock) so server and client render identically. */
const LOGIN_STAMP = "Sat Sep 20 09:41"

const PROMPT = "patina:~ olivia$ "
/** A text link in running copy: OS blue, underlined. */
const LINK = "text-(--y2k-link) underline underline-offset-2"
const INSTALL = ["Installing the Y2K pack…", "✓ DESIGN.md · /y2k-ify · /check-y2k · components.json"]

/** The Terminal window's shell: a handful of commands over the Finder's own
 *  files. Keystrokes go to a hidden input; the line is drawn as text with the
 *  block cursor at the caret (solid while typing, hollow when unfocused). */
function TerminalSession({ files, onOpen }: { files: FinderItem[]; onOpen: (file: FinderItem) => void }) {
  const [lines, setLines] = React.useState(() => [`Last login: ${LOGIN_STAMP} on ttys000`, `${PROMPT}${INIT}`, ...INSTALL])
  const [input, setInput] = React.useState("")
  const [caret, setCaret] = React.useState(0)
  const [focused, setFocused] = React.useState(false)
  const history = React.useRef<string[]>([])
  const back = React.useRef(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [lines, input])

  const recall = (value: string) => {
    setInput(value)
    setCaret(value.length)
  }

  const run = (cmd: string) => {
    const line = cmd.trim()
    if (line) history.current.push(line)
    back.current = history.current.length
    recall("")
    const [name, ...args] = line.split(/\s+/)
    const arg = args.join(" ")
    const bare = (s: string) => s.toLowerCase().replace(/["'\s]/g, "")
    let out: string[] = []
    if (name === "clear") return setLines([])
    if (line === INIT) out = INSTALL
    else if (name === "help")
      out = [
        "ls                    list Patina HD",
        "open <file>           open a file, e.g. open DESIGN.md",
        `${INIT}  install the Y2K pack`,
        "echo · pwd · whoami · clear",
      ]
    else if (name === "ls") out = [files.map((f) => f.label).join("  ")]
    else if (name === "pwd") out = ["/Users/olivia"]
    else if (name === "whoami") out = ["olivia"]
    else if (name === "echo") out = [arg]
    else if (name === "open") {
      const file = files.find((f) => bare(f.label) === bare(arg))
      if (!arg) out = ["Usage: open <file>"]
      else if (file) onOpen(file)
      else out = [`The file /Users/olivia/${arg} does not exist.`]
    } else if (line) out = [`bash: ${name}: command not found`]
    setLines((l) => [...l, PROMPT + cmd, ...out])
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") run(input)
    else if (e.key === "c" && e.ctrlKey) {
      setLines((l) => [...l, `${PROMPT}${input}^C`])
      recall("")
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault()
      back.current = Math.max(0, Math.min(history.current.length, back.current + (e.key === "ArrowUp" ? -1 : 1)))
      recall(history.current[back.current] ?? "")
    }
  }

  const under = input[caret] ?? " "
  return (
    <div
      ref={scrollRef}
      // A click anywhere types into the shell — unless it made a text selection.
      onClick={() => !window.getSelection()?.toString() && inputRef.current?.focus({ preventScroll: true })}
      className="y2k-field m-2 min-h-0 flex-1 cursor-text overflow-auto px-2 py-1 font-(family-name:--y2k-font-mono) text-[11px] leading-[1.5] text-black"
    >
      {lines.map((l, i) => (
        <p key={i} className="break-all whitespace-pre-wrap">{l}</p>
      ))}
      <p className="relative break-all whitespace-pre-wrap">
        {PROMPT}
        {input.slice(0, caret)}
        <span className="relative">
          {under}
          <span
            // Re-keyed on every edit so the blink restarts solid, as Terminal's does.
            key={`${caret}:${input}`}
            aria-hidden
            className={cn(
              "absolute inset-0",
              focused
                ? "bg-black text-white motion-safe:animate-[y2k-blink_1s_steps(1)_infinite]"
                : "text-transparent outline-1 -outline-offset-1 outline-black"
            )}
          >
            {under}
          </span>
        </span>
        {input.slice(caret + 1)}
        {/* 16px so iOS doesn't zoom the page when it takes focus. */}
        <input
          ref={inputRef}
          autoFocus
          aria-label="Terminal"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setCaret(e.target.selectionStart ?? e.target.value.length)
          }}
          onSelect={(e) => setCaret(e.currentTarget.selectionStart ?? 0)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="absolute top-0 left-0 size-px text-[16px] opacity-0"
        />
      </p>
    </div>
  )
}

/** Read Me font menu → real fallback stacks. The classic Mac faces (Charcoal,
 *  Geneva, Monaco) aren't installed everywhere, so each maps to a distinct
 *  present-day fallback. Keys must match the Popup options exactly. */
const FONT_STACK: Record<string, string> = {
  "Lucida Grande": '"Lucida Grande", "Lucida Sans Unicode", sans-serif',
  Geneva: 'Geneva, Verdana, "Segoe UI", sans-serif',
  Monaco: 'Monaco, "Courier New", ui-monospace, monospace',
  Charcoal: '"Charcoal", Georgia, "Times New Roman", serif',
}

/** The rubber-band selection rectangle drawn over a marquee surface. `z` lifts
 *  it above in-flow content (the Finder file grids); the desktop surface omits
 *  it. Renders nothing until a drag is in progress. */
function Band({ rect, z }: { rect: { x: number; y: number; w: number; h: number } | null; z?: boolean }) {
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

export function Desktop() {
  const [tone, setTone] = React.useState<Tone>("pink")
  const { wins, focus, open, close, minimize: park, zoom, frontId } = useWindows()
  // Minimising pours the window into its Dock tile; bringing a minimised
  // window back pours it out again.
  const minimize = React.useCallback(
    (id: WinId) => {
      const el = document.querySelector(`[data-window-id="${id}"]`)
      if (el) void genie(el, `[data-dock-id="min:${id}"]`)
      park(id)
    },
    [park]
  )
  const show = (id: WinId) => {
    const tile = wins[id].minimized ? document.querySelector(`[data-dock-id="min:${id}"]`) : null
    if (tile) void genie(`[data-window-id="${id}"]`, tile.getBoundingClientRect(), { reverse: true })
    open(id)
  }

  React.useEffect(() => {
    document.documentElement.dataset.tone = tone
  }, [tone])

  const currentTone = TONES.find((t) => t.id === tone)!
  const openWin = (id: WinId) => () => show(id)
  // What every desktop window takes from the window manager.
  const winProps = (id: WinId) => ({
    id,
    z: wins[id].z,
    zoomed: wins[id].zoomed,
    opened: wins[id].opened,
    active: frontId === id,
    onRaise: focus,
    onDismiss: close,
    onMinimize: minimize,
    onZoom: zoom,
  })
  // Stable, so the iPod (memoised) doesn't redraw on every desktop update.
  const ejectIPod = React.useCallback(() => close("ipod"), [close])
  // Which app the About window is about (the front app's first menu opens it).
  const [aboutApp, setAboutApp] = React.useState("Finder")

  // Finder / Design System / Tone search queries, and the icon selection set
  // (populated by single-click or the desktop marquee drag-select).
  const [finderQuery, setFinderQuery] = React.useState("")
  const [dsQuery, setDsQuery] = React.useState("")
  // Code the page didn't wait for, fetched a few seconds after it has
  // loaded, so a window opens with its contents rather than filling in.
  React.useEffect(() => {
    const t = setTimeout(() => {
      loadDesignSystem()
      loadPackIcons()
    }, 3000)
    return () => clearTimeout(t)
  }, [])
  const [toneQuery, setToneQuery] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set())
  const selectOnly = React.useCallback((key: string) => setSelected(new Set([key])), [])
  const [finderView, setFinderView] = React.useState<"icons" | "list" | "columns">("icons")
  // Where the Finder is: the labels from Computer down. In the column view it
  // is also the selection, one row per column, and may end on a file.
  const [finderPath, setFinderPath] = React.useState<string[]>(["Patina HD"])
  // The paths Back returns to, the latest last.
  const [finderHistory, setFinderHistory] = React.useState<string[][]>([])
  // Column widths by depth, dragged by the strips between them; a column not
  // yet dragged is 176.
  const [columnWidths, setColumnWidths] = React.useState<number[]>([])
  // A drag fires per pointer move, but `clamp` snaps to the 4px grid, so most
  // moves resolve to the width already set — returning `prev` unchanged lets
  // React skip the re-render of the whole desktop.
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
  const finderViewportRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = finderViewportRef.current
    const newest = el?.querySelectorAll("[data-finder-column]")
    const last = newest?.[newest.length - 1]
    if (!el || finderView !== "columns" || !last) return
    el.scrollLeft = Math.max(0, last.getBoundingClientRect().right - el.getBoundingClientRect().left + el.scrollLeft - el.clientWidth)
  }, [finderView, finderPath])
  // Finder's toolbar, shown or hidden by the title bar's white oval.
  const [finderToolbar, setFinderToolbar] = React.useState(true)
  // File › Find… opens the Finder and puts the caret in its search field.
  const finderSearch = React.useRef<HTMLInputElement>(null)
  const [findAsked, setFindAsked] = React.useState(0)
  React.useEffect(() => {
    if (findAsked) finderSearch.current?.focus()
  }, [findAsked])

  // Read Me text-formatting toolbar state.
  const [font, setFont] = React.useState("Lucida Grande")
  const [fontSize, setFontSize] = React.useState("13")
  const [bold, setBold] = React.useState(false)
  const [italic, setItalic] = React.useState(false)
  const [underline, setUnderline] = React.useState(false)
  // Last saved file, surfaced in the Read Me status bar after Save.
  const [savedNote, setSavedNote] = React.useState<string | null>(null)
  // The Bin is empty — clicking it in the Dock says so.
  const [trashOpen, setTrashOpen] = React.useState(false)

  // `kind` / `size` / `modified` feed the column view's inspector pane, the way
  // the 10.2 Finder's third column describes the selected file.
  const patinaFiles: FinderItem[] = [
    { label: "Read Me", icon: <DocIcon />, onClick: openWin("readme"), kind: "TextEdit document", size: "12 KB", created: "18/09/26", modified: "20/09/26" },
    { label: "Design System", icon: <PillIcon />, onClick: openWin("buttons"), kind: "Application", size: "1.8 MB", created: "14/09/26", modified: "20/09/26", version: VERSION },
    { label: "Tone", icon: <PrefsIcon />, onClick: openWin("tone"), kind: "Preference pane", size: "248 KB", created: "14/09/26", modified: "19/09/26", version: VERSION },
    { label: "DESIGN.md", icon: <DocIcon />, onClick: openWin("design"), kind: "Markdown document", size: "36 KB", created: "12/09/26", modified: "20/09/26" },
    { label: "Changelog", icon: <DocIcon />, onClick: openWin("changelog"), kind: "Markdown document", size: "4 KB", created: "18/09/26", modified: "25/09/26" },
    { label: "Terminal", icon: <TerminalIcon />, onClick: openWin("terminal"), kind: "Application", size: "912 KB", created: "14/09/26", modified: "18/09/26", version: VERSION },
  ]
  // The Favourites folder collects a few of them, so it lists the same rows.
  const finderItems: FinderItem[] = [
    ...patinaFiles,
    { label: "Favourites", icon: <HeartIcon />, kind: "Folder", size: "—", created: "14/09/26", modified: "18/09/26", contents: patinaFiles.filter((it) => FAVOURITE_LABELS.includes(it.label)) },
  ]

  const volumes: FinderItem[] = [
    { label: "Patina HD", icon: <DiskIcon />, kind: "Volume", size: "56k available", created: "14/09/26", modified: "20/09/26", contents: finderItems },
    { label: "Macintosh HD", icon: <DiskIcon />, kind: "Volume", size: "18.2 GB available", created: "24/03/01", modified: "20/09/26", contents: macFolders },
  ]

  // The path, walked down from Computer; a label no longer there ends it.
  const chain: FinderItem[] = []
  let level: FinderItem[] | undefined = volumes
  for (const label of finderPath) {
    const it: FinderItem | undefined = level?.find((c) => c.label === label)
    if (!it) break
    chain.push(it)
    level = it.contents
  }
  // The folder the icon and list views show: the path, less a file it ends on.
  const place = chain.at(-1)?.contents ? chain : chain.slice(0, -1)
  const placePath = place.map((it) => it.label)
  const here = place.at(-1)
  const hereItems = here?.contents ?? volumes
  const q = finderQuery.trim().toLowerCase()
  const matching = (items: FinderItem[]) => (q ? items.filter((it) => it.label.toLowerCase().includes(q)) : items)
  const visibleFinderItems = matching(hereItems)

  const navigate = (path: string[]) => {
    // The place the Finder already shows (Patina HD from the desktop, at
    // first) is no step for Back: it would light the button, and going
    // back would go nowhere.
    if (path.length === finderPath.length && path.every((label, i) => label === finderPath[i])) return
    setFinderHistory((h) => [...h, finderPath])
    setFinderPath(path)
    setSelected((sel) => new Set([...sel].filter((k) => !k.startsWith("finder:"))))
  }
  const goBack = () => {
    const prev = finderHistory.at(-1)
    if (!prev) return
    setFinderHistory((h) => h.slice(0, -1))
    setFinderPath(prev)
  }
  // Show a place in the Finder, opening it if need be.
  const goTo = (path: string[]) => {
    navigate(path)
    open("finder")
  }
  // Open an item as a double-click does: a folder opens in the Finder, a file
  // opens its window. `at` is the path of the folder it sits in.
  const openItem = (it: FinderItem, at: string[]) => (it.contents ? goTo([...at, it.label]) : it.onClick?.())

  // The column view: the volumes, then a column for each folder on the path,
  // marking the row the path goes through. The focused column is the deepest,
  // where the last click landed; a file at the end of the path gets the
  // inspector.
  const columns = [
    { items: volumes, on: chain[0]?.label, volume: true },
    ...chain.flatMap((it, i) =>
      it.contents ? [{ items: it === here ? visibleFinderItems : it.contents, on: chain[i + 1]?.label, volume: false }] : []
    ),
  ]
  const columnShown = chain.at(-1)?.contents ? undefined : chain.at(-1)
  // A phone, or any screen without a pointer that hovers (a touch screen):
  // a tap in the Finder opens a file, as a double-click does with a mouse —
  // there is no double-tap to find out about.
  const tapOpens = useMediaQuery("(max-width: 767px), (hover: none)")
  // A click in the list or icon view: select the item, and open it too
  // where a tap is the only click there is.
  const choose = (key: string, it: FinderItem) => {
    selectOnly(key)
    if (tapOpens) openItem(it, placePath)
  }
  // Clicking a folder descends into it; clicking a file selects it (and, on
  // a touch screen, opens it).
  const selectColumn = (depth: number, it: FinderItem) => {
    const path = [...finderPath.slice(0, depth), it.label]
    if (it.contents) navigate(path)
    else {
      setFinderPath(path)
      if (tapOpens) it.onClick?.()
    }
  }


  const isDesktop = useMediaQuery("(min-width: 768px)")
  // On a phone, scroll to a window as it opens (it goes to the top of the
  // column: DesktopWindow's `order`) — only when a newer one opens, so
  // closing the latest leaves the page where it is. By its place in the
  // layout (offsetTop), not its box on screen: it is still scaling in from
  // 95%, and a 5000px document mid-animation sits 120px lower than it will.
  const latestId = (Object.keys(wins) as WinId[]).reduce<WinId | undefined>(
    (a, id) => ((wins[id].opened ?? 0) > (a ? (wins[a].opened ?? 0) : 0) ? id : a),
    undefined
  )
  const latestOpened = latestId ? (wins[latestId].opened ?? 0) : 0
  const scrolledTo = React.useRef(0)
  React.useEffect(() => {
    if (isDesktop || !latestId || latestOpened <= scrolledTo.current) return
    scrolledTo.current = latestOpened
    const el = document.querySelector<HTMLElement>(`[data-window-id="${latestId}"]`)
    if (!el) return
    let top = 0
    for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) top += n.offsetTop
    window.scrollTo({ top: Math.max(0, top - parseFloat(getComputedStyle(el).scrollMarginTop)), behavior: prefersReducedMotion() ? "auto" : "smooth" })
  }, [isDesktop, latestId, latestOpened])
  const { band, rootProps } = useMarqueeSelect(setSelected, isDesktop, "desktop:")
  // A second, independent marquee scoped to the Finder file area.
  const { band: finderBand, rootProps: finderRootProps } = useMarqueeSelect(setSelected, true, "finder:")

  // Windows currently minimized to the Dock (open but hidden). Ordered by WinId
  // for a stable Dock tile order.
  const minimizedWindows = (Object.keys(wins) as WinId[]).filter((id) => wins[id].open && wins[id].minimized)
  const titleOf = (id: WinId) =>
    id === "finder" ? (here?.label ?? "Computer") : id === "appinfo" ? (aboutApp === "Finder" ? "About The Finder" : `About ${aboutApp}`) : WINDOWS[id].title
  const appOf = (id: WinId) => (id === "appinfo" ? aboutApp : WINDOWS[id].app)

  // Desktop icons, top-right: single click selects, double click (or File ›
  // Open) opens.
  const desktopIcons = [
    { id: "finder", label: "Patina HD", icon: <DiskIcon />, onOpen: () => openItem(volumes[0], []) },
    { id: "readme", label: "Read Me", icon: <DocIcon />, onOpen: openWin("readme") },
    { id: "design", label: "DESIGN.md", icon: <DocIcon />, onOpen: openWin("design") },
    { id: "ipod", label: "iPod", icon: <IPodIcon />, onOpen: openWin("ipod") },
  ]

  /* ── The menu bar, after the ★: the front app, then the Finder's menus ── */

  // The front app is the front window's; with none, the Finder.
  const app = frontId ? appOf(frontId) : "Finder"
  const ids = (Object.keys(wins) as WinId[]).filter((id) => wins[id].open)
  const shown = ids.filter((id) => !wins[id].minimized)
  const appWindows = ids.filter((id) => appOf(id) === app)
  // What Hide can send to the Dock (not a window that only closes): the
  // front app's windows, or everyone else's.
  const hideable = shown.filter((id) => !WINDOWS[id].closeOnly)
  const mine = hideable.filter((id) => appOf(id) === app)
  const others = hideable.filter((id) => appOf(id) !== app)
  const frontFixed = !frontId || WINDOWS[frontId].closeOnly
  const finderShown = shown.includes("finder")
  // What File › Open opens: the selected desktop icons and Finder items.
  const toOpen = [...selected].flatMap((key) => {
    const [where, name] = key.split(/:(.*)/)
    if (where === "desktop") return desktopIcons.filter((it) => it.id === name).map((it) => it.onOpen)
    if (where === "finder") return visibleFinderItems.filter((it) => it.label === name).map((it) => () => openItem(it, placePath))
    return []
  })
  const menus: MenuSpec[] = [
    {
      label: app,
      items: [
        {
          label: `About ${app}`,
          onSelect: () => {
            setAboutApp(app)
            open("appinfo")
          },
        },
        "-",
        { label: "Preferences…", onSelect: openWin("tone") },
        // The Bin is always empty, so there is nothing to empty.
        ...(app === "Finder" ? (["-", { label: "Empty Bin…", shortcut: "⇧⌘⌫", disabled: true }] as MenuRow[]) : []),
        "-",
        // Hiding is minimizing: the Dock is the only place a window can go.
        { label: `Hide ${app}`, shortcut: "⌘H", disabled: !mine.length, onSelect: () => mine.forEach(minimize) },
        { label: "Hide Others", disabled: !others.length, onSelect: () => others.forEach(minimize) },
        { label: "Show All", disabled: !minimizedWindows.length, onSelect: () => minimizedWindows.forEach(show) },
        // The Finder never quits.
        ...(app === "Finder" ? [] : (["-", { label: `Quit ${app}`, shortcut: "⌘Q", onSelect: () => appWindows.forEach(close) }] as MenuRow[])),
      ],
    },
    {
      label: "File",
      items: [
        { label: "New Finder Window", shortcut: "⌘N", onSelect: openWin("finder") },
        { label: "Open", shortcut: "⌘O", disabled: !toOpen.length, onSelect: () => toOpen.forEach((go) => go()) },
        { label: "Close Window", shortcut: "⌘W", disabled: !frontId, onSelect: () => frontId && close(frontId) },
        "-",
        {
          label: "Find…",
          shortcut: "⌘F",
          onSelect: () => {
            open("finder")
            setFinderToolbar(true)
            setFindAsked((n) => n + 1)
          },
        },
      ],
    },
    {
      // Nothing here can be undone or put on the clipboard (the browser's own
      // copy and paste still work): the menu is 10.1's, greyed.
      label: "Edit",
      items: [
        { label: "Can’t Undo", shortcut: "⌘Z", disabled: true },
        "-",
        { label: "Cut", shortcut: "⌘X", disabled: true },
        { label: "Copy", shortcut: "⌘C", disabled: true },
        { label: "Paste", shortcut: "⌘V", disabled: true },
        { label: "Select All", shortcut: "⌘A", disabled: true },
        { label: "Show Clipboard", disabled: true },
      ],
    },
    {
      label: "View",
      items: [
        ...(["icons", "list", "columns"] as const).map((v) => ({
          label: { icons: "as Icons", list: "as List", columns: "as Columns" }[v],
          checked: finderView === v,
          disabled: !finderShown,
          onSelect: () => {
            setFinderView(v)
            focus("finder")
          },
        })),
        "-",
        { label: finderToolbar ? "Hide Toolbar" : "Show Toolbar", shortcut: "⌘B", disabled: !finderShown, onSelect: () => setFinderToolbar((v) => !v) },
      ],
    },
    {
      label: "Go",
      items: [
        { label: "Computer", shortcut: "⌥⌘C", onSelect: () => goTo([]) },
        { label: "Home", shortcut: "⌥⌘H", onSelect: () => goTo(HOME) },
        { label: "Favourites", onSelect: () => goTo(FAVOURITES) },
        { label: "Applications", shortcut: "⌥⌘A", onSelect: () => goTo(["Macintosh HD", "Applications"]) },
        "-",
        {
          label: "Back",
          shortcut: "⌘[",
          disabled: !finderHistory.length,
          onSelect: () => {
            goBack()
            open("finder")
          },
        },
      ],
    },
    {
      label: "Window",
      items: [
        { label: "Zoom Window", disabled: frontFixed, onSelect: () => frontId && zoom(frontId) },
        { label: "Minimise Window", shortcut: "⌘M", disabled: frontFixed, onSelect: () => frontId && minimize(frontId) },
        "-",
        // The front app's windows, over everything else in the order they stand.
        {
          label: "Bring All to Front",
          disabled: !frontId,
          onSelect: () => appWindows.filter((id) => shown.includes(id)).sort((a, b) => wins[a].z - wins[b].z).forEach(focus),
        },
        // Every open window: a tick on the front one, a diamond on those in the Dock.
        ...(ids.length ? (["-"] as MenuRow[]) : []),
        ...ids.map((id) => ({ label: titleOf(id), mark: wins[id].minimized ? "◆" : id === frontId ? "✓" : undefined, onSelect: openWin(id) })),
      ],
    },
    { label: "Help", items: [{ label: "Patina Help", shortcut: "⌘?", onSelect: openWin("help") }] },
  ]

  return (
    <div className="min-h-dvh overflow-x-hidden font-(family-name:--y2k-font-ui) text-(--y2k-ink)">
      <Wallpaper photos={WALLPAPERS} />
      <style href="y2k-wallpaper-small" precedence="default">
        {SMALL_WALLPAPER_CSS}
      </style>
      <Stars />
      <MenuBar tone={tone} onToneChange={setTone} onOpen={show} menus={menus} />

      {/* Desktop surface: catches marquee drag-select on empty space (desktop
          only). Sits above the wallpaper, below the icons and windows. */}
      {isDesktop && (
        <div
          aria-hidden
          className="absolute inset-0 top-(--y2k-menubar-h) z-0 hidden md:block"
          {...rootProps}
        >
          <Band rect={band} />
        </div>
      )}

      {/* Desktop icons, top-right. Single click selects; double click opens. */}
      <nav aria-label="Desktop" className="absolute top-9 right-3 z-[1] hidden flex-col items-center gap-3 md:flex">
        {desktopIcons.map((it) => {
          const key = `desktop:${it.id}`
          return (
            <button
              key={it.id}
              type="button"
              data-select-item={key}
              aria-pressed={selected.has(key)}
              onClick={() => selectOnly(key)}
              onDoubleClick={it.onOpen}
              className="group flex w-[84px] cursor-default flex-col items-center gap-0.5 outline-none"
            >
              <span className="size-14 [&_svg]:size-full [&_svg]:drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]">{it.icon}</span>
              {/* Two lines at most, then cut from the middle, as in the Finder. */}
              <MiddleTruncate
                text={it.label}
                lines={2}
                className="w-full text-center"
                labelClassName={cn(
                  "inline-block max-w-full rounded-[3px] px-1.5 py-[1px] text-[12px] text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]",
                  selected.has(key) && "bg-(--y2k-tone-selection)"
                )}
              />
            </button>
          )
        })}
      </nav>

      <main className="relative flex flex-col gap-5 px-3 pt-8 pb-24 md:block md:px-0 md:pt-0 md:pb-0">
        {wins.finder.open && !wins.finder.minimized && (
          <DesktopWindow
            {...winProps("finder")}
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
            initial={{ x: 40, y: 56 }}
            onToolbarToggle={() => setFinderToolbar((v) => !v)}
            className="md:h-[400px] md:w-[640px]"
            status={[
              q ? `${visibleFinderItems.length} of ${hereItems.length} items` : `${hereItems.length} ${hereItems.length === 1 ? "item" : "items"}`,
              chain[0]?.size,
            ]
              .filter(Boolean)
              .join(", ")}
            toolbar={finderToolbar && 
              // Sized to the window, not the screen: as the window narrows,
              // the search field gives up its width (160px down to 96px),
              // then goes, once the items and a 96px field no longer fit
              // (they take 368px with their labels).
              <WindowToolbar className="@container">
                <WindowToolbarControl label="Back">
                  <Button size="icon" aria-label="Back" disabled={!finderHistory.length} onClick={goBack} className="[&_svg]:h-2 [&_svg]:w-[13px]">
                    <BackGlyph />
                  </Button>
                </WindowToolbarControl>
                <WindowToolbarControl label="View">
                  <SegmentedControl
                    items={[
                      { label: "Icons", icon: <GridGlyph />, active: finderView === "icons", onClick: () => setFinderView("icons") },
                      { label: "List", icon: <ListGlyph />, active: finderView === "list", onClick: () => setFinderView("list") },
                      { label: "Columns", icon: <ColGlyph />, active: finderView === "columns", onClick: () => setFinderView("columns") },
                    ]}
                  />
                </WindowToolbarControl>
                <WindowToolbarSeparator />
                <WindowToolbarItem icon={<ComputerIcon />} onClick={() => navigate([])}>Computer</WindowToolbarItem>
                <WindowToolbarItem icon={<HomeIcon />} onClick={() => navigate(HOME)}>Home</WindowToolbarItem>
                <WindowToolbarItem icon={<HeartIcon />} onClick={() => navigate(FAVOURITES)}>Favourites</WindowToolbarItem>
                <WindowToolbarControl label="Search" className="ml-auto w-40 min-w-24 @max-[480px]:hidden">
                  <SearchField ref={finderSearch} value={finderQuery} onChange={setFinderQuery} placeholder="" className="w-full" />
                </WindowToolbarControl>
              </WindowToolbar>
            }
          >
            <WindowScrollArea viewportRef={finderViewportRef} className={cn("bg-white", finderView === "columns" && "overflow-hidden")}>
              {q && visibleFinderItems.length === 0 ? (
                <p className="p-6 text-center text-[12px] text-(--y2k-ink-secondary)">No items match “{finderQuery}”.</p>
              ) : finderView === "columns" ? (
                // Aqua column view, rebuilt from the 10.2 reference. The FIRST
                // column lists volumes — double-height rows, 32px icons, a
                // disclosure arrow on every one — and each folder on the path
                // opens the next. Columns are 176px, parted by an 8px bevel
                // with a grip at its foot; the strip scrolls sideways once the
                // path runs past the window, as the real Finder does.
                <div className="flex min-h-full w-max min-w-full">
                  {columns.map((col, depth) => (
                    <React.Fragment key={depth}>
                      <div data-finder-column className="shrink-0 overflow-y-auto py-1" style={{ width: columnWidths[depth] ?? 176 }}>
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
                      <ColumnSplit width={columnWidths[depth] ?? 176} onResize={(w) => setColumnWidth(depth, w)} />
                    </React.Fragment>
                  ))}
                  {columnShown && <ColumnInspector item={columnShown} />}
                  {/* The reference pads the rest of the width with an empty
                      column, ready for the next level. */}
                  <div className="w-44 min-w-0 flex-1 border-l border-black/10" />
                </div>
              ) : finderView === "list" ? (
                // Aqua list view: the pack's Table — the list header, 12px
                // rows, every other row pale blue, the selection in the tone.
                <div className="relative min-h-full" {...finderRootProps}>
                  <Band rect={finderBand} z />
                  <Table>
                    <TableHeader>
                      <tr>
                        <TableHead sorted="ascending">Name</TableHead>
                        <TableHead>Date Modified</TableHead>
                        <TableHead>Size</TableHead>
                        {/* A phone has room for three columns; Kind goes. */}
                        <TableHead className="max-sm:hidden">Kind</TableHead>
                      </tr>
                    </TableHeader>
                    <TableBody>
                      {visibleFinderItems.map((it) => {
                        const key = `finder:${it.label}`
                        return (
                          <FileRow
                            key={it.label}
                            item={it}
                            data-select-item={key}
                            selected={selected.has(key)}
                            onSelect={() => choose(key, it)}
                            onOpen={() => openItem(it, placePath)}
                            className="relative z-[2]"
                          >
                            <TableCell>{it.modified}</TableCell>
                            <TableCell>{it.size}</TableCell>
                            <TableCell className="max-sm:hidden">{it.kind}</TableCell>
                          </FileRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="relative grid min-h-full grid-cols-3 content-start gap-y-3 p-3 sm:grid-cols-4" {...finderRootProps}>
                  <Band rect={finderBand} z />
                  {visibleFinderItems.map((it) => {
                    const key = `finder:${it.label}`
                    return (
                      <button
                        key={it.label}
                        type="button"
                        data-select-item={key}
                        disabled={it.disabled}
                        aria-pressed={selected.has(key)}
                        onClick={() => !it.disabled && choose(key, it)}
                        onDoubleClick={() => openItem(it, placePath)}
                        className="group relative z-[2] flex cursor-default flex-col items-center gap-1 outline-none disabled:opacity-45"
                      >
                        <span className="size-12 [&_svg]:size-full">{it.icon}</span>
                        {/* Two lines at most, then cut from the middle. */}
                        <MiddleTruncate
                          text={it.label}
                          lines={2}
                          className="w-full text-center"
                          labelClassName={cn(
                            "inline-block max-w-full rounded-[3px] px-1.5 py-[1px] text-[12px]",
                            // The light tone under black ink, the same in every tone.
                            selected.has(key) && "bg-(--y2k-tone-focus) text-(--y2k-ink)"
                          )}
                        />
                      </button>
                    )
                  })}
                </div>
              )}
            </WindowScrollArea>
          </DesktopWindow>
        )}

        {wins.about.open && !wins.about.minimized && (
          <DesktopWindow
            {...winProps("about")}
            // Top right: its 300px end 16px short of the desktop icons. The
            // classes paint it there before the page wakes (the same sum in
            // CSS: 412 = ICON_COLUMN + 16 + 300); then `initial` takes over.
            initial={() => ({ x: typeof window === "undefined" ? 40 : down4(Math.max(40, window.innerWidth - ICON_COLUMN - 16 - 300)), y: 56 })}
            className="md:top-14 md:left-[round(down,max(40px,100vw_-_412px),4px)] md:w-[300px]"
          >
            <WindowBody className="flex flex-col items-center gap-2 pt-5 pb-5 text-center">
              <h1>
                <LogoIcon className="h-16 w-32 drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]" />
              </h1>
              <p className="text-[11px]">Public Beta</p>
              <dl className="mt-2 grid grid-cols-[auto_auto] gap-x-2 text-[11px]">
                <dt className="text-right">Taste:</dt><dd className="text-left">Aqua × millennium</dd>
                <dt className="text-right">Tone:</dt><dd className="text-left">{currentTone.label}</dd>
                <dt className="text-right">Version:</dt><dd className="text-left">{VERSION} (Public Beta)</dd>
              </dl>
              <p className="mt-2 text-[11px]">
                Built by{" "}
                <a href="https://oliviaforster.com" target="_blank" rel="noopener noreferrer" className={LINK}>
                  Olivia Forster
                </a>
              </p>
            </WindowBody>
          </DesktopWindow>
        )}

        {wins.appinfo.open && !wins.appinfo.minimized && (
          <DesktopWindow {...winProps("appinfo")} title={titleOf("appinfo")} initial={{ x: 96, y: 96 }} className="md:w-[300px]">
            <WindowBody className="flex flex-col items-center gap-2 pt-5 pb-6 text-center text-[13px]">
              <span className="size-16 [&_img]:size-full [&_svg]:size-full">
                {Object.values(WINDOWS).find((w) => w.app === aboutApp)?.icon}
              </span>
              <p>{aboutApp}</p>
              <p>Patina {VERSION} (Public Beta)</p>
            </WindowBody>
          </DesktopWindow>
        )}

        {wins.readme.open && !wins.readme.minimized && (
          <DesktopWindow
            {...winProps("readme")}
            initial={{ x: 300, y: 84 }}
            className="md:h-[360px] md:w-[460px]"
            status={savedNote ?? undefined}
            toolbar={
              <WindowToolbar>
                <PopupButton value={font} onChange={setFont} options={["Lucida Grande", "Geneva", "Monaco", "Charcoal"]} className="w-[128px]" />
                <PopupButton value={fontSize} onChange={setFontSize} options={["9", "10", "12", "13", "14", "18", "24"]} className="w-[52px]" />
                <SegmentedControl
                  items={[
                    { label: "Bold", icon: <b className="text-[11px]">B</b>, active: bold, onClick: () => setBold((v) => !v) },
                    { label: "Italic", icon: <i className="text-[11px]">I</i>, active: italic, onClick: () => setItalic((v) => !v) },
                    { label: "Underline", icon: <u className="text-[11px]">U</u>, active: underline, onClick: () => setUnderline((v) => !v) },
                  ]}
                />
              </WindowToolbar>
            }
          >
            <WindowScrollArea className="bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]">
              <div
                className={cn(
                  "flex flex-col gap-3 px-6 py-5 leading-[1.5]",
                  bold && "font-bold",
                  italic && "italic",
                  underline && "underline"
                )}
                style={{ fontFamily: FONT_STACK[font] ?? font, fontSize: `${fontSize}px` }}
              >
              <h2 className="text-[13px] font-bold">Read Me</h2>
              <p>
                Patina OS is Aqua × millennium for coding agents. A pack isn&apos;t a browser extension and doesn&apos;t touch
                sites you visit. It changes what your agent builds: install one in a project and whatever Claude Code,
                Cursor or Codex makes there comes out with some taste, instead of Inter on a grey card. This desktop is
                built with <strong>Y2K</strong>, the first pack: Aqua in millennium colours.
              </p>
              <ol className="flex list-decimal flex-col gap-2 pl-5">
                <li>
                  Install the pack in your project:
                  <Mono className="y2k-field my-1 block px-[6px] py-1">
                    {INIT}
                  </Mono>
                  That adds <Mono>DESIGN.md</Mono>, the pack&apos;s components and the <Mono>/y2k-ify</Mono> and{" "}
                  <Mono>/check-y2k</Mono> skills.
                </li>
                <li>
                  Ask your agent for whatever you need, say &ldquo;make a settings page&rdquo;. It reads DESIGN.md and
                  builds the page in Aqua, in your tone.
                </li>
                <li>
                  For a page you already have, run <Mono>/y2k-ify</Mono> and the agent rebuilds it with the pack&apos;s
                  components. <Mono>/check-y2k</Mono> catches AI defaults that creep back in.
                </li>
              </ol>
              <p>More in Help › Patina Help.</p>
              </div>
            </WindowScrollArea>
            <WindowFooter className="pt-3">
              <SaveDialog defaultName="Read Me" onSaved={({ name, where }) => setSavedNote(`Saved “${name}” to ${where}`)}>
                <Button>Save…</Button>
              </SaveDialog>
              <Button isDefault onClick={() => close("readme")}>OK</Button>
            </WindowFooter>
          </DesktopWindow>
        )}

        {wins.help.open && !wins.help.minimized && (
          <DesktopWindow
            {...winProps("help")}
            initial={{ x: 240, y: 72 }}
            className="md:h-[460px] md:w-[520px]"
          >
            <WindowScrollArea className="bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]">
              <div className="flex flex-col gap-3 px-6 py-5 text-[12px] leading-[1.6]">
                <h2 className="flex items-center gap-2 text-[13px] font-bold">
                  <InfoIcon className="size-8" />
                  Patina Help
                </h2>
                <p>
                  Patina OS is Aqua × millennium for coding agents. Install a pack in a project and whatever Claude
                  Code, Cursor or Codex builds there follows the pack&apos;s style, instead of the usual Inter on a grey
                  card. Y2K is the first pack: Mac OS X Aqua in five millennium colours. This desktop is built with it.
                </p>

                <h3 className="mt-1 font-bold">Install</h3>
                <p>Run this in a React project that uses Tailwind (a new create-next-app is fine):</p>
                <Mono className="y2k-field block px-[6px] py-1">{INIT}</Mono>
                <p>
                  It first asks which of the five tones you want (or pass <Mono>--tone aqua</Mono>, say). Then it
                  puts <Mono>DESIGN.md</Mono> at the root of the project, the pack&apos;s components in{" "}
                  <Mono>components/ui</Mono>, the <Mono>/y2k-ify</Mono> and <Mono>/check-y2k</Mono> skills in{" "}
                  <Mono>.claude/skills</Mono>, the tone on your <Mono>&lt;html&gt;</Mono>, and a note in{" "}
                  <Mono>CLAUDE.md</Mono> and <Mono>AGENTS.md</Mono> that tells your agent to read DESIGN.md before it
                  builds any UI. Files you already have are left alone
                  unless you add <Mono className="whitespace-nowrap">--force</Mono>.
                </p>
                <p>
                  Lucida Grande belongs to Apple, so it isn&apos;t in the pack. Macs already have it. Everywhere else the
                  pack falls back to Lato, which you add from Google Fonts.
                </p>
                <p>If you only want one component, shadcn can fetch it on its own:</p>
                <Mono className="y2k-field block px-[6px] py-1 break-all">
                  npx shadcn@latest add {process.env.NEXT_PUBLIC_REGISTRY}/window.json
                </Mono>

                <h3 className="mt-1 font-bold">Build something</h3>
                <p>
                  Ask your agent the way you normally would, for example &ldquo;make a settings page&rdquo;. It reads
                  DESIGN.md first and builds the page from the pack&apos;s windows, buttons and controls.
                </p>

                <h3 className="mt-1 font-bold">Restyle a page you already have</h3>
                <p>
                  Run <Mono>/y2k-ify</Mono> in your agent. It rebuilds the page with the pack&apos;s components and
                  keeps what the page does (same routes, same data), then runs <Mono>/check-y2k</Mono> on what it
                  changed. Your other pages keep building meanwhile, because the pack&apos;s Button accepts shadcn&apos;s
                  variant and size names.
                </p>

                <h3 className="mt-1 font-bold">Check before you ship</h3>
                <p>
                  <Mono>/check-y2k</Mono>, or <Mono className="whitespace-nowrap">node scripts/check-y2k.mjs .</Mono> in a terminal, reads the rules
                  out of DESIGN.md and lists every place the page slips back to the defaults: grey cards, the
                  purple-to-blue gradient, thin-line icons. It exits with an error when it finds one, so it can run in CI.
                </p>

                <h3 className="mt-1 font-bold">Change the tone</h3>
                <p>
                  There are five: Y2K pink, Aqua, Lime, Tangerine and Grape. The tone colours the gel, the selection
                  and the wallpaper. The installer sets the one you pick on <Mono>&lt;html&gt;</Mono>; to change it
                  later, edit <Mono>data-tone</Mono> there, e.g. <Mono>&lt;html data-tone=&quot;aqua&quot;&gt;</Mono>.
                  Here, choose one from the ★ menu or open Tone Preferences.
                </p>

                <h3 className="mt-1 font-bold">Using this desktop</h3>
                <p>
                  Double-click an icon to open it and drag a window by its title bar. The three lights at the top left
                  close, minimise and zoom. Everything else is in the Dock. The Design System app shows the pack&apos;s
                  components, colours and type, and{" "}
                  <button type="button" onClick={openWin("design")} className={cn("cursor-pointer", LINK)}>
                    DESIGN.md
                  </button>{" "}
                  has the rules in full.
                </p>

                <h3 className="mt-1 font-bold">Source</h3>
                <p>
                  The code is on GitHub:{" "}
                  <a href="https://github.com/livisliving/Patina" target="_blank" rel="noopener noreferrer" className={LINK}>
                    github.com/livisliving/Patina
                  </a>
                </p>
              </div>
            </WindowScrollArea>
          </DesktopWindow>
        )}

        {wins.buttons.open && !wins.buttons.minimized && (
          <DesktopWindow
            {...winProps("buttons")}
            initial={{ x: 200, y: 110 }}
            className="md:h-[480px] md:w-[560px]"
            toolbar={
              <WindowToolbar>
                <span className="text-[12px] text-(--y2k-ink-secondary)">Components</span>
                <SearchField value={dsQuery} onChange={setDsQuery} className="ml-auto w-40" placeholder="Filter" />
              </WindowToolbar>
            }
          >
            <WindowScrollArea>
              <DesignSystem query={dsQuery} tone={tone} onTone={setTone} />
            </WindowScrollArea>
            <WindowFooter>
              <Button onClick={openWin("window")}>Show Dialogue…</Button>
              <Button isDefault onClick={() => close("buttons")}>OK</Button>
            </WindowFooter>
          </DesktopWindow>
        )}

        {wins.window.open && !wins.window.minimized && (
          <DesktopWindow
            {...winProps("window")}
            initial={{ x: 360, y: 150 }}
            className="md:w-[340px]"
          >
            <WindowBody className="flex gap-3 pt-5">
              <HeartIcon className="size-12 shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
              <div className="flex flex-col gap-1">
                <p className="text-[13px] font-bold">This is a Window.</p>
                <p className="text-[12px] text-(--y2k-ink-secondary)">
                  Drag it by the title bar. It has the pinstripes, the three traffic lights and a gel
                  default button, and your agent gets the same window from <Mono>Window</Mono> in the registry.
                </p>
              </div>
            </WindowBody>
            <WindowFooter>
              <Button isDefault onClick={() => close("window")}>OK</Button>
            </WindowFooter>
          </DesktopWindow>
        )}

        {wins.design.open && !wins.design.minimized && (
          <DesktopWindow
            {...winProps("design")}
            initial={{ x: 260, y: 96 }}
            className="md:h-[440px] md:w-[520px]"
          >
            <WindowScrollArea className="bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]">
              {/* Body is set in the Aqua UI face (Lucida Grande), not the mono
                  face — only the inline code spans stay monospaced. This is a
                  readable digest of the repo's DESIGN.md: the same rules and
                  the same literal values, in the order an agent needs them.
                  Keep the two in sync. */}
              <div className="flex flex-col gap-3 px-6 py-5 font-(family-name:--y2k-font-ui) text-[12px] leading-[1.6]">
                <h2 className="text-[13px] font-bold">DESIGN.md</h2>
                <p className="text-(--y2k-ink-secondary)">
                  This is the spec your coding agent reads. <Mono>{INIT}</Mono> puts the full file in
                  your project, with the <Mono>/y2k-ify</Mono> and <Mono>/check-y2k</Mono> skills. What follows is a
                  shorter version.
                </p>

                <h3 className="mt-1 font-bold"># Two layers</h3>
                <p>
                  <strong>Structure</strong> is Mac OS X Aqua from 2000 to 2005, and it is the same in every tone:
                  pinstriped windows, three glossy traffic lights at the top left, a centred bold title, soft drop
                  shadows, gel controls and a translucent Dock. <strong>Tone</strong> is the colour of everything made
                  of gel: buttons, the selection, the scroll thumb and the wallpaper. There are five, and{" "}
                  <Mono>data-tone</Mono> on <Mono>&lt;html&gt;</Mono> picks one. Don&apos;t mix two tones on one
                  screen, and don&apos;t colour text with a tone.
                </p>

                <h3 className="mt-1 font-bold"># Grid</h3>
                <p>
                  Everything except text snaps to a <strong>4px</strong> grid: spacing, sizes, radii and offsets. There
                  are three exceptions: 1px hairlines, the 2 or 3px highlights on gel, and Aqua 10.0&apos;s own
                  measurements (menu bar 22px, title bar 26px, traffic lights 13px, scroll bar 15px, push button 20px,
                  check box cell 15 × 16px, pop-up gem 21px and a few more), each with a named token in DESIGN.md.{" "}
                  <strong>Font sizes don&apos;t snap.</strong> They stay at the sizes Apple used.
                </p>

                <h3 className="mt-1 font-bold"># Colours</h3>
                <p>
                  The base colours are Y2K pink <Mono>#e8449a</Mono>, aqua <Mono>#4d83d2</Mono>,
                  lime <Mono>#7fc31c</Mono>, tangerine <Mono>#e8891a</Mono> and grape{" "}
                  <Mono>#7a3aba</Mono>. The gradients on gel, tabs, controls and progress bars were read off rendered
                  10.0 controls, one pixel row at a time. Aqua uses those rows as they are; the other tones keep each
                  row&apos;s lightness and chroma and swap in their own hue. Alternate list rows, selected text and the
                  focus ring (the light tone at 55%) change with the tone as well.
                </p>
                <p>
                  Some colours never change: ink <Mono>#000000</Mono>, secondary ink{" "}
                  <Mono>#4b4b4b</Mono>, disabled <Mono>#8d8d8d</Mono>, window pinstripe{" "}
                  <Mono>#dedede</Mono>, field <Mono>#ffffff</Mono> and window rim <Mono>#7f7f7f</Mono>. The traffic
                  lights are red, yellow and green in every tone. The full table is in the Colours group of the Design
                  System app.
                </p>

                <h3 className="mt-1 font-bold"># Type</h3>
                <p>
                  Lucida Grande comes first, then open-source Lato on machines that aren&apos;t Macs, then the system
                  sans. EB Garamond is only for the wordmark, at 44px, as gel text. Code is Monaco at 11px. Aqua uses
                  three sizes: 11px for small text (status bars, placards, segments, toolbar labels), 12px for group
                  box captions (bold) and list rows, and 13px for everything else, with window titles and headings in
                  bold. The one extra is the Dock&rsquo;s name label, 14px bold. Use sentence case everywhere.{" "}
                  <strong>No Inter, Geist, Roboto, Helvetica or system-ui.</strong> That neutral look is what this pack
                  is here to replace.
                </p>

                <h3 className="mt-1 font-bold"># Materials</h3>
                <p>
                  Controls are white gel or tone gel. Every window surface is pinstriped, title and menu bars included.
                  iTunes-style windows are brushed metal, and hero surfaces are translucent plastic or chrome. Only
                  windows, menus, the Dock and gel have shadows. There are no cards, so there are no card shadows.
                </p>

                <h3 className="mt-1 font-bold"># Shapes</h3>
                <p>
                  Push buttons are capsules. Windows have 8px corners on top and 6px below; group boxes, tab panels and
                  menus 5px; segmented controls and pop-ups 4px; folder tabs 7px on top; text fields 2px and search
                  fields 10px. Check boxes and progress bars are square. Icons are 64px glossy objects with a gloss
                  cap, never a thin-line set.
                </p>

                <h3 className="mt-1 font-bold"># Components</h3>
                <p>
                  Push buttons are 20px tall and at least 68px wide, with a 13px regular label in black on gel and a
                  deep, soft shadow. Each window has one default button, in the tone gel; the throb it does in dialogues
                  is optional. Tabs are folder tabs on a panel, the selected one in light tone gel with black text.
                  Group boxes set their bold 12px caption into the top border. Dialogues <em>are</em> windows, with
                  right-aligned labels, Cancel to the left of the default button and the button row at the bottom
                  right. Status bars are left-aligned. A window that loses focus keeps its shadow and its title bar
                  turns translucent grey. Scroll bars have an arrow at each end, and a second bar runs along the bottom
                  when the content is too wide. Progress bars are square and ribbed while they run, and show the Aqua
                  barber pole when there&apos;s no telling how long the wait is. The Dock magnifies on hover and puts a
                  black triangle under apps that are running.
                </p>

                <h3 className="mt-1 font-bold"># Don&apos;t</h3>
                <p>
                  <Mono>/check-y2k</Mono> fails on any of these: grey cards and zinc or slate surfaces; the
                  purple-to-blue AI gradient; 8 to 16px card radii; shadows on anything that isn&apos;t a window; thin-line
                  icons; tinted pinstripes or traffic lights; two tones on one screen; a page layout (hero, centred
                  column, three-up feature grid, footer of link columns); muted helper text under every field.
                </p>
              </div>
            </WindowScrollArea>
            <WindowFooter>
              <Button isDefault onClick={() => close("design")}>OK</Button>
            </WindowFooter>
          </DesktopWindow>
        )}

        {wins.changelog.open && !wins.changelog.minimized && (
          <DesktopWindow
            {...winProps("changelog")}
            initial={{ x: 300, y: 128 }}
            className="md:h-[360px] md:w-[440px]"
          >
            <WindowScrollArea className="bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]">
              <div className="flex flex-col gap-3 px-6 py-5 text-[12px] leading-[1.6]">
                <h2 className="text-[13px] font-bold">Changelog</h2>
                {CHANGELOG.map((entry) => (
                  <div key={entry.version}>
                    <p className="font-bold">{`${entry.version} — ${entry.date}`}</p>
                    <ul className="mt-1 flex list-disc flex-col gap-1 pl-5 text-(--y2k-ink-secondary)">
                      {entry.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </WindowScrollArea>
            <WindowFooter>
              <Button isDefault onClick={() => close("changelog")}>OK</Button>
            </WindowFooter>
          </DesktopWindow>
        )}

        {wins.terminal.open && !wins.terminal.minimized && (
          <DesktopWindow
            {...winProps("terminal")}
            material="metal"
            initial={{ x: 340, y: 160 }}
            className="md:h-[300px] md:w-[480px]"
          >
            <TerminalSession files={finderItems} onOpen={(file) => openItem(file, ["Patina HD"])} />
          </DesktopWindow>
        )}

        {wins.tone.open && !wins.tone.minimized && (
          <DesktopWindow
            {...winProps("tone")}
            initial={{ x: 420, y: 190 }}
            className="md:h-[360px] md:w-[480px]"
            toolbar={
              <WindowToolbar>
                <SearchField value={toneQuery} onChange={setToneQuery} placeholder="" className="ml-auto w-36" />
              </WindowToolbar>
            }
          >
            <WindowScrollArea>
              <WindowBody className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <PrefsIcon className="size-12 shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
                <p className="text-[11px] text-(--y2k-ink-secondary)">
                  Five colour families from 1998 to 2006. Pick one and the gel, the selection, the Dock icons and the wallpaper all change to match. The traffic lights stay red, yellow and green.
                </p>
              </div>
              {(() => {
                const tq = toneQuery.trim().toLowerCase()
                const shown = tq ? TONES.filter((t) => t.label.toLowerCase().includes(tq)) : TONES
                if (shown.length === 0) {
                  return <p className="py-4 text-center text-[12px] text-(--y2k-ink-secondary)">No tones match “{toneQuery}”.</p>
                }
                return (
                  <div className="flex justify-center gap-2 rounded-[8px] bg-white px-3 py-4 sm:gap-4 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.2)]" role="radiogroup" aria-label="Tone">
                    {shown.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        role="radio"
                        aria-checked={tone === t.id}
                        onClick={() => setTone(t.id)}
                        data-tone={t.id}
                        className="group flex max-w-[60px] min-w-0 flex-1 cursor-default flex-col items-center gap-1 outline-none"
                      >
                        <span
                          className={cn(
                            "relative size-9 overflow-hidden rounded-full bg-(image:--y2k-tone-button-fluid)",
                            "shadow-[inset_0_0_0_1px_var(--y2k-tone-button-edge),inset_0_0_6px_color-mix(in_srgb,var(--y2k-tone-button-edge)_50%,transparent),0_2px_3px_rgba(0,0,0,0.35)]",
                            "group-hover:brightness-105 group-focus-visible:outline-3 group-focus-visible:outline-(--y2k-tone-focus)",
                            tone === t.id && "outline-3 outline-offset-1 outline-black/40"
                          )}
                        />
                        <span className="text-[11px] whitespace-nowrap">{t.label}</span>
                      </button>
                    ))}
                  </div>
                )
              })()}
              <WindowWell className="rounded-[8px] px-3 py-2 text-[12px]">
                <strong>{currentTone.label}</strong> · {currentTone.era}
                <br />
                {currentTone.blurb}
              </WindowWell>
              <p className="text-[11px] text-(--y2k-ink-secondary)">
                Where the colours come from: the Y2K palette (hot pink, baby blue, chrome, lime, black), the iMac G3 flavours of 1998 to 2001, and McBling, 2001 to 2006.
              </p>
            </WindowBody>
            </WindowScrollArea>
            <WindowFooter>
              <Button isDefault onClick={() => close("tone")}>OK</Button>
            </WindowFooter>
          </DesktopWindow>
        )}

        {/* The iPod plays on while minimized, so it stays mounted (hidden)
            until it is closed or ejected. */}
        {wins.ipod.open && (
          <DesktopWindow
            {...winProps("ipod")}
            material="metal"
            // Bottom left: 16px in, and its 400px 16px above the Dock's shelf.
            initial={() => {
              if (typeof window === "undefined") return { x: 16, y: 96 }
              const dock = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--y2k-dock-h")) || 70
              return { x: 16, y: down4(Math.max(32, window.innerHeight - dock - 400 - 16)) }
            }}
            // The same place in CSS, for the paint before the page wakes.
            className={cn(
              "md:top-[round(down,max(32px,100dvh_-_var(--y2k-dock-h)_-_416px),4px)] md:left-4 md:h-[400px] md:w-[600px]",
              wins.ipod.minimized && "hidden"
            )}
          >
            <IPod onEject={ejectIPod} hidden={wins.ipod.minimized} />
          </DesktopWindow>
        )}
      </main>

      <Dock
        items={[
          { id: "finder", label: "Finder", icon: <FaceIcon />, running: wins.finder.open, onClick: openWin("finder") },
          { id: "readme", label: "Read Me", icon: <NoteIcon />, running: wins.readme.open, onClick: openWin("readme") },
          { id: "tone", label: "Tone Preferences", icon: <PrefsIcon />, running: wins.tone.open, onClick: openWin("tone") },
          { id: "buttons", label: "Design System", icon: <PillIcon />, running: wins.buttons.open, onClick: openWin("buttons") },
          { id: "design", label: "DESIGN.md", icon: <DocIcon />, running: wins.design.open, onClick: openWin("design") },
          { id: "terminal", label: "Terminal", icon: <TerminalIcon />, running: wins.terminal.open, onClick: openWin("terminal") },
          { id: "ipod", label: "iPod", icon: <IPodIcon />, running: wins.ipod.open, onClick: openWin("ipod") },
          // Minimized windows get their own tiles on the right (after a divider),
          // like Mac OS X's minimized-window section. Click to restore.
          ...minimizedWindows.map((id, i) => ({
            id: `min:${id}`,
            label: titleOf(id),
            icon: WINDOWS[id].icon,
            running: true,
            minimized: true,
            dividerBefore: i === 0,
            onClick: openWin(id),
          })),
          { id: "trash", label: "Bin", icon: <TrashIcon />, dividerBefore: true, onClick: () => setTrashOpen(true) },
        ]}
      />

      {/* The Bin: empty. A controlled Aqua dialog, opened from the Dock. */}
      <Window open={trashOpen} onOpenChange={setTrashOpen}>
        <WindowContent
          title="Bin"
          description="The Bin is empty."
          className="w-[min(calc(100%-2rem),22rem)]"
        >
          <WindowBody className="flex items-center gap-3 pt-5">
            <TrashIcon className="size-12 shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
            <p className="text-[13px]">The Bin is empty.</p>
          </WindowBody>
          <WindowFooter>
            <WindowClose asChild>
              <Button isDefault>OK</Button>
            </WindowClose>
          </WindowFooter>
        </WindowContent>
      </Window>
    </div>
  )
}
