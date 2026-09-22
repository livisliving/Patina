"use client"

import * as React from "react"
import { DropdownMenu as Menu } from "radix-ui"

import { cn } from "@/lib/utils"
import { menuContentClass, menuItemClass, menuSeparatorClass, menuTickClass } from "@/components/ui/popup"

/**
 * Patina MenuBar — DESIGN.md › Layout › Menu bar.
 *
 * Aqua's menu bar, pinned to the top: 22px of the light pinstripe over a
 * #a0a0a0 rule, 13px titles 8px in, an open title in the tone highlight. The
 * leftmost menu (`logo`) sits where the Apple menu does; the first of `menus`
 * is the front app's, its name in bold; the last is Help; the clock is at the
 * right. On a phone only the logo, the app's menu and Help stay.
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

/** A title in the bar: the tone highlight while its menu is open. */
function MenuBarTitle({ className, ...props }: React.ComponentProps<typeof Menu.Trigger>) {
  return (
    <Menu.Trigger
      data-slot="menu-bar-title"
      className={cn(
        "flex h-full shrink-0 cursor-default items-center rounded-[3px] px-2 whitespace-nowrap outline-none select-none",
        "data-[state=open]:bg-(image:--y2k-tone-highlight) data-[state=open]:text-(--y2k-tone-highlight-text)",
        className
      )}
      {...props}
    />
  )
}

/** The clock at the right: weekday, date and time from the visitor's own
 *  clock, in their time zone and their locale's format. It turns over on the
 *  minute, and checks again when the tab comes back or the machine wakes. */
function MenuBarClock({ locale }: { locale?: string }) {
  const [time, setTime] = React.useState<string | null>(null)
  React.useEffect(() => {
    let timer = 0
    const tick = () => {
      const d = new Date()
      const day = d.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" }).replace(",", "")
      setTime(`${day} ${d.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })}`)
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
  }, [locale])
  return <span suppressHydrationWarning>{time ?? ""}</span>
}

function MenuBar({
  logo,
  menus,
  clock = true,
  locale,
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
  className?: string
  /** Status items before the clock. */
  children?: React.ReactNode
}) {
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

  const menu = (spec: MenuSpec, key: React.Key, title?: string) => (
    <Menu.Root key={key} modal={false}>
      <MenuBarTitle aria-label={spec["aria-label"]} className={title}>
        {spec.label}
      </MenuBarTitle>
      <Menu.Portal>
        <Menu.Content align="start" sideOffset={0} className={menuContentClass}>
          {spec.content ?? <MenuRows items={spec.items ?? []} />}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  )

  return (
    <header
      data-slot="menu-bar"
      className={cn(
        "fixed inset-x-0 top-0 z-[90] flex h-(--y2k-menubar-h) min-w-0 flex-nowrap items-stretch gap-[2px] px-2",
        "border-b border-(--y2k-menubar-border) bg-(image:--y2k-pinstripe-light) font-(family-name:--y2k-font-ui) text-[13px] text-(--y2k-ink)",
        className
      )}
    >
      {logo && menu(logo, "logo", "px-3")}
      {menus.map((spec, i) => menu(spec, i, cn(i === 0 && "font-bold", i > 0 && i < menus.length - 1 && "hidden sm:flex")))}
      {(clock || children) && (
        <div className="ml-auto flex shrink-0 items-center gap-4 px-3 whitespace-nowrap select-none">
          {children}
          {clock && <MenuBarClock locale={locale} />}
        </div>
      )}
    </header>
  )
}

export { MenuBar, MenuBarTitle, MenuBarClock, MenuRows, type MenuRow, type MenuSpec }
