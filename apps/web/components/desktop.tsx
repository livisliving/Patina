"use client"

import * as React from "react"
import { DropdownMenu as Menu } from "radix-ui"
import {
  Button,
  Marquee,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  VisitorCounter,
  Window,
  WindowBody,
  WindowClose,
  WindowContent,
  WindowFooter,
  WindowFrame,
  WindowGroup,
  WindowScrollArea,
  WindowSidebar,
  WindowSidebarGroup,
  WindowSidebarItem,
  WindowToolbar,
  WindowTrigger,
  WindowWell,
  cn,
} from "@patina/ui"

import { DiskIcon, DocIcon, FaceIcon, FolderIcon, HeartIcon, NoteIcon, PillIcon, PrefsIcon, StarIcon, TerminalIcon, TrashIcon, SearchGlyph } from "./aqua-icons"
import { ChromeReflection, TranslucentPlastic } from "@patina/shaders"
import { Dock } from "./dock"
import { MenuBar } from "./menubar"
import { menuContent, menuItem } from "./menu-styles"
import { TONES, type Tone } from "./tones"
import { useDrag } from "./use-drag"
import { useMarqueeSelect } from "./use-marquee-select"
import { useMediaQuery } from "./use-media-query"
import { useResize } from "./use-resize"
import { Stars } from "./stars"
import { Wallpaper } from "./wallpaper"

/* ── Window manager ───────────────────────────────────────────────── */

type WinId = "about" | "readme" | "finder" | "buttons" | "tone" | "favourites" | "window" | "design" | "changelog" | "terminal"
type WinState = Record<WinId, { open: boolean; z: number; minimized: boolean }>

const INITIAL: WinState = {
  finder: { open: false, z: 0, minimized: false },
  about: { open: true, z: 1, minimized: false },
  readme: { open: false, z: 0, minimized: false },
  buttons: { open: false, z: 0, minimized: false },
  tone: { open: false, z: 0, minimized: false },
  favourites: { open: false, z: 0, minimized: false },
  window: { open: false, z: 0, minimized: false },
  design: { open: false, z: 0, minimized: false },
  changelog: { open: false, z: 0, minimized: false },
  terminal: { open: false, z: 0, minimized: false },
}

const APP_NAME: Record<WinId, string> = {
  finder: "Patina",
  about: "Patina",
  readme: "TextEdit",
  buttons: "Design System",
  tone: "Tone Preferences",
  favourites: "Patina",
  window: "Design System",
  design: "TextEdit",
  changelog: "TextEdit",
  terminal: "Terminal",
}

/** Icon shown on a window's minimized-tile in the Dock. */
const DOCK_ICON: Record<WinId, React.ReactNode> = {
  finder: <FaceIcon />,
  about: <HeartIcon />,
  readme: <NoteIcon />,
  buttons: <PillIcon />,
  tone: <PrefsIcon />,
  favourites: <HeartIcon />,
  window: <PillIcon />,
  design: <DocIcon />,
  changelog: <DocIcon />,
  terminal: <TerminalIcon />,
}

function useWindows() {
  const [wins, setWins] = React.useState<WinState>(INITIAL)
  const top = React.useRef(1)
  const focus = React.useCallback((id: WinId) => {
    setWins((w) => (w[id].z === top.current ? w : { ...w, [id]: { ...w[id], z: ++top.current } }))
  }, [])
  // Open (or, if minimized, restore) a window and bring it to the front.
  const open = React.useCallback((id: WinId) => {
    setWins((w) => ({ ...w, [id]: { open: true, z: ++top.current, minimized: false } }))
  }, [])
  const close = React.useCallback((id: WinId) => {
    setWins((w) => ({ ...w, [id]: { ...w[id], open: false, minimized: false } }))
  }, [])
  // Minimize: the window stays "open" (still runs, keeps its Dock triangle) but
  // is hidden until re-opened from the Dock.
  const minimize = React.useCallback((id: WinId) => {
    setWins((w) => ({ ...w, [id]: { ...w[id], minimized: true } }))
  }, [])
  // The frontmost VISIBLE window (minimized windows don't drive the menu bar).
  const frontId = (Object.keys(wins) as WinId[]).reduce<WinId | null>(
    (best, id) =>
      wins[id].open && !wins[id].minimized && (best === null || wins[id].z > wins[best].z) ? id : best,
    null
  )
  return { wins, focus, open, close, minimize, frontId }
}

/* ── A draggable, zoomable desktop window ─────────────────────────── */

type DesktopWindowProps = Omit<
  React.ComponentProps<typeof WindowFrame>,
  "onFocus" | "onClose" | "onMinimize" | "onZoom" | "active"
> & {
  id: WinId
  initial: { x: number; y: number }
  z: number
  active: boolean
  onRaise: (id: WinId) => void
  onDismiss: (id: WinId) => void
  onMinimize: (id: WinId) => void
}

function DesktopWindow({ id, initial, z, active, onRaise, onDismiss, onMinimize, className, style, ...props }: DesktopWindowProps) {
  const raise = React.useCallback(() => onRaise(id), [onRaise, id])
  const { pos, handleProps } = useDrag(initial, raise)
  const { size, gripProps } = useResize({ w: 260, h: 180 }, raise)
  const [zoomed, setZoomed] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const toggleZoom = React.useCallback(() => {
    setZoomed((v) => !v)
    raise()
  }, [raise])
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
      active={active}
      onClose={() => onDismiss(id)}
      onMinimize={() => onMinimize(id)}
      onZoom={toggleZoom}
      titleBarProps={{ ...handleProps, onDoubleClick: toggleZoom }}
      resizeGripProps={isDesktop && !zoomed ? gripProps : undefined}
      onPointerDownCapture={raise}
      className={cn(
        "w-full animate-[y2k-window-in_var(--y2k-duration-window)_var(--y2k-ease-aqua)] motion-reduce:animate-none md:absolute",
        className
      )}
      style={{ ...placement, zIndex: z, ...style }}
      {...props}
    />
  )
}

/* ── Aqua controls used by the demo ───────────────────────────────── */

/** Pop-up button: white gel, 22px, 6px corners, double chevron. Opens a real
 *  Aqua dropdown menu of `options`; the selected one shows a tick and updates
 *  the button label via `onChange`. */
function Popup({
  value,
  options,
  onChange,
  className,
}: {
  value: string
  options: string[]
  onChange?: (value: string) => void
  className?: string
}) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger asChild>
        <button
          type="button"
          className={cn(
            "relative inline-flex h-[22px] min-w-[60px] cursor-default items-center overflow-hidden rounded-[8px] py-[2px] pr-6 pl-2 text-left text-[13px] text-(--y2k-ink) outline-none",
            "bg-(image:--y2k-gel-white) shadow-(--y2k-popup-shadow) [text-shadow:0_1px_1px_rgba(255,255,255,0.5)]",
            "before:pointer-events-none before:absolute before:inset-x-px before:top-0 before:h-1/2 before:rounded-[7px_7px_0_0] before:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.4)_60%,rgba(255,255,255,0)_100%)] before:content-['']",
            "focus-visible:shadow-[var(--y2k-popup-shadow),0_0_0_3px_var(--y2k-tone-focus)] active:brightness-95 data-[state=open]:brightness-95",
            className
          )}
        >
          <span className="relative z-[1] truncate">{value}</span>
          <svg viewBox="0 0 8 10" className="absolute top-1/2 right-[8px] z-[2] h-[8px] w-2 -translate-y-1/2" aria-hidden>
            <path d="M1 3.5L4 1L7 3.5M1 6.5L4 9L7 6.5" stroke="#333" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </button>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align="start" sideOffset={4} className={cn(menuContent, "min-w-[var(--radix-dropdown-menu-trigger-width)]")}>
          <Menu.RadioGroup value={value} onValueChange={(v) => onChange?.(v)}>
            {options.map((opt) => (
              <Menu.RadioItem key={opt} value={opt} className={cn(menuItem, "pl-6")}>
                <Menu.ItemIndicator className="absolute left-1.5 text-[11px]">✓</Menu.ItemIndicator>
                {opt}
              </Menu.RadioItem>
            ))}
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  )
}

function Checkbox({ label, defaultChecked = true }: { label: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = React.useState(defaultChecked)
  return (
    <label className="inline-flex cursor-default items-center gap-2 text-[13px] select-none">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => setChecked((c) => !c)}
        className={cn(
          "relative size-[16px] overflow-hidden rounded-[3px] outline-none",
          "before:pointer-events-none before:absolute before:inset-x-px before:top-0 before:h-1/2 before:rounded-[2px_2px_0_0] before:bg-[linear-gradient(rgba(255,255,255,0.9),rgba(255,255,255,0.2))] before:content-['']",
          "focus-visible:shadow-[0_0_0_3px_var(--y2k-tone-focus)]",
          checked
            ? "bg-(image:--y2k-tone-button) shadow-[0_1px_1px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,17,49,0.6),0_0_0_0.5px_rgba(0,0,0,0.4)]"
            : "bg-(image:--y2k-gel-white) shadow-[0_1px_1px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.35),0_0_0_0.5px_rgba(0,0,0,0.4)]"
        )}
      >
        {checked && (
          <svg viewBox="0 0 14 14" className="relative z-[1] size-full" aria-hidden>
            <path d="M3 7.5l2.6 2.6L11 4.5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.4))" }} />
          </svg>
        )}
      </button>
      {label}
    </label>
  )
}

