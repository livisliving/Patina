/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Patina Window — DESIGN.md › Components › Window (Dialog).
 *
 * A Mac OS X 10.0 Aqua window: pinstripes (or brushed metal), a 26px title
 * bar with three 13px traffic lights 5px apart and a bold centred title, a
 * 1px #7f7f7f border, 8px top / 6px bottom corners and a soft drop shadow.
 *
 *   <WindowFrame title="…" material="pinstripe" | "metal">   on the desktop
 *   <Window><WindowTrigger/><WindowContent title="…">        a modal (Radix Dialog)
 */

/* ── Traffic lights ───────────────────────────────────────────────── */

const LIGHTS = {
  close: { color: "red", glyph: "M2.5 2.5l5 5M7.5 2.5l-5 5", label: "Close" },
  minimize: { color: "yellow", glyph: "M2 5h6", label: "Minimise" },
  zoom: { color: "green", glyph: "M5 2v6M2 5h6", label: "Zoom" },
} as const

type LightKind = keyof typeof LIGHTS

function TrafficLight({
  kind,
  active = true,
  disabled = false,
  onClick,
  as,
}: {
  kind: LightKind
  active?: boolean
  /** A light the window can't use: the plain gel, as in an inactive
   *  window, and no glyph. */
  disabled?: boolean
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  /** What renders the hit area: a button, or the Dialog's Close (which
   *  renders one and closes the dialog). A component rather than asChild,
   *  which shadcn rewrites for Base UI projects. */
  as?: React.ElementType
}) {
  const light = LIGHTS[kind]
  const lit = active && !disabled
  const Hit = as ?? "button"
  const hit = (
    <Hit
      type="button"
      aria-label={light.label}
      data-slot="window-light"
      disabled={disabled}
      className="absolute -inset-2 z-10 cursor-default opacity-0 outline-none"
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        onClick?.(e)
      }}
      onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
    />
  )
  return (
    <div className="group/light relative size-(--y2k-light-size) rounded-full has-focus-visible:shadow-(--y2k-focus-ring)" data-kind={kind}>
      <div
        aria-hidden="true"
        className={cn(
          "relative box-border size-(--y2k-light-size) overflow-hidden rounded-full shadow-(--y2k-light-shadow)",
          lit ? "active:shadow-(--y2k-light-shadow-active)" : "opacity-55"
        )}
        style={{ backgroundImage: lit ? `var(--y2k-light-${light.color})` : "var(--y2k-light-off)" }}
      >
        {/* The glyph shows while the pointer is over the group, and on the
            light the keyboard is on. */}
        {lit && (
          <svg
            viewBox="0 0 10 10"
            className="pointer-events-none absolute inset-0 z-[1] size-full opacity-0 group-hover/lights:opacity-100 group-has-focus-visible/light:opacity-100"
            style={{ color: `var(--y2k-light-${light.color}-glyph)` }}
            aria-hidden="true"
          >
            <path d={light.glyph} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          </svg>
        )}
      </div>
      {hit}
    </div>
  )
}

type WindowLightsProps = {
  active?: boolean
  onClose?: () => void
  onMinimize?: () => void
  onZoom?: () => void
  /** False for a window that only closes (an About box): yellow and green
   *  turn to the plain gel and do nothing. */
  minimizable?: boolean
  zoomable?: boolean
  /** What renders the close light's hit area (the Dialog variant passes DialogPrimitive.Close). */
  closeAs?: React.ElementType
}

function WindowLights({ active = true, onClose, onMinimize, onZoom, minimizable = true, zoomable = true, closeAs }: WindowLightsProps) {
  return (
    <div data-slot="window-lights" className="group/lights relative flex items-center gap-(--y2k-light-gap)">
      <TrafficLight kind="close" active={active} onClick={onClose} as={closeAs} />
      <TrafficLight kind="minimize" active={active} disabled={!minimizable} onClick={onMinimize} />
      <TrafficLight kind="zoom" active={active} disabled={!zoomable} onClick={onZoom} />
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
        "relative flex h-(--y2k-titlebar-h) shrink-0 items-center gap-2 px-2 select-none",
        // Unfocused, the rows are 75% grey with nothing under them, so the
        // desktop shows faintly through the title bar. Metal paints its own.
        !metal && (active ? "bg-(image:--y2k-titlebar)" : "bg-(image:--y2k-titlebar-inactive)"),
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </div>
  )
}

