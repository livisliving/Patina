"use client"

import * as React from "react"

import { WindowBody, WindowFrame, WindowScrollArea } from "@/components/ui/window"
import { cn } from "@/lib/utils"
import type { Img, Movie } from "@/lib/content"

import { asset } from "./asset"
import { cropStyle, croppedSize } from "./crop"
import { useDrag } from "./use-drag"
import { prefersReducedMotion, useMediaQuery } from "./use-media-query"
import { useResize } from "./use-resize"

/* ── Window manager ───────────────────────────────────────────────── */

/** What a window is: a Finder, a TextEdit document, a Preview image, a
 *  QuickTime movie, an About box — or the iPod, resident on the desktop. */
export type WinKind = "finder" | "document" | "preview" | "player" | "about" | "ipod"

export type Point = { x: number; y: number }

/** Each window's facts: the app it belongs to (the menu bar's bold name
 *  while it is in front — the owner's About box is the Finder's, as About
 *  This Mac is), its title (the Finder's follows its folder, so that one is looked up
 *  live), its plain name (the Dock tile's label, the Window menu's row), its
 *  Dock tile when minimised, whether it only closes, as About This Mac does
 *  (yellow and green greyed, nothing minimises or zooms it), and whatever
 *  it shows: an image, a movie, a document. */
export type WinSpec = {
  id: string
  kind: WinKind
  app: string
  name: string
  title: React.ReactNode
  icon: React.ReactNode
  closeOnly?: boolean
  payload?: unknown
}

/** A window that is open: its facts, where it stands in the stack, whether
 *  it is in the Dock or zoomed, and where it first opened (a function when
 *  that depends on the screen). `opened` counts up each time it is opened
 *  or brought back (from the Dock, a menu, a click in the Finder); the
 *  windows there at load have none. A focus does not change it: on a phone
 *  that is a tap to scroll. */
export type WinEntry = WinSpec & { z: number; minimized: boolean; zoomed?: boolean; at: Point | (() => Point); opened?: number }

/** New windows open cascaded 24px right and down from the last one placed;
 *  past the screen's lower right the cascade starts again at the top left. */
const CASCADE = 24
const CASCADE_START: Point = { x: 40, y: 56 }

function cascadeFrom(wins: WinEntry[]): Point {
  const last = wins.findLast((w) => typeof w.at !== "function")
  if (!last) return CASCADE_START
  const from = last.at as Point
  const next = { x: from.x + CASCADE, y: from.y + CASCADE }
  const fits = typeof window === "undefined" || (next.x < window.innerWidth - 320 && next.y < window.innerHeight - 240)
  return fits ? next : CASCADE_START
}

const put = (wins: WinEntry[], i: number, entry: WinEntry) => [...wins.slice(0, i), entry, ...wins.slice(i + 1)]

/** The registry: any number of windows, in the order they opened. */
export function useWindows(initial: () => WinEntry[]) {
  const [wins, setWins] = React.useState<WinEntry[]>(initial)
  // The stack's top; it starts above whatever the first windows were given.
  const top = React.useRef(wins.reduce((m, w) => Math.max(m, w.z), 0))
  const opened = React.useRef(0)
  const focus = React.useCallback((id: string) => {
    setWins((w) => {
      const i = w.findIndex((x) => x.id === id)
      return i < 0 || w[i].z === top.current ? w : put(w, i, { ...w[i], z: ++top.current })
    })
  }, [])
  // Open a window and bring it to the front; one already open (or minimised)
  // comes back where it was.
  const open = React.useCallback((spec: WinSpec, at?: Point | (() => Point)) => {
    setWins((w) => {
      const i = w.findIndex((x) => x.id === spec.id)
      if (i >= 0) return put(w, i, { ...w[i], minimized: false, z: ++top.current, opened: ++opened.current })
      return [...w, { ...spec, at: at ?? cascadeFrom(w), z: ++top.current, minimized: false, opened: ++opened.current }]
    })
  }, [])
  const close = React.useCallback((id: string) => {
    setWins((w) => w.filter((x) => x.id !== id))
  }, [])
  // Minimize: the window stays open (still runs, keeps its Dock triangle) but
  // is hidden until re-opened from the Dock.
  const minimize = React.useCallback((id: string) => {
    setWins((w) => {
      const i = w.findIndex((x) => x.id === id)
      return i < 0 ? w : put(w, i, { ...w[i], minimized: true })
    })
  }, [])
  // Zoom (the green light, a title-bar double-click, Window › Zoom Window)
  // toggles the window between its own size and the whole desktop.
  const zoom = React.useCallback((id: string) => {
    setWins((w) => {
      const i = w.findIndex((x) => x.id === id)
      return i < 0 ? w : put(w, i, { ...w[i], zoomed: !w[i].zoomed, z: ++top.current })
    })
  }, [])
  // The frontmost VISIBLE window (minimized windows don't drive the menu bar).
  const frontId = wins.reduce<WinEntry | null>((best, w) => (!w.minimized && (best === null || w.z > best.z) ? w : best), null)?.id ?? null
  return { wins, focus, open, close, minimize, zoom, frontId }
}