/** Aqua search field: a rounded white well with a magnifier. Controlled. */
function SearchField({
  value,
  onChange,
  className,
  placeholder = "",
}: {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}) {
  return (
    <label
      className={cn(
        "flex h-[22px] items-center gap-1.5 rounded-full bg-white pr-3 pl-2 text-[12px] text-(--y2k-ink)",
        "shadow-[inset_0_1px_2px_rgba(0,0,0,0.3),0_0_0_1px_rgba(0,0,0,0.25),0_1px_0_rgba(255,255,255,0.6)]",
        "focus-within:shadow-[inset_0_1px_2px_rgba(0,0,0,0.3),0_0_0_1px_rgba(0,0,0,0.25),0_0_0_3px_var(--y2k-tone-focus)]",
        className
      )}
    >
      <SearchGlyph className="size-3 shrink-0 text-neutral-500" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 bg-transparent outline-none placeholder:text-neutral-400"
        placeholder={placeholder}
        aria-label="Search"
      />
    </label>
  )
}

/** Per-variant styling for `Segmented`. Each variant reads in isolation:
 *  `tone` fills the selected segment with the tone gel; `view` is the Finder
 *  toolbar's View control, rebuilt 1:1 from a Mac OS X 10.2 screenshot.
 *
 *  Measured off that reference (values halved from its 2× capture): the bezel
 *  is 84 × 24 with a 6px radius and a single dark hairline; an unselected
 *  segment runs #d8d8d8 → #e7e7e7 *downwards* (darker at the top, which is what
 *  makes it read as a recessed strip rather than a gel pill); segments are
 *  parted by one #b4b4b4 hairline; glyphs are #525252 and 12px. The selected
 *  segment is the OS accent — blue in the screenshot, so the tone gel here —
 *  and its glyph stays dark, per the pack's black-ink-on-gel rule. The 6px
 *  radius and 24px height are reference metrics (the same exception the HIG
 *  chrome sizes get), not 4px-grid values. */
const SEG = {
  tone: {
    container: "shadow-(--y2k-popup-shadow) rounded-[8px]",
    cell: "h-[22px] w-7 bg-(image:--y2k-gel-white) before:pointer-events-none before:absolute before:inset-x-px before:top-0 before:h-1/2 before:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.7),rgba(255,255,255,0.25)_60%,rgba(255,255,255,0))] before:content-['']",
    firstCell: "rounded-l-[8px] before:rounded-tl-[7px]",
    lastCell: "rounded-r-[8px] before:rounded-tr-[7px]",
    divider: "shadow-[inset_1px_0_0_rgba(0,0,0,0.35)]",
    active: "bg-(image:--y2k-tone-list) text-white before:opacity-50 [&_svg]:drop-shadow-[0_1px_0_rgba(0,0,0,0.4)]",
    glyph: "[&_svg]:size-3.5 [&_svg]:text-neutral-600",
  },
  view: {
    container: "rounded-[8px] bg-[linear-gradient(to_bottom,#e7e7e7,#ffffff)] shadow-[0_0_0_1px_#adadad,0_1px_1px_rgba(0,0,0,0.12)]",
    cell: "size-6 bg-transparent",
    // The container clips, so the end segments need no radius of their own —
    // the 8px lives in exactly one place.
    firstCell: "",
    lastCell: "",
    divider: "shadow-[inset_1px_0_0_#adadad]",
    // The reference's selected segment sweeps hard from a darkened accent at
    // the top to near-white at the bottom (its blue runs rgb(16,82,165) →
    // rgb(123,173,222) → rgb(189,247,255)); these three stops are that sweep
    // expressed against the tone.
    active: "bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--y2k-tone)_80%,black)_0%,color-mix(in_srgb,var(--y2k-tone)_60%,white)_55%,color-mix(in_srgb,var(--y2k-tone)_25%,white)_100%)] shadow-[inset_1px_0_0_var(--y2k-tone-button-edge),inset_-1px_0_0_var(--y2k-tone-button-edge)]",
    glyph: "[&_svg]:h-2.5 [&_svg]:w-auto [&_svg]:text-(--y2k-ink)",
  },
} as const

/** Segmented white gel buttons (back / forward, view modes). With
 *  `variant="view"` the selected segment shows a neutral pressed state (the
 *  Finder view control); otherwise the selection fills with the tone gel. */
function Segmented({ items, variant = "tone" }: { items: { label: string; icon: React.ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void }[]; variant?: "tone" | "view" }) {
  const s = SEG[variant]
  return (
    <div className={cn("inline-flex overflow-hidden", s.container)}>
      {items.map((it, i) => (
        <button
          key={it.label}
          type="button"
          aria-label={it.label}
          aria-pressed={it.active}
          disabled={it.disabled}
          onClick={it.onClick}
          className={cn(
            "relative flex cursor-default items-center justify-center overflow-hidden text-(--y2k-ink) outline-none",
            "disabled:text-(--y2k-ink-disabled) disabled:[&_svg]:opacity-45 active:brightness-95",
            s.cell,
            i === 0 && s.firstCell,
            i === items.length - 1 && s.lastCell,
            i > 0 && s.divider,
            it.active && s.active
          )}
        >
          <span
            className={cn(
              "relative z-[1]",
              s.glyph,
              // On the filled segment the glyph goes to ink, as Aqua keeps it
              // dark on the blue selection.
              it.active && variant === "view" && "[&_svg]:text-(--y2k-ink)"
            )}
          >
            {it.icon}
          </span>
        </button>
      ))}
    </div>
  )
}

/** A toolbar control with its label beneath — the 10.2/10.3 unified Finder
 *  toolbar layout (Back, View, …). */
function ToolbarLabeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-[3px]">
      {/* A fixed 28px slot that centres whatever control it holds, so the 28px
          round buttons and the 24px View control drop their labels onto one
          baseline (they sat 2px apart before). */}
      <span className="flex h-7 items-center justify-center">{children}</span>
      <span className="text-[11px] leading-none text-(--y2k-ink)">{label}</span>
    </div>
  )
}

/** The round Aqua "Back" toolbar button (a capsule gel button with a triple
 *  left chevron), matching the Finder reference. */
function ToolbarRoundButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative flex size-7 cursor-default items-center justify-center overflow-hidden rounded-full text-(--y2k-ink) outline-none",
        "bg-(image:--y2k-gel-white) shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.25),0_0_0_0.75px_rgba(0,0,0,0.45)] disabled:text-(--y2k-ink-disabled)",
        "before:pointer-events-none before:absolute before:inset-x-[3px] before:top-[2px] before:h-[42%] before:rounded-full before:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.9),rgba(255,255,255,0.2)_70%,rgba(255,255,255,0))] before:content-['']",
        "active:brightness-90"
      )}
    >
      <span className="relative z-[1] [&_svg]:h-2.5 [&_svg]:w-[16px]">{children}</span>
    </button>
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
  /** A folder's contents: selecting it opens a further column instead of the
   *  inspector. An empty array is still a folder — it just opens empty. */
  contents?: FinderItem[]
}

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
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {chevron && <DisclosureGlyph />}
    </button>
  )
}

/** The last column: a 128px icon over plain "Label: value" lines, left-aligned
 *  — the reference prints them as running text, not as a label grid. */
