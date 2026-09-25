"use client"

import * as React from "react"

import { genie } from "@/components/ui/dock"
import { ICONS } from "@/components/ui/icons"
import type { DocumentEntry, Entry, Img, Movie, Site } from "@/lib/content"

import { findNode, indexSite, type Node } from "./disk"
import { DocIcon, FaceIcon, IPodIcon, NoteIcon } from "./icons"
import { PATINA } from "./patina"
import { WindowActionsProvider, useWindows, type Place, type Point, type WinEntry, type WinSpec } from "./windows"

/**
 * The desktop's state, for anything that opens a window from anywhere — a
 * thumbnail in a document opening Preview, a row in the Finder opening a
 * document, a Dock tile bringing a window back. `useDesktop()` is the whole
 * of it: the site, the windows, the Finder's place, and the open-* helpers.
 */

/** What a document window holds: the document, and its Finder path (the
 *  volume, then file names) — what the address names while it is in front. */
export type DocumentPayload = { doc: DocumentEntry; path: string[] }

/** The applications that run only while they have a window: in the Dock
 *  while they do, as a running app was in 10.0. */
export const TRANSIENT_APPS = ["Preview", "QuickTime Player"]

/** The apps' icons: About <app> shows one. */
export const APP_ICONS: Record<string, React.ReactNode> = {
  Finder: <FaceIcon />,
  TextEdit: <NoteIcon />,
  Preview: <ICONS.preview />,
  "QuickTime Player": <ICONS.quicktime />,
  iPod: <IPodIcon />,
}

/** The desktop at load, worked out from the screen so a 1280 × 800 one gets
 *  the same picture: the About box at the left (x 40, y 56, 448 wide), the
 *  Finder beside it (640 wide, or down to 512 on a narrower screen), the
 *  iPod (when there is one) under the Finder, 16px above the Dock — the
 *  Finder and the iPod both clear of the desktop icons (84px, 12px from the
 *  right edge, so 96px). A screen too short for the Finder's 400 over the
 *  iPod's 400 takes height from the Finder (down to 288) and lets the iPod
 *  overlap its foot by up to 48px. Below 768 wide or 480 tall (DESKTOP)
 *  none of this applies: the windows stack. Every value on the 4px grid. */
const ICON_COLUMN = 96
const ABOUT_W = 448
const FINDER_SIZE = { w: 640, h: 400 }
/** The narrowest the Finder opens: names cut from the middle, so a
 *  folder's Name column still reads beside the Kind sidebar down to here. */
const FINDER_MIN_W = 512
const IPOD_SIZE = { w: 600, h: 400 }
const down4 = (n: number) => Math.floor(n / 4) * 4

export function loadLayout(ipod = true): { finder: Point & { w: number; h: number }; ipod: Point } {
  if (typeof window === "undefined") return { finder: { x: 512, y: 56, ...FINDER_SIZE }, ipod: { x: 16, y: 96 } }
  const dock = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--y2k-dock-h")) || 70
  // The windows' right edge: 16px short of the icons.
  const right = window.innerWidth - ICON_COLUMN - 16
  const at = { x: down4(Math.max(16, right - IPOD_SIZE.w)), y: down4(Math.max(32, window.innerHeight - dock - IPOD_SIZE.h - 16)) }
  // 640 wide where the screen has room beside the About box, down to 512.
  const w = down4(Math.max(FINDER_MIN_W, Math.min(FINDER_SIZE.w, right - (40 + ABOUT_W + 24))))
  // With no iPod under it, the Finder may run down to 16px above the Dock.
  const foot = ipod ? at.y + 48 : window.innerHeight - dock - 16
  const finder = {
    x: down4(Math.max(64, Math.min(40 + ABOUT_W + 24, right - w))),
    y: 56,
    w,
    h: down4(Math.min(FINDER_SIZE.h, Math.max(288, foot - 56))),
  }
  return { finder, ipod: at }
}

