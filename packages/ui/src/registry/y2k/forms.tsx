"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Patina form controls — DESIGN.md › Components › Form controls.
 *
 * The Aqua 10.0 set, each at the original's size and rows (the gradients are
 * the measured profiles in y2k.css):
 *   Checkbox  a 15×16 cell holding a square 12px box 3px down; checked = the
 *             tone check gel and a black tick that overshoots the top-right
 *             corner; mixed = a 6×2 black bar. Label 24px from the left edge.
 *   Radio     a 14×15 cell holding a 12px ball; on = the tone ball + a 4px
 *             black dot. Label 24px in.
 *   TextField 24px, 13px text 6px in, white, #a9a9a9 rim darker (#949494) on
 *             top, 2px corners, a short inner shadow; focus = tone rim + ring
 *   SearchField  the same field with 10px corners, 10px in
 *   Slider    a 7px grooved track; a 15px ball, or a 15×19 pointer over 5px
 *             tick marks
 *   Stepper   a 13×21 pill with the two little arrows, 6px after its field
 */

/* Checkbox and Radio: the label row, and the 1px drop under the control. */
const choiceLabel = "inline-flex cursor-default items-center gap-[6px] font-(family-name:--y2k-font-ui) text-[13px] text-(--y2k-ink) select-none"
const choiceDrop = "drop-shadow-[0_1px_1px_rgba(0,0,0,0.34)]"

/* ── Checkbox ─────────────────────────────────────────────────────── */

type CheckState = boolean | "mixed"

function Checkbox({
  label,
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  disabled,
  className,
}: {
  label?: React.ReactNode
  checked?: CheckState
  defaultChecked?: CheckState
  onCheckedChange?: (checked: CheckState) => void
  disabled?: boolean
  className?: string
}) {
  const [inner, setInner] = React.useState<CheckState>(defaultChecked)
  const checked = checkedProp ?? inner
  const on = checked !== false
  return (
    <label
      data-slot="checkbox"
      className={cn(choiceLabel, disabled && "text-(--y2k-ink-disabled)", className)}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked === "mixed" ? "mixed" : checked}
        disabled={disabled}
        onClick={() => {
          const next = checked === true ? false : true
          setInner(next)
          onCheckedChange?.(next)
        }}
        className={cn(
          "group/check relative my-px mr-[2px] ml-px h-4 w-(--y2k-check-cell-w) shrink-0 cursor-default outline-none",
          !disabled && choiceDrop
        )}
      >
        {/* The 12px box: the measured rows, its sides a shade darker. */}
        <span
          aria-hidden
          className={cn(
            "absolute top-[3px] left-px size-3 bg-(image:--face) group-active/check:bg-[image:var(--y2k-gel-pressed),var(--face)]",
            "shadow-[inset_1px_0_0_var(--side),inset_-1px_0_0_var(--side)] group-focus-visible/check:shadow-(--y2k-focus-ring)",
            on
              ? "[--face:var(--y2k-tone-check)] [--side:color-mix(in_srgb,var(--y2k-tone-control-edge)_55%,transparent)]"
              : "[--face:var(--y2k-check-off)] [--side:rgba(0,0,0,0.16)]",
            disabled && "after:absolute after:inset-0 after:bg-[linear-gradient(to_bottom,rgba(53,53,53,0.49),rgba(95,95,95,0.49)_20%,rgba(124,124,124,0.49))] after:content-['']"
          )}
        />
        {checked === true && (
          <svg viewBox="0 0 15 16" className="absolute inset-0 size-full" aria-hidden>
            <path d="M3.4 6.3L6.6 12.3L13.7 1.1" stroke="#000" strokeWidth="1.9" fill="none" strokeLinejoin="round" />
          </svg>
        )}
        {checked === "mixed" && (
          <svg viewBox="0 0 15 16" className="absolute inset-0 size-full" aria-hidden>
            <rect x="4" y="8" width="6" height="2" fill="#000" />
            <rect x="4" y="10" width="6" height="1" fill="rgba(0,0,0,0.3)" />
          </svg>
        )}
      </button>
      {label}
    </label>
  )
}

/* ── Radio ────────────────────────────────────────────────────────── */

const RadioContext = React.createContext<{
  name: string
  value: string | undefined
  select: (v: string) => void
} | null>(null)

