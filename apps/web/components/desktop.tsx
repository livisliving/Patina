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

import { DiskIcon, DocIcon, FolderIcon, HeartIcon, NoteIcon, PillIcon, PrefsIcon, StarIcon, TerminalIcon, TrashIcon, SearchGlyph } from "./aqua-icons"
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
  finder: <StarIcon />,
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
 *  `tone` fills the selected segment with the tone gel; `view` (the Finder view
 *  control) is a light capsule whose selected cell is a subtle recessed tint. */
const SEG = {
  tone: {
    container: "shadow-(--y2k-popup-shadow)",
    cell: "bg-(image:--y2k-gel-white) before:pointer-events-none before:absolute before:inset-x-px before:top-0 before:h-1/2 before:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.7),rgba(255,255,255,0.25)_60%,rgba(255,255,255,0))] before:content-['']",
    firstCell: "before:rounded-tl-[7px]",
    lastCell: "before:rounded-tr-[7px]",
    divider: "shadow-[inset_1px_0_0_rgba(0,0,0,0.35)]",
    active: "bg-(image:--y2k-tone-list) text-white before:opacity-50 [&_svg]:drop-shadow-[0_1px_0_rgba(0,0,0,0.4)]",
  },
  view: {
    container: "bg-[linear-gradient(to_bottom,#fdfdfd,#e4e4e4)] shadow-[0_0_0_0.75px_rgba(0,0,0,0.35),0_1px_1px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]",
    cell: "bg-transparent",
    firstCell: "",
    lastCell: "",
    divider: "shadow-[inset_1px_0_0_rgba(0,0,0,0.18)]",
    active: "bg-[linear-gradient(to_bottom,#d7d7d7,#e9e9e9)] shadow-[inset_1px_0_0_rgba(0,0,0,0.18),inset_-1px_0_0_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(0,0,0,0.18)]",
  },
} as const

/** Segmented white gel buttons (back / forward, view modes). With
 *  `variant="view"` the selected segment shows a neutral pressed state (the
 *  Finder view control); otherwise the selection fills with the tone gel. */