/** What every desktop window takes from the window manager. The provider
 *  hands these down, so a window only needs its own entry. */
export type WindowActions = {
  frontId: string | null
  focus: (id: string) => void
  close: (id: string) => void
  minimize: (id: string) => void
  zoom: (id: string) => void
}

const WindowActionsContext = React.createContext<WindowActions | null>(null)
export const WindowActionsProvider = WindowActionsContext.Provider

function useWindowActions() {
  const actions = React.useContext(WindowActionsContext)
  if (!actions) throw new Error("A desktop window needs the DesktopProvider above it.")
  return actions
}

/* ── A draggable, zoomable desktop window ─────────────────────────── */

/** Zoomed: the whole desktop, 8px in, between the menu bar and the Dock. */
const ZOOMED = {
  left: 8,
  top: "calc(var(--y2k-menubar-h) + 8px)",
  width: "calc(100vw - 16px)",
  height: "calc(100dvh - var(--y2k-menubar-h) - var(--y2k-dock-h) - 16px)",
} as const

/** The smallest the grip lets a window get, unless a shell says otherwise. */
const MIN = { w: 260, h: 180 }

type DesktopWindowProps = Omit<React.ComponentProps<typeof WindowFrame>, "onClose" | "onMinimize" | "onZoom" | "active" | "title"> & {
  win: WinEntry
  /** Defaults to the window's own title. */
  title?: React.ReactNode
  /** Its size until the grip is dragged; without one, the md:w-* / md:h-*
   *  classes size it. */
  defaultSize?: { w: number; h: number }
  min?: { w: number; h: number }
}