/** The 20×12 white oval at the right end of a toolbar window's title bar;
 *  it shows or hides the toolbar. */
function WindowToolbarToggle({ className, active = true, ...props }: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      data-slot="window-toolbar-toggle"
      aria-label="Toggle toolbar"
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        "relative z-10 ml-auto h-[12px] w-[20px] shrink-0 cursor-default rounded-[6px] outline-none",
        "focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-1 focus-visible:outline-(--y2k-tone-focus)",
        "bg-(image:--y2k-toolbar-toggle) shadow-[var(--y2k-light-drop),inset_0_0_0_1px_rgba(0,0,0,0.25)]",
        "active:bg-[image:var(--y2k-gel-pressed),var(--y2k-toolbar-toggle)] active:shadow-(--y2k-light-drop-active)",
        !active && "opacity-50",
        className
      )}
      {...props}
    />
  )
}

function WindowTitleText({
  className,
  as,
  active = true,
  ...props
}: React.ComponentProps<"span"> & { as?: React.ElementType; active?: boolean }) {
  const Comp = as ?? "span"
  return (
    <Comp
      data-slot="window-title"
      className={cn(
        // Centred on the window, with the lights' width kept clear on both
        // sides (66px), so a long title ends in an ellipsis before them.
        "pointer-events-none absolute left-1/2 block h-full max-w-[calc(100%-132px)] -translate-x-1/2 truncate",
        "font-(family-name:--y2k-font-ui) text-[13px] leading-(--y2k-titlebar-h) font-bold",
        active ? "text-(--y2k-title-ink) [text-shadow:var(--y2k-title-lift)]" : "text-(--y2k-title-ink-inactive)",
        className
      )}
      {...props}
    />
  )
}

/** The toolbar strip under the title bar: white falling to #dedede over a
 *  #9a9a9a foot, items bottom-aligned 10px apart. */
function WindowToolbar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="window-toolbar"
      className={cn(
        "flex shrink-0 items-start gap-[10px] border-b border-[#9a9a9a] px-[10px] pt-[6px] pb-1",
        "bg-[linear-gradient(to_bottom,#fbfbfb_0%,#ededed_62%,#dedede_100%)]",
        "in-data-[active=false]:bg-[linear-gradient(to_bottom,#f6f6f6,#ececec)]",
        className
      )}
      {...props}
    />
  )
}

// A toolbar slot: its content over an 11px label, 2px apart.
const toolbarSlot = "flex flex-col items-center gap-[2px] px-[6px] py-[2px]"
const toolbarLabel = "font-(family-name:--y2k-font-ui) text-[11px] text-[#1e1e1e]"

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
        toolbarSlot,
        "cursor-default rounded-[4px] outline-none",
        toolbarLabel,
        "active:bg-black/10 aria-pressed:bg-black/[0.13] disabled:opacity-50 focus-visible:ring-3 focus-visible:ring-(--y2k-tone-focus)",
        className
      )}
      {...props}
    >
      <span className="flex size-8 items-center justify-center [&_svg]:size-8">{icon}</span>
      <span className="max-sm:sr-only">{children}</span>
    </button>
  )
}

/** A control in the toolbar that is not an item — the Finder's Back button,
 *  its View segments — set on the items' lines: a 32px slot centres it on
 *  their icons, its label on their labels' baseline. */
function WindowToolbarControl({ className, label, children, ...props }: React.ComponentProps<"div"> & { label: React.ReactNode }) {
  return (
    <div data-slot="window-toolbar-control" className={cn(toolbarSlot, className)} {...props}>
      <span className="flex h-8 items-center justify-center self-stretch">{children}</span>
      <span className={cn(toolbarLabel, "max-sm:sr-only")}>{label}</span>
    </div>
  )
}

