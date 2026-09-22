"use client"

import { DropdownMenu as Menu } from "radix-ui"
import { MenuBar as PackMenuBar, menuItemClass, menuSeparatorClass, menuTickClass, type MenuSpec } from "@patina/ui"

import { StarIcon } from "./aqua-icons"
import { TONES, type Tone } from "./tones"

export type { MenuRow, MenuSpec } from "@patina/ui"

type MenuBarProps = {
  tone: Tone
  onToneChange: (t: Tone) => void
  onOpen: (id: "about" | "readme" | "buttons" | "finder" | "tone") => void
  /** After the ★: the front app's menu (its name in bold), then File, Edit,
   *  View, Go, Window and Help. */
  menus: MenuSpec[]
}

/** The desktop's menu bar: the pack's, with the ★ menu — About, the tones
 *  (where 10.1 keeps its system-wide settings) and the pack's windows. */
export function MenuBar({ tone, onToneChange, onOpen, menus }: MenuBarProps) {
  const star: MenuSpec = {
    label: <StarIcon className="size-4 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]" />,
    "aria-label": "Patina menu",
    content: (
      <>
        <Menu.Item className={menuItemClass} onSelect={() => onOpen("about")}>About Patina</Menu.Item>
        <Menu.Separator className={menuSeparatorClass} />
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
      </>
    ),
  }
  return <PackMenuBar logo={star} menus={menus} />
}
