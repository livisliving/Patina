"use client"

import * as React from "react"
import { DropdownMenu as Menu } from "radix-ui"

import { cn } from "@/lib/utils"
import { menuContentClass, menuItemClass, menuSeparatorClass, menuTickClass } from "@/components/ui/popup"
import { Slider } from "@/components/ui/forms"

/**
 * Patina MenuBar — DESIGN.md › Layout › Menu bar.
 *
 * Aqua's menu bar, pinned to the top: 22px of the light pinstripe over a
 * #a0a0a0 rule, 13px titles 8px in, an open title in the tone highlight. The
 * leftmost menu (`logo`) sits where the Apple menu does; the first of `menus`
 * is the front app's, its name in bold; the last is Help; the clock is at the
 * right. On a phone only the logo, the app's menu and Help stay.
 *
 * A title lights up under the pointer. Click one and its menu opens;
 * while a menu is open, the others open as the pointer crosses their titles,
 * the clock and the volume included, as the real bar does.
 *
 * Menus are data: rows with the original's shortcuts, shown as 10.x shows
 * them and bound while the page has focus — except those the browser keeps
 * for itself (⌘N, ⌘W, ⌘M, ⌘Q, ⌘H…), which never arrive. A menu that needs
 * more than rows (a radio group, swatches) passes its own `content`, built
 * with Radix DropdownMenu and the pack's menu classes from popup.
 */

/** One row: its label, the original's shortcut, and a tick (`checked`) or a
 *  mark such as ◆ at the left. A row with nothing to do is greyed. */
type MenuRow =
  | { label: React.ReactNode; shortcut?: string; disabled?: boolean; checked?: boolean; mark?: string; onSelect?: () => void }
  | "-"

type MenuSpec = {
  /** The title in the bar: text, or an icon with an `aria-label`. */
  label: React.ReactNode
  "aria-label"?: string
  items?: MenuRow[]
  /** Your own menu content instead of rows. */
  content?: React.ReactNode
}

/** The key a shortcut names, as KeyboardEvent.code. */
const CODE: Record<string, string> = { "[": "BracketLeft", "]": "BracketRight", "?": "Slash", "⌫": "Backspace", ",": "Comma" }

function pressed(e: KeyboardEvent, shortcut: string, mac: boolean) {
  const key = shortcut.replace(/[⌘⇧⌥⌃]/g, "")
  return (
    e.code === (CODE[key] ?? (/^\d$/.test(key) ? `Digit${key}` : `Key${key}`)) &&
    (mac ? e.metaKey : e.ctrlKey) &&
    e.altKey === shortcut.includes("⌥") &&
    e.shiftKey === (shortcut.includes("⇧") || key === "?")
  )
}

/** Which of the bar's menus is open: one at a time, by key. */
type BarState = {
  open: string | null
  /** Changes it from what it is right now, so a menu closing and the next
   *  one opening in the same pointer event land in either order. */
  setOpen: (update: (current: string | null) => string | null) => void
  /** What is open right now, for the moment a menu finishes closing. */
  openRef: React.RefObject<string | null>
}
const MenuBarContext = React.createContext<BarState | null>(null)

/** The props that make a Radix DropdownMenu one of the bar's menus. Outside
 *  a MenuBar it opens and closes on its own. */
function useBarMenu(key: string) {
  const bar = React.useContext(MenuBarContext)
  const [alone, setAlone] = React.useState(false)
  if (!bar) return { root: { open: alone, onOpenChange: setAlone }, trigger: {}, content: {} }
  return {
    root: {
      open: bar.open === key,
      onOpenChange: (open: boolean) => bar.setOpen((cur) => (open ? key : cur === key ? null : cur)),
    },
    trigger: {
      // Sliding across the bar with a menu open opens the one underneath.
      onPointerEnter: () => bar.setOpen((cur) => (cur !== null && cur !== key ? key : cur)),
    },
    content: {
      // Focus goes back to the title only when the bar closes, not when the
      // pointer has moved on to the next menu.
      onCloseAutoFocus: (e: Event) => {
        if (bar.openRef.current !== null) e.preventDefault()
      },
    },
  }
}