function RadioGroup({
  value: valueProp,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "defaultValue"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}) {
  const [inner, setInner] = React.useState(defaultValue)
  const name = React.useId()
  const value = valueProp ?? inner
  const select = (v: string) => {
    setInner(v)
    onValueChange?.(v)
  }
  return (
    <RadioContext.Provider value={{ name, value, select }}>
      <div role="radiogroup" data-slot="radio-group" className={cn("flex flex-col gap-1", className)} {...props}>
        {children}
      </div>
    </RadioContext.Provider>
  )
}

function Radio({ value, label, disabled, className }: { value: string; label?: React.ReactNode; disabled?: boolean; className?: string }) {
  const group = React.useContext(RadioContext)
  const on = group?.value === value
  return (
    <label
      data-slot="radio"
      className={cn(choiceLabel, disabled && "text-(--y2k-ink-disabled)", className)}
    >
      <button
        type="button"
        role="radio"
        aria-checked={on}
        disabled={disabled}
        onClick={() => group?.select(value)}
        className={cn(
          "group/radio relative mx-[2px] mt-px mb-[2px] h-(--y2k-radio-cell-h) w-(--y2k-radio-cell-w) shrink-0 cursor-default outline-none",
          !disabled && choiceDrop
        )}
      >
        {/* The 12px ball: the measured rows, darkening to its rim. */}
        <span
          aria-hidden
          className={cn(
            "absolute top-px left-px size-3 rounded-full bg-(image:--face) group-active/radio:bg-[image:var(--y2k-gel-pressed),var(--face)]",
            "shadow-[inset_0_0_0_1px_var(--side),inset_0_0_3px_rgba(0,0,0,0.2)] group-focus-visible/radio:shadow-(--y2k-focus-ring)",
            on
              ? "[--face:var(--y2k-tone-radio)] [--side:color-mix(in_srgb,var(--y2k-tone-control-edge)_55%,transparent)]"
              : "[--face:var(--y2k-radio-off)] [--side:rgba(0,0,0,0.3)]",
            disabled && "after:absolute after:inset-0 after:rounded-full after:bg-[rgba(95,95,95,0.49)] after:content-['']"
          )}
        >
          {on && <span className="absolute top-1/2 left-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black shadow-[0_0_0.5px_#000]" />}
        </span>
      </button>
      {label}
    </label>
  )
}

/* ── Text field / search field ────────────────────────────────────── */

const field = cn(
  "y2k-field h-(--y2k-field-h) min-w-0 font-(family-name:--y2k-font-ui) text-[13px] text-(--y2k-ink) outline-none",
  "placeholder:text-(--y2k-ink-disabled) focus:border-(--y2k-tone) focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.12),var(--y2k-focus-ring)]",
  "disabled:bg-[#f0f0f0] disabled:text-(--y2k-ink-disabled) read-only:bg-[#f6f6f6] read-only:text-[#4a4a4a]"
)

function TextField({ className, ...props }: React.ComponentProps<"input">) {
  return <input type="text" data-slot="text-field" className={cn(field, "px-[6px]", className)} {...props} />
}

