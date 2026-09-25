/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Dock } from "@/components/ui/dock"
import { Wallpaper } from "@/components/ui/wallpaper"
import { Window, WindowBody, WindowClose, WindowContent, WindowFooter } from "@/components/ui/window"
import { cn } from "@/lib/utils"
import type { Img, Movie, Site } from "@/lib/content"

import { AboutPerson } from "./about"
import { asset } from "./asset"
import { APP_ICONS, DesktopProvider, TRANSIENT_APPS, loadLayout, samePath, useDesktop, type DocumentPayload } from "./context"
import { buildDisk, everyNode, findNode, findOpen, iconOf, type FinderItem, type Node } from "./disk"
import { DocumentView } from "./document"
import { Band, Finder, finderKey, kindsOf, resolveFinder, type FinderView, type Sort, type SortCol } from "./finder"
import { DiskIcon, DocIcon, FaceIcon, FolderIcon, IPodIcon, StarIcon, TrashIcon } from "./icons"
import { MenuBar, type MenuRow, type MenuSpec } from "./menubar"
import { MiddleTruncate } from "./middle-truncate"
import { PATINA } from "./patina"
import { readOpen, withOpen } from "./redirects"
import { TONES, type Tone } from "./tones"
import { useMarqueeSelect } from "./use-marquee-select"
import { DESKTOP, prefersReducedMotion, useMediaQuery } from "./use-media-query"
import { useTone } from "./use-tone"
import { AboutWindow, DesktopWindow, PlayerWindow, PreviewWindow, topmost, type WinEntry } from "./windows"

type IPodComponent = React.ComponentType<{ onEject: () => void; hidden?: boolean }>

type DesktopProps = {
  site: Site
  /** The volume's name: the Finder's root and the first desktop icon
   *  ("Your Name HD"). */
  volume: string
  /** Your own photos per tone, a 16:9 one and a phone one; a tone without
   *  one keeps the pack's swoosh. Paths under public/. */
  wallpaper?: Partial<Record<Tone, { desktop: string; mobile?: string }>>
  /** The `ipod` item's IPod, passed in so the desktop never imports an item
   *  that may not be installed. Without it there is no iPod. */
  ipod?: IPodComponent
  className?: string
}

/** About Patina OS: what the desktop is built with, and who built it — the
 *  ★ menu's second row, as About This Mac sat under the owner's own things. */
function AboutPatina({ tone }: { tone: Tone }) {
  return (
    <>
      <StarIcon className="size-16 drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]" />
      <h2 className="text-[13px] font-bold">{PATINA.name}</h2>
      <dl className="grid grid-cols-[auto_auto] gap-x-2 text-[11px]">
        <dt className="text-right">Taste:</dt>
        <dd className="text-left">{PATINA.taste}</dd>
        <dt className="text-right">Tone:</dt>
        <dd className="text-left">{TONES.find((t) => t.id === tone)?.label ?? tone}</dd>
        <dt className="text-right">Version:</dt>
        <dd className="text-left">{PATINA.version}</dd>
      </dl>
      <p className="mt-2 text-[11px]">
        Built by{" "}
        <a href={PATINA.site} target="_blank" rel="noopener noreferrer" className={LINK}>
          {PATINA.by}
        </a>
      </p>
    </>
  )
}

/** A text link in the About box: OS blue, underlined, its focus ring drawn. */
const LINK = "text-(--y2k-link) underline underline-offset-2 outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-(--y2k-tone-focus)"

/** Once per page, in the browser's console: what the desktop is built with. */
let signed = false
function sign() {
  if (signed) return
  signed = true
  console.info(`%c${PATINA.name}%c ${PATINA.version} — ${PATINA.taste}, built by ${PATINA.by} · ${PATINA.site}`, "font-weight: bold", "font-weight: normal")
}

/** On a phone, scroll the page to a window: by its place in the layout
 *  (offsetTop), not its box on screen — it is still scaling in from 95%,
 *  and a 5000px document mid-animation sits 120px lower than it will. */
function scrollToWindow(el: HTMLElement) {
  let top = 0
  for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) top += n.offsetTop
  const to = Math.max(0, top - parseFloat(getComputedStyle(el).scrollMarginTop))
  // Smooth for a hop; a jump for a flight (from the Finder under one
  // 5000px document to the top): smooth would take over a second, and a
  // second tap would land on moving content.
  const far = Math.abs(to - window.scrollY) > 2 * window.innerHeight
  window.scrollTo({ top: to, behavior: prefersReducedMotion() || far ? "auto" : "smooth" })
}