function MenuRows({ items }: { items: MenuRow[] }) {
  return items.map((row, i) =>
    row === "-" ? (
      <Menu.Separator key={i} className={menuSeparatorClass} />
    ) : row.checked !== undefined ? (
      <Menu.CheckboxItem key={i} className={menuItemClass} checked={row.checked} disabled={row.disabled || !row.onSelect} onSelect={row.onSelect}>
        <Menu.ItemIndicator className={menuTickClass}>✓</Menu.ItemIndicator>
        {row.label}
        {row.shortcut && <span>{row.shortcut}</span>}
      </Menu.CheckboxItem>
    ) : (
      <Menu.Item key={i} className={menuItemClass} disabled={row.disabled || !row.onSelect} onSelect={row.onSelect}>
        {row.mark && (
          <span aria-hidden className={menuTickClass}>
            {row.mark}
          </span>
        )}
        {row.label}
        {row.shortcut && <span>{row.shortcut}</span>}
      </Menu.Item>
    )
  )
}

/** A title in the bar: the tone highlight and white ink under the pointer
 *  and while its menu is open. */
function MenuBarTitle({ className, ...props }: React.ComponentProps<typeof Menu.Trigger>) {
  return (
    <Menu.Trigger
      data-slot="menu-bar-title"
      className={cn(
        "relative isolate flex h-full shrink-0 cursor-default items-center rounded-[3px] px-2 whitespace-nowrap outline-none select-none",
        "before:absolute before:inset-0 before:-z-10 before:rounded-[3px] before:bg-(image:--y2k-tone-highlight) before:opacity-0",
        "hover:before:opacity-100 hover:text-(--y2k-tone-highlight-text) data-[state=open]:before:opacity-100 data-[state=open]:text-(--y2k-tone-highlight-text)",
        className
      )}
      {...props}
    />
  )
}

/** The time, read from the visitor's clock in their time zone. It turns
 *  over on the minute, and checks again when the tab comes back or the
 *  machine wakes. */
function useNow() {
  const [now, setNow] = React.useState<Date | null>(null)
  React.useEffect(() => {
    let timer = 0
    const tick = () => {
      const d = new Date()
      setNow(d)
      window.clearTimeout(timer)
      timer = window.setTimeout(tick, 60_000 - (d.getTime() % 60_000))
    }
    const onShow = () => document.visibilityState === "visible" && tick()
    tick()
    document.addEventListener("visibilitychange", onShow)
    window.addEventListener("focus", tick)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener("visibilitychange", onShow)
      window.removeEventListener("focus", tick)
    }
  }, [])
  return now
}

/** The clock as an icon: a 16px face with its hands at the time. */
function ClockGlyph({ date }: { date: Date }) {
  const m = date.getMinutes()
  const h = (date.getHours() % 12) + m / 60
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <circle cx={8} cy={8} r={6.75} fill="#fff" stroke="currentColor" strokeWidth={1.5} />
      <path d="M8 8V4.25" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" transform={`rotate(${h * 30} 8 8)`} />
      <path d="M8 8V2.75" stroke="currentColor" strokeWidth={1} strokeLinecap="round" transform={`rotate(${m * 6} 8 8)`} />
    </svg>
  )
}

/** The clock at the right: the weekday and the time, as text or as a little
 *  face. Its menu shows the whole date, switches between the two, and opens
 *  Date & Time when there is one to open. */