/** The dotted rule that parts groups of toolbar items: 1px, 2px on and 2px
 *  off in #8f8f8f, the toolbar's full height, 4px clear either side. */
function WindowToolbarSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      data-slot="window-toolbar-separator"
      className={cn(
        "mx-1 w-px shrink-0 self-stretch bg-[linear-gradient(to_bottom,#8f8f8f_0_2px,transparent_2px_4px)] bg-size-[1px_4px]",
        className
      )}
      {...props}
    />
  )
}

function WindowBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="window-body"
      className={cn(
        "p-5 font-(family-name:--y2k-font-ui) text-[13px] leading-[1.45] text-(--y2k-ink)",
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
      className={cn("flex flex-wrap items-center justify-end gap-3 px-5 pt-1 pb-5", className)}
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
        "bg-(--y2k-input-bg) shadow-[inset_0_1px_2px_rgba(0,0,0,0.25),0_0_0_1px_var(--y2k-separator)]",
        className
      )}
      {...props}
    />
  )
}

/** Aqua group box: a faint rounded well, its bold 12px caption set into the
 *  top border 20px in. */
function WindowGroup({
  className,
  label,
  children,
  ...props
}: React.ComponentProps<"fieldset"> & { label: React.ReactNode }) {
  return (
    <fieldset
      data-slot="window-group"
      className={cn("y2k-group", className)}
      {...props}
    >
      <legend className="font-(family-name:--y2k-font-ui) text-(--y2k-ink)">{label}</legend>
      {children}
    </fieldset>
  )
}

function WindowStatusBar({ className, active = true, ...props }: React.ComponentProps<"div"> & { active?: boolean }) {
  return (
    <div
      data-slot="window-statusbar"
      className={cn(
        "flex h-(--y2k-statusbar-h) shrink-0 items-center gap-px border-t border-[#b4b4b4] px-2 py-[3px] font-(family-name:--y2k-font-ui) text-[11px] leading-[1.6] text-[#404040]",
        active ? "bg-(image:--y2k-placard)" : "bg-(image:--y2k-placard-inactive)",
        className
      )}
      {...props}
    />
  )
}

/** Aqua alert layout: a 64px icon, a bold 13px message, 11px informative
 *  text and a right-aligned button row 12px apart, all 20px in. Put it inside
 *  a Window (dialog) or a sheet. */
function WindowAlert({
  className,
  icon,
  message,
  informative,
  buttons,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  icon?: React.ReactNode
  message: React.ReactNode
  informative?: React.ReactNode
  /** The button row; Cancel left of the default, as usual. */
  buttons?: React.ReactNode
}) {
  return (
    <div data-slot="window-alert" role="alertdialog" className={cn("flex gap-4 p-5 font-(family-name:--y2k-font-ui) text-(--y2k-ink)", className)} {...props}>
      {icon && <div className="size-16 shrink-0 [&_img]:size-full [&_svg]:size-full">{icon}</div>}
      <div className="min-w-0 flex-1">
        <p className="mb-2 text-[13px] leading-[1.25] font-bold">{message}</p>
        {informative && <p className="text-[11px] leading-[1.35]">{informative}</p>}
        {buttons && <div className="mt-5 flex justify-end gap-3">{buttons}</div>}
      </div>
    </div>
  )
}

/* ── Aqua scrollbar + scroll area ─────────────────────────────────── */

/** Scrollbar geometry: 17px arrows at each end of a 15px bar. */
const ARROW = 17
const MIN_THUMB = 24
const ARROW_STEP = 40

type Axis = "y" | "x"

/** Everything that differs between the two bars. The arrow glyphs are one
 *  7×6 triangle, turned. */
