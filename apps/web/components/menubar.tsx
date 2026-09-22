"use client"

import * as React from "react"
import { DropdownMenu as Menu } from "radix-ui"
import { cn, menuContentClass, menuItemClass, menuSeparatorClass, menuTickClass } from "@patina/ui"

import { StarIcon } from "./aqua-icons"
import { TONES, type Tone } from "./tones"

function Clock() {
  const [time, setTime] = React.useState<string | null>(null)
  React.useEffect(() => {
    const tick = () => {
      const d = new Date()
      const day = d.toLocaleDateString("en-GB", { weekday: "short", month: "short", day: "numeric" }).replace(",", "")
      const t = d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" })
      setTime(`${day} ${t}`)
    }
    tick()
    const id = window.setInterval(tick, 10_000)
    return () => window.clearInterval(id)
  }, [])
  return <span suppressHydrationWarning>{time ?? ""}</span>
}

function MenuTrigger({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-full shrink-0 cursor-default items-center rounded-[3px] px-2 whitespace-nowrap outline-none select-none",
        "data-[state=open]:bg-(image:--y2k-tone-highlight) data-[state=open]:text-(--y2k-tone-highlight-text)",
        className
      )}
      {...props}
    />
  )
}

/** One row of a menu: its label, the original's shortcut (shown as 10.1
 *  shows it, and bound when the browser lets it through), and a tick or a
 *  diamond at the left. A row with nothing to do is greyed. */
export type MenuRow =
  | { label: string; shortcut?: string; disabled?: boolean; checked?: boolean; mark?: string; onSelect?: () => void }
  | "-"
export type MenuSpec = { label: string; items: MenuRow[] }

/** The key a shortcut names, as KeyboardEvent.code. */
const CODE: Record<string, string> = { "[": "BracketLeft", "?": "Slash", "⌫": "Backspace" }

function pressed(e: KeyboardEvent, shortcut: string, mac: boolean) {
  const key = shortcut.replace(/[⌘⇧⌥]/g, "")
  return (
    e.code === (CODE[key] ?? `Key${key}`) &&
    (mac ? e.metaKey : e.ctrlKey) &&
    e.altKey === shortcut.includes("⌥") &&
    e.shiftKey === (shortcut.includes("⇧") || key === "?")
  )
}

function Rows({ items }: { items: MenuRow[] }) {
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

type MenuBarProps = {
  tone: Tone
  onToneChange: (t: Tone) => void
  onOpen: (id: "about" | "readme" | "buttons" | "finder" | "tone") => void
  /** After the ★: the front app's menu (its name in bold), then File, Edit,
   *  View, Go, Window and Help. */
  menus: MenuSpec[]
}

export function MenuBar({ tone, onToneChange, onOpen, menus }: MenuBarProps) {
  // Shortcuts: the menus' own, read at the moment of the key press. ⌘N, ⌘W,
  // ⌘M, ⌘Q and the like never arrive — the browser keeps them.
  const latest = React.useRef(menus)
  React.useEffect(() => {
    latest.current = menus
  })
  React.useEffect(() => {
    const mac = /Mac|iPhone|iPad/.test(navigator.platform)
    const onKey = (e: KeyboardEvent) => {
      for (const menu of latest.current)
        for (const row of menu.items)
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
    <header
      className={cn(
        // Aqua 10.0 menu bar: 22px of menu pinstripe over a #a0a0a0 rule,
        // 13px items 8px in from the edge, the app name in bold.
        "fixed inset-x-0 top-0 z-[90] flex h-(--y2k-menubar-h) min-w-0 flex-nowrap items-stretch gap-[2px] px-2",
        "border-b border-(--y2k-menubar-border) bg-(image:--y2k-pinstripe-light) font-(family-name:--y2k-font-ui) text-[13px] text-(--y2k-ink)"
      )}
    >
      <Menu.Root modal={false}>
        <Menu.Trigger asChild>
          <MenuTrigger className="px-3" aria-label="Patina menu">
            <StarIcon className="size-4 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]" />
          </MenuTrigger>
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Content align="start" sideOffset={0} className={menuContentClass}>
            <Menu.Item className={menuItemClass} onSelect={() => onOpen("about")}>About Patina</Menu.Item>
            <Menu.Separator className={menuSeparatorClass} />
            {/* The tones, where 10.1 keeps its system-wide settings. */}
            <Menu.RadioGroup value={tone} onValueChange={(v) => onToneChange(v as Tone)}>
              {TONES.map((t) => (
                <Menu.RadioItem key={t.id} value={t.id} className={menuItemClass}>
                  <span className="flex items-center gap-2">
                    <Menu.ItemIndicator className={menuTickClass}>✓</Menu.ItemIndicator>
                    <span
                      data-tone={t.id}
                      className="inline-block size-3 rounded-full bg-(--y2k-tone) shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_0_0_0.5px_rgba(0,0,0,0.35)]"
                    />
                    {t.label}
                  </span>
                  <span className="text-[11px] opacity-70">{t.era.split(" · ")[1]}</span>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
            <Menu.Item className={menuItemClass} onSelect={() => onOpen("tone")}>Tone Preferences…</Menu.Item>
            <Menu.Separator className={menuSeparatorClass} />
            <Menu.Item className={menuItemClass} onSelect={() => onOpen("readme")}>Read Me</Menu.Item>
            <Menu.Item className={menuItemClass} onSelect={() => onOpen("finder")}>Patina</Menu.Item>
            <Menu.Item className={menuItemClass} onSelect={() => onOpen("buttons")}>Design System</Menu.Item>
            <Menu.Separator className={menuSeparatorClass} />
            <Menu.Item className={menuItemClass} disabled>Install… <span className="text-[11px]">Day 2</span></Menu.Item>
            <Menu.Item className={menuItemClass} disabled>Y2K-ify a Page… <span className="text-[11px]">Day 2</span></Menu.Item>
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>

      {menus.map((menu, i) => (
        <Menu.Root key={i} modal={false}>
          <Menu.Trigger asChild>
            {/* On a phone the bar keeps the app's menu and Help. */}
            <MenuTrigger className={cn(i === 0 && "font-bold", i > 0 && i < menus.length - 1 && "hidden sm:flex")}>{menu.label}</MenuTrigger>
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Content align="start" sideOffset={0} className={menuContentClass}>
              <Rows items={menu.items} />
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>
      ))}

      <div className="ml-auto flex shrink-0 items-center px-3 whitespace-nowrap select-none">
        <Clock />
      </div>
    </header>
  )
}