/**
 * A whole site as a Mac OS X 10.1 desktop: the menu bar, the volume and the
 * featured entries as icons top-right, the About box and the Finder open,
 * the Dock — every window draggable, zoomable, minimised into the Dock
 * through the genie. Everything it shows comes from `site` (lib/content.ts).
 */
export function Desktop({ site, volume, wallpaper, ipod, className }: DesktopProps) {
  return (
    <DesktopProvider site={site} volume={volume} ipod={!!ipod}>
      <DesktopShell wallpaper={wallpaper} IPod={ipod} className={className} />
    </DesktopProvider>
  )
}

/* ── Desktop ──────────────────────────────────────────────────────── */

/** At most three featured entries stand on the desktop and in the Dock. */
const FEATURED_MAX = 3

function DesktopShell({ wallpaper, IPod, className }: { wallpaper?: DesktopProps["wallpaper"]; IPod?: IPodComponent; className?: string }) {
  // The tone lives on <html data-tone>, where the layout (or the CLI) set
  // it; the ★ menu changes it there and everything that follows the tone
  // reads it back.
  const tone = useTone()
  React.useEffect(sign, [])
  const setTone = (t: Tone) => {
    document.documentElement.dataset.tone = t
  }
  const d = useDesktop()
  const { site, volume, nodes, aboutTitle, windows, frontId, show, close, focus, minimize, zoom, finderPath, canGoBack, navigate, goBack, openEntry, openAbout } = d
  const root = React.useMemo(() => [volume], [volume])

  // Stable, so the iPod (memoised) doesn't redraw on every desktop update.
  const ejectIPod = React.useCallback(() => close("ipod"), [close])

  // The Finder's search, its view, its selection set (populated by
  // single-click or the marquee drag-select) and its list order.
  const [finderQuery, setFinderQuery] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set())
  const selectOnly = React.useCallback((key: string) => setSelected(new Set([key])), [])
  const [finderView, setFinderView] = React.useState<FinderView>("icons")
  const [sort, setSort] = React.useState<Sort>(null)
  const sortBy = (col: SortCol) => setSort((s) => (s?.col === col ? { col, dir: s.dir === "ascending" ? "descending" : "ascending" } : { col, dir: "ascending" }))
  // Finder's toolbar, shown or hidden by the title bar's white oval.
  const [finderToolbar, setFinderToolbar] = React.useState(true)
  // File › Find… opens the Finder and puts the caret in its search field.
  const finderSearch = React.useRef<HTMLInputElement>(null)
  const [findAsked, setFindAsked] = React.useState(0)
  React.useEffect(() => {
    if (findAsked) finderSearch.current?.focus()
  }, [findAsked])
  // The Bin is empty — clicking it in the Dock says so.
  const [trashOpen, setTrashOpen] = React.useState(false)

  const volumes = React.useMemo(() => buildDisk(nodes, volume, { open: (n) => openEntry(n.entry, n.path), about: openAbout }), [nodes, volume, openEntry, openAbout])
  // A folder's Kind filter (its sidebar). It holds through a change of view
  // and goes back to All items once the Finder leaves that folder: it is
  // kept with the folder it was picked in, so no other folder is ever
  // drawn filtered.
  const [kindPick, setKindPick] = React.useState<{ at: string; kind: string | null } | null>(null)
  const placeKey = resolveFinder(volumes, finderPath, "", null).placePath.join("/")
  const kindFilter = kindPick?.at === placeKey ? kindPick.kind : null
  const at = resolveFinder(volumes, finderPath, finderQuery, sort, kindFilter)
  const { here, placePath, visible } = at
  const kinds = kindsOf(here?.contents ?? [])
  // Go to a folder: the Finder, at that place — unless it is showing it
  // already (a file of it may be selected in the column view), which is no
  // step for Back; then the Finder just comes to the front.
  const goTo = (path: string[]) => d.openFinder(samePath(placePath, path) ? undefined : path)
  const goPlace = (path: string[]) => !samePath(placePath, path) && navigate(path)

  // Open an item as a double-click does: a folder opens in the Finder, a file
  // opens its window. `where` is the path of the folder it sits in.
  const openItem = (it: FinderItem, where: string[]) => (it.contents ? d.openFinder([...where, it.label]) : it.onClick?.())

  const isDesktop = useMediaQuery(DESKTOP)
  // On a phone, scroll to a window as it opens (it goes to the top of the
  // column: DesktopWindow's `order`) — only when a newer one opens, so
  // closing the latest leaves the page where it is.
  const latest = windows.reduce<WinEntry | undefined>((a, w) => ((w.opened ?? 0) > (a?.opened ?? 0) ? w : a), undefined)
  const [latestId, latestOpened] = [latest?.id, latest?.opened ?? 0]
  const scrolledTo = React.useRef(0)
  React.useEffect(() => {
    if (isDesktop || !latestId || latestOpened <= scrolledTo.current) return
    // A window whose code is still loading (the iPod, a document, opened
    // before the warm-up fetched it) is not in the page yet: look again each
    // frame until it is, five seconds at most.
    let frame = 0
    let tries = 0
    const scroll = () => {
      const el = document.querySelector<HTMLElement>(`[data-window-id="${CSS.escape(latestId)}"]`)
      if (!el) {
        if (++tries < 300) frame = requestAnimationFrame(scroll)
        return
      }
      scrolledTo.current = latestOpened
      scrollToWindow(el)
    }
    scroll()
    return () => cancelAnimationFrame(frame)
  }, [isDesktop, latestId, latestOpened])
  const { band, rootProps } = useMarqueeSelect(setSelected, isDesktop, "desktop:")
  // A second, independent marquee scoped to the Finder file area.
  const { band: finderBand, rootProps: finderRootProps } = useMarqueeSelect(setSelected, true, "finder:")

  const find = (id: string) => windows.find((w) => w.id === id)
  const running = (id: string) => !!find(id)
  // An application that runs only while it has a window (Preview, QuickTime
  // Player) is in the Dock while it does, with its triangle, as a running
  // app was in 10.0; its tile brings its front window forward, or restores
  // one that was minimised. The Finder and the iPod have tiles of their own.
  const transientApps = TRANSIENT_APPS.flatMap((name) => {
    const ws = windows.filter((w) => w.app === name)
    const target = topmost(ws.filter((w) => !w.minimized)) ?? topmost(ws)
    return target ? [{ id: `app:${name}`, label: name, icon: APP_ICONS[name], running: true, onClick: () => show(target.id) }] : []
  })
  // Windows currently minimized to the Dock (open but hidden), in the order
  // they opened, for a stable Dock tile order.
  const minimizedWindows = windows.filter((w) => w.minimized)
  const titleOf = (w: WinEntry) => (w.kind === "finder" ? (here?.label ?? "Computer") : w.name)

  // The site's shape: its featured entries (as they are named, an alias
  // with its badge), the documents among them (through an alias to its
  // target) and its top-level folders.
  const featured = site.featured
    .slice(0, FEATURED_MAX)
    .map((titles) => findNode(nodes, titles, false))
    .filter((n): n is Node => !!n)
  const featuredDocs = site.featured
    .slice(0, FEATURED_MAX)
    .map((titles) => findNode(nodes, titles))
    .filter((n): n is Node => n?.entry.type === "document")
  const folders = nodes.filter((n) => n.entry.type === "collection")
  const iconFor = (n: Node) => iconOf(n.entry, n.entry.type === "alias" ? findNode(nodes, n.entry.to)?.entry : undefined)

  // Desktop icons, top-right: single click selects, double click (or File ›
  // Open) opens.
  const desktopIcons = [
    { id: "volume", label: volume, icon: <DiskIcon />, onOpen: () => goTo(root) },
    ...featured.map((n) => ({ id: n.path.join("/"), label: n.path.at(-1)!, icon: iconFor(n), onOpen: () => d.openEntry(n.entry, n.path) })),
  ]
  const places = [{ label: volume, icon: <DiskIcon />, path: root }, ...folders.map((n) => ({ label: n.path.at(-1)!, icon: <FolderIcon />, path: n.path }))]

  /* ── The menu bar, after the ★: the front app, then the Finder's menus ── */

  // The front app is the front window's; with none, the Finder.
  const front = frontId ? find(frontId) : undefined
  const app = front?.app ?? "Finder"
  const shown = windows.filter((w) => !w.minimized)
  const appWindows = windows.filter((w) => w.app === app)
  // What Hide can send to the Dock (not a window that only closes): the
  // front app's windows, or everyone else's.
  const hideable = shown.filter((w) => !w.closeOnly)
  const mine = hideable.filter((w) => w.app === app)
  const others = hideable.filter((w) => w.app !== app)
  const frontFixed = !front || !!front.closeOnly
  const finderShown = shown.some((w) => w.id === "finder")
  // What File › Open opens: the selected desktop icons and Finder items.
  const toOpen = [...selected].flatMap((key) => {
    const [where, name] = key.split(/:(.*)/)
    if (where === "desktop") return desktopIcons.filter((it) => it.id === name).map((it) => it.onOpen)
    if (where === "finder") return visible.filter((it) => finderKey(placePath, it) === key).map((it) => () => openItem(it, placePath))
    return []
  })
  const menus: MenuSpec[] = [
    {
      label: app,
      items: [
        { label: `About ${app}`, onSelect: () => d.openAppInfo(app) },
        // The Bin is always empty, so there is nothing to empty.
        ...(app === "Finder" ? (["-", { label: "Empty Bin…", shortcut: "⇧⌘⌫", disabled: true }] as MenuRow[]) : []),
        "-",
        // Hiding is minimising: the Dock is the only place a window can go.
        { label: `Hide ${app}`, shortcut: "⌘H", disabled: !mine.length, onSelect: () => mine.forEach((w) => minimize(w.id)) },
        { label: "Hide Others", disabled: !others.length, onSelect: () => others.forEach((w) => minimize(w.id)) },
        { label: "Show All", disabled: !minimizedWindows.length, onSelect: () => minimizedWindows.forEach((w) => show(w.id)) },
        // The Finder never quits.
        ...(app === "Finder" ? [] : (["-", { label: `Quit ${app}`, shortcut: "⌘Q", onSelect: () => appWindows.forEach((w) => close(w.id)) }] as MenuRow[])),
      ],
    },
    {
      label: "File",
      items: [
        { label: "New Finder Window", shortcut: "⌘N", onSelect: () => d.openFinder() },
        { label: "Open", shortcut: "⌘O", disabled: !toOpen.length, onSelect: () => toOpen.forEach((go) => go()) },
        { label: "Close Window", shortcut: "⌘W", disabled: !frontId, onSelect: () => frontId && close(frontId) },
        "-",
        {
          label: "Find…",
          shortcut: "⌘F",
          onSelect: () => {
            d.openFinder()
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
        ...places.map((p, i) => ({ label: p.label, shortcut: i === 0 ? "⌥⌘C" : undefined, onSelect: () => goTo(p.path) })),
        { label: aboutTitle, onSelect: d.openAbout },
        "-",
        {
          label: "Back",
          shortcut: "⌘[",
          disabled: !canGoBack,
          onSelect: () => {
            goBack()
            d.openFinder()
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
          onSelect: () =>
            appWindows
              .filter((w) => !w.minimized)
              .sort((a, b) => a.z - b.z)
              .forEach((w) => focus(w.id)),
        },
        // Every open window: a tick on the front one, a diamond on those in the Dock.
        ...(windows.length ? (["-"] as MenuRow[]) : []),
        ...windows.map((w) => ({ label: titleOf(w), mark: w.minimized ? "◆" : w.id === frontId ? "✓" : undefined, onSelect: () => show(w.id) })),
      ],
    },
    { label: "Help", items: [{ label: `${site.person.name} Help`, shortcut: "⌘?", onSelect: d.openAbout }] },
  ]

  /* ── The address: ?open=<path> ── */

  // At load, the window the address names (redirects.ts › readOpen) opens in
  // front of the desktop's own — a page's old URL, redirected here, opens
  // its window. A path that leads nowhere opens nothing.
  const linked = React.useRef<"opened" | "arrived" | null>(null)
  React.useEffect(() => {
    const names = readOpen(window.location.search)
    const node = names && findOpen(nodes, names, volume)
    if (!node) return
    linked.current = "opened"
    d.openEntry(node.entry, node.path)
    // Once, at load: after that the desktop is the visitor's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Then the address follows the front window — a document, a folder, a
  // picture or a movie on the disk — so a visitor can copy a link to what
  // they are looking at; with none of those in front (the About box, the
  // volume, a document's own picture) it names nothing. replaceState: no
  // navigation, no reload, nothing added to Back.
  const frontPath = ((): string[] | null => {
    switch (front?.kind) {
      case "document":
        return (front.payload as DocumentPayload).path
      case "finder":
        return placePath.length > 1 ? placePath : null
      case "preview": {
        const img = front.payload as Img
        return everyNode(nodes).find((n) => n.entry.type === "picture" && n.entry.image.src === img.src)?.path ?? null
      }
      case "player": {
        const movie = front.payload as Movie
        return everyNode(nodes).find((n) => n.entry.type === "movie" && n.entry.movie.src === movie.src)?.path ?? null
      }
      default:
        return null
    }
  })()
  const openKey = JSON.stringify(frontPath ? frontPath.slice(1) : null)
  React.useEffect(() => {
    // The render this follows still has the load's front window: the
    // linked one comes to the front in the next.
    if (linked.current === "opened") {
      linked.current = "arrived"
      return
    }
    // On a phone the windows stack, the new one last: take the visitor to it.
    if (linked.current === "arrived") {
      linked.current = null
      if (frontId && !window.matchMedia(DESKTOP).matches)
        document.querySelector(`[data-window-id="${CSS.escape(frontId)}"]`)?.scrollIntoView({ block: "start" })
    }
    const { pathname, search, hash } = window.location
    const next = withOpen(search, JSON.parse(openKey) as string[] | null)
    if (next !== search) window.history.replaceState(window.history.state, "", `${pathname}${next}${hash}`)
    // Only when what the address should name changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openKey])

  const photos = React.useMemo(
    () =>
      wallpaper &&
      Object.fromEntries(Object.entries(wallpaper).map(([t, p]) => [t, p && { desktop: asset(p.desktop), mobile: p.mobile ? asset(p.mobile) : undefined }])),
    [wallpaper]
  )

  return (
    // Clip, not hide: overflow-x: hidden would make this box a scroll
    // container that never scrolls (the page does), and a document's
    // section bar could not stick to the top of the screen on a phone.
    <div className={cn("min-h-dvh overflow-x-clip font-(family-name:--y2k-font-ui) text-(--y2k-ink)", className)}>
      {/* What the page is built with, in its <head> (React hoists it there). */}
      <meta name="generator" content={`${PATINA.name} ${PATINA.version} — built by ${PATINA.by}`} />
      <Wallpaper photos={photos} />
      <MenuBar
        tone={tone}
        onToneChange={setTone}
        owner={site.owner}
        about={{ label: aboutTitle, onSelect: d.openAbout }}
        aboutPatina={d.openPatina}
        places={places.map((p) => ({ label: p.label, onSelect: () => goTo(p.path) }))}
        home={site.home}
        menus={menus}
      />

      {/* Desktop surface: catches marquee drag-select on empty space (desktop
          only). Sits above the wallpaper, below the icons and windows. */}
      {isDesktop && (
        <div aria-hidden className="absolute inset-0 top-(--y2k-menubar-h) z-0 hidden desk:block" {...rootProps}>
          <Band rect={band} />
        </div>
      )}

      {/* Desktop icons, top-right. Single click selects; double click, or
          Enter on the keyboard, opens. */}
      <nav aria-label="Desktop" className="absolute top-9 right-3 z-[1] hidden flex-col items-center gap-3 desk:flex">
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
              onKeyDown={(e) => e.key === "Enter" && it.onOpen()}
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

      {/* The windows' own stacking context: their z-indexes climb with every
          focus and must only ever compete with each other — never with the
          Dock (80), the menu bar (90) or an open menu (100) — so `isolate`
          at 2 keeps them above the desktop icons and under all the chrome. */}
      {/* The windows: one column on a phone, the newest first (their
          `order`); two side by side on a phone held sideways, left to
          right, each as tall as it is; floating on a desktop. */}
      <main className="relative isolate z-[2] flex flex-col gap-5 px-3 pt-8 pb-24 pair:grid pair:grid-cols-2 pair:items-start desk:block desk:px-0 desk:pt-0 desk:pb-0">
        {windows.map((w) => {
          switch (w.kind) {
            case "finder":
              return (
                <Finder
                  key={w.id}
                  win={w}
                  volumes={volumes}
                  at={at}
                  path={finderPath}
                  canGoBack={canGoBack}
                  onBack={goBack}
                  onNavigate={navigate}
                  onSelectPath={d.setFinderPath}
                  view={finderView}
                  onView={setFinderView}
                  toolbar={finderToolbar}
                  onToolbarToggle={() => setFinderToolbar((v) => !v)}
                  query={finderQuery}
                  onQuery={setFinderQuery}
                  searchRef={finderSearch}
                  sort={sort}
                  onSort={sortBy}
                  kindFilter={kinds.length ? { kinds, value: kindFilter, onChange: (kind) => setKindPick({ at: placeKey, kind }) } : null}
                  selected={selected}
                  onSelect={selectOnly}
                  band={finderBand}
                  rootProps={finderRootProps}
                  onOpenItem={openItem}
                  places={[
                    ...places.map((p) => ({ label: p.label, icon: p.icon, onClick: () => goPlace(p.path) })),
                    { label: aboutTitle, icon: <FaceIcon />, onClick: d.openAbout },
                  ]}
                  initialSize={() => {
                    const { w, h } = loadLayout(!!IPod).finder
                    return { w, h }
                  }}
                />
              )
            case "about": {
              const info = w.payload as { app?: string; patina?: boolean } | undefined
              return (
                // The owner's About box is 448px — room for the panes; About <app> stays 300.
                <AboutWindow key={w.id} win={w} className={info ? undefined : "desk:w-[448px]"}>
                  {info?.patina ? (
                    <AboutPatina tone={tone} />
                  ) : info?.app ? (
                    // About <the front app>: its icon, its name, and what it runs on.
                    <>
                      <span className="size-16 [&_img]:size-full [&_svg]:size-full">{APP_ICONS[info.app] ?? <FaceIcon />}</span>
                      <p>{info.app}</p>
                      <p className="text-[11px]">
                        {PATINA.name} {PATINA.version}
                      </p>
                    </>
                  ) : (
                    <AboutPerson person={site.person} />
                  )}
                </AboutWindow>
              )
            }
            case "document":
              return <DocumentView key={w.id} win={w} doc={(w.payload as DocumentPayload).doc} />
            case "preview":
              return <PreviewWindow key={w.id} win={w} />
            case "player":
              return <PlayerWindow key={w.id} win={w} />
            case "ipod":
              // The iPod plays on while minimized, so it stays mounted (hidden)
              // until it is closed or ejected.
              return IPod ? (
                <DesktopWindow key={w.id} win={w} material="metal" className="desk:h-[400px] desk:w-[600px]">
                  <IPod onEject={ejectIPod} hidden={w.minimized} />
                </DesktopWindow>
              ) : null
          }
        })}
      </main>

      <Dock
        items={[
          // The Finder never quits (its menu has no Quit), so its triangle
          // stays even with every Finder window closed, as in 10.1.
          { id: "finder", label: "Finder", icon: <FaceIcon />, running: true, onClick: () => d.openFinder() },
          ...featuredDocs.map((n) => ({
            id: `doc:${n.path.join("/")}`,
            label: n.path.at(-1)!,
            icon: <DocIcon />,
            running: running(d.documentId(n.path)),
            onClick: () => d.openEntry(n.entry, n.path),
          })),
          // A folder in the Dock: it opens in the Finder, so it runs when the Finder does.
          ...folders.map((n) => ({ id: `folder:${n.path.join("/")}`, label: n.path.at(-1)!, icon: <FolderIcon />, running: running("finder"), onClick: () => goTo(n.path) })),
          ...(IPod ? [{ id: "ipod", label: "iPod", icon: <IPodIcon />, running: running("ipod"), onClick: d.openIPod }] : []),
          ...transientApps,
          // Minimized windows get their own tiles on the right (after a divider),
          // like Mac OS X's minimized-window section. Click to restore.
          ...minimizedWindows.map((w, i) => ({
            id: `min:${w.id}`,
            label: titleOf(w),
            icon: w.icon,
            running: true,
            minimized: true,
            dividerBefore: i === 0,
            onClick: () => show(w.id),
          })),
          { id: "trash", label: "Bin", icon: <TrashIcon />, dividerBefore: true, onClick: () => setTrashOpen(true) },
        ]}
      />

      {/* The Bin: empty. A controlled Aqua dialog, opened from the Dock. */}
      <Window open={trashOpen} onOpenChange={setTrashOpen}>
        <WindowContent title="Bin" description="The Bin is empty." className="w-[min(calc(100%-2rem),22rem)]">
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
