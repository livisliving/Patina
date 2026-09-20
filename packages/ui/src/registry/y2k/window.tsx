"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Patina Window — DESIGN.md › Components › Window (Dialog).
 *
 * A Mac OS X Aqua window: pinstripes (or brushed metal), a 22px title bar
 * with three 13px traffic lights and a centered title, a 0.5px hairline
 * border, 0.45rem corners and a deep soft shadow when in front.
 *
 *   <WindowFrame title="…" material="pinstripe" | "metal">   on the desktop
 *   <Window><WindowTrigger/><WindowContent title="…">        a modal (Radix Dialog)
 */

/* ── Traffic lights ───────────────────────────────────────────────── */

const LIGHTS = {
  close: { color: "red", glyph: "M2.5 2.5l5 5M7.5 2.5l-5 5", label: "Close" },
  minimize: { color: "yellow", glyph: "M2 5h6", label: "Minimize" },
  zoom: { color: "green", glyph: "M5 2v6M2 5h6", label: "Zoom" },
} as const

type LightKind = keyof typeof LIGHTS

function TrafficLight({
  kind,
  active = true,
  onClick,
  wrapper,
}: {
  kind: LightKind
  active?: boolean
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  wrapper?: (button: React.ReactElement) => React.ReactNode
}) {
  const light = LIGHTS[kind]
  const hit = (
    <button
      type="button"
      aria-label={light.label}
      data-slot="window-light"
      className="absolute -inset-2 z-10 cursor-default opacity-0 outline-none"
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(e)
      }}
      onPointerDown={(e) => e.stopPropagation()}
    />
  )
  return (
    <div className="relative size-[14px]" data-kind={kind}>
      <div
        aria-hidden="true"
        className={cn(
          "relative box-border size-[14px] overflow-hidden rounded-full transition-[filter] duration-150",
          active ? "group-hover/lights:brightness-110" : "opacity-70"
        )}
        style={{
          background: active ? `var(--y2k-light-${light.color})` : "var(--y2k-light-off)",
          boxShadow: active
            ? `var(--y2k-light-${light.color}-shadow)`
            : "var(--y2k-light-off-shadow)",
        }}
      >
        {/* Top specular: a small, sharp, high white dot — the Aqua wet-gel
            glint. Kept tight (not a wash over half the sphere) so the saturated
            body dominates and the light reads crisp, not like a generic orb. */}
        <div
          className="pointer-events-none absolute top-[1px] left-1/2 z-[2] h-[32%] w-[52%] -translate-x-1/2 rounded-[50%]"
          style={{ background: "radial-gradient(ellipse at 50% 38%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 45%, rgba(255,255,255,0) 72%)" }}
        />
        {/* Bottom bounce: a faint upward rim-light, dimmer than the specular so
            it doesn't flatten the sphere. */}
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 z-[2] h-[30%] w-[68%] -translate-x-1/2 rounded-[50%] blur-[0.3px]"
          style={{ background: "radial-gradient(ellipse at 50% 82%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.12) 55%, rgba(255,255,255,0) 100%)" }}
        />
        {/* Glyph on hover of the whole group */}
        {active && (
          <svg
            viewBox="0 0 10 10"
            className="pointer-events-none absolute inset-0 z-[1] size-full opacity-0 transition-opacity duration-150 group-hover/lights:opacity-100"
            style={{
              color: `var(--y2k-light-${light.color}-glyph)`,
              filter: "drop-shadow(0 0.5px 0 rgba(255,255,255,0.2))",
            }}
            aria-hidden="true"
          >
            <path d={light.glyph} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          </svg>
        )}
      </div>
      {wrapper ? wrapper(hit) : hit}
    </div>
  )
}

type WindowLightsProps = {
  active?: boolean
  onClose?: () => void
  onMinimize?: () => void
  onZoom?: () => void
  /** Wrap the close hit-area (the Dialog variant wraps it in DialogPrimitive.Close). */
  closeWrapper?: (button: React.ReactElement) => React.ReactNode
}