/** loadLayout's sums in CSS, for the first paint (see `Place`): the same
 *  numbers out of 100vw and 100dvh, rounded down to the grid, so the
 *  windows paint where they will stay instead of in a heap at the top left
 *  until the page wakes. Keep the two in step. */
const RIGHT = `(100vw - ${ICON_COLUMN + 16}px)`
const FLOOR = `(100dvh - var(--y2k-dock-h, 70px) - 16px)`
const IPOD_Y = `round(down, max(32px, ${FLOOR} - ${IPOD_SIZE.h}px), 4px)`
const FINDER_W = `round(down, max(${FINDER_MIN_W}px, min(${FINDER_SIZE.w}px, ${RIGHT} - ${40 + ABOUT_W + 24}px)), 4px)`
const loadPlace = (ipod: boolean): Record<"about" | "finder" | "ipod", Place> => ({
  about: { left: "40px", top: "56px" },
  finder: {
    left: `round(down, max(64px, min(${40 + ABOUT_W + 24}px, ${RIGHT} - ${FINDER_W})), 4px)`,
    top: "56px",
    width: FINDER_W,
    height: `round(down, min(${FINDER_SIZE.h}px, max(288px, ${ipod ? `${IPOD_Y} + 48px` : FLOOR} - 56px)), 4px)`,
  },
  ipod: { left: `round(down, max(16px, ${RIGHT} - ${IPOD_SIZE.w}px), 4px)`, top: IPOD_Y },
})

/** An id inside a quoted attribute selector: only the quote and the
 *  backslash need escaping (a Preview's id carries a path). */
