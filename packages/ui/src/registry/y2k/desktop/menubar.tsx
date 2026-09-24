"use client"

import { DropdownMenu as Menu } from "radix-ui"

import { MenuBar as PackMenuBar, MenuBarVolume, type MenuSpec } from "@/components/ui/menu-bar"
import { menuItemClass, menuSeparatorClass, menuTickClass } from "@/components/ui/popup"

import { StarIcon } from "./icons"
import { TONES, type Tone } from "./tones"
import { setVolume, useVolume } from "./volume"

export type { MenuRow, MenuSpec } from "@/components/ui/menu-bar"

type MenuBarProps = {
  tone: Tone
  onToneChange: (t: Tone) => void
  /** Who the site is about: the ★ menu's name. */
  owner: string
  /** The ★ menu's first row: the About box. */
  about: { label: string; onSelect: () => void }
  /** The desktop's places: the volume, then the top-level folders. */
  places: { label: string; onSelect: () => void }[]
  /** The live site, linked at the foot of the ★ menu. */
  home?: { label: string; href: string }
  /** After the ★: the front app's menu (its name in bold), then File, Edit,
   *  View, Go, Window and Help. */
  menus: MenuSpec[]
}

/** The desktop's menu bar: the pack's, with the ★ menu — About the owner,
 *  the tones (where 10.1 keeps its system-wide settings), the desktop's
 *  places, and the site this desktop is a window onto. */
export function MenuBar({ tone, onToneChange, owner, about, places, home, menus }: MenuBarProps) {
  const volume = useVolume()
  const star: MenuSpec = {
    label: <StarIcon className="size-4 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]" />,
    "aria-label": `${owner} menu`,
    content: (
      <>
        <Menu.Item className={menuItemClass} onSelect={about.onSelect}>
          {about.label}
        </Menu.Item>
        <Menu.Separator className={menuSeparatorClass} />
        <Menu.RadioGroup value={tone} onValueChange={(v) => onToneChange(v as Tone)}>
          {TONES.map((t) => (
            <Menu.RadioItem key={t.id} value={t.id} className={menuItemClass}>
              <span className="flex items-center gap-2">
                <Menu.ItemIndicator className={menuTickClass}>✓</Menu.ItemIndicator>
                <span
                  data-tone={t.id}
                  className="inline-block size-3 rounded-full bg-(--y2k-tone) shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_0_0_1px_rgba(0,0,0,0.18)]"
                />
                {t.label}
              </span>
              <span className="text-[11px] opacity-70">{t.era.split(" · ")[1]}</span>
            </Menu.RadioItem>
          ))}
        </Menu.RadioGroup>
        <Menu.Separator className={menuSeparatorClass} />
        {places.map((p) => (
          <Menu.Item key={p.label} className={menuItemClass} onSelect={p.onSelect}>
            {p.label}
          </Menu.Item>
        ))}
        {home && (
          <>
            <Menu.Separator className={menuSeparatorClass} />
            <Menu.Item asChild className={menuItemClass}>
              <a href={home.href} target="_blank" rel="noopener noreferrer">
                {home.label}
              </a>
            </Menu.Item>
          </>
        )}
      </>
    ),
  }
  return (
    // Today's date, in 2000.
    <PackMenuBar logo={star} menus={menus} locale="en-GB" clockYear={2000}>
      <MenuBarVolume value={volume} onValueChange={setVolume} />
    </PackMenuBar>
  )
}