function WindowLights({ active = true, onClose, onMinimize, onZoom, closeWrapper }: WindowLightsProps) {
  return (
    <div data-slot="window-lights" className="group/lights relative ml-1.5 flex items-center gap-2">
      <TrafficLight kind="close" active={active} onClick={onClose} wrapper={closeWrapper} />
      <TrafficLight kind="minimize" active={active} onClick={onMinimize} />
      <TrafficLight kind="zoom" active={active} onClick={onZoom} />
    </div>
  )
}

/* ── Frame parts ──────────────────────────────────────────────────── */

type Material = "pinstripe" | "metal"

function WindowTitleBar({
  className,
  active = true,
  material = "pinstripe",
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & { active?: boolean; material?: Material }) {
  const metal = material === "metal"
  return (
    <div
      data-slot="window-titlebar"
      data-active={active}
      className={cn(
        "relative flex h-(--y2k-titlebar-h) shrink-0 items-center px-[0.1rem] py-[0.1rem] select-none",
        !metal && (active ? "border-b border-(--y2k-titlebar-border)" : "border-b border-(--y2k-titlebar-border-inactive)"),
        className
      )}
      style={{
        // The inactive title bar is genuinely translucent to the desktop
        // behind the window (Aqua sends a backgrounded window's chrome
        // see-through) — NOT opacity, which would only reveal the opaque
        // window body. The frame root no longer paints behind the title bar,
        // so this alpha composites against the wallpaper.
        ...(metal
          ? {}
          : active
            ? { backgroundColor: "var(--y2k-window-bg)", backgroundImage: "var(--y2k-pinstripe-titlebar), var(--y2k-pinstripe)" }
            : { backgroundColor: "var(--y2k-titlebar-inactive-bg)", backgroundImage: "var(--y2k-pinstripe-inactive)" }),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

function WindowTitleText({
  className,
  as,
  active = true,
  material = "pinstripe",
  style,
  ...props
}: React.ComponentProps<"span"> & { as?: React.ElementType; active?: boolean; material?: Material }) {
  const Comp = as ?? "span"
  return (
    <Comp
      data-slot="window-title"
      className={cn(
        "pointer-events-none absolute left-1/2 flex h-full max-w-[calc(100%-140px)] -translate-x-1/2 items-center overflow-hidden px-2 text-ellipsis whitespace-nowrap",
        "font-(family-name:--y2k-font-ui) text-[13px] font-medium",
        active ? "text-(--y2k-ink)" : "text-(--y2k-ink-dim)",
        className
      )}
      style={{
        textShadow: !active
          ? "none"
          : material === "metal"
            ? "0 1px 0 rgba(255,255,255,0.7)"
            : "0 1px 0 rgba(255,255,255,0.6)",
        ...style,
      }}
      {...props}
    />
  )
}

/** A toolbar row under the title bar (Show All, search, view buttons). */
function WindowToolbar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="window-toolbar"
      className={cn("flex shrink-0 items-center gap-2 border-b border-(--y2k-separator) px-2 py-1.5", className)}
      {...props}
    />
  )
}

/** The classic 10.x Finder toolbar item: a big icon with a label, no button chrome. */
function WindowToolbarItem({
  className,
  icon,
  children,
  ...props
}: React.ComponentProps<"button"> & { icon: React.ReactNode }) {
  return (
    <button
      type="button"
      data-slot="window-toolbar-item"
      className={cn(
        "flex w-14 cursor-default flex-col items-center gap-0.5 rounded-[4px] py-1 outline-none",
        "font-(family-name:--y2k-font-ui) text-[11px] leading-none text-(--y2k-ink)",
        "hover:bg-black/[0.06] active:bg-black/[0.12] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-(--y2k-tone-focus)",
        className
      )}
      {...props}
    >
      <span className="flex size-8 items-center justify-center [&_svg]:size-8 [&_svg]:drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">{icon}</span>
      {children}
    </button>
  )
}

function WindowBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="window-body"
      className={cn(
        "p-4 font-(family-name:--y2k-font-ui) text-[13px] leading-[1.45] text-(--y2k-ink)",
        className
      )}
      {...props}
    />
  )
}

/** Button row: right-aligned, Cancel to the left of the default, 12px apart. */
function WindowFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="window-footer"
      className={cn("flex flex-wrap items-center justify-end gap-3 px-4 pt-1 pb-4", className)}
      {...props}
    />
  )
}

