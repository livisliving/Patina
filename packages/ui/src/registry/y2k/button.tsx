import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Patina Button — DESIGN.md › Components › Buttons.
 *
 * The Aqua push button: 28px tall, 14px radius, no border. Two materials:
 *   white  — translucent white gel (Cancel, Show All…). The default.
 *   tone   — the gel in the current tone. Pass `isDefault` to make it the
 *            window's default button: it pulses like Aqua's blue "Save".
 *
 * Gloss is two pseudo-elements: a shine across the top third and a glow
 * rising from the bottom. Text sits above both with a soft drop shadow.
 */
const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 cursor-default select-none items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap",
    "border-0 font-(family-name:--y2k-font-ui) font-medium leading-none text-(--y2k-ink) antialiased outline-none",
    "transition-[filter] duration-150",
    // Top shine (Aqua gel cap: upper ~46%, pill-shaped, per HIG/aqua gloss)
    "before:pointer-events-none before:absolute before:top-[2px] before:left-[7%] before:right-[7%] before:z-[2] before:h-[46%] before:rounded-full before:bg-(image:--y2k-gel-shine) before:blur-[0.4px] before:content-['']",
    // Bottom glow
    "after:pointer-events-none after:absolute after:bottom-0 after:left-1/2 after:h-[33%] after:w-[calc(100%-8px)] after:-translate-x-1/2 after:rounded-full after:bg-(image:--y2k-gel-glow) after:blur-[1px] after:content-['']",
    "disabled:pointer-events-none disabled:text-(--y2k-ink-disabled) disabled:[text-shadow:none] disabled:before:opacity-40 disabled:after:opacity-40",
    "data-[default=true]:animate-[y2k-pulse_1.5s_ease-in-out_infinite] data-[default=true]:active:animate-none",
    "[&_svg]:pointer-events-none [&_svg]:relative [&_svg]:z-[1] [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        white: [
          "bg-(image:--y2k-gel-white) shadow-(--y2k-gel-white-shadow) [text-shadow:0_2px_2px_rgba(0,0,0,0.25)]",
          "focus-visible:shadow-(--y2k-gel-white-shadow-active) active:shadow-(--y2k-gel-white-shadow-active)",
          "disabled:bg-[linear-gradient(rgba(200,200,200,0.5),rgba(255,255,255,0.5))]",
        ],
        tone: [
          "bg-(image:--y2k-tone-button) shadow-(--y2k-gel-tone-shadow) [text-shadow:0_2px_2px_var(--y2k-tone-text-shadow)]",
          "focus-visible:shadow-(--y2k-gel-tone-shadow-active) active:shadow-(--y2k-gel-tone-shadow-active)",
          "disabled:bg-(image:--y2k-gel-white) disabled:shadow-(--y2k-gel-white-shadow)",
        ],
      },
      size: {
        sm: "h-[17px] rounded-full px-3 text-[11px]",
        md: "h-(--y2k-button-h) rounded-full px-4 text-[13px]",
        lg: "h-[28px] rounded-full px-5 text-[14px]",
        icon: "size-(--y2k-button-h) rounded-full px-0",
        "icon-sm": "size-[17px] rounded-full px-0 [&_svg:not([class*='size-'])]:size-3",
      },
    },
    defaultVariants: {
      variant: "white",
      size: "md",
    },
  }
)

function Button({
  className,
  variant = "white",
  size = "md",
  isDefault = false,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** The window's default action: tone gel + pulse. One per window. */
    isDefault?: boolean
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const resolvedVariant = isDefault ? "tone" : variant

  return (
    <Comp
      data-slot="button"
      data-variant={resolvedVariant}
      data-size={size}
      data-default={isDefault || undefined}
      className={cn(buttonVariants({ variant: resolvedVariant, size, className }))}
      {...props}
    >
      {asChild ? children : <span className="relative z-[1]">{children}</span>}
    </Comp>
  )
}

export { Button, buttonVariants }