function MenuBarClock({
  locale,
  year,
  onOpenDateTime,
}: {
  locale?: string
  /** A year to show in the menu's date in place of the real one; the day,
   *  the month and the time stay as they are. */
  year?: number
  onOpenDateTime?: () => void
}) {
  const now = useNow()
  const [view, setView] = React.useState<"text" | "icon">("text")
  const menu = useBarMenu("clock")
  // A 24-hour clock keeps its leading zero (07:05); a 12-hour one doesn't (7:05 pm).
  const h24 = /h2[34]/.test(new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle ?? "")
  const day = now?.toLocaleDateString(locale, { weekday: "short" }) ?? ""
  const time = now?.toLocaleTimeString(locale, { hour: h24 ? "2-digit" : "numeric", minute: "2-digit" }) ?? ""
  const date = now
    ? new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
        .formatToParts(now)
        .map((part) => (part.type === "year" && year !== undefined ? String(year) : part.value))
        .join("")
    : ""
  return (
    <Menu.Root modal={false} {...menu.root}>
      <MenuBarTitle aria-label={now ? `${date}, ${time}` : "Clock"} suppressHydrationWarning {...menu.trigger}>
        {view === "icon" && now ? (
          <ClockGlyph date={now} />
        ) : (
          // A phone has room for the time only.
          <>
            <span className="hidden sm:inline">{day}&nbsp;</span>
            {time}
          </>
        )}
      </MenuBarTitle>
      <Menu.Portal>
        <Menu.Content align="end" sideOffset={0} className={menuContentClass} {...menu.content}>
          <Menu.Item disabled className={menuItemClass}>
            {date}
          </Menu.Item>
          <Menu.Separator className={menuSeparatorClass} />
          <Menu.RadioGroup value={view} onValueChange={(v) => setView(v as "text" | "icon")}>
            <Menu.RadioItem value="icon" className={menuItemClass}>
              <Menu.ItemIndicator className={menuTickClass}>✓</Menu.ItemIndicator>
              View as Icon
            </Menu.RadioItem>
            <Menu.RadioItem value="text" className={menuItemClass}>
              <Menu.ItemIndicator className={menuTickClass}>✓</Menu.ItemIndicator>
              View as Text
            </Menu.RadioItem>
          </Menu.RadioGroup>
          <Menu.Separator className={menuSeparatorClass} />
          <Menu.Item disabled={!onOpenDateTime} onSelect={onOpenDateTime} className={menuItemClass}>
            Open Date &amp; Time…
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  )
}

/** The speaker: its waves go with the level, and none at all when muted. */
function SpeakerGlyph({ level }: { level: number }) {
  const waves = level <= 0 ? 0 : level < 34 ? 1 : level < 67 ? 2 : 3
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <path d="M1.5 5.5H4.5L8.5 2V14L4.5 10.5H1.5Z" fill="currentColor" stroke="currentColor" strokeWidth={1} strokeLinejoin="round" />
      {[3, 5.5, 8].slice(0, waves).map((r) => (
        <path key={r} d={`M${8.5 + r * 0.55} ${8 - r * 0.8}A${r} ${r} 0 0 1 ${8.5 + r * 0.55} ${8 + r * 0.8}`} fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" />
      ))}
    </svg>
  )
}

/** The volume, as the menu bar keeps it: the speaker, and under it a narrow
 *  menu with a vertical slider. Slide it to the bottom and the speaker
 *  goes quiet. `value` runs from 0 to 100. */
function MenuBarVolume({ value, onValueChange }: { value: number; onValueChange: (value: number) => void }) {
  const menu = useBarMenu("volume")
  return (
    <Menu.Root modal={false} {...menu.root}>
      <MenuBarTitle aria-label={value > 0 ? `Volume ${value}%` : "Volume muted"} {...menu.trigger}>
        <SpeakerGlyph level={value} />
      </MenuBarTitle>
      <Menu.Portal>
        <Menu.Content align="center" sideOffset={0} className={cn(menuContentClass, "min-w-0 px-2 py-3")} {...menu.content}>
          <div className="relative h-[124px] w-6">
            <Slider
              min={0}
              max={100}
              value={value}
              onChange={(e) => onValueChange(Number(e.target.value))}
              aria-label="Volume"
              aria-orientation="vertical"
              className="absolute top-1/2 left-1/2 w-[124px] -translate-x-1/2 -translate-y-1/2 -rotate-90"
            />
          </div>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  )
}