function SearchField({
  value,
  onChange,
  className,
  placeholder = "Search",
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "onChange"> & { value: string; onChange: (value: string) => void }) {
  return (
    <input
      type="search"
      data-slot="search-field"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={props["aria-label"] ?? "Search"}
      className={cn(field, "rounded-[10px] px-[10px] [&::-webkit-search-cancel-button]:appearance-none", className)}
      {...props}
    />
  )
}

/* ── Slider ───────────────────────────────────────────────────────── */

// thumb: / track: (y2k.css) style the WebKit and Firefox parts in one go.
const track = "track:h-[7px] track:rounded-[4px] track:bg-(image:--y2k-slider-track)"
// The ball: 15px, the measured rows, darkening hard toward its rim, a 1px foot.
const roundThumb = cn(
  "thumb:size-(--y2k-slider-thumb) thumb:rounded-full thumb:border-0 thumb:bg-(image:--y2k-tone-slider)",
  "thumb:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--y2k-tone-control-edge)_80%,transparent),inset_0_0_4px_1px_color-mix(in_srgb,var(--y2k-tone-control-edge)_45%,transparent),0_1px_0.5px_rgba(0,0,0,0.55)]",
  "[&::-webkit-slider-thumb]:-mt-1"
)
// Brushed metal (iTunes' volume): a 12px white knob riding a pixel low in the
// measured 6px groove.
const metalThumb = cn(
  "track:h-[6px] track:rounded-[2px] track:bg-(image:--y2k-metal-groove)",
  "thumb:size-3 thumb:rounded-full thumb:border-0 thumb:bg-(image:--y2k-metal-knob) [&::-webkit-slider-thumb]:-mt-[3px]",
  "thumb:shadow-[inset_1px_0_1px_rgba(0,0,0,0.25),inset_-1px_0_1px_rgba(0,0,0,0.25),0_1px_1px_rgba(0,0,0,0.3)]"
)
// The pointer: 15×19, square shoulders, a 45° point down at the ticks.
const pointerThumb = cn(
  "thumb:h-(--y2k-slider-pointer-h) thumb:w-(--y2k-slider-thumb) thumb:rounded-none thumb:border-0",
  "thumb:[clip-path:polygon(1px_0,14px_0,15px_1px,15px_11.5px,7.5px_19px,0_11.5px,0_1px)]",
  "thumb:bg-[linear-gradient(to_right,rgba(0,0,40,0.35)_0_1px,transparent_1px_calc(100%-1px),rgba(0,0,40,0.35)_calc(100%-1px)),var(--y2k-tone-pointer)]",
  "[&::-webkit-slider-thumb]:-mt-[6px]"
)

function Slider({
  thumb = "round",
  ticks,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & {
  /** "round" — the ball; "pointer" — the pentagon over tick marks; "metal" —
   *  brushed metal's white knob in its groove. */
  thumb?: "round" | "pointer" | "metal"
  /** Number of tick marks under a pointer slider. */
  ticks?: number
}) {
  const input = (
    <input
      type="range"
      data-slot="slider"
      className={cn(
        "h-[22px] w-full cursor-default appearance-none bg-transparent outline-none",
        "thumb:appearance-none focus-visible:thumb:shadow-(--y2k-focus-ring)",
        track,
        { round: roundThumb, pointer: pointerThumb, metal: metalThumb }[thumb],
        className
      )}
      {...props}
    />
  )
  if (!ticks || thumb !== "pointer") return input
  return (
    <div data-slot="slider-with-ticks" className="flex w-full flex-col">
      {input}
      <div className="mt-px flex justify-between px-[7px]" aria-hidden>
        {Array.from({ length: ticks }, (_, i) => (
          <span key={i} className="h-[5px] w-px bg-[#8a8a8a]" />
        ))}
      </div>
    </div>
  )
}

/* ── Stepper ──────────────────────────────────────────────────────── */

function Stepper({
  value,
  onValueChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  field: withField = true,
  className,
}: {
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** Show the number field beside the arrows (the usual Aqua pairing). */
  field?: boolean
  className?: string
}) {
  const set = (v: number) => onValueChange(Math.min(max, Math.max(min, v)))
  const half = "flex h-1/2 w-full cursor-default outline-none"
  const disabledAll = value >= max && value <= min
  return (
    <div data-slot="stepper" className={cn("inline-flex items-center gap-[6px]", className)}>
      {withField && (
        <TextField
          value={String(value)}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (!Number.isNaN(n)) set(n)
          }}
          inputMode="numeric"
          className="w-[52px]"
          aria-label="Value"
        />
      )}
      {/* The 13×21 pill: the measured rows (the pressed half floods with the
          tone), its sides darkening, the two little arrows drawn on top. */}
      <span
        className={cn(
          "relative inline-flex h-(--y2k-stepper-h) w-(--y2k-stepper-w) flex-col overflow-hidden rounded-full",
          "shadow-[inset_1px_0_1px_rgba(0,0,0,0.3),inset_-1px_0_1px_rgba(0,0,0,0.3),0_1px_1px_rgba(0,0,0,0.3)]",
          "bg-(image:--y2k-stepper)",
          "has-[button:first-of-type:active:enabled]:bg-(image:--y2k-tone-stepper-up)",
          "has-[button:last-of-type:active:enabled]:bg-(image:--y2k-tone-stepper-down)",
          disabledAll && "opacity-60"
        )}
      >
        <svg viewBox="0 0 7 12" className="pointer-events-none absolute top-1/2 left-1/2 h-3 w-[7px] -translate-x-1/2 -translate-y-1/2" aria-hidden>
          <path d="M3.5 0.3L6.7 4.8H0.3zM3.5 11.7L6.7 7.2H0.3z" fill="#000" />
        </svg>
        <button type="button" aria-label="Increase" disabled={value >= max} onClick={() => set(value + step)} className={half} />
        <button type="button" aria-label="Decrease" disabled={value <= min} onClick={() => set(value - step)} className={half} />
      </span>
    </div>
  )
}

export { Checkbox, RadioGroup, Radio, TextField, SearchField, Slider, Stepper, type CheckState }

/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
