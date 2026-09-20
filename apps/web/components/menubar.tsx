"use client"

import * as React from "react"
import { DropdownMenu as Menu } from "radix-ui"
import { cn } from "@patina/ui"

import { StarIcon } from "./aqua-icons"
import { menuContent, menuItem, menuSep } from "./menu-styles"
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

/* Pinstriped menu sheet, 92% opaque, soft drop shadow.
   The menu styles now live in ./menu-styles so pop-up buttons share them. */

function MenuTrigger({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "relative z-[2] flex h-full shrink-0 cursor-default items-center px-2.5 whitespace-nowrap outline-none select-none",
        "data-[state=open]:bg-(--y2k-tone-selection) data-[state=open]:text-(--y2k-tone-selection-text) data-[state=open]:[text-shadow:none]",
        className
      )}
      {...props}
    />
  )
}

type MenuBarProps = {
  tone: Tone
  appName: string
  onToneChange: (t: Tone) => void
  onOpen: (id: "about" | "readme" | "buttons" | "finder" | "tone") => void
}

export function MenuBar({ tone, appName, onToneChange, onOpen }: MenuBarProps) {
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[90] flex h-(--y2k-menubar-h) min-w-0 flex-nowrap items-stretch",
        "border-b border-black/[0.44] font-(family-name:--y2k-font-ui) text-[14px] font-medium text-(--y2k-ink)",
        "[text-shadow:0_1px_2px_rgba(0,0,0,0.3)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.1)]",
        // gloss across the top half
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-[1] before:h-1/2 before:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.3),rgba(255,255,255,0.1))] before:content-['']"
      )}
      style={{ backgroundImage: "var(--y2k-pinstripe-menubar), var(--y2k-menubar-bg)" }}
    >
      <Menu.Root modal={false}>
        <Menu.Trigger asChild>
          <MenuTrigger className="px-3" aria-label="Patina menu">
            <StarIcon className="size-4 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]" />
          </MenuTrigger>
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Content align="start" sideOffset={0} className={menuContent}>
            <Menu.Item className={menuItem} onSelect={() => onOpen("about")}>About Patina</Menu.Item>
            <Menu.Separator className={menuSep} />
            <Menu.Item className={menuItem} onSelect={() => onOpen("tone")}>Tone Preferences…</Menu.Item>
            <Menu.Separator className={menuSep} />
            <Menu.Item className={menuItem} onSelect={() => onOpen("readme")}>Read Me</Menu.Item>
            <Menu.Item className={menuItem} onSelect={() => onOpen("finder")}>Patina</Menu.Item>
            <Menu.Item className={menuItem} onSelect={() => onOpen("buttons")}>Design System</Menu.Item>
            <Menu.Separator className={menuSep} />
            <Menu.Item className={menuItem} disabled>Install… <span className="text-[11px]">Day 2</span></Menu.Item>
            <Menu.Item className={menuItem} disabled>Y2K-ify a Page… <span className="text-[11px]">Day 2</span></Menu.Item>
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>

      <Menu.Root modal={false}>
        <Menu.Trigger asChild>
          <MenuTrigger className="font-bold">{appName}</MenuTrigger>
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Content align="start" sideOffset={0} className={menuContent}>
            <Menu.Item className={menuItem} onSelect={() => onOpen("about")}>About {appName}</Menu.Item>
            <Menu.Separator className={menuSep} />
            <Menu.Item className={menuItem} disabled>Hide {appName} <span className="text-[11px]">⌘H</span></Menu.Item>
            <Menu.Item className={menuItem} disabled>Quit {appName} <span className="text-[11px]">⌘Q</span></Menu.Item>
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>

      <Menu.Root modal={false}>
        <Menu.Trigger asChild>
          <MenuTrigger>Tone</MenuTrigger>
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Content align="start" sideOffset={0} className={menuContent}>
            <Menu.RadioGroup value={tone} onValueChange={(v) => onToneChange(v as Tone)}>
              {TONES.map((t) => (
                <Menu.RadioItem key={t.id} value={t.id} className={cn(menuItem, "pl-6")}>
                  <span className="flex items-center gap-2">
                    <Menu.ItemIndicator className="absolute left-1.5 text-[11px]">✓</Menu.ItemIndicator>
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
            <Menu.Separator className={menuSep} />
            <Menu.Item className={menuItem} onSelect={() => onOpen("tone")}>Tone Preferences…</Menu.Item>
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>

      <div className="relative z-[2] ml-auto flex shrink-0 items-center gap-2 px-3 select-none sm:gap-4">
        <span className="whitespace-nowrap">
          <Clock />
        </span>
      </div>
    </header>
  )
}
