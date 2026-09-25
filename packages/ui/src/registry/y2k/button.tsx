import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Patina Button — DESIGN.md › Components › Buttons.
 *
 * The Aqua 10.0 push button, at the original's measurements: 20px tall, a
 * full 10px round end, 68px minimum, 14px end caps, 13px regular text. The
 * body is the original's 20 rows (--y2k-gel-white / --y2k-tone-button); the
 * round ends darken toward the rim; it sits on a short, tight drop shadow.
 *   white  — the neutral push button (Cancel, Show All…). The default.
 *   tone   — the gel in the current tone. `isDefault` marks the window's
 *            default action; `pulsing` adds the dialog throb.
 *   metal  — brushed metal's white disc (iTunes' transport): the measured
 *            rows, the sides shading in, a short drop onto the metal, the
 *            glyph in the metal's #393939. Disabled, only the glyph greys,
 *            to #9c9c9c; the disc stays.
 *   link   — not an Aqua control: a text link in OS blue (--y2k-link), for
 *            what the web needs and shadcn's variant="link".
 * Pressed (held, or aria-pressed for a toggle) lays the original's grey press
 * over the fill and pulls the shadow in. Disabled fades to 55% with #8d8d8d
 * text and no shadow.
 *
 * size="icon" is the Aqua round button: a 20px grey sphere, 11px glyph.
 *
 * shadcn's own names are accepted too, so a page written for shadcn's Button
 * compiles on this one before /y2k-ify has been over it: `default` is the
 * tone gel; `outline`, `secondary`, `ghost` and `destructive` the white one
 * (Aqua has one push button; a destructive action is still a white button
 * with a plain label); `lg` and `default` sizes are the one push-button size,
 * `xs` the small one, `icon-lg`/`icon-xs` the round buttons.
 */
const packVariants = cva(
  [
    "relative inline-flex shrink-0 cursor-default select-none items-center justify-center gap-1.5 whitespace-nowrap",
    "border-0 font-(family-name:--y2k-font-ui) font-normal leading-none text-(--y2k-ink) antialiased outline-none",
    "focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-1 focus-visible:outline-(--y2k-tone-focus)",
    "disabled:pointer-events-none disabled:text-(--y2k-ink-disabled) disabled:opacity-55 disabled:shadow-(--rim)",
    // The body is --face; a press lays the original's grey over it.
    "bg-(image:--face) active:bg-[image:var(--y2k-gel-pressed),var(--face)] aria-pressed:bg-[image:var(--y2k-gel-pressed),var(--face)]",
    "data-[pulsing=true]:motion-safe:animate-[y2k-pulse_0.5s_ease-in-out_infinite] data-[pulsing=true]:active:animate-none",
    "[&_svg]:pointer-events-none [&_svg]:relative [&_svg]:z-[1] [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        // --rim darkens the round ends toward the edge (inset, so it follows the radius).
        white: "[--face:var(--y2k-gel-white)] [--rim:var(--y2k-button-rim-white)]",
        tone: "[--face:var(--y2k-tone-button)] [--rim:var(--y2k-button-rim-tone)]",
        metal: [
          "[--face:var(--y2k-metal-button)] [--drop:var(--y2k-shadow-button-metal)] [--rim:var(--y2k-button-rim-metal)]",
        ],
        link: "",
      },
      size: {
        sm: "h-[17px] min-w-[56px] rounded-full px-3 text-[11px] shadow-[var(--rim),var(--y2k-shadow-button-small)] active:shadow-[var(--rim),var(--y2k-shadow-button-active)]",
        md: [
          "h-(--y2k-button-h) min-w-[68px] rounded-full px-[14px] text-[13px]",
          "shadow-[var(--rim),var(--y2k-shadow-button)] active:shadow-[var(--rim),var(--y2k-shadow-button-active)]",
        ],
        icon: [
          "size-(--y2k-button-h) rounded-full px-0 text-[11px] text-[#262626]",
          "shadow-[var(--rim),var(--y2k-shadow-button-icon)] [&_svg:not([class*='size-'])]:size-3",
        ],
        "icon-sm": "size-[17px] rounded-full px-0 shadow-[var(--rim),var(--y2k-shadow-button-small)] [&_svg:not([class*='size-'])]:size-3",
      },
    },
    compoundVariants: [
      // The round button is a grey sphere, not the push-button body.
      { variant: "white", size: "icon", className: "[--face:var(--y2k-round-button)]" },
      // Metal's ink and drop, over whatever the size sets.
      {
        variant: "metal",
        className: [
          "text-[#393939] shadow-[var(--rim),var(--drop)] active:shadow-[var(--rim),var(--y2k-shadow-button-metal-active)]",
          "disabled:text-[#9c9c9c] disabled:opacity-100 disabled:shadow-[var(--rim),var(--drop)]",
        ],
      },
      // A link has no body at all, whatever the size.
      {
        variant: "link",
        className: [
          "h-auto min-w-0 rounded-none bg-none px-0 text-(--y2k-link) underline underline-offset-2 shadow-none",
          "active:bg-none active:shadow-none disabled:shadow-none",
        ],
      },
    ],
    defaultVariants: {
      variant: "white",
      size: "md",
    },
  }
)