/** White content area inside a window (a document, a list, a file grid). */
function WindowWell({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="window-well"
      className={cn(
        "bg-(--y2k-input-bg) shadow-[inset_0_1px_2px_rgba(0,0,0,0.25),0_0_0_1px_var(--y2k-input-border)]",
        className
      )}
      {...props}
    />
  )
}

/** Aqua group box: a faint rounded well with a bold caption. */
function WindowGroup({
  className,
  label,
  children,
  ...props
}: React.ComponentProps<"fieldset"> & { label: React.ReactNode }) {
  return (
    <fieldset
      data-slot="window-group"
      className={cn(
        "mt-1 rounded-[8px] bg-black/[0.04] px-3 pt-2 pb-3 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]",
        className
      )}
      {...props}
    >
      <legend className="px-1 font-(family-name:--y2k-font-ui) text-[11px] font-bold text-(--y2k-ink)">
        {label}
      </legend>
      {children}
    </fieldset>
  )
}

function WindowStatusBar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="window-statusbar"
      className={cn(
        "flex h-[16px] shrink-0 items-center justify-center border-t border-(--y2k-separator) px-3 font-(family-name:--y2k-font-ui) text-[10px] text-(--y2k-ink-secondary)",
        className
      )}
      {...props}
    />
  )
}

/* ── Aqua scrollbar + scroll area ─────────────────────────────────── */

/** Scrollbar geometry. ARROW_H MUST match the arrow button's `h-[15px]` class;
 *  the track math (clientHeight − ARROWS_H) depends on it. */
const ARROW_H = 15
const ARROWS_H = ARROW_H * 2
const MIN_THUMB = 24
const ARROW_STEP = 40

/** A single up/down arrow button for the scrollbar. `dir` is -1 (up) or 1 (down). */
function ScrollArrow({ dir, onScrollBy }: { dir: 1 | -1; onScrollBy: (delta: number) => void }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden="true"
      onPointerDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onScrollBy(dir * ARROW_STEP)
      }}
      className={cn(
        "relative flex h-[15px] w-full cursor-default items-center justify-center bg-(image:--y2k-scrollbar-arrow) text-(--y2k-ink)",
        "shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.7)] active:brightness-90"
      )}
    >
      <svg viewBox="0 0 10 10" className="size-2" aria-hidden>
        {dir === -1 ? <path d="M5 3l3 4H2z" fill="currentColor" /> : <path d="M5 7L2 3h6z" fill="currentColor" />}
      </svg>
    </button>
  )
}

/** The paired up/down arrow box at the far end of the (vertical) scrollbar. */
function ScrollArrows({ onScrollBy }: { onScrollBy: (delta: number) => void }) {
  return (
    <div className="flex shrink-0 flex-col">
      <ScrollArrow dir={-1} onScrollBy={onScrollBy} />
      <ScrollArrow dir={1} onScrollBy={onScrollBy} />
    </div>
  )
}

/**
 * A scrollable region with the classic Aqua scrollbar: a grooved trough, a
 * tone-tinted gel thumb, and paired arrow buttons at the far end. Wraps native
 * overflow, so scrolling (wheel, keyboard, drag) is real; the visuals are ours.
 */
function WindowScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = React.useState({ show: false, thumb: 0, top: 0 })
  const drag = React.useRef<{ y: number; scroll: number } | null>(null)

  const measure = React.useCallback(() => {
    const el = viewportRef.current
    if (!el) return
    const { scrollHeight, clientHeight, scrollTop } = el
    const show = scrollHeight > clientHeight + 1
    const trackH = clientHeight - ARROWS_H
    const thumb = show ? Math.max(MIN_THUMB, (clientHeight / scrollHeight) * trackH) : 0
    const maxScroll = scrollHeight - clientHeight
    const top = maxScroll > 0 ? (scrollTop / maxScroll) * (trackH - thumb) : 0
    setMetrics({ show, thumb, top })
  }, [])

  React.useEffect(() => {
    measure()
    const el = viewportRef.current
    if (!el) return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    for (const c of Array.from(el.children)) ro.observe(c)
    return () => ro.disconnect()
  }, [measure])

  const onThumbDown = (e: React.PointerEvent) => {
    const el = viewportRef.current
    if (!el) return
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { y: e.clientY, scroll: el.scrollTop }
  }
  const onThumbMove = (e: React.PointerEvent) => {
    const el = viewportRef.current
    if (!drag.current || !el) return
    const trackH = el.clientHeight - ARROWS_H
    const maxScroll = el.scrollHeight - el.clientHeight
    const dy = e.clientY - drag.current.y
    el.scrollTop = drag.current.scroll + (dy / (trackH - metrics.thumb)) * maxScroll
  }
  const onThumbUp = (e: React.PointerEvent) => {
    drag.current = null
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }
  const scrollBy = (delta: number) => {
    viewportRef.current?.scrollBy({ top: delta })
  }

  return (
    <div data-slot="window-scrollarea" className={cn("relative flex min-h-0 flex-1", className)} {...props}>
      <div
        ref={viewportRef}
        data-slot="window-scroll-viewport"
        onScroll={measure}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {metrics.show && (
        <div
          data-slot="window-scrollbar"
          className="flex w-(--y2k-scrollbar-size) shrink-0 flex-col bg-(image:--y2k-scrollbar-trough) shadow-[inset_1px_0_0_rgba(0,0,0,0.25)]"
        >
          <div className="relative min-h-0 flex-1">
            <button
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              onPointerDown={onThumbDown}
              onPointerMove={onThumbMove}
              onPointerUp={onThumbUp}
              onPointerCancel={onThumbUp}
              className="absolute inset-x-[2px] cursor-default rounded-full bg-(image:--y2k-scrollbar-thumb) shadow-(--y2k-scrollbar-thumb-shadow)"
              style={{ height: metrics.thumb, top: metrics.top, touchAction: "none" }}
            />
          </div>
          <ScrollArrows onScrollBy={scrollBy} />
        </div>
      )}
    </div>
  )
}

/** The diagonal-hatch resize grip in a window's bottom-right corner. Spread
 *  `gripProps` (from a useResize-style hook) to make it drag-resize. */
function WindowResizeGrip({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="window-resize-grip"
      role="presentation"
      className={cn(
        "absolute right-0 bottom-0 z-[3] size-[15px] cursor-nwse-resize",
        className
      )}
      style={{ touchAction: "none" }}
      {...props}
    >
      <svg viewBox="0 0 15 15" className="size-full" aria-hidden>
        <g stroke="rgba(0,0,0,0.45)" strokeWidth="1" strokeLinecap="round">
          <path d="M13 5L5 13M13 8.5L8.5 13M13 12L12 13" />
        </g>
        <g stroke="rgba(255,255,255,0.7)" strokeWidth="1" strokeLinecap="round" transform="translate(-1,-1)">
          <path d="M13 5L5 13M13 8.5L8.5 13M13 12L12 13" />
        </g>
      </svg>
    </div>
  )
}

type WindowFrameProps = Omit<React.ComponentProps<"div">, "title"> &
  Omit<WindowLightsProps, "active"> & {
    title: React.ReactNode
    active?: boolean
    material?: Material
    /** Rendered between the title bar and the body (a toolbar, a tab strip). */
    toolbar?: React.ReactNode
    status?: React.ReactNode
    /** Custom title element (the Dialog variant passes DialogPrimitive.Title). */
    titleAs?: React.ElementType
    /** Props for the title bar — the drag handle lives here. */
    titleBarProps?: React.ComponentProps<"div">
    /** Render the bottom-right Aqua resize grip; spread the drag handlers. */
    resizeGripProps?: React.ComponentProps<"div">
  }