const AXIS = {
  y: {
    bar: "w-(--y2k-scrollbar-size) flex-col col-start-2 row-start-1",
    arrow: "h-[17px] w-full bg-(image:--y2k-scroll-arrow)",
    arrowRule: ["shadow-[inset_0_1px_0_rgba(0,0,0,0.25),inset_0_-1px_0_rgba(0,0,0,0.35)]", "shadow-[inset_0_1px_0_rgba(0,0,0,0.35),inset_0_-1px_0_rgba(0,0,0,0.25)]"],
    glyph: ["", "rotate-180"],
    trough: "bg-(image:--y2k-scroll-track)",
    cups: ["inset-x-0 top-0 h-3 rounded-t-full shadow-[inset_0_1px_1px_rgba(0,0,0,0.3)]", "inset-x-0 bottom-0 h-3 rounded-b-full shadow-[inset_0_-1px_1px_rgba(0,0,0,0.3)]"],
    thumb: "inset-x-0 top-0 bg-(image:--y2k-tone-scroll)",
    translate: "translateY",
  },
  x: {
    bar: "h-(--y2k-scrollbar-size) flex-row col-start-1 row-start-2",
    arrow: "h-full w-[17px] bg-(image:--y2k-scroll-arrow-h)",
    arrowRule: ["shadow-[inset_1px_0_0_rgba(0,0,0,0.25),inset_-1px_0_0_rgba(0,0,0,0.35)]", "shadow-[inset_1px_0_0_rgba(0,0,0,0.35),inset_-1px_0_0_rgba(0,0,0,0.25)]"],
    glyph: ["-rotate-90", "rotate-90"],
    trough: "bg-(image:--y2k-scroll-track-h)",
    cups: ["inset-y-0 left-0 w-3 rounded-l-full shadow-[inset_1px_0_1px_rgba(0,0,0,0.3)]", "inset-y-0 right-0 w-3 rounded-r-full shadow-[inset_-1px_0_1px_rgba(0,0,0,0.3)]"],
    thumb: "inset-y-0 left-0 bg-(image:--y2k-tone-scroll-h)",
    translate: "translateX",
  },
} as const

/** One arrow button: the light face with its crease, a dark 7×6 triangle, a
 *  darker rule where it meets the trough. `end` 0 = up/left, 1 = down/right. */
function ScrollArrow({ axis, end, onScrollBy }: { axis: Axis; end: 0 | 1; onScrollBy: (delta: number) => void }) {
  const a = AXIS[axis]
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden="true"
      onPointerDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onScrollBy((end ? 1 : -1) * ARROW_STEP)
      }}
      className={cn("relative flex shrink-0 cursor-default items-center justify-center active:brightness-90", a.arrow, a.arrowRule[end])}
    >
      <svg viewBox="0 0 7 6" className={cn("h-1.5 w-[7px]", a.glyph[end])} aria-hidden>
        <path d="M3.5 0L7 6H0z" fill="#434343" />
      </svg>
    </button>
  )
}

/** One scrollbar: an arrow at each end (the 10.0 default), the grooved trough
 *  curving into cups under them, and the tone gel thumb. The thumb's size is
 *  React's; its position is written straight to `thumbRef` as the content
 *  scrolls, so scrolling never re-renders. */
function ScrollBar({
  axis,
  thumb,
  thumbRef,
  onScrollBy,
  thumbHandlers,
}: {
  axis: Axis
  thumb: number
  thumbRef: React.Ref<HTMLButtonElement>
  onScrollBy: (delta: number) => void
  thumbHandlers: React.ComponentProps<"button">
}) {
  const a = AXIS[axis]
  return (
    <div data-slot="window-scrollbar" data-axis={axis} className={cn("flex shrink-0", a.bar)}>
      <ScrollArrow axis={axis} end={0} onScrollBy={onScrollBy} />
      <div className={cn("relative min-h-0 min-w-0 flex-1", a.trough)}>
        <span aria-hidden className={cn("pointer-events-none absolute", a.cups[0])} />
        <span aria-hidden className={cn("pointer-events-none absolute", a.cups[1])} />
        <button
          ref={thumbRef}
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className={cn("absolute z-[1] cursor-default rounded-full", a.thumb)}
          style={axis === "y" ? { height: thumb, touchAction: "none" } : { width: thumb, touchAction: "none" }}
          {...thumbHandlers}
        />
      </div>
      <ScrollArrow axis={axis} end={1} onScrollBy={onScrollBy} />
    </div>
  )
}

