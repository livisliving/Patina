"use client"

import { DropdownMenu as Menu } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Patina menus and the pop-up button — DESIGN.md › Components.
 *
 * The Aqua 10.0 menu: the menu pinstripe at 90%, so the screen shows faintly
 * through; a 1px #8a8a8a rim, 5px bottom corners, a 4px inset and 19px rows
 * (a 17px line, 1px above and below) 22px from the edge; the highlighted row
 * takes the tone highlight gradient with its ink. Exported as class names so any Radix DropdownMenu — the menu
 * bar's, a context menu — can wear it.
 *
 * PopupButton: 20px, the white rows with a 4px round left end and 13px text
 * 10px in, ending in a 21px gem — the tone control rows, parted from the
 * body by a darker 1px line, its round right end darkening — with two white
 * 5×4 arrows. It opens that menu with the options as radio items, the
 * current one ticked.
 */

const menuContentClass = cn(
  "z-[100] min-w-[180px] rounded-b-[5px] border border-[#8a8a8a] bg-(image:--y2k-pinstripe-menu) py-1 outline-none",
  "font-(family-name:--y2k-font-ui) text-[13px] text-(--y2k-ink) shadow-(--y2k-shadow-menu)",
  "data-[state=open]:animate-[y2k-fade-in_120ms_ease-out]"
)

const menuItemClass = cn(
  "relative flex cursor-default items-center justify-between gap-[18px] px-[22px] py-px leading-[17px] outline-none select-none",
  "data-[highlighted]:bg-(image:--y2k-tone-highlight) data-[highlighted]:text-(--y2k-tone-highlight-text)",
  "data-[disabled]:text-(--y2k-ink-disabled)"
)

const menuSeparatorClass = "my-1 h-px border-b border-white bg-[#c8c8c8]"

/** A ticked item's check, in the 22px margin. */
const menuTickClass = "absolute left-2 text-[11px]"

function PopupButton({
  value,
  options,
  onChange,
  className,
  "aria-label": ariaLabel,
}: {
  value: string
  options: string[]
  onChange?: (value: string) => void
  className?: string
  "aria-label"?: string
}) {
  return (
    <Menu.Root modal={false}>
      {/* The trigger is the button itself — no asChild, which shadcn rewrites
          for Base UI projects. */}
      <Menu.Trigger
        type="button"
        data-slot="popup-button"
        aria-label={ariaLabel}
        className={cn(
          "relative inline-flex h-(--y2k-popup-h) min-w-[60px] cursor-default items-center rounded-[4px] pr-[calc(var(--y2k-popup-gem)+2px)] pl-[10px] text-left",
          "font-(family-name:--y2k-font-ui) text-[13px] text-black outline-none",
          "bg-(image:--y2k-popup-white) shadow-[inset_1px_0_0_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.14)]",
          "focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-(--y2k-tone-focus) data-[state=open]:brightness-95",
          className
        )}
      >
        <span className="relative z-[1] truncate">{value}</span>
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-0 right-0 w-(--y2k-popup-gem) rounded-r-[4px]",
            "bg-[image:var(--y2k-tone-popup),var(--y2k-tone-control)] bg-[length:1px_100%,100%_100%] bg-no-repeat",
            "shadow-[inset_-3px_0_3px_-1px_color-mix(in_srgb,var(--y2k-tone-control-edge)_45%,transparent)]"
          )}
        >
          <svg viewBox="0 0 21 20" className="absolute inset-0 size-full">
            <path d="M10.5 4.6L13 9H8zM8 11h5l-2.5 4.4z" fill="#fff" />
          </svg>
        </span>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align="start" sideOffset={4} className={cn(menuContentClass, "min-w-[var(--radix-dropdown-menu-trigger-width)]")}>
          <Menu.RadioGroup value={value} onValueChange={(v) => onChange?.(v)}>
            {options.map((opt) => (
              <Menu.RadioItem key={opt} value={opt} className={menuItemClass}>
                <Menu.ItemIndicator className={menuTickClass}>✓</Menu.ItemIndicator>
                {opt}
              </Menu.RadioItem>
            ))}
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  )
}

export { PopupButton, menuContentClass, menuItemClass, menuSeparatorClass, menuTickClass }