export function DesktopWindow({ win, title, defaultSize, min = MIN, className, style, ...props }: DesktopWindowProps) {
  const { frontId, focus, close, minimize, zoom } = useWindowActions()
  const fixed = win.closeOnly
  const raise = React.useCallback(() => focus(win.id), [focus, win.id])
  const { pos, handleProps } = useDrag(win.at, raise)
  const { size, gripProps } = useResize(min, raise)
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const box = size ?? defaultSize
  // On a phone the windows are one column, and a window just opened (or
  // brought back) goes to its top, the latest first, and is scrolled to —
  // else it would land under all the others and the tap seem to do nothing.
  // `order` moves it without moving it in the DOM, so nothing in it restarts.
  // The scroll goes by the window's place in the layout (offsetTop), not its
  // box on screen: a new one is still scaling in from 95%, and a 5000px
  // document mid-animation starts 120px lower than it will.
  React.useEffect(() => {
    if (isDesktop || !win.opened) return
    const el = document.querySelector<HTMLElement>(`[data-window-id="${CSS.escape(win.id)}"]`)
    if (!el) return
    let top = 0
    for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) top += n.offsetTop
    window.scrollTo({ top: Math.max(0, top - parseFloat(getComputedStyle(el).scrollMarginTop)), behavior: prefersReducedMotion() ? "auto" : "smooth" })
  }, [isDesktop, win.opened, win.id])
  // Only float (apply left/top/size) on desktop. Below md the window is in
  // normal flow (w-full) — applying the drag offsets to a relative element
  // would push it off-screen.
  const placement = !isDesktop
    ? {}
    : win.zoomed
      ? ZOOMED
      : { left: pos.x, top: pos.y, ...(box ? { width: box.w, height: box.h } : null) }
  // When zoomed, the maximized geometry comes from inline `placement`. The
  // per-window fixed-size classes (md:w-[...]/md:h-[...]) are NOT !important, so
  // inline width/height already override them — we just must not re-assert an
  // !important width/height here, or it would beat the inline maximized size.
  return (
    <WindowFrame
      data-window-id={win.id}
      title={title ?? win.title}
      active={frontId === win.id}
      onClose={() => close(win.id)}
      onMinimize={() => minimize(win.id)}
      onZoom={() => zoom(win.id)}
      minimizable={!fixed}
      zoomable={!fixed}
      titleBarProps={handleProps}
      // A window that only closes (an About box) is sized to its content and
      // has no grip, as About This Mac had none.
      resizeGripProps={isDesktop && !win.zoomed && !fixed ? gripProps : undefined}
      onPointerDownCapture={raise}
      className={cn(
        // scroll-mt: scrolled to on a phone, it clears the menu bar.
        "w-full scroll-mt-8 animate-[y2k-window-in_var(--y2k-duration-window)_var(--y2k-ease-aqua)] motion-reduce:animate-none md:absolute",
        // A minimised window stays mounted (its place, its size and what it
        // was doing survive the Dock) and hidden until it comes back.
        win.minimized && "hidden",
        className
      )}
      style={{ ...placement, zIndex: win.z, ...(isDesktop ? null : { order: -(win.opened ?? 0) }), ...style }}
      {...props}
    />
  )
}

/* ── The apps' windows ────────────────────────────────────────────── */