/** Where a thumb sits: its length (0 = no bar) and its offset down the trough. */
function thumbFor(client: number, total: number, scrolled: number) {
  if (total <= client + 1) return { thumb: 0, offset: 0 }
  const trough = client - ARROW * 2
  const thumb = Math.max(MIN_THUMB, (client / total) * trough)
  return { thumb, offset: (scrolled / (total - client)) * (trough - thumb) }
}

/**
 * A scrollable region with Aqua 10.0 scrollbars: 15px, one arrow at each end,
 * a grooved trough whose ends curve into cups, the tone gel thumb. A vertical
 * bar appears when the content is too tall, a horizontal one along the foot
 * when it is too wide, and the square between them when both do. Wraps native
 * overflow, so scrolling (wheel, keyboard, drag) is real; the visuals are ours.
 * `viewportRef` hands the scrolling element to the caller.
 */
function WindowScrollArea({
  className,
  children,
  viewportRef: viewportRefProp,
  ...props
}: React.ComponentProps<"div"> & { viewportRef?: React.Ref<HTMLDivElement> }) {
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const thumbY = React.useRef<HTMLButtonElement>(null)
  const thumbX = React.useRef<HTMLButtonElement>(null)
  const [thumbs, setThumbs] = React.useState({ y: 0, x: 0 })
  const drag = React.useRef<{ axis: Axis; at: number; scroll: number } | null>(null)

  // The caller's ref gets the scrolling element without this component
  // writing to a prop.
  React.useImperativeHandle(viewportRefProp, () => viewportRef.current as HTMLDivElement, [])

  // Sizes go through React (they add or remove a bar); positions go straight
  // to the thumbs.
  const measure = React.useCallback(() => {
    const el = viewportRef.current
    if (!el) return
    const y = thumbFor(el.clientHeight, el.scrollHeight, el.scrollTop)
    const x = thumbFor(el.clientWidth, el.scrollWidth, el.scrollLeft)
    setThumbs((t) => (t.y === y.thumb && t.x === x.thumb ? t : { y: y.thumb, x: x.thumb }))
    if (thumbY.current) thumbY.current.style.transform = `${AXIS.y.translate}(${y.offset}px)`
    if (thumbX.current) thumbX.current.style.transform = `${AXIS.x.translate}(${x.offset}px)`
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
  // A bar that has just appeared needs its thumb placed.
  React.useLayoutEffect(measure, [thumbs, measure])

  const thumbHandlers = (axis: Axis): React.ComponentProps<"button"> => {
    const y = axis === "y"
    return {
      onPointerDown: (e) => {
        const el = viewportRef.current
        if (!el) return
        e.preventDefault()
        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)
        drag.current = { axis, at: y ? e.clientY : e.clientX, scroll: y ? el.scrollTop : el.scrollLeft }
      },
      onPointerMove: (e) => {
        const el = viewportRef.current
        if (!el || drag.current?.axis !== axis) return
        const trough = (y ? el.clientHeight : el.clientWidth) - ARROW * 2 - thumbs[axis]
        const max = y ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth
        const next = drag.current.scroll + (((y ? e.clientY : e.clientX) - drag.current.at) / trough) * max
        if (y) el.scrollTop = next
        else el.scrollLeft = next
      },
      onPointerUp: (e) => {
        drag.current = null
        e.currentTarget.releasePointerCapture(e.pointerId)
      },
      onPointerCancel: () => {
        drag.current = null
      },
    }
  }

  return (
    <div
      data-slot="window-scrollarea"
      className={cn("relative grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] grid-rows-[minmax(0,1fr)_auto]", className)}
      {...props}
    >
      <div
        ref={viewportRef}
        data-slot="window-scroll-viewport"
        onScroll={measure}
        className="col-start-1 row-start-1 min-h-0 min-w-0 overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {(["y", "x"] as const).map(
        (axis) =>
          thumbs[axis] > 0 && (
            <ScrollBar
              key={axis}
              axis={axis}
              thumb={thumbs[axis]}
              thumbRef={axis === "y" ? thumbY : thumbX}
              onScrollBy={(d) => viewportRef.current?.scrollBy(axis === "y" ? { top: d } : { left: d })}
              thumbHandlers={thumbHandlers(axis)}
            />
          )
      )}
      {thumbs.y > 0 && thumbs.x > 0 && (
        <span aria-hidden className="col-start-2 row-start-2 size-(--y2k-scrollbar-size) bg-(image:--y2k-scroll-track) shadow-[inset_1px_1px_0_rgba(0,0,0,0.2)]" />
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
    /** Show the title-bar toolbar toggle (the white oval) and call this on click. */
    onToolbarToggle?: () => void
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
  minimizable,
  zoomable,
  closeAs,
  titleBarProps,
  resizeGripProps,
  onToolbarToggle,
  children,
  ...props
}: WindowFrameProps) {
  const metal = material === "metal"
  // A window is a region named by its title, so a screen reader can say
  // which one it is in. A dialog's frame (titleAs) is named by its Dialog.
  const titleId = React.useId()
  return (
    <div
      data-slot="window"
      data-active={active}
      data-material={material}
      role={titleAs ? undefined : "region"}
      aria-labelledby={titleAs ? undefined : titleId}
      className={cn(
        // The system face on the frame itself, so text set straight into a
        // window (a toolbar's, a status bar's) is Aqua's without the app
        // having to set a body font.
        "relative flex flex-col overflow-hidden border font-(family-name:--y2k-font-ui) text-(--y2k-ink)",
        // Aqua 10.0 rounds the top corners 8px and the bottom 6px, on
        // pinstripe and metal alike. Focus changes only the chrome inside
        // (title bar, lights, title); the rim and the drop stay.
        "rounded-t-(--y2k-window-radius) rounded-b-(--y2k-window-radius-bottom)",
        "border-(--y2k-window-border) shadow-(--y2k-shadow-window)",
        metal && "y2k-metal",
        // Brushed metal gets its inset rim light on top of everything
        metal && active && "after:pointer-events-none after:absolute after:inset-0 after:z-[2] after:rounded-[inherit] after:shadow-(--y2k-metal-inset) after:content-['']",
        className
      )}
      {...props}
    >
      {/* A double-click on the title bar zooms, as the green light does. */}
      <WindowTitleBar
        active={active}
        material={material}
        {...titleBarProps}
        onDoubleClick={(e) => {
          titleBarProps?.onDoubleClick?.(e)
          if (zoomable !== false) onZoom?.()
        }}
      >
        <WindowLights
          active={active}
          onClose={onClose}
          onMinimize={onMinimize}
          onZoom={onZoom}
          minimizable={minimizable}
          zoomable={zoomable}
          closeAs={closeAs}
        />
        <WindowTitleText as={titleAs} active={active} id={titleAs ? undefined : titleId}>
          {title}
        </WindowTitleText>
        {onToolbarToggle && <WindowToolbarToggle active={active} onClick={onToolbarToggle} />}
      </WindowTitleBar>
      {/* The pinstripe body is painted below the title bar, not on the root:
          the title bar carries its own fill. Metal paints the root instead. */}
      <div className={cn("flex min-h-0 flex-1 flex-col", !metal && "bg-(image:--y2k-pinstripe)")}>
        {toolbar}
        <div data-slot="window-content" className="flex min-h-0 flex-1 flex-col">
          {children}
        </div>
        {status != null && <WindowStatusBar active={active}>{status}</WindowStatusBar>}
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
          closeAs={showClose ? DialogPrimitive.Close : undefined}
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
  WindowToolbarControl,
  WindowToolbarSeparator,
  WindowToolbarToggle,
  WindowAlert,
  WindowBody,
  WindowFooter,
  WindowWell,
  WindowGroup,
  WindowStatusBar,
  WindowScrollArea,
  WindowResizeGrip,
  type Material as WindowMaterial,
}