function ColumnInspector({ item }: { item: FinderItem }) {
  return (
    <div className="flex w-44 shrink-0 flex-col items-center overflow-y-auto px-3 pt-6 pb-3">
      <span className="size-32 shrink-0 [&_svg]:size-full">{item.icon}</span>
      <div className="mt-4 w-full space-y-1 text-[12px] leading-[1.35]">
        <p className="truncate">Name: {item.label}</p>
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
        "outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--y2k-tone)]"
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
const ChevronL = () => (<svg viewBox="0 0 10 10" aria-hidden><path d="M6.5 1.5L3 5l3.5 3.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>)
const ChevronR = () => (<svg viewBox="0 0 10 10" aria-hidden><path d="M3.5 1.5L7 5 3.5 8.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>)
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
            <WindowWell className="h-[22px] rounded-[2px]">
              <input
                id="save-as"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-full w-full bg-transparent px-1.5 text-[12px] outline-none focus-visible:shadow-[0_0_0_3px_var(--y2k-tone-focus)]"
              />
            </WindowWell>
            <span className="justify-self-end">Where:</span>
            <Popup value={where} onChange={setWhere} options={["Documents", "Desktop", "Home", "Applications", "Patina HD"]} className="w-[200px]" />
          </div>
          <div className="pl-[84px]">
            <Checkbox label="Save Image Preview" />
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

/** Read Me font menu → real fallback stacks. The classic Mac bitmap faces
 *  (Chicago, Charcoal, Geneva, Monaco) aren't installed on modern systems, so
 *  each maps to a distinct present-day fallback — otherwise picking "Charcoal"
 *  and "Chicago" would render identically (both falling back to the same font).
 *  Keys must match the Popup options exactly. */
const FONT_STACK: Record<string, string> = {
  "Lucida Grande": '"Lucida Grande", "Lucida Sans Unicode", sans-serif',
  Geneva: 'Geneva, Verdana, "Segoe UI", sans-serif',
  Monaco: 'Monaco, "Courier New", ui-monospace, monospace',
  Chicago: '"Chicago", Impact, "Arial Black", sans-serif',
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

/* ── Design System: colour + type documentation ───────────────────── */

/** Fixed (never toned) tokens documented in the "Colors" group. */
const FIXED_TOKENS = [
  { token: "--y2k-ink", role: "Primary text" },
  { token: "--y2k-ink-secondary", role: "Secondary text" },
  { token: "--y2k-ink-dim", role: "Dimmed text" },
  { token: "--y2k-ink-disabled", role: "Disabled text" },
  { token: "--y2k-window-bg", role: "Window surface" },
  { token: "--y2k-input-bg", role: "Field surface" },
  { token: "--y2k-window-border", role: "Window hairline" },
  { token: "--y2k-titlebar-border", role: "Title-bar hairline" },
  { token: "--y2k-separator", role: "Separator" },
  { token: "--y2k-input-border", role: "Field hairline" },
  { token: "--y2k-os-blue", role: "OS blue (fixed accent)" },
] as const

/** Traffic lights: radial-gradient spheres. The swatch paints the real
 *  gradient; the printed value is the gradient's mid stop. */
const LIGHT_TOKENS = [
  { token: "--y2k-light-red", role: "Close" },
  { token: "--y2k-light-yellow", role: "Minimize" },
  { token: "--y2k-light-green", role: "Zoom" },
] as const

/** Per-tone tokens listed for all five tones. */
const TONE_TOKENS = [
  { token: "--y2k-tone", role: "Base" },
  { token: "--y2k-tone-selection", role: "Selection" },
  { token: "--y2k-tone-list", role: "List gradient" },
  { token: "--y2k-wall-hi", role: "Wallpaper hi" },
  { token: "--y2k-wall-mid", role: "Wallpaper mid" },
  { token: "--y2k-wall-lo", role: "Wallpaper lo" },
] as const

/** The UI type scale. Sizes are native Aqua values and are NEVER snapped to the
 *  4px grid — only layout is. */
const TYPE_SCALE = [
  { px: 10, role: "Window status bar", weight: "Regular" },
  { px: 11, role: "Captions, group labels, About metadata", weight: "Regular / Bold" },
  { px: 12, role: "Document body, list rows", weight: "Regular" },
  { px: 13, role: "Default UI text: buttons, menus, fields", weight: "Regular" },
  { px: 14, role: "Menu bar, large push button", weight: "Medium" },
  { px: 15, role: "Document heading", weight: "Bold" },
  { px: 44, role: "About wordmark (EB Garamond)", weight: "Regular" },
] as const

const TYPE_FACES = [
  { token: "--y2k-font-ui", role: "UI", sample: "Lucida Grande 13" },
  { token: "--y2k-font-wordmark", role: "Wordmark", sample: "Patina" },
  { token: "--y2k-font-mono", role: "Mono", sample: "npx patina init" },
] as const

const TONE_IDS = TONES.map((t) => t.id)
const FIXED_NAMES: string[] = [
  ...[...FIXED_TOKENS, ...LIGHT_TOKENS].map((t) => t.token),
  ...TYPE_FACES.map((f) => f.token),
]
const TONE_NAMES: string[] = TONE_TOKENS.map((t) => t.token)

/**
 * Reads the declared value of each token straight out of the stylesheet, once,
 * on mount — for the five tones via a hidden `data-tone` probe, and for the
 * fixed tokens off <html>. Printing measured values (instead of a hand-copied
 * table) means the palette in the Design System can never drift from y2k.css.
 * Values are empty until the effect runs, so rows render "—" during SSR.
 */
function useTokenValues() {
  const [fixed, setFixed] = React.useState<Record<string, string>>({})
  const [byTone, setByTone] = React.useState<Record<string, Record<string, string>>>({})

  React.useEffect(() => {
    const read = (el: Element, names: readonly string[]) => {
      const cs = getComputedStyle(el)
      return Object.fromEntries(names.map((n) => [n, cs.getPropertyValue(n).trim()]))
    }
    setFixed(read(document.documentElement, FIXED_NAMES))

    const probe = document.createElement("div")
    probe.style.display = "none"
    document.body.appendChild(probe)
    const next: Record<string, Record<string, string>> = {}
    for (const id of TONE_IDS) {
      probe.dataset.tone = id
      next[id] = read(probe, TONE_NAMES)
    }
    probe.remove()
    setByTone(next)
  }, [])

  return { fixed, byTone }
}

/** The first `rgb(...)`/hex stop inside a gradient — what a gradient token's
 *  swatch is labelled with, since the whole gradient string is unreadable. */
function midStop(value: string) {
  const stops = value.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}/gi)
  if (!stops) return value
  return stops[Math.min(1, stops.length - 1)]
}

/** Normalise a colour token to "#rrggbb · rgb(r, g, b)" (plus its alpha when
 *  it is translucent). The browser hands custom properties back in whatever
 *  form it likes — #0006, rgba(0, 0, 0, 0.4) — which reads badly in a palette,
 *  and the hex-with-alpha shorthand hides the actual RGB. */
function formatColor(raw: string) {
  const v = midStop(raw.trim())
  let r: number, g: number, b: number
  let a = 1
  const hex = v.match(/^#([0-9a-f]{3,8})$/i)
  if (hex) {
    let h = hex[1]
    if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("")
    r = parseInt(h.slice(0, 2), 16)
    g = parseInt(h.slice(2, 4), 16)
    b = parseInt(h.slice(4, 6), 16)
    if (h.length === 8) a = parseInt(h.slice(6, 8), 16) / 255
  } else {
    const m = v.match(/rgba?\(([^)]+)\)/i)
    if (!m) return v
    const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(Number)
    if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return v
    ;[r, g, b] = parts
    if (parts.length > 3) a = parts[3]
  }
  const pair = (n: number) => Math.round(n).toString(16).padStart(2, "0")
  const out = `#${pair(r)}${pair(g)}${pair(b)} · rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
  return a < 1 ? `${out} · ${Math.round(a * 100)}% α` : out
}

/** A 32px colour chip: paints `background` (a flat colour or a gradient) over
 *  a checkerboard, so an α-token reads as translucent rather than solid. */
function Swatch({ background, className }: { background: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-8 shrink-0 rounded-[4px] bg-[length:8px_8px] bg-[position:0_0,0_4px,4px_-4px,-4px_0]",
        "bg-[linear-gradient(45deg,#cfcfcf_25%,transparent_25%),linear-gradient(-45deg,#cfcfcf_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#cfcfcf_75%),linear-gradient(-45deg,transparent_75%,#cfcfcf_75%)]",
        "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.3)]",
        className
      )}
    >
      <span className="block size-full rounded-[4px]" style={{ background }} />
    </span>
  )
}

/** One documented token: chip, role, token name, and the literal value. */
function ColorRow({ token, role, value }: { token: string; role: string; value?: string }) {
  return (
    // Wraps rather than truncates when the row is narrower than name + value
    // (the palette is readable down to a phone-width window).
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <Swatch background={`var(${token})`} />
      <span className="min-w-[132px] flex-1">
        <span className="block text-[11px]">{role}</span>
        <code className="block truncate font-(family-name:--y2k-font-mono) text-[10px] text-(--y2k-ink-dim)">{token}</code>
      </span>
      <code className="shrink-0 font-(family-name:--y2k-font-mono) text-[10px] text-(--y2k-ink-secondary)">
        {value ? formatColor(value) : "—"}
      </code>
    </div>
  )
}

export function Desktop() {
  const [tone, setTone] = React.useState<Tone>("pink")
  const { wins, focus, open, close, minimize, frontId } = useWindows()

  React.useEffect(() => {
    document.documentElement.dataset.tone = tone
  }, [tone])

  const currentTone = TONES.find((t) => t.id === tone)!
  const openWin = (id: WinId) => () => open(id)

  // Finder / Design System / Tone search queries, and the icon selection set
  // (populated by single-click or the desktop marquee drag-select).
  const [finderQuery, setFinderQuery] = React.useState("")
  const [dsQuery, setDsQuery] = React.useState("")
  const [toneQuery, setToneQuery] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set())
  const selectOnly = React.useCallback((key: string) => setSelected(new Set([key])), [])
  const [finderView, setFinderView] = React.useState<"icons" | "list" | "columns">("icons")
  // Column view keeps its own cursors: the row in the first column, the row in
  // the folder column, and which of the two the user last clicked — Aqua tints
  // only the focused column's selection and greys the rest.
  const [columnVolume, setColumnVolume] = React.useState("Patina HD")
  const [columnSel, setColumnSel] = React.useState<string | null>(null)
  const [columnChildSel, setColumnChildSel] = React.useState<string | null>(null)
  const [columnFocus, setColumnFocus] = React.useState<0 | 1 | 2>(1)
  // Column widths, dragged by the strips between them (index 0 = volumes,
  // 1 = the volume's contents, 2 = an opened folder).
  const [columnWidths, setColumnWidths] = React.useState<number[]>([176, 176, 176])
  const setColumnWidth = React.useCallback(
    (i: number, w: number) => setColumnWidths((prev) => prev.map((v, n) => (n === i ? w : v))),
    []
  )
  // Opening a folder pushes a column past the window's width; the Finder always
  // scrolls the strip to show the newest one, so this does too.
  const columnStripRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = columnStripRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [finderView, columnVolume, columnSel, columnChildSel])
  // The "Controls" demo group has its own (independent) popup + search field.
  const [dsControlsWhere, setDsControlsWhere] = React.useState("Documents")
  const [dsControlsSearch, setDsControlsSearch] = React.useState("")

  // Read Me text-formatting toolbar state.
  const [font, setFont] = React.useState("Lucida Grande")
  const [fontSize, setFontSize] = React.useState("13")
  const [bold, setBold] = React.useState(false)
  const [italic, setItalic] = React.useState(false)
  const [underline, setUnderline] = React.useState(false)
  // Last saved file, surfaced in the Read Me status bar after Save.
  const [savedNote, setSavedNote] = React.useState<string | null>(null)
  // Trash is empty — clicking it in the Dock says so.
  const [trashOpen, setTrashOpen] = React.useState(false)
  // Literal token values for the Design System's "Colors" group.
  const { fixed: fixedColors, byTone: toneColors } = useTokenValues()
  // Which tone the "Colors" group is showing. Follows the active tone, but can
  // be tabbed away from to read another family's values.
  const [colorTab, setColorTab] = React.useState<Tone>(tone)
  React.useEffect(() => setColorTab(tone), [tone])

  // `kind` / `size` / `modified` feed the column view's inspector pane, the way
  // the 10.2 Finder's third column describes the selected file.
  const finderItems: FinderItem[] = [
    { label: "Read Me", icon: <DocIcon />, onClick: openWin("readme"), kind: "TextEdit document", size: "12 KB", created: "18/09/26", modified: "20/09/26" },
    { label: "Design System", icon: <PillIcon />, onClick: openWin("buttons"), kind: "Application", size: "1.8 MB", created: "14/09/26", modified: "20/09/26", version: "1.0" },
    { label: "Tone", icon: <PrefsIcon />, onClick: openWin("tone"), kind: "Preference pane", size: "248 KB", created: "14/09/26", modified: "19/09/26", version: "1.0" },
    { label: "DESIGN.md", icon: <DocIcon />, onClick: openWin("design"), kind: "Markdown document", size: "36 KB", created: "12/09/26", modified: "20/09/26" },
    { label: "Changelog", icon: <DocIcon />, onClick: openWin("changelog"), kind: "Markdown document", size: "4 KB", created: "18/09/26", modified: "20/09/26" },
    { label: "Terminal", icon: <TerminalIcon />, onClick: openWin("terminal"), kind: "Application", size: "912 KB", created: "14/09/26", modified: "18/09/26", version: "1.0" },
    { label: "Favourites", icon: <HeartIcon />, onClick: openWin("favourites"), kind: "Folder", size: "—", created: "14/09/26", modified: "18/09/26" },
  ]

  // The column view's first column lists VOLUMES, not files — the files live
  // one level in, under Patina HD. Macintosh HD is the machine's own disk; its
  // folders are listed, they just hold nothing this desktop models.
  const macFolders: FinderItem[] = ["Applications", "Library", "System", "Users"].map((label) => ({
    label,
    icon: <FolderIcon />,
    kind: "Folder",
    size: "—",
    created: "24/03/01",
    modified: "24/03/01",
    contents: [],
  }))
  const volumes: FinderItem[] = [
    { label: "Patina HD", icon: <DiskIcon />, kind: "Volume", size: "56k available", created: "14/09/26", modified: "20/09/26", contents: finderItems },
    { label: "Macintosh HD", icon: <DiskIcon />, kind: "Volume", size: "18.2 GB available", created: "24/03/01", modified: "20/09/26", contents: macFolders },
  ]
  const q = finderQuery.trim().toLowerCase()
  const visibleFinderItems = q ? finderItems.filter((it) => it.label.toLowerCase().includes(q)) : finderItems

  // Curated quick-links shown in the Favourites window.
  const favourites: { label: string; icon: React.ReactNode; onClick: () => void }[] = [
    { label: "Read Me", icon: <DocIcon />, onClick: openWin("readme") },
    { label: "Design System", icon: <PillIcon />, onClick: openWin("buttons") },
    { label: "Tone", icon: <PrefsIcon />, onClick: openWin("tone") },
    { label: "DESIGN.md", icon: <DocIcon />, onClick: openWin("design") },
  ]

  // Design System window: show a group only if its label matches the search.
  // The group bodies are unique JSX, but the label set lives here once so the
  // "no results" check below can't drift out of sync with the rendered groups.
  const DS_GROUPS = [
    "Buttons", "Variants", "Sizes", "Icon buttons", "States", "Form controls",
    "Progress", "Tabs", "Marquee & counter", "Materials (shaders)", "Tone",
    "Colors", "Type",
  ]
  const dsq = dsQuery.trim().toLowerCase()
  const dsMatch = (label: string) => !dsq || label.toLowerCase().includes(dsq)
  const dsNoResults = dsq && !DS_GROUPS.some(dsMatch)

  const isDesktop = useMediaQuery("(min-width: 768px)")
  const { band, rootProps } = useMarqueeSelect(setSelected, isDesktop, "desktop:")
  // A second, independent marquee scoped to the Finder file area.
  const { band: finderBand, rootProps: finderRootProps } = useMarqueeSelect(setSelected, true, "finder:")

  // Windows currently minimized to the Dock (open but hidden). Ordered by WinId
  // for a stable Dock tile order.
  const minimizedWindows = (Object.keys(wins) as WinId[]).filter((id) => wins[id].open && wins[id].minimized)

  return (
    <div className="min-h-dvh overflow-x-hidden font-(family-name:--y2k-font-ui) text-(--y2k-ink)">
      <Wallpaper />
      <Stars />
      <MenuBar tone={tone} appName={frontId ? APP_NAME[frontId] : "Patina"} onToneChange={setTone} onOpen={open} />

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
        {[
          { id: "finder" as WinId, label: "Patina HD", icon: <DiskIcon /> },
          { id: "readme" as WinId, label: "Read Me", icon: <DocIcon /> },
          { id: "buttons" as WinId, label: "Design System", icon: <PillIcon /> },
        ].map((it) => {
          const key = `desktop:${it.id}`
          return (
            <button
              key={it.id}
              type="button"
              data-select-item={key}
              aria-pressed={selected.has(key)}
              onClick={() => selectOnly(key)}
              onDoubleClick={openWin(it.id)}
              className="group flex w-[84px] cursor-default flex-col items-center gap-0.5 outline-none"
            >
              <span className="size-14 [&_svg]:size-full [&_svg]:drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]">{it.icon}</span>
              <span
                className={cn(
                  "rounded-[3px] px-1.5 py-[1px] text-[12px] font-medium text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]",
                  selected.has(key) && "bg-(--y2k-tone-selection)"
                )}
              >
                {it.label}
              </span>
            </button>
          )
        })}
      </nav>

      <main className="relative flex flex-col gap-5 px-3 pt-[36px] pb-24 md:block md:px-0 md:pt-0 md:pb-0">
        {wins.finder.open && !wins.finder.minimized && (
          <DesktopWindow
            id="finder"
            title="Patina"
            material="metal"
            initial={{ x: 40, y: 56 }}
            z={wins.finder.z}
            active={frontId === "finder"}
            onRaise={focus}
            onDismiss={close}
            onMinimize={minimize}
            className="md:h-[400px] md:w-[560px]"
            status={
              finderView === "columns"
                ? columnVolume === "Patina HD"
                  ? `${visibleFinderItems.length} items, 56k available`
                  : "4 items, 18.2 GB available"
                : `${visibleFinderItems.length} of ${finderItems.length} items, 56k available`
            }
            toolbar={
              <WindowToolbar className="flex-wrap border-b-0 px-3 pt-2 pb-1.5">
                <ToolbarLabeled label="Back">
                  <ToolbarRoundButton label="Back" disabled>
                    <BackGlyph />
                  </ToolbarRoundButton>
                </ToolbarLabeled>
                <ToolbarLabeled label="View">
                  <Segmented
                    variant="view"
                    items={[
                      { label: "Icons", icon: <GridGlyph />, active: finderView === "icons", onClick: () => setFinderView("icons") },
                      { label: "List", icon: <ListGlyph />, active: finderView === "list", onClick: () => setFinderView("list") },
                      { label: "Columns", icon: <ColGlyph />, active: finderView === "columns", onClick: () => setFinderView("columns") },
                    ]}
                  />
                </ToolbarLabeled>
                <SearchField value={finderQuery} onChange={setFinderQuery} className="order-last mt-1 w-full self-start sm:order-none sm:ml-auto sm:w-40" />
              </WindowToolbar>
            }
          >
            <div className="flex min-h-0 flex-1 border-t border-black/[0.35]">
              {/* Column view carries its own leftmost pane (the volume), exactly
                  as the 10.2 Finder does — the sidebar steps aside so the
                  inspector column has room. */}
              <WindowSidebar className={cn("hidden sm:flex", finderView === "columns" && "sm:hidden")}>
                <WindowSidebarGroup label="Devices" />
                <WindowSidebarItem icon={<DiskIcon />} selected>
                  Patina HD
                </WindowSidebarItem>
                <WindowSidebarGroup label="Places" />
                {finderItems.slice(0, 4).map((it) => (
                  <WindowSidebarItem key={it.label} icon={it.icon} onClick={it.onClick}>
                    {it.label}
                  </WindowSidebarItem>
                ))}
              </WindowSidebar>
              <WindowScrollArea className={cn("bg-white", finderView === "columns" && "overflow-hidden")}>
                {visibleFinderItems.length === 0 ? (
                  <p className="p-6 text-center text-[12px] text-(--y2k-ink-secondary)">No items match “{finderQuery}”.</p>
                ) : finderView === "columns" ? (
                  (() => {
                    // Aqua column view, rebuilt from the 10.2 reference. The
                    // FIRST column lists volumes — double-height rows, 32px
                    // icons, a disclosure arrow on every one — and the files
                    // live one level in, under Patina HD. Columns are 176px,
                    // parted by an 8px bevel with a grip at its foot; the strip
                    // scrolls sideways once a folder opens a fourth column,
                    // exactly as the real Finder does.
                    const contentsOf = (it: FinderItem | undefined): FinderItem[] | undefined =>
                      it?.label === "Favourites"
                        ? favourites
                            .map((f) => finderItems.find((i) => i.label === f.label))
                            .filter((f): f is FinderItem => f !== undefined)
                        : it?.contents

                    const vol = volumes.find((v) => v.label === columnVolume) ?? volumes[0]
                    const rows = vol.label === "Patina HD" ? visibleFinderItems : (vol.contents ?? [])
                    const sel = rows.find((r) => r.label === columnSel) ?? rows[0]
                    const kids = contentsOf(sel)
                    const kid = kids?.find((k) => k.label === columnChildSel) ?? kids?.[0]
                    // The inspector always describes the deepest selected FILE.
                    const shown = kids ? kid : sel

                    return (
                      <div ref={columnStripRef} className="flex min-h-full overflow-x-auto">
                        <div className="shrink-0 overflow-y-auto py-1" style={{ width: columnWidths[0] }}>
                          {volumes.map((v) => (
                            <ColumnRow
                              key={v.label}
                              item={v}
                              volume
                              chevron
                              on={vol.label === v.label}
                              focused={columnFocus === 0}
                              onSelect={() => {
                                setColumnVolume(v.label)
                                setColumnSel(null)
                                setColumnChildSel(null)
                                setColumnFocus(0)
                              }}
                            />
                          ))}
                        </div>
                        <ColumnSplit width={columnWidths[0]} onResize={(w) => setColumnWidth(0, w)} />
                        <div className="shrink-0 overflow-y-auto py-1" style={{ width: columnWidths[1] }}>
                          {rows.map((it) => (
                            <ColumnRow
                              key={it.label}
                              item={it}
                              on={sel?.label === it.label}
                              focused={columnFocus === 1}
                              chevron={contentsOf(it) !== undefined}
                              onSelect={() => {
                                setColumnSel(it.label)
                                setColumnChildSel(null)
                                setColumnFocus(1)
                              }}
                            />
                          ))}
                        </div>
                        <ColumnSplit width={columnWidths[1]} onResize={(w) => setColumnWidth(1, w)} />
                        {kids ? (
                          <>
                            <div className="shrink-0 overflow-y-auto py-1" style={{ width: columnWidths[2] }}>
                              {kids.map((it) => (
                                <ColumnRow
                                  key={it.label}
                                  item={it}
                                  on={kid?.label === it.label}
                                  focused={columnFocus === 2}
                                  chevron={contentsOf(it) !== undefined}
                                  onSelect={() => {
                                    setColumnChildSel(it.label)
                                    setColumnFocus(2)
                                  }}
                                />
                              ))}
                            </div>
                            <ColumnSplit width={columnWidths[2]} onResize={(w) => setColumnWidth(2, w)} />
                          </>
                        ) : null}
                        {shown && <ColumnInspector item={shown} />}
                        {/* The reference pads the rest of the width with an
                            empty column, ready for the next level. */}
                        <div className="w-44 min-w-0 flex-1 border-l border-black/10" />
                      </div>
                    )
                  })()
                ) : finderView === "list" ? (
                  <div className="relative flex min-h-full flex-col py-1" {...finderRootProps}>
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
                          onClick={() => !it.disabled && selectOnly(key)}
                          onDoubleClick={it.onClick}
                          className={cn(
                            "flex cursor-default items-center gap-2 px-3 py-1 text-left text-[13px] outline-none disabled:opacity-45",
                            selected.has(key) && "bg-(--y2k-tone-selection) text-(--y2k-tone-selection-text)"
                          )}
                        >
                          <span className="size-5 shrink-0 [&_svg]:size-full">{it.icon}</span>
                          {it.label}
                        </button>
                      )
                    })}
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
                          onClick={() => !it.disabled && selectOnly(key)}
                          onDoubleClick={it.onClick}
                          className="group relative z-[2] flex cursor-default flex-col items-center gap-1 outline-none disabled:opacity-45"
                        >
                          <span className="size-12 [&_svg]:size-full">{it.icon}</span>
                          <span
                            className={cn(
                              "rounded-[3px] px-1.5 py-[1px] text-[12px]",
                              selected.has(key) && "bg-(--y2k-tone-selection) text-(--y2k-tone-selection-text)"
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
        )}

        {wins.about.open && !wins.about.minimized && (
          <DesktopWindow
            id="about"
            title="About Patina"
            initial={{ x: 40, y: 56 }}
            z={wins.about.z}
            active={frontId === "about"}
            onRaise={focus}
            onDismiss={close}
            onMinimize={minimize}
            className="md:w-[300px]"
          >
            <WindowBody className="flex flex-col items-center gap-2 pt-5 pb-5 text-center">
              <StarIcon className="size-16 drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]" />
              <h1 className="y2k-gel-text font-(family-name:--y2k-font-wordmark) text-[44px] leading-none">Patina</h1>
              <p className="text-[11px]">Public Beta</p>
              <dl className="mt-2 grid grid-cols-[auto_auto] gap-x-2 text-[11px]">
                <dt className="text-right">Taste:</dt><dd className="text-left">Aqua × millennium tones</dd>
                <dt className="text-right">Tone:</dt><dd className="text-left">{currentTone.label}</dd>
                <dt className="text-right">Version:</dt><dd className="text-left">1.0 (Public Beta)</dd>
              </dl>
              <p className="mt-2 text-[11px]">Built by Olivia Forster</p>
            </WindowBody>
          </DesktopWindow>
        )}

        {wins.readme.open && !wins.readme.minimized && (
          <DesktopWindow
            id="readme"
            title="Read Me"
            initial={{ x: 300, y: 84 }}
            z={wins.readme.z}
            active={frontId === "readme"}
            onRaise={focus}
            onDismiss={close}
            onMinimize={minimize}
            className="md:h-[360px] md:w-[460px]"
            status={savedNote ?? undefined}
            toolbar={
              <WindowToolbar className="gap-3 px-3">
                <Popup value={font} onChange={setFont} options={["Lucida Grande", "Geneva", "Monaco", "Chicago", "Charcoal"]} className="w-[128px]" />
                <Popup value={fontSize} onChange={setFontSize} options={["9", "10", "12", "13", "14", "18", "24"]} className="w-[52px]" />
                <Segmented
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
              <h2 className="text-[15px] font-bold">Patina — Read Me</h2>
              <p>
                <strong>Patina</strong> is a platform of <strong>taste packs for AI coding agents</strong>. A pack doesn&apos;t
                restyle a site you&apos;re looking at — it changes what your coding agent <em>produces</em>. Install one into a
                project and anything Claude Code, Cursor or Codex builds there comes out with real taste, not Inter on a grey
                card. This desktop is <strong>Y2K</strong> — pack #1, Aqua × millennium tones.
              </p>
              <ol className="flex list-decimal flex-col gap-2 pl-5">
                <li>
                  <strong>Install a pack into your project</strong>
                  <code className="mt-1 block rounded-[3px] bg-neutral-900 px-2 py-1 font-(family-name:--y2k-font-mono) text-[11px] text-white">
                    npx patina init
                  </code>
                  Copies <code className="text-[12px]">DESIGN.md</code>, the <code className="text-[12px]">/y2k-ify</code> and{" "}
                  <code className="text-[12px]">/check-y2k</code> skills, and points <code className="text-[12px]">components.json</code> at this registry.
                </li>
                <li>
                  <strong>Ask your agent for anything.</strong> &ldquo;Make a settings page.&rdquo; It reads DESIGN.md and builds it
                  Aqua-style in your tone.
                </li>
                <li>
                  <strong>Already have a page?</strong> Run <code className="text-[12px]">/y2k-ify</code> — the agent screenshots it and
                  rewrites it with the pack&apos;s components. <code className="text-[12px]">/check-y2k</code> flags any AI default that creeps back.
                </li>
              </ol>
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

        {wins.buttons.open && !wins.buttons.minimized && (
          <DesktopWindow
            id="buttons"
            title="Design System"
            initial={{ x: 200, y: 110 }}
            z={wins.buttons.z}
            active={frontId === "buttons"}
            onRaise={focus}
            onDismiss={close}
            onMinimize={minimize}
            className="md:h-[480px] md:w-[560px]"
            toolbar={
              <WindowToolbar className="px-3">
                <span className="text-[12px] text-(--y2k-ink-secondary)">Components</span>
                <SearchField value={dsQuery} onChange={setDsQuery} className="ml-auto w-40" placeholder="Filter" />
              </WindowToolbar>
            }
          >
            <WindowScrollArea>
              <WindowBody className="flex flex-col gap-3">
              {dsMatch("Buttons") && (
              <WindowGroup label="Buttons">
                <div className="flex flex-wrap items-center gap-3">
                  <Button>Cancel</Button>
                  <Button isDefault>Save</Button>
                  <span className="text-[11px] text-(--y2k-ink-secondary)">The default button pulses, like Aqua&apos;s blue Save.</span>
                </div>
              </WindowGroup>
              )}
              {dsMatch("Variants") && (
              <WindowGroup label="Variants">
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="white">White gel</Button>
                  <Button variant="tone">Tone gel</Button>
                  <span className="text-[11px] text-(--y2k-ink-secondary)">Two materials: translucent white gel and the gel in the active tone.</span>
                </div>
              </WindowGroup>
              )}
              {dsMatch("Sizes") && (
              <WindowGroup label="Sizes">
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </WindowGroup>
              )}
              {dsMatch("Icon buttons") && (
              <WindowGroup label="Icon buttons">
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="icon" aria-label="Back"><ChevronL /></Button>
                  <Button size="icon" variant="tone" aria-label="Forward"><ChevronR /></Button>
                  <span className="text-[11px] text-(--y2k-ink-secondary)">Round icon buttons, white or tone.</span>
                </div>
              </WindowGroup>
              )}
              {dsMatch("States") && (
              <WindowGroup label="States">
                <div className="flex flex-wrap items-center gap-3">
                  <Button disabled>Disabled (white)</Button>
                  <Button variant="tone" disabled>Disabled (tone)</Button>
                  <Button autoFocus>Focused</Button>
                </div>
              </WindowGroup>
              )}
              {dsMatch("Form controls") && (
              <WindowGroup label="Form controls">
                <div className="flex flex-wrap items-center gap-3">
                  <Popup value={dsControlsWhere} onChange={setDsControlsWhere} options={["Documents", "Desktop", "Home", "Applications"]} className="w-[140px]" />
                  <Checkbox label="Save Image Preview" />
                  <SearchField value={dsControlsSearch} onChange={setDsControlsSearch} className="w-36" placeholder="Search" />
                </div>
              </WindowGroup>
              )}
              {dsMatch("Progress") && (
              <WindowGroup label="Progress">
                <div className="flex flex-col gap-2">
                  <Progress value={62} />
                  <Progress aria-label="Loading" />
                  <span className="text-[11px] text-(--y2k-ink-secondary)">Determinate gel bar; the second is the Aqua barber pole.</span>
                </div>
              </WindowGroup>
              )}
              {dsMatch("Tabs") && (
              <WindowGroup label="Tabs">
                <Tabs defaultValue="general">
                  <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>
                  <TabsContent value="general">Segmented control — the selected tab fills with the tone gel.</TabsContent>
                  <TabsContent value="appearance">Appearance settings would live here.</TabsContent>
                  <TabsContent value="advanced">Advanced settings would live here.</TabsContent>
                </Tabs>
              </WindowGroup>
              )}
              {dsMatch("Marquee & counter") && (
              <WindowGroup label="Marquee & counter">
                <div className="flex flex-col gap-2">
                  <div className="overflow-hidden rounded-[4px] bg-(--y2k-input-bg) px-1 py-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]">
                    <Marquee speed={16}>★ welcome to my homepage ★ sign my guestbook ★ best viewed in 800×600 ★</Marquee>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px]">You are visitor</span>
                    <VisitorCounter count={1337} />
                  </div>
                </div>
              </WindowGroup>
              )}
              {dsMatch("Materials (shaders)") && (
              <WindowGroup label="Materials (shaders)">
                <div className="flex flex-wrap gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <ChromeReflection className="size-24 rounded-[12px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.3)]" />
                    <span className="text-[11px] text-(--y2k-ink-secondary)">Chrome reflection</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <TranslucentPlastic className="size-24 rounded-[12px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.3)]" />
                    <span className="text-[11px] text-(--y2k-ink-secondary)">Translucent plastic</span>
                  </div>
                  <span className="max-w-[180px] text-[11px] text-(--y2k-ink-secondary)">WebGL, with a CSS-gradient fallback when unavailable or reduced-motion.</span>
                </div>
              </WindowGroup>
              )}
              {dsMatch("Tone") && (
              <WindowGroup label="Tone">
                <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Tone">
                  {TONES.map((t) => (
                    <span key={t.id} data-tone={t.id}>
                      <Button
                        size="lg"
                        variant="tone"
                        role="radio"
                        aria-checked={tone === t.id}
                        onClick={() => setTone(t.id)}
                        className={cn(tone === t.id && "shadow-[var(--y2k-gel-tone-shadow),0_0_0_3px_rgba(0,0,0,0.35)]")}
                      >
                        {t.label}
                      </Button>
                    </span>
                  ))}
                </div>
              </WindowGroup>
              )}
              {dsMatch("Colors") && (
              <WindowGroup label="Colors">
                <div className="flex flex-col gap-4">
                  <section className="flex flex-col gap-2">
                    <p className="text-[11px] font-bold">Neutrals &amp; surfaces — fixed, never toned</p>
                    <div className="flex flex-col gap-2">
                      {FIXED_TOKENS.map((t) => (
                        <ColorRow key={t.token} token={t.token} role={t.role} value={fixedColors[t.token]} />
                      ))}
                    </div>
                  </section>

                  <section className="flex flex-col gap-2">
                    <p className="text-[11px] font-bold">Traffic lights — radial gradients; the value is the mid stop</p>
                    <div className="flex flex-col gap-2">
                      {LIGHT_TOKENS.map((t) => (
                        <ColorRow key={t.token} token={t.token} role={`${t.role} (gradient)`} value={fixedColors[t.token]} />
                      ))}
                    </div>
                  </section>

                  <section className="flex flex-col gap-2">
                    <p className="text-[11px] font-bold">Tone families — live, switched by <code className="font-(family-name:--y2k-font-mono) text-[10px]">data-tone</code> on &lt;html&gt;</p>
                    {/* One tab per tone instead of five stacked lists — the
                        section was far too long. Each trigger carries its own
                        data-tone, so the selected segment fills with the gel it
                        documents; the panel below is scoped the same way, which
                        is what makes the swatches resolve to that tone. */}
                    <Tabs value={colorTab} onValueChange={(v) => setColorTab(v as Tone)}>
                      <TabsList className="flex w-full">
                        {TONES.map((t) => (
                          <TabsTrigger key={t.id} value={t.id} data-tone={t.id} className="min-w-0 flex-1 truncate px-2">
                            {t.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {TONES.map((t) => (
                        <TabsContent key={t.id} value={t.id} data-tone={t.id} className="flex flex-col gap-2">
                          {TONE_TOKENS.map((tk) => (
                            <ColorRow key={tk.token} token={tk.token} role={tk.role} value={toneColors[t.id]?.[tk.token]} />
                          ))}
                        </TabsContent>
                      ))}
                    </Tabs>
                    <p className="text-[11px] text-(--y2k-ink-secondary)">
                      Everything else in a tone is derived from the base: the button gel is base at 78/72/78% alpha
                      (top darkened 28%, bottom lightened 22%), the glow is base at 50%, the focus ring base at 25%.
                    </p>
                  </section>

                  <section className="flex flex-col gap-2">
                    <p className="text-[11px] font-bold">Listed, not swatched</p>
                    <p className="text-[11px] text-(--y2k-ink-secondary)">
                      Gradient and texture tokens carry no single colour:{" "}
                      <code className="font-(family-name:--y2k-font-mono) text-[10px]">--y2k-gel-white</code>,{" "}
                      <code className="font-(family-name:--y2k-font-mono) text-[10px]">--y2k-gel-shine</code>,{" "}
                      <code className="font-(family-name:--y2k-font-mono) text-[10px]">--y2k-gel-glow</code>,{" "}
                      <code className="font-(family-name:--y2k-font-mono) text-[10px]">--y2k-pinstripe</code>,{" "}
                      <code className="font-(family-name:--y2k-font-mono) text-[10px]">--y2k-metal</code>,{" "}
                      <code className="font-(family-name:--y2k-font-mono) text-[10px]">--y2k-shadow-window</code>.
                    </p>
                  </section>
                </div>
              </WindowGroup>
              )}
              {dsMatch("Type") && (
              <WindowGroup label="Type">
                <div className="flex flex-col gap-4">
                  <section className="flex flex-col gap-2">
                    <p className="text-[11px] font-bold">Faces</p>
                    {TYPE_FACES.map((f) => (
                      <div key={f.token} className="flex min-w-0 flex-col">
                        <div className="flex min-w-0 items-baseline gap-2">
                          <span className="shrink-0 text-[13px]" style={{ fontFamily: `var(${f.token})` }}>
                            {f.sample}
                          </span>
                          <code className="shrink-0 font-(family-name:--y2k-font-mono) text-[10px]">{f.token}</code>
                          <span className="shrink-0 text-[11px] text-(--y2k-ink-dim)">{f.role}</span>
                        </div>
                        {/* The whole stack, in fallback order — truncated, full text on hover. */}
                        <code
                          className="min-w-0 truncate font-(family-name:--y2k-font-mono) text-[10px] text-(--y2k-ink-secondary)"
                          title={fixedColors[f.token] ?? ""}
                        >
                          {fixedColors[f.token] ?? "—"}
                        </code>
                      </div>
                    ))}
                  </section>

                  <section className="flex flex-col gap-2">
                    <p className="text-[11px] font-bold">Scale — native Aqua sizes, never snapped to the 4px grid</p>
                    {TYPE_SCALE.map((s) => (
                      <div key={s.px} className="flex min-w-0 items-baseline gap-2">
                        <span
                          className="w-[64px] shrink-0 leading-none"
                          style={{ fontSize: `${s.px}px` }}
                        >
                          Aa
                        </span>
                        <code className="w-[40px] shrink-0 font-(family-name:--y2k-font-mono) text-[10px]">{s.px}px</code>
                        <span className="w-[88px] shrink-0 text-[11px] text-(--y2k-ink-secondary)">{s.weight}</span>
                        <span className="min-w-0 flex-1 truncate text-[11px]">{s.role}</span>
                      </div>
                    ))}
                    <p className="text-[11px] text-(--y2k-ink-secondary)">
                      Line height 1.45–1.6 for text, 1.0 for chrome. Sentence case everywhere.
                    </p>
                  </section>
                </div>
              </WindowGroup>
              )}
              {dsNoResults && (
                <p className="p-2 text-center text-[12px] text-(--y2k-ink-secondary)">No components match “{dsQuery}”.</p>
              )}
            </WindowBody>
            </WindowScrollArea>
            <WindowFooter>
              <Button onClick={openWin("window")}>Show Dialog…</Button>
              <Button isDefault onClick={() => close("buttons")}>OK</Button>
            </WindowFooter>
          </DesktopWindow>
        )}

        {wins.window.open && !wins.window.minimized && (
          <DesktopWindow
            id="window"
            title="Window"
            initial={{ x: 360, y: 150 }}
            z={wins.window.z}
            active={frontId === "window"}
            onRaise={focus}
            onDismiss={close}
            onMinimize={minimize}
            className="md:w-[340px]"
          >
            <WindowBody className="flex gap-3 pt-5">
              <HeartIcon className="size-12 shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
              <div className="flex flex-col gap-1">
                <p className="text-[13px] font-bold">This is a Window.</p>
                <p className="text-[12px] text-(--y2k-ink-secondary)">
                  A draggable Aqua window: pinstriped title bar, three traffic lights, a gel default button that
                  pulses. Your coding agent gets it from <code className="text-[11px]">Window</code> in the registry.
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
            id="design"
            title="DESIGN.md"
            initial={{ x: 260, y: 96 }}
            z={wins.design.z}
            active={frontId === "design"}
            onRaise={focus}
            onDismiss={close}
            onMinimize={minimize}
            className="md:h-[440px] md:w-[520px]"
          >
            <WindowScrollArea className="bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]">
              {/* Body is set in the Aqua UI face (Lucida Grande), not the mono
                  face — only the inline code spans stay monospaced. This is a
                  readable digest of the repo's DESIGN.md: the same rules and
                  the same literal values, in the order an agent needs them.
                  Keep the two in sync. */}
              <div className="flex flex-col gap-3 px-6 py-5 font-(family-name:--y2k-font-ui) text-[12px] leading-[1.6]">
                <h2 className="text-[15px] font-bold">DESIGN.md</h2>
                <p className="text-(--y2k-ink-secondary)">
                  The taste spec your coding agent reads. <code className="font-(family-name:--y2k-font-mono) text-[11px]">npx patina init</code> drops the full
                  file into your project, along with the <code className="font-(family-name:--y2k-font-mono) text-[11px]">/y2k-ify</code> and{" "}
                  <code className="font-(family-name:--y2k-font-mono) text-[11px]">/check-y2k</code> skills. This window is the same spec, abridged.
                </p>

                <h3 className="mt-1 font-bold"># Two layers</h3>
                <p>
                  <strong>Structure</strong> is Mac OS X Aqua (2000–2005) and never changes: pinstriped windows, three
                  glossy traffic lights top-left, a centred bold title, deep soft shadows, gel controls, a translucent
                  Dock. <strong>Tone</strong> is the colour of everything gel — buttons, selection, the scroll thumb,
                  the wallpaper. Five families, one active at a time via <code className="font-(family-name:--y2k-font-mono) text-[11px]">data-tone</code> on{" "}
                  <code className="font-(family-name:--y2k-font-mono) text-[11px]">&lt;html&gt;</code>. Never mix two tones on a screen; never put a tone on text.
                </p>

                <h3 className="mt-1 font-bold"># Grid</h3>
                <p>
                  Every non-text element snaps to a <strong>4px</strong> grid — spacing, sizes, radii, offsets. Three
                  exceptions: 1px hairlines; 2–3px gel highlights and their small radii; and HIG-authentic OS metrics
                  (menu bar 25px, title bar 22px, scrollbar 15px, push button 20px). <strong>Font sizes are never
                  snapped</strong> — the native Aqua sizes stay as Apple drew them.
                </p>

                <h3 className="mt-1 font-bold"># Colours</h3>
                <p>
                  Tone bases: Y2K pink <code className="font-(family-name:--y2k-font-mono) text-[11px]">#e8449a</code>, aqua <code className="font-(family-name:--y2k-font-mono) text-[11px]">#2765ca</code>,
                  lime <code className="font-(family-name:--y2k-font-mono) text-[11px]">#7fc31c</code>, tangerine <code className="font-(family-name:--y2k-font-mono) text-[11px]">#e8891a</code>, grape{" "}
                  <code className="font-(family-name:--y2k-font-mono) text-[11px]">#8344c4</code>. Everything else in a family derives from its base: the button
                  gel is the base at 78/72/78% alpha, the glow 50%, the focus ring 25%.
                </p>
                <p>
                  Aqua constants, never toned: ink <code className="font-(family-name:--y2k-font-mono) text-[11px]">#000000</code>, secondary ink{" "}
                  <code className="font-(family-name:--y2k-font-mono) text-[11px]">#4b4b4b</code>, window <code className="font-(family-name:--y2k-font-mono) text-[11px]">#ececec</code>, field{" "}
                  <code className="font-(family-name:--y2k-font-mono) text-[11px]">#ffffff</code>, OS blue <code className="font-(family-name:--y2k-font-mono) text-[11px]">#2765ca</code>, hairlines black
                  at 20–40%. Traffic lights stay red/yellow/green in every tone. The full table lives in the Design
                  System&apos;s Colors group.
                </p>

                <h3 className="mt-1 font-bold"># Type</h3>
                <p>
                  Lucida Grande first, open-source Lato as the fallback for non-Mac, then the system sans. EB Garamond
                  for the wordmark only, at 44px, as gel text. Monaco for code. Sizes: 10px status bars, 11px captions
                  and group labels, 12px document body and list rows, 13px default UI text, 14px menu bar, 15px document
                  headings. Sentence case everywhere. <strong>No Inter, Geist, Roboto, Helvetica or system-ui</strong> —
                  their neutrality is the look this pack exists to kill.
                </p>

                <h3 className="mt-1 font-bold"># Materials</h3>
                <p>
                  White gel and tone gel for controls; pinstripes on every window surface including title and menu bars;
                  brushed metal for iTunes-style windows; translucent plastic and chrome for hero surfaces. Shadows
                  belong to windows, menus, the Dock and gel only — never a card shadow, because there are no cards.
                </p>

                <h3 className="mt-1 font-bold"># Shapes</h3>
                <p>
                  Controls are capsules (pill radius); windows round their top corners only; group boxes and wells take
                  the small control radius; checkboxes 3px; inputs are square sunken wells. Icons are 64px glossy
                  objects with a gloss cap — never a thin-line icon set.
                </p>

                <h3 className="mt-1 font-bold"># Components</h3>
                <p>
                  Push buttons are 20px tall, 13px label, black ink on gel. One default button per window, and it
                  pulses. Dialogs <em>are</em> windows: right-aligned labels, Cancel to the left of the default, the
                  button row bottom-right. The Dock magnifies on hover and marks running apps with a black triangle.
                  Progress indeterminate = the Aqua barber pole.
                </p>

                <h3 className="mt-1 font-bold"># Don&apos;t</h3>
                <p>
                  <code className="font-(family-name:--y2k-font-mono) text-[11px]">/check-y2k</code> fails on any of these: grey cards and zinc/slate surfaces;
                  the purple-to-blue AI gradient; 8–16px card radii; shadows on non-window elements; thin-line icons;
                  tinted pinstripes or traffic lights; two tones on one screen; a page layout (hero, centred column,
                  three-up feature grid, link-column footer); muted-foreground helper text under every field.
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
            id="changelog"
            title="Changelog"
            initial={{ x: 300, y: 128 }}
            z={wins.changelog.z}
            active={frontId === "changelog"}
            onRaise={focus}
            onDismiss={close}
            onMinimize={minimize}
            className="md:h-[360px] md:w-[440px]"
          >
            <WindowScrollArea className="bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]">
              <div className="flex flex-col gap-3 px-6 py-5 text-[12px] leading-[1.6]">
                <h2 className="text-[15px] font-bold">Changelog</h2>
                <div>
                  <p className="font-bold">1.0 — Public Beta</p>
                  <ul className="mt-1 flex list-disc flex-col gap-1 pl-5 text-(--y2k-ink-secondary)">
                    <li>Star brand mark, tone-reactive across all five tones.</li>
                    <li>Photo wallpapers per tone; twinkling desktop stars.</li>
                    <li>Design System window: components + full colour palette.</li>
                    <li>Project-wide 4px layout grid (native font sizes kept).</li>
                    <li>Minimize-to-Dock, draggable windows, Finder marquee select.</li>
                  </ul>
                </div>
              </div>
            </WindowScrollArea>
            <WindowFooter>
              <Button isDefault onClick={() => close("changelog")}>OK</Button>
            </WindowFooter>
          </DesktopWindow>
        )}

        {wins.terminal.open && !wins.terminal.minimized && (
          <DesktopWindow
            id="terminal"
            title="Terminal — bash"
            material="metal"
            initial={{ x: 340, y: 160 }}
            z={wins.terminal.z}
            active={frontId === "terminal"}
            onRaise={focus}
            onDismiss={close}
            onMinimize={minimize}
            className="md:h-[300px] md:w-[480px]"
          >
            <div className="min-h-0 flex-1 overflow-auto bg-black/90 px-3 py-2 font-(family-name:--y2k-font-mono) text-[12px] leading-[1.5] text-[#d6ffd6]">
              <p>Last login: {LOGIN_STAMP} on ttys000</p>
              <p className="mt-1">
                <span className="text-white">patina:~ olivia$</span> npx patina init
              </p>
              <p>Installing the Y2K pack…</p>
              <p>✓ DESIGN.md · /y2k-ify · /check-y2k · components.json</p>
              <p className="mt-1">
                <span className="text-white">patina:~ olivia$</span>{" "}
                <span className="inline-block h-[14px] w-[7px] translate-y-[2px] animate-pulse bg-[#d6ffd6]" aria-hidden />
              </p>
            </div>
          </DesktopWindow>
        )}

        {wins.tone.open && !wins.tone.minimized && (
          <DesktopWindow
            id="tone"
            title="Tone"
            initial={{ x: 420, y: 190 }}
            z={wins.tone.z}
            active={frontId === "tone"}
            onRaise={focus}
            onDismiss={close}
            onMinimize={minimize}
            className="md:h-[360px] md:w-[480px]"
            toolbar={
              <WindowToolbar className="px-3">
                <SearchField value={toneQuery} onChange={setToneQuery} className="ml-auto w-36" />
              </WindowToolbar>
            }
          >
            <WindowScrollArea>
              <WindowBody className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <PrefsIcon className="size-12 shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
                <p className="text-[11px] text-(--y2k-ink-secondary)">
                  Five colour families that ruled 1998–2006. Pick one; every gel surface, selection, the Dock icons and the wallpaper follow. The traffic lights stay.
                </p>
              </div>
              {(() => {
                const tq = toneQuery.trim().toLowerCase()
                const shown = tq ? TONES.filter((t) => t.label.toLowerCase().includes(tq)) : TONES
                if (shown.length === 0) {
                  return <p className="py-4 text-center text-[12px] text-(--y2k-ink-secondary)">No tones match “{toneQuery}”.</p>
                }
                return (
                  <div className="flex flex-wrap justify-center gap-4 rounded-[8px] bg-white px-3 py-4 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.2)]" role="radiogroup" aria-label="Tone">
                    {shown.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        role="radio"
                        aria-checked={tone === t.id}
                        onClick={() => setTone(t.id)}
                        data-tone={t.id}
                        className="group flex w-[60px] cursor-default flex-col items-center gap-1 outline-none"
                      >
                        <span
                          className={cn(
                            "relative size-9 overflow-hidden rounded-full bg-(image:--y2k-tone-button) shadow-(--y2k-gel-tone-shadow)",
                            "before:absolute before:top-[2px] before:left-1/2 before:h-[33%] before:w-[calc(100%-10px)] before:-translate-x-1/2 before:rounded-[12px_12px_2px_2px] before:bg-(image:--y2k-gel-shine) before:content-['']",
                            "after:absolute after:bottom-0 after:left-1/2 after:h-[33%] after:w-[calc(100%-8px)] after:-translate-x-1/2 after:rounded-[4px] after:bg-(image:--y2k-gel-glow) after:blur-[1px] after:content-['']",
                            "group-hover:brightness-105 group-focus-visible:shadow-[var(--y2k-gel-tone-shadow),0_0_0_3px_var(--y2k-tone-focus)]",
                            tone === t.id && "shadow-[var(--y2k-gel-tone-shadow),0_0_0_3px_rgba(0,0,0,0.4)]"
                          )}
                        />
                        <span className="text-[11px]">{t.label}</span>
                      </button>
                    ))}
                  </div>
                )
              })()}
              <WindowWell className="rounded-[4px] px-3 py-2 text-[12px]">
                <strong>{currentTone.label}</strong> · {currentTone.era}
                <br />
                {currentTone.blurb}
              </WindowWell>
              <p className="text-[10px] text-(--y2k-ink-secondary)">
                Sources: Y2K palette surveys (hot pink · baby blue · chrome · lime · black), iMac G3 flavours 1998–2001, McBling 2001–06.
              </p>
            </WindowBody>
            </WindowScrollArea>
            <WindowFooter>
              <Button isDefault onClick={() => close("tone")}>OK</Button>
            </WindowFooter>
          </DesktopWindow>
        )}

        {wins.favourites.open && !wins.favourites.minimized && (
          <DesktopWindow
            id="favourites"
            title="Favourites"
            initial={{ x: 500, y: 130 }}
            z={wins.favourites.z}
            active={frontId === "favourites"}
            onRaise={focus}
            onDismiss={close}
            onMinimize={minimize}
            className="md:h-[300px] md:w-[320px]"
            status={`${favourites.length} favourites`}
          >
            <WindowScrollArea className="bg-white">
              <div className="flex flex-col py-1">
                {favourites.map((it) => (
                  <button
                    key={it.label}
                    type="button"
                    onClick={it.onClick}
                    onDoubleClick={it.onClick}
                    className="group flex cursor-default items-center gap-2 px-3 py-1.5 text-left text-[13px] outline-none hover:bg-(--y2k-tone-selection) hover:text-(--y2k-tone-selection-text)"
                  >
                    <span className="size-6 shrink-0 [&_svg]:size-full">{it.icon}</span>
                    {it.label}
                  </button>
                ))}
              </div>
            </WindowScrollArea>
          </DesktopWindow>
        )}
      </main>

      <Dock
        items={[
          { id: "finder", label: "Finder", icon: <FaceIcon />, running: wins.finder.open, onClick: openWin("finder") },
          { id: "readme", label: "Read Me", icon: <NoteIcon />, running: wins.readme.open, onClick: openWin("readme") },
          { id: "buttons", label: "Design System", icon: <PillIcon />, running: wins.buttons.open, onClick: openWin("buttons") },
          { id: "design", label: "DESIGN.md", icon: <DocIcon />, running: wins.design.open, onClick: openWin("design") },
          { id: "terminal", label: "Terminal", icon: <TerminalIcon />, running: wins.terminal.open, onClick: openWin("terminal") },
          { id: "tone", label: "Tone Preferences", icon: <PrefsIcon />, running: wins.tone.open, onClick: openWin("tone") },
          { id: "about", label: "About Patina", icon: <HeartIcon />, running: wins.about.open, onClick: openWin("about") },
          // Minimized windows get their own tiles on the right (after a divider),
          // like Mac OS X's minimized-window section. Click to restore.
          ...minimizedWindows.map((id, i) => ({
            id: `min:${id}`,
            label: APP_NAME[id],
            icon: DOCK_ICON[id],
            running: true,
            minimized: true,
            dividerBefore: i === 0,
            onClick: openWin(id),
          })),
          { id: "trash", label: "Trash", icon: <TrashIcon />, dividerBefore: true, onClick: () => setTrashOpen(true) },
        ]}
      />

      {/* Trash: empty. A controlled Aqua dialog, opened from the Dock. */}
      <Window open={trashOpen} onOpenChange={setTrashOpen}>
        <WindowContent
          title="Trash"
          description="The Trash is empty."
          className="w-[min(calc(100%-2rem),22rem)]"
        >
          <WindowBody className="flex items-center gap-3 pt-5">
            <TrashIcon className="size-12 shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
            <p className="text-[13px]">The Trash is empty.</p>
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
