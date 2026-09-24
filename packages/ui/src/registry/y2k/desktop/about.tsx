"use client"

import * as React from "react"

import { PopupButton } from "@/components/ui/popup"
import { WindowScrollArea, WindowWell } from "@/components/ui/window"
import { cn } from "@/lib/utils"
import type { Person } from "@/lib/content"

import { asset } from "./asset"
import { Blocks } from "./blocks"
import { useReducedMotion } from "./use-media-query"

/**
 * What the owner's About box shows: the portrait (with the greeting typed
 * onto its screen, when it has one), the name and role under it, and the
 * panes laid out as 10.0's Show Info was: a pop-up button switching them
 * (Show Info's were General Information, Name & Extension, Preview,
 * Privileges…) over a sunken well, each pane's blocks in it.
 *
 * A pop-up rather than folder tabs because that is how Show Info did it; a
 * narrow About box would not fit six tabs; and the pop-up's gem is the
 * tone's gel — one more place the tone shows.
 */

/* ── The portrait ─────────────────────────────────────────────────── */

/** How far in from the screen's edge the text starts: a tenth of the screen
 *  each way, clear of its rounded corners and the shaded bezel. */
const INSET = 0.1
/** One character every 45ms, as a typewriter effect goes. */
const TYPE_MS = 45
/** Phosphor mint on a black screen: the picture's own colours, not the
 *  desktop's chrome. */
const SCREEN_INK = "#9EE9C8"

/** How many characters of `text` have been typed so far. */
function useTypewriter(text: string, on: boolean) {
  const [typed, setTyped] = React.useState(0)
  React.useEffect(() => {
    if (!on) return
    const id = window.setInterval(() => {
      setTyped((n) => {
        if (n + 1 >= text.length) window.clearInterval(id)
        return Math.min(n + 1, text.length)
      })
    }, TYPE_MS)
    return () => window.clearInterval(id)
  }, [text, on])
  return on ? typed : text.length
}

function Cursor({ blink }: { blink: boolean }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block h-[1em] w-[0.6em] align-text-bottom", blink && "animate-[y2k-blink_1s_steps(1)_infinite]")}
      style={{ backgroundColor: SCREEN_INK }}
    />
  )
}

/** The lines typed onto the portrait's screen, placed in percent of the
 *  picture. */
function Screen({ screen, lines }: { screen: { x: number; y: number; w: number; h: number }; lines: string[] }) {
  // Less motion: the whole greeting is there at once, the cursor still.
  const reduce = useReducedMotion()
  const text = lines.join("\n")
  const shown = useTypewriter(text, !reduce)
  const typed = text.slice(0, shown).split("\n")
  const inset = { x: screen.w * INSET, y: screen.h * INSET }
  return (
    <>
      {/* Typed from the left, whatever the About body centres. */}
      <div
        aria-hidden
        className="absolute overflow-hidden text-left font-(family-name:--y2k-font-mono) text-[11px] leading-[1.5] break-words whitespace-pre-wrap [text-shadow:0_0_4px_rgba(158,233,200,0.55)]"
        style={{
          color: SCREEN_INK,
          left: `${screen.x + inset.x}%`,
          top: `${screen.y + inset.y}%`,
          width: `${screen.w - inset.x * 2}%`,
          height: `${screen.h - inset.y * 2}%`,
        }}
      >
        {typed.map((line, i) => (
          <span key={i} className="block">
            {line}
            {i === typed.length - 1 && <Cursor blink={!reduce} />}
          </span>
        ))}
      </div>
      <p className="sr-only">{lines.join(" ")}</p>
    </>
  )
}

/** The portrait, 260px wide, the greeting on its screen. */
function Portrait({ portrait }: { portrait: NonNullable<Person["portrait"]> }) {
  const { image, screen, lines } = portrait
  return (
    <div className="relative w-[260px]" style={{ aspectRatio: `${image.w} / ${image.h}` }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a plain img: the screen is placed over it in percent */}
      <img
        src={asset(image.src)}
        alt={image.alt}
        width={image.w}
        height={image.h}
        draggable={false}
        // A picture flattened on white, multiplied: its white is the
        // pinstripe, so it stands on the window as an icon would.
        className="absolute inset-0 size-full mix-blend-multiply"
      />
      {screen && lines?.length ? <Screen screen={screen} lines={lines} /> : null}
    </div>
  )
}

/* ── The About box's contents ─────────────────────────────────────── */

/** Inside AboutWindow's body (centred, 8px apart): the portrait, the name
 *  and role, then the pane switcher over its well. The well is 240px tall
 *  and scrolls, so the box stays short whatever pane is up. */
export function AboutPerson({ person }: { person: Person }) {
  const labels = person.panes.map((p) => p.label)
  const [label, setLabel] = React.useState(labels[0])
  const pane = person.panes.find((p) => p.label === label) ?? person.panes[0]
  return (
    <>
      {person.portrait && <Portrait portrait={person.portrait} />}
      <div>
        <p className="leading-[1.3] font-bold">{person.name}</p>
        {person.role && <p className="text-[11px] leading-[1.35]">{person.role}</p>}
      </div>
      {pane && (
        <div className="flex w-full flex-col gap-2 pt-1 text-left">
          {labels.length > 1 && <PopupButton aria-label="Show" value={pane.label} options={labels} onChange={setLabel} className="w-full" />}
          <WindowWell>
            {/* Keyed on the pane, so a new pane starts at the top. */}
            <WindowScrollArea key={pane.label} className="h-[240px]">
              <div className="p-3 text-[13px] leading-[1.45] text-(--y2k-ink)">
                <Blocks blocks={pane.blocks} anchorPrefix="about" />
              </div>
            </WindowScrollArea>
          </WindowWell>
        </div>
      )}
      {person.copyright && <p className="text-[11px] leading-[1.35] text-(--y2k-ink-secondary)">{person.copyright}</p>}
    </>
  )
}