function WindowFrame({
  className,
  title,
  titleAs,
  active = true,
  material = "pinstripe",
  toolbar,
  status,
  onClose,
  onMinimize,
  onZoom,
  closeWrapper,
  titleBarProps,
  resizeGripProps,
  children,
  ...props
}: WindowFrameProps) {
  const metal = material === "metal"
  return (
    <div
      data-slot="window"
      data-active={active}
      data-material={material}
      className={cn(
        "relative flex flex-col overflow-hidden border-[0.5px] text-(--y2k-ink)",
        // Official Aqua: standard 10.0 windows round the TOP corners only
        // (square bottom); the textured/metal window (10.2) rounds all four.
        // The frame root does NOT paint the opaque pinstripe body — that lives
        // on window-content — so an inactive title bar's translucent fill
        // composites against the desktop, not against the window body.
        metal ? "y2k-metal rounded-(--y2k-window-radius)" : "rounded-t-(--y2k-window-radius)",
        active
          ? "border-(--y2k-window-border) shadow-(--y2k-shadow-window)"
          : "border-(--y2k-window-border-inactive) shadow-(--y2k-shadow-window-inactive)",
        // Brushed metal gets its inset rim light on top of everything
        metal && active && "after:pointer-events-none after:absolute after:inset-0 after:z-[2] after:rounded-[inherit] after:shadow-(--y2k-metal-inset) after:content-['']",
        className
      )}
      {...props}
    >
      <WindowTitleBar active={active} material={material} {...titleBarProps}>
        <WindowLights
          active={active}
          onClose={onClose}
          onMinimize={onMinimize}
          onZoom={onZoom}
          closeWrapper={closeWrapper}
        />
        <WindowTitleText as={titleAs} active={active} material={material}>
          {title}
        </WindowTitleText>
      </WindowTitleBar>
      {/* Below the title bar, the pinstripe body is painted here (not on the
          frame root) so the inactive title bar alone stays translucent-to-
          desktop. Metal is the exception: `.y2k-metal` paints its opaque body
          on the root, so metal windows aren't see-through when inactive. */}
      <div className={cn("flex min-h-0 flex-1 flex-col", !metal && "bg-(image:--y2k-pinstripe)")}>
        {toolbar}
        <div data-slot="window-content" className="flex min-h-0 flex-1 flex-col">
          {children}
        </div>
        {status != null && <WindowStatusBar>{status}</WindowStatusBar>}
      </div>
      {resizeGripProps && <WindowResizeGrip {...resizeGripProps} />}
    </div>
  )
}

/* ── Dialog: the modal window (Radix Dialog) ─────────────────────── */

function Window({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="window-dialog" {...props} />
}

function WindowTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="window-trigger" {...props} />
}

function WindowClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="window-close" {...props} />
}

function WindowOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="window-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/10",
        "data-[state=open]:animate-[y2k-fade-in_var(--y2k-duration-window)_ease-out] motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  )
}

type WindowContentProps = React.ComponentProps<typeof DialogPrimitive.Content> & {
  title: React.ReactNode
  /** Screen-reader description. Rendered visually hidden. */
  description?: React.ReactNode
  material?: Material
  toolbar?: React.ReactNode
  status?: React.ReactNode
  showClose?: boolean
}

function WindowContent({
  className,
  title,
  description,
  material,
  toolbar,
  status,
  showClose = true,
  children,
  ...props
}: WindowContentProps) {
  return (
    <DialogPrimitive.Portal data-slot="window-portal">
      <WindowOverlay />
      <DialogPrimitive.Content
        data-slot="window-dialog-content"
        {...(description ? {} : { "aria-describedby": undefined })}
        className={cn(
          "fixed top-1/2 left-1/2 z-50 w-[min(calc(100%-2rem),30rem)] -translate-x-1/2 -translate-y-1/2 outline-none",
          "data-[state=open]:animate-[y2k-window-in_var(--y2k-duration-window)_var(--y2k-ease-aqua)] motion-reduce:animate-none",
          className
        )}
        {...props}
      >
        <WindowFrame
          title={title}
          titleAs={DialogPrimitive.Title}
          material={material}
          toolbar={toolbar}
          status={status}
          closeWrapper={showClose ? (button) => <DialogPrimitive.Close asChild>{button}</DialogPrimitive.Close> : undefined}
        >
          {description && (
            <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
          )}
          {children}
        </WindowFrame>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export {
  Window,
  WindowTrigger,
  WindowClose,
  WindowOverlay,
  WindowContent,
  WindowFrame,
  WindowTitleBar,
  WindowTitleText,
  WindowLights,
  TrafficLight,
  WindowToolbar,
  WindowToolbarItem,
  WindowBody,
  WindowFooter,
  WindowWell,
  WindowGroup,
  WindowStatusBar,
  WindowScrollArea,
  WindowResizeGrip,
  type Material as WindowMaterial,
}