/** shadcn's Button names, mapped onto the pack's. */
const VARIANT_ALIAS = { default: "tone", outline: "white", secondary: "white", ghost: "white", destructive: "white" } as const
const SIZE_ALIAS = { default: "md", lg: "md", xs: "sm", "icon-lg": "icon", "icon-xs": "icon-sm" } as const

type PackProps = VariantProps<typeof packVariants>
type ButtonVariant = NonNullable<PackProps["variant"]> | keyof typeof VARIANT_ALIAS
type ButtonSize = NonNullable<PackProps["size"]> | keyof typeof SIZE_ALIAS

const packVariant = (v?: ButtonVariant | null) => (v && v in VARIANT_ALIAS ? VARIANT_ALIAS[v as keyof typeof VARIANT_ALIAS] : (v as PackProps["variant"]))
const packSize = (s?: ButtonSize | null) => (s && s in SIZE_ALIAS ? SIZE_ALIAS[s as keyof typeof SIZE_ALIAS] : (s as PackProps["size"]))

/** The button's classes, for a link or anything else that should look like
 *  one — shadcn's names welcome. */
function buttonVariants({ variant, size, className }: { variant?: ButtonVariant | null; size?: ButtonSize | null; className?: string } = {}) {
  return packVariants({ variant: packVariant(variant), size: packSize(size), className })
}

function Button({
  className,
  variant = "white",
  size = "md",
  isDefault = false,
  pulsing = false,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> & {
    variant?: ButtonVariant | null
    size?: ButtonSize | null
  } & {
    /** The window's default action: the tone gel. One per window. */
    isDefault?: boolean
    /** The dialog throb of the default button (off by default, as in the
     *  reference: every resting screenshot shows its mid-phase). */
    pulsing?: boolean
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const resolvedVariant = isDefault ? "tone" : packVariant(variant)
  const resolvedSize = packSize(size)

  return (
    <Comp
      data-slot="button"
      data-variant={resolvedVariant}
      data-size={resolvedSize}
      data-default={isDefault || undefined}
      data-pulsing={(isDefault && pulsing) || undefined}
      className={cn(packVariants({ variant: resolvedVariant, size: resolvedSize, className }))}
      {...props}
    >
      {asChild ? children : <span className="relative z-[1]">{children}</span>}
    </Comp>
  )
}

/** Aqua bevel button ("Choose…"): 18px, 11px black text, the original's 16
 *  rows with a 1px drop; square shoulders. */
function BevelButton({ className, pressed, ...props }: React.ComponentProps<"button"> & { pressed?: boolean }) {
  return (
    <button
      type="button"
      data-slot="bevel-button"
      aria-pressed={pressed}
      className={cn(
        "relative inline-flex h-(--y2k-bevel-h) shrink-0 cursor-default items-center justify-center rounded-[2px] px-[10px] whitespace-nowrap outline-none",
        "font-(family-name:--y2k-font-ui) text-[11px] text-black select-none",
        "bg-(image:--y2k-bevel) shadow-(--y2k-shadow-bevel)",
        "active:bg-[image:var(--y2k-gel-pressed),var(--y2k-bevel)] aria-pressed:bg-[image:var(--y2k-gel-pressed),var(--y2k-bevel)]",
        "disabled:bg-(image:--y2k-bevel-disabled) disabled:text-(--y2k-ink-disabled) disabled:shadow-none",
        "focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-1 focus-visible:outline-(--y2k-tone-focus)",
        className
      )}
      {...props}
    />
  )
}

export { Button, BevelButton, buttonVariants }

/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