const attr = (id: string) => id.replace(/["\\]/g, "\\$&")

/** Two Finder paths to the same place. */
export const samePath = (a: string[], b: string[]) => a.length === b.length && a.every((label, i) => label === b[i])

type Desktop = {
  site: Site
  /** The volume's name ("Olivia HD"): the Finder's root and the first
   *  desktop icon. */
  volume: string
  /** Every entry with its titles and its Finder path (disk.tsx). */
  nodes: Node[]
  /** The About box's title: the site's About entry's, or About <owner>. */
  aboutTitle: string
  windows: WinEntry[]
  frontId: string | null
  /** Open a window; one already open comes to the front, out of the Dock
   *  (through the genie) if it was there. */
  open: (spec: WinSpec, at?: Point | (() => Point)) => void
  /** Bring an open window to the front by id, out of the Dock if need be. */
  show: (id: string) => void
  close: (id: string) => void
  focus: (id: string) => void
  minimize: (id: string) => void
  zoom: (id: string) => void
  /** The Finder, at a place if one is given. */
  openFinder: (path?: string[]) => void
  /** Open an entry as a double-click does. `path` is its Finder path (the
   *  volume, then file names): a folder opens there in the Finder, a
   *  document in TextEdit, an alias opens its target — the same window,
   *  never a second one. */
  openEntry: (entry: Entry, path: string[]) => void
  /** The entry at a path of titles (an alias's `to`, a featured path). */
  openTitles: (titles: string[]) => void
  openImage: (img: Img) => void
  openVideo: (movie: Movie) => void
  openAbout: () => void
  /** About <app>: the front app's first menu item. */
  openAppInfo: (app: string) => void
  /** The ★ menu's About Patina OS. */
  openPatina: () => void
  /** The iPod, when the desktop has one. */
  openIPod: () => void
  /** A document window's id, for the Dock's running triangles. */
  documentId: (path: string[]) => string
  /** Where the Finder is: the labels from Computer down. In the column
   *  view it is also the selection, one row per column, and may end on a
   *  file. */
  finderPath: string[]
  canGoBack: boolean
  /** Go somewhere, leaving the place for Back. */
  navigate: (path: string[]) => void
  /** Set the path without a step for Back: the column view picking a file. */
  setFinderPath: (path: string[]) => void
  goBack: () => void
}

const DesktopContext = React.createContext<Desktop | null>(null)

export function useDesktop() {
  const desktop = React.useContext(DesktopContext)
  if (!desktop) throw new Error("useDesktop() needs the DesktopProvider above it.")
  return desktop
}

const documentId = (path: string[]) => `doc:${path.join("/")}`

export function DesktopProvider({ site, volume, ipod = false, children }: { site: Site; volume: string; ipod?: boolean; children: React.ReactNode }) {
  const nodes = React.useMemo(() => indexSite(site, volume), [site, volume])
  const aboutTitle = site.entries.find((e) => e.type === "about")?.title ?? `About ${site.owner}`

  // The resident windows. The About box is the Finder's, as About This Mac
  // is; the iPod is on the desktop from the start, under the Finder.
  const finderSpec = React.useMemo<WinSpec>(() => ({ id: "finder", kind: "finder", app: "Finder", name: "Finder", title: volume, icon: <FaceIcon /> }), [volume])
  const aboutSpec = React.useMemo<WinSpec>(
    () => ({ id: "about", kind: "about", app: "Finder", name: aboutTitle, title: aboutTitle, icon: <FaceIcon />, closeOnly: true }),
    [aboutTitle]
  )
  const ipodSpec = React.useMemo<WinSpec>(() => ({ id: "ipod", kind: "ipod", app: "iPod", name: "iPod", title: "iPod", icon: <IPodIcon /> }), [])
  const ipodAt = React.useCallback((): Point => loadLayout(ipod).ipod, [ipod])

  // At load: the About box in front, the Finder at the volume beside it,
  // the iPod under the Finder. They stay in this order in the registry, so
  // on a phone they stack as they always have.
  const { wins, focus, open: place, close, minimize: park, zoom, frontId } = useWindows(() => {
    const at = loadPlace(ipod)
    return [
      { ...finderSpec, at: () => loadLayout(ipod).finder, place: at.finder, z: 1, minimized: false },
      ...(ipod ? [{ ...ipodSpec, at: ipodAt, place: at.ipod, z: 2, minimized: false }] : []),
      { ...aboutSpec, at: { x: 40, y: 56 }, place: at.about, z: 3, minimized: false },
    ]
  })
  // The registry as the handlers last saw it: they run after a commit, so
  // reading it through a ref keeps them stable.
  const winsRef = React.useRef(wins)
  React.useEffect(() => {
    winsRef.current = wins
  }, [wins])

  // Minimising pours the window into its Dock tile; bringing a minimised
  // window back pours it out again.
  const minimize = React.useCallback(
    (id: string) => {
      const el = document.querySelector(`[data-window-id="${attr(id)}"]`)
      if (el) void genie(el, `[data-dock-id="min:${attr(id)}"]`)
      park(id)
    },
    [park]
  )
  const open = React.useCallback(
    (spec: WinSpec, at?: Point | (() => Point)) => {
      const current = winsRef.current.find((w) => w.id === spec.id)
      const tile = current?.minimized ? document.querySelector(`[data-dock-id="min:${attr(spec.id)}"]`) : null
      if (tile) void genie(`[data-window-id="${attr(spec.id)}"]`, tile.getBoundingClientRect(), { reverse: true })
      place(spec, at)
    },
    [place]
  )
  const show = React.useCallback(
    (id: string) => {
      const current = winsRef.current.find((w) => w.id === id)
      if (current) open(current)
    },
    [open]
  )

  // Where the Finder is, and the places Back returns to, the latest last —
  // one state, so every step is a pure update (a setState inside another's
  // updater runs twice under StrictMode and pushed each place twice).
  const [nav, setNav] = React.useState<{ path: string[]; history: string[][] }>(() => ({ path: [volume], history: [] }))
  const navigate = React.useCallback((path: string[]) => {
    // Going where the Finder already is leaves nothing for Back.
    setNav((n) => (samePath(n.path, path) ? n : { path, history: [...n.history, n.path] }))
  }, [])
  const setFinderPath = React.useCallback((path: string[]) => setNav((n) => ({ ...n, path })), [])
  const goBack = React.useCallback(() => {
    setNav((n) => {
      const previous = n.history.at(-1)
      return previous ? { path: previous, history: n.history.slice(0, -1) } : n
    })
  }, [])

  const openFinder = React.useCallback(
    (path?: string[]) => {
      if (path) navigate(path)
      open(finderSpec)
    },
    [navigate, open, finderSpec]
  )
  const openImage = React.useCallback(
    (img: Img) => open({ id: `preview:${img.src}`, kind: "preview", app: "Preview", name: img.name, title: img.name, icon: APP_ICONS.Preview, payload: img }),
    [open]
  )
  const openVideo = React.useCallback(
    (movie: Movie) =>
      open({ id: `player:${movie.src}`, kind: "player", app: "QuickTime Player", name: movie.name, title: movie.name, icon: APP_ICONS["QuickTime Player"], payload: movie }),
    [open]
  )
  const openAbout = React.useCallback(() => open(aboutSpec), [open, aboutSpec])
  const openEntry = React.useCallback(
    (entry: Entry, path: string[]) => {
      // An alias opens its target, at the target's own path: one window.
      const node = entry.type === "alias" ? findNode(nodes, entry.to) : { entry, path }
      if (!node) return
      const { entry: it, path: at } = node
      switch (it.type) {
        case "collection":
          return openFinder(at)
        case "about":
          return openAbout()
        case "picture":
          return openImage(it.image)
        case "movie":
          return openVideo(it.movie)
        case "document": {
          // Titled with its file name, suffix and all, as TextEdit titles a
          // document; the Window menu and a minimised tile read the same name.
          const name = at.at(-1) ?? it.title
          return open({ id: documentId(at), kind: "document", app: "TextEdit", name, title: name, icon: <DocIcon />, payload: { doc: it, path: at } satisfies DocumentPayload })
        }
      }
    },
    [nodes, open, openFinder, openAbout, openImage, openVideo]
  )
  const openTitles = React.useCallback(
    (titles: string[]) => {
      const node = findNode(nodes, titles)
      if (node) openEntry(node.entry, node.path)
    },
    [nodes, openEntry]
  )
  const openAppInfo = React.useCallback(
    (app: string) => {
      const title = app === "Finder" ? "About The Finder" : `About ${app}`
      open({ id: `about:${app}`, kind: "about", app, name: title, title, icon: APP_ICONS[app] ?? <FaceIcon />, closeOnly: true, payload: { app } })
    },
    [open]
  )
  const openPatina = React.useCallback(() => {
    const title = `About ${PATINA.name}`
    open({ id: "about:patina", kind: "about", app: "Finder", name: title, title, icon: <FaceIcon />, closeOnly: true, payload: { patina: true } })
  }, [open])
  const openIPod = React.useCallback(() => ipod && open(ipodSpec, ipodAt), [ipod, open, ipodSpec, ipodAt])

  const actions = React.useMemo(() => ({ frontId, focus, close, minimize, zoom }), [frontId, focus, close, minimize, zoom])

  return (
    <DesktopContext.Provider
      value={{
        site,
        volume,
        nodes,
        aboutTitle,
        windows: wins,
        frontId,
        open,
        show,
        close,
        focus,
        minimize,
        zoom,
        openFinder,
        openEntry,
        openTitles,
        openImage,
        openVideo,
        openAbout,
        openAppInfo,
        openPatina,
        openIPod,
        documentId,
        finderPath: nav.path,
        canGoBack: nav.history.length > 0,
        navigate,
        setFinderPath,
        goBack,
      }}
    >
      <WindowActionsProvider value={actions}>{children}</WindowActionsProvider>
    </DesktopContext.Provider>
  )
}

/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