/** "155 KB", as the Finder and Preview print a size. */
export const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`

/** How big an image opens: inside min(80vw, its own width) × 70vh, keeping
 *  its shape, in whole pixels so the frame lands on the grid of the screen. */
export function fitImage(w: number, h: number): { w: number; h: number } {
  const maxW = typeof window === "undefined" ? 640 : Math.min(window.innerWidth * 0.8, w)
  const maxH = typeof window === "undefined" ? Infinity : window.innerHeight * 0.7
  const s = Math.min(1, maxW / w, maxH / h)
  return { w: Math.round(w * s), h: Math.round(h * s) }
}

/** What the frame adds around a body: the title bar, the status bar and the
 *  1px rim above and below (DESIGN.md's titlebar and window-statusbar). */
const CHROME_H = 26 + 24 + 2

/**
 * A TextEdit document: the pinstripe chrome round a white page — 13px text
 * 20px in, DESIGN.md's window-document — in the Aqua scroll area. `outline`
 * is the column at the left for the document's table of contents (a
 * TreeView), 192px on the pinstripe behind a hairline; `status` the bar at
 * the foot. DocumentView (document.tsx) fills the page.
 */
export function DocumentWindow({
  win,
  title,
  outline,
  status,
  className,
  children,
  ...props
}: Omit<DesktopWindowProps, "status"> & { outline?: React.ReactNode; status?: React.ReactNode }) {
  return (
    <DesktopWindow win={win} title={title} status={status} min={{ w: 320, h: 240 }} className={cn("md:h-[520px] md:w-[640px]", className)} {...props}>
      <div className="flex min-h-0 flex-1">
        {outline && <div className="hidden w-48 shrink-0 overflow-y-auto border-r border-(--y2k-separator) p-2 md:block">{outline}</div>}
        <WindowScrollArea className="bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]">
          <div className="p-5 font-(family-name:--y2k-font-ui) text-[13px] leading-[1.45] text-(--y2k-ink)">{children}</div>
        </WindowScrollArea>
      </div>
    </DesktopWindow>
  )
}

/**
 * Preview, as 10.0 shipped it: a pinstripe window titled with the file's
 * name, the picture filling the body, its size and weight in the status
 * bar. The window opens sized to the picture; shrink it and the picture
 * scrolls, as Preview's did.
 */
export function PreviewWindow({ win }: { win: WinEntry }) {
  const img = win.payload as Img
  // Sized once, when it opens: the screen it opened on is the one it fits.
  const [box] = React.useState(() => fitImage(img.w, img.h))
  return (
    <DesktopWindow
      win={win}
      defaultSize={{ w: box.w + 2, h: box.h + CHROME_H }}
      min={{ w: 240, h: 160 }}
      status={`${img.w} × ${img.h}, ${kb(img.bytes)}`}
    >
      <WindowScrollArea className="bg-white">
        <div className="flex min-h-full">
          {/* eslint-disable-next-line @next/next/no-img-element -- a plain img: sized by the window, not by next/image */}
          <img
            src={asset(img.src)}
            alt={img.alt}
            width={box.w}
            height={box.h}
            draggable={false}
            // Auto margins centre it in a bigger window and let it overflow
            // (and scroll) in a smaller one; on a phone it fits the width.
            className="m-auto block h-auto max-w-full md:max-w-none"
          />
        </div>
      </WindowScrollArea>
    </DesktopWindow>
  )
}

/**
 * QuickTime Player 5 — Aqua's first brushed-metal app: the movie on the
 * metal, titled and footed with its name. It opens 16:9 and takes the
 * movie's own frame once the metadata says what that is; the movie scales
 * with the window.
 */
export function PlayerWindow({ win }: { win: WinEntry }) {
  const movie = win.payload as Movie
  // The picture's size and proportions (the frame's, less the bars).
  const picture = (w: number, h: number) => croppedSize(w, h, movie.crop)
  const [box, setBox] = React.useState(() => {
    const p = picture(640, 360)
    return fitImage(p.w, p.h)
  })
  // The poster's proportions until the movie says its own.
  const [ratio, setRatio] = React.useState(() => {
    const p = picture(movie.poster?.w ?? 640, movie.poster?.h ?? 360)
    return p.w / p.h
  })
  return (
    <DesktopWindow
      win={win}
      material="metal"
      defaultSize={{ w: box.w + 2, h: box.h + CHROME_H }}
      min={{ w: 320, h: 240 }}
      status={movie.name}
    >
      {/* In flow (a phone) the body has no height of its own: keep the frame. */}
      <div className="relative min-h-0 flex-1 overflow-hidden [container-type:size] max-md:aspect-video">
        {/* A cropped movie sits in a clip of the picture's own proportions,
            as large as the body allows and centred in it (the metal shows
            round it when the window is another shape), the movie scaled
            and slid behind the clip so the bars stay outside it. */}
        <div
          className={movie.crop ? "absolute inset-0 m-auto overflow-hidden" : "absolute inset-0"}
          style={movie.crop ? { aspectRatio: ratio, width: `min(100cqw, calc(100cqh * ${ratio}))` } : undefined}
        >
          <video
            src={asset(movie.src)}
            poster={movie.poster ? asset(movie.poster.src) : undefined}
            controls
            playsInline
            onLoadedMetadata={(e) => {
              const p = picture(e.currentTarget.videoWidth || 640, e.currentTarget.videoHeight || 360)
              setBox(fitImage(p.w, p.h))
              setRatio(p.w / p.h)
            }}
            // max-w-none: the preflight's max-width:100% on a video would
            // hold it to the clip and bring the bars back.
            className="absolute inset-0 size-full max-w-none object-contain"
            style={cropStyle(movie.crop)}
          />
        </div>
      </div>
    </DesktopWindow>
  )
}

/** An About box: 300px, closes only, its contents centred. */
export function AboutWindow({ win, className, children }: { win: WinEntry; className?: string; children: React.ReactNode }) {
  return (
    <DesktopWindow win={win} className={cn("md:w-[300px]", className)}>
      <WindowBody className="flex flex-col items-center gap-2 pt-5 pb-5 text-center">{children}</WindowBody>
    </DesktopWindow>
  )
}
