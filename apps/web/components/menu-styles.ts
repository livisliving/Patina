"use client"

import { cn } from "@patina/ui"

/**
 * Shared Aqua dropdown-menu styles, used by the menu bar and by the pop-up
 * buttons (font / size / "Where" pickers). Kept in one place so the menu sheet,
 * items and separators look identical wherever a Radix DropdownMenu is used.
 */

/* Pinstriped menu sheet, 92% opaque, soft drop shadow. */
export const menuContent = cn(
  "z-[100] min-w-[12rem] bg-(image:--y2k-pinstripe) py-1 opacity-[0.92] outline-none",
  "font-(family-name:--y2k-font-ui) text-[13px] text-(--y2k-ink) shadow-(--y2k-shadow-menu)",
  "data-[state=open]:animate-[y2k-fade-in_120ms_ease-out]"
)

export const menuItem = cn(
  "relative flex h-6 cursor-default items-center justify-between gap-6 py-1.5 pr-3 pl-4 outline-none select-none",
  "[text-shadow:0_2px_3px_rgba(0,0,0,0.25)]",
  "data-[highlighted]:bg-(--y2k-tone-selection) data-[highlighted]:text-(--y2k-tone-selection-text) data-[highlighted]:[text-shadow:none]",
  "data-[disabled]:text-(--y2k-ink-disabled) data-[disabled]:[text-shadow:none]"
)

export const menuSep = "my-1 h-px bg-(--y2k-separator)"