function MenuBar({
  logo,
  menus,
  clock = true,
  locale,
  clockYear,
  onOpenDateTime,
  className,
  children,
}: {
  /** The leftmost menu, where the Apple menu sits. */
  logo?: MenuSpec
  /** The front app's menu first (bold), then the rest; the last is Help. */
  menus: MenuSpec[]
  clock?: boolean
  /** The clock's locale; the browser's by default. */
  locale?: string
  /** A year for the clock menu's date in place of the real one. */
  clockYear?: number
  /** Makes the clock menu's Open Date & Time… do something. */
  onOpenDateTime?: () => void
  className?: string
  /** Status items before the clock, such as a MenuBarVolume. */
  children?: React.ReactNode
}) {
  const [open, setOpenState] = React.useState<string | null>(null)
  const openRef = React.useRef<string | null>(null)
  const setOpen = React.useCallback((update: (current: string | null) => string | null) => {
    openRef.current = update(openRef.current)
    setOpenState(openRef.current)
  }, [])

  // Shortcuts: every menu's rows, read at the moment of the key press.
  const latest = React.useRef([logo, ...menus])
  React.useEffect(() => {
    latest.current = [logo, ...menus]
  })
  React.useEffect(() => {
    const mac = /Mac|iPhone|iPad/.test(navigator.platform)
    const onKey = (e: KeyboardEvent) => {
      for (const menu of latest.current)
        for (const row of menu?.items ?? [])
          if (row !== "-" && row.shortcut && row.onSelect && !row.disabled && pressed(e, row.shortcut, mac)) {
            e.preventDefault()
            row.onSelect()
            return
          }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <MenuBarContext.Provider value={{ open, setOpen, openRef }}>
    <header
      data-slot="menu-bar"
      className={cn(
        "fixed inset-x-0 top-0 z-[90] flex h-(--y2k-menubar-h) min-w-0 flex-nowrap items-stretch gap-[2px] px-2",
        "border-b border-(--y2k-menubar-border) bg-(image:--y2k-pinstripe-light) font-(family-name:--y2k-font-ui) text-[13px] text-(--y2k-ink)",
        className
      )}
    >
      {logo && <BarMenu spec={logo} id="logo" className="px-3" />}
      {menus.map((spec, i) => (
        <BarMenu key={i} spec={spec} id={`menu-${i}`} className={cn(i === 0 && "font-bold", i > 0 && i < menus.length - 1 && "hidden sm:flex")} />
      ))}
      {(clock || children) && (
        <div className="ml-auto flex h-full shrink-0 items-stretch whitespace-nowrap select-none">
          {children}
          {clock && <MenuBarClock locale={locale} year={clockYear} onOpenDateTime={onOpenDateTime} />}
        </div>
      )}
    </header>
    </MenuBarContext.Provider>
  )
}

/** One of the bar's menus, from its spec. */
function BarMenu({ spec, id, className }: { spec: MenuSpec; id: string; className?: string }) {
  const menu = useBarMenu(id)
  return (
    <Menu.Root modal={false} {...menu.root}>
      <MenuBarTitle aria-label={spec["aria-label"]} className={className} {...menu.trigger}>
        {spec.label}
      </MenuBarTitle>
      <Menu.Portal>
        <Menu.Content align="start" sideOffset={0} className={menuContentClass} {...menu.content}>
          {spec.content ?? <MenuRows items={spec.items ?? []} />}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  )
}

export { MenuBar, MenuBarTitle, MenuBarClock, MenuBarVolume, MenuRows, type MenuRow, type MenuSpec }