function Segmented({ items, variant = "tone" }: { items: { label: string; icon: React.ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void }[]; variant?: "tone" | "view" }) {
  const s = SEG[variant]
  return (
    <div className={cn("inline-flex rounded-[8px]", s.container)}>
      {items.map((it, i) => (
        <button
          key={it.label}
          type="button"
          aria-label={it.label}
          aria-pressed={it.active}
          disabled={it.disabled}
          onClick={it.onClick}
          className={cn(
            "relative flex h-[22px] w-7 cursor-default items-center justify-center overflow-hidden text-(--y2k-ink) outline-none",
            "disabled:text-(--y2k-ink-disabled) active:brightness-95",
            s.cell,
            i === 0 && cn("rounded-l-[8px]", s.firstCell),
            i === items.length - 1 && cn("rounded-r-[8px]", s.lastCell),
            i > 0 && s.divider,
            it.active && s.active
          )}
        >
          <span className="relative z-[1] [&_svg]:size-3.5 [&_svg]:text-neutral-600">{it.icon}</span>
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
      {children}
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

const ChevronL = () => (<svg viewBox="0 0 10 10" aria-hidden><path d="M6.5 1.5L3 5l3.5 3.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>)
const ChevronR = () => (<svg viewBox="0 0 10 10" aria-hidden><path d="M3.5 1.5L7 5 3.5 8.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>)
const GridGlyph = () => (<svg viewBox="0 0 12 12" aria-hidden><path d="M1 1h4v4H1zM7 1h4v4H7zM1 7h4v4H1zM7 7h4v4H7z" fill="currentColor" /></svg>)
const ListGlyph = () => (<svg viewBox="0 0 12 12" aria-hidden><path d="M1 2h10v1.5H1zM1 5.25h10v1.5H1zM1 8.5h10V10H1z" fill="currentColor" /></svg>)
const ColGlyph = () => (<svg viewBox="0 0 12 12" aria-hidden><path d="M1 1h3v10H1zM4.5 1h3v10h-3zM8 1h3v10H8z" fill="currentColor" /></svg>)

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
  const [finderView, setFinderView] = React.useState<"icons" | "list">("icons")
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

  const finderItems: { label: string; icon: React.ReactNode; onClick?: () => void; disabled?: boolean }[] = [
    { label: "Read Me", icon: <DocIcon />, onClick: openWin("readme") },
    { label: "Design System", icon: <PillIcon />, onClick: openWin("buttons") },
    { label: "Tone", icon: <PrefsIcon />, onClick: openWin("tone") },
    { label: "DESIGN.md", icon: <DocIcon />, onClick: openWin("design") },
    { label: "Changelog", icon: <DocIcon />, onClick: openWin("changelog") },
    { label: "Terminal", icon: <TerminalIcon />, onClick: openWin("terminal") },
    { label: "Favourites", icon: <HeartIcon />, onClick: openWin("favourites") },
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
            className="md:h-[340px] md:w-[560px]"
            status={`${visibleFinderItems.length} of ${finderItems.length} items, 56k available`}
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
                      { label: "Columns", icon: <ColGlyph />, disabled: true },
                    ]}
                  />
                </ToolbarLabeled>
                <SearchField value={finderQuery} onChange={setFinderQuery} className="order-last mt-1 w-full self-start sm:order-none sm:ml-auto sm:w-40" />
              </WindowToolbar>
            }
          >
            <div className="flex min-h-0 flex-1 border-t border-black/[0.35]">
              <WindowSidebar className="hidden sm:flex">
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
              <WindowScrollArea className="bg-white">
                {visibleFinderItems.length === 0 ? (
                  <p className="p-6 text-center text-[12px] text-(--y2k-ink-secondary)">No items match “{finderQuery}”.</p>
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
            className="md:h-[440px] md:w-[472px]"
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
            className="md:h-[400px] md:w-[460px]"
          >
            <WindowScrollArea className="bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]">
              <div className="flex flex-col gap-3 px-6 py-5 font-(family-name:--y2k-font-mono) text-[12px] leading-[1.6]">
                <h2 className="text-[15px] font-bold">DESIGN.md</h2>
                <p className="text-(--y2k-ink-secondary)">The taste spec your coding agent reads. This is what <code className="text-[11px]">npx patina init</code> drops into your project.</p>
                <h3 className="mt-1 font-bold"># Grid</h3>
                <p>Every non-text element snaps to a <strong>4px</strong> grid. Exceptions: 1px hairlines, 2–3px gel highlights, and HIG-authentic OS metrics (title bar 22px, menu bar 25px, scrollbar 15px, push button 20px). Font sizes stay native (11/13px) — never snapped.</p>
                <h3 className="mt-1 font-bold"># Materials</h3>
                <p>White gel and tone gel; translucent plastic and chrome for hero surfaces. Pinstripes on chrome. Real shadows, no flat cards.</p>
                <h3 className="mt-1 font-bold"># Tone</h3>
                <p>Five families (Y2K pink · aqua · lime · tangerine · grape). One is active at a time via <code className="text-[11px]">data-tone</code>; every gel, selection, the Dock icons and the wallpaper follow it.</p>
                <h3 className="mt-1 font-bold"># Type</h3>
                <p>Lucida Grande first, Lato fallback. Sentence case. No Inter, no grey-on-grey.</p>
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
                <p className="text-[11px] text-(--y2k-ink-dim)">This desktop is built with the same pack it ships.</p>
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
          { id: "finder", label: "Patina", icon: <StarIcon />, running: wins.finder.open, onClick: openWin("finder") },
          { id: "readme", label: "Read Me", icon: <NoteIcon />, running: wins.readme.open, onClick: openWin("readme") },
          { id: "buttons", label: "Design System", icon: <PillIcon />, running: wins.buttons.open, onClick: openWin("buttons") },
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
