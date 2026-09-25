"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { WindowWell } from "@/components/ui/window"
import type { Block } from "@/lib/content"
import { Inlines } from "./blocks"

/**
 * The six blocks that need more than a paragraph's worth of drawing: steps,
 * quote, faq, table, progress and code. `blocks.tsx` renders the rest and
 * hands these here, each with the block object's fields spread as props.
 *
 * Each is an Aqua thing that existed in Mac OS X 10.0/10.1, chosen from
 * Apple's *Aqua Human Interface Guidelines* (June 2002), with the reason in a
 * comment above it. Type is DESIGN.md's three sizes and nothing else: 13px
 * body and bold, 11px secondary ink, 12px inside the Table. No tone on text;
 * no card radius, no card shadow; every non-text value on the 4px grid bar
 * DESIGN.md's named metrics (the 7px disclosure triangle, its 5px gap).
 */

type Of<T extends Block["type"]> = Omit<Extract<Block, { type: T }>, "type">

/** 11px secondary ink: DESIGN.md's `body-sm` — the only size secondary ink
 *  may take ("never at body size"). */
const SMALL = "text-[11px] leading-[1.35] text-(--y2k-ink-secondary)"

/** The tone focus ring every focusable thing in a document wears. */
const FOCUS = "outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-(--y2k-tone-focus)"

/* ── steps ────────────────────────────────────────────────────────── */

/**
 * steps → a Setup Assistant pane (HIG ch. 14, "Setup Assistants"). A
 * process read in order is what an assistant is: one step per pane ("ask
 * only one question per pane"), text flush left in a sunken inset area,
 * **Go Back** and **Continue** bottom-right, and a progress bar to the left
 * of Go Back, its left edge on the inset's. Here the bar is a true fraction
 * — step n of N — the one honest Progress a document can hold.
 *
 * Go Back is dimmed on the first step. On the last, the default button
 * reads **Done** and simply stays: there is nothing to finish. (The HIG's
 * Conclusion pane also dims Go Back, because a real assistant has already
 * changed the system by then; a document has changed nothing, so the
 * reader may still go back.) Continue is the window's one default button,
 * the tone gel; Go Back is the white one, 12px to its left.
 *
 * Every step is laid into the same grid cell and all but the current one
 * are hidden (visibility, so they leave the tab order and the accessibility
 * tree): the pane is as tall as its longest step, and the buttons never
 * jump as the reader steps through — an assistant window doesn't resize
 * between panes.
 */
export function Steps({ title, intro, items }: Of<"steps">) {
  const [step, setStep] = React.useState(0)
  const continueRef = React.useRef<HTMLButtonElement>(null)
  const titleId = React.useId()
  // The panes: the source's own lead-in as "Introduction" (HIG: title the
  // first pane "Introduction"), when it has one, then one pane a step.
  const panes = [...(intro ? [{ title: "Introduction", body: intro }] : []), ...items]
  const n = panes.length
  if (!items.length) return null
  const at = Math.min(step, n - 1)
  const first = at === 0
  const last = at === n - 1
  // The count is of the steps; the Introduction isn't one.
  const lead = intro ? 1 : 0
  const counter = at < lead ? "Introduction" : `Step ${at + 1 - lead} of ${items.length}`

  return (
    <div role="group" aria-labelledby={title ? titleId : undefined} aria-label={title ? undefined : "Steps"} className="flex flex-col gap-1">
      {title && (
        <h3 id={titleId} className="text-[13px] leading-[1.3] font-bold">
          {title}
        </h3>
      )}
      {/* The pane's heading: where the reader is, in 11px secondary ink. */}
      <p className={SMALL}>{counter}</p>
      {/* The inset area: the window's sunken white well, 12px in. */}
      <WindowWell className="grid p-3" aria-live="polite">
        {panes.map((it, i) => (
          <div
            key={i}
            aria-hidden={i !== at || undefined}
            className={i === at ? "col-start-1 row-start-1" : "invisible col-start-1 row-start-1"}
          >
            <p className="text-[13px] leading-[1.3] font-bold">{it.title}</p>
            <p className="mt-1">
              <Inlines text={it.body} />
            </p>
            {/* The step's command: Monaco 11px, as a code block, on the
                pane's own white (the pane is already the well). */}
            {"code" in it && it.code && (
              <pre tabIndex={0} className={`mt-2 overflow-x-auto font-(family-name:--y2k-font-mono) text-[11px] leading-[1.5] whitespace-pre-wrap ${FOCUS}`}>
                <code>{it.code}</code>
              </pre>
            )}
          </div>
        ))}
      </WindowWell>
      {/* The foot: the progress bar from the inset's left edge, then the
          button row — Go Back, then the default — 12px apart. */}
      <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2">
        <Progress
          value={((at + 1 - lead) / items.length) * 100}
          getValueLabel={() => counter}
          aria-label="Progress"
          className="min-w-24 flex-1"
        />
        <div className="ml-auto flex items-center gap-3">
          <Button
            variant="white"
            disabled={first}
            onClick={() => {
              // Go Back dims on the first step and would drop the focus with
              // it; hand the focus to the default button instead.
              if (at === 1) continueRef.current?.focus()
              setStep(at - 1)
            }}
          >
            Go Back
          </Button>
          <Button ref={continueRef} isDefault onClick={last ? undefined : () => setStep(at + 1)}>
            {/* Both labels share one cell and the idle one is hidden, so the
                button keeps Continue's width on the last step and the bar
                beside it doesn't grow when Continue turns into Done. */}
            <span className="grid">
              <span className={last ? "invisible col-start-1 row-start-1" : "col-start-1 row-start-1"}>Continue</span>
              <span className={last ? "col-start-1 row-start-1" : "invisible col-start-1 row-start-1"}>Done</span>
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ── quote ────────────────────────────────────────────────────────── */

/**
 * The note's own colours, measured off 512 Pixels' Mac OS X 10.0 "Stickies"
 * screenshot (the Aqua Screenshot Library): the paper #FFFFA1, the title
 * strip #FFE53E, a 1px #FFC700 rim round the note and under the strip's top.
 * Yellow is Stickies' classic colour: in that screenshot the welcome notes
 * are green, blue and pink, and the empty note in front — the new one — is
 * yellow. It is the note's colour, content like a picture's, so it stays
 * yellow in every tone.
 */
const NOTE = { paper: "#ffffa1", strip: "#ffe53e", rim: "#ffc700" } as const

/**
 * quote → a Stickies note set into the page. Stickies was rewritten in Cocoa
 * for Mac OS X in 2001 and the HIG shows its icon (ch. 11): a quotation, a
 * testimonial, is a thing someone jotted down and stuck up, and a yellow
 * sticky says that before a word is read. It stays a note, not a card:
 * square corners and the 1px rim, the 12px title strip the front note wears
 * (1px rim + 11px of strip, as measured) without its close and collapse
 * boxes — here nothing closes — and the softest 1–2px shadow, the note
 * lifted off the page by a sheet's thickness. 200px wide at least (the
 * default note), 400 at most, so a line stays readable. The quote 13px,
 * `by` under it at 11px secondary ink (8.3:1 on the paper; black
 * 20:1, a link's OS blue 5.3:1).
 */
export function Quote({ text, by }: Of<"quote">) {
  return (
    <figure
      style={{ backgroundColor: NOTE.paper, borderColor: NOTE.rim }}
      className="w-fit max-w-[min(100%,400px)] min-w-[min(100%,200px)] border-x border-b pb-2 shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
    >
      <div aria-hidden style={{ backgroundColor: NOTE.strip, borderColor: NOTE.rim }} className="h-3 border-t" />
      <blockquote className="px-2 pt-1 text-[13px] leading-[1.45] text-(--y2k-ink)">
        <Inlines text={text} />
      </blockquote>
      {by && <figcaption className={`px-2 pt-1 ${SMALL}`}>{by}</figcaption>}
    </figure>
  )
}

/* ── faq ──────────────────────────────────────────────────────────── */

/**
 * faq → disclosure triangles (HIG ch. 7, "Disclosure Triangles": they
 * "disclose information that elaborates on the primary information", as in
 * the Finder's list view). A question is the primary line; its answer
 * elaborates. One row per question: the black triangle — the pack's
 * TreeView glyph, 7 × 9 — pointing right when closed and down when open, the
 * question 13px bold 5px beside it, and the answer 13px under it, indented
 * to the question's text. All closed at first, as a list view opens. Each
 * row is one button with aria-expanded, so the whole question toggles, by
 * pointer or keyboard.
 */
export function Faq({ items }: Of<"faq">) {
  const [open, setOpen] = React.useState<ReadonlySet<number>>(() => new Set())
  const id = React.useId()
  const toggle = (i: number) =>
    setOpen((s) => {
      const next = new Set(s)
      if (!next.delete(i)) next.add(i)
      return next
    })
  return (
    <ul className="flex flex-col gap-1">
      {items.map((it, i) => {
        const isOpen = open.has(i)
        return (
          <li key={i}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`${id}-${i}`}
              onClick={() => toggle(i)}
              className={`flex w-full cursor-default items-start text-left text-[13px] leading-[1.45] font-bold ${FOCUS}`}
            >
              {/* One line tall, so the triangle sits on the question's first
                  line however far it wraps. */}
              <span aria-hidden className="mr-[5px] flex h-[1lh] w-[7px] shrink-0 items-center">
                <svg
                  viewBox="0 0 7 9"
                  className={`h-[9px] w-[7px] transition-transform motion-reduce:transition-none ${isOpen ? "rotate-90" : ""}`}
                >
                  <path d="M0 0l7 4.5L0 9z" fill="#1a1a1a" />
                </svg>
              </span>
              <span>{it.q}</span>
            </button>
            <div id={`${id}-${i}`} hidden={!isOpen} className="pt-1 pl-3">
              <Inlines text={it.a} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/* ── table ────────────────────────────────────────────────────────── */

/**
 * table → the pack's Table, the Aqua list view (DESIGN.md › Lists): the 17px
 * list header with hairline column rules, 12px rows, every other row the
 * pale tone. Nothing is sorted — the rows are in the site's order — so no
 * header takes the tone or a triangle. Cells hold `Text` (bold runs, links)
 * and wrap, set to the top so a wrapped cell doesn't float its neighbours;
 * the list sits in the field rim, and a table wider than the page scrolls
 * sideways inside it rather than widening the page. A row shorter than the
 * header is padded with empty cells, never guessed at.
 */
export function DataTable({ head, rows }: Of<"table">) {
  const cols = Math.max(head.length, ...rows.map((r) => r.length))
  return (
    <div className="overflow-x-auto border border-(--y2k-field-border) border-t-(--y2k-field-border-top)">
      <Table>
        {head.length > 0 && (
          <TableHeader>
            <tr>
              {Array.from({ length: cols }, (_, i) => (
                <TableHead key={i}>{head[i] ?? ""}</TableHead>
              ))}
            </tr>
          </TableHeader>
        )}
        <TableBody>
          {rows.map((r, ri) => (
            <TableRow key={ri}>
              {Array.from({ length: cols }, (_, ci) => (
                <TableCell key={ci} className="align-top whitespace-normal">
                  {r[ci] != null && <Inlines text={r[ci]} />}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/* ── progress ─────────────────────────────────────────────────────── */

/**
 * progress → the pack's determinate Progress, because this block is by
 * definition a true fraction of a whole ("3 of 5 done", "72% complete") —
 * unlike `metrics`, whose changes are never drawn as a bar. Laid out as a
 * 10.0 progress panel is: what is happening in 13px above the bar, the count
 * in 11px secondary ink under it — "3 of 5", or "72%" when the whole is 100.
 * The bar is the value's share of `max`, clamped to the bar.
 */
export function ProgressBlock({ label, value, max }: Of<"progress">) {
  const labelId = React.useId()
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  const count = max === 100 ? `${value}%` : `${value} of ${max}`
  return (
    <div className="flex flex-col gap-1">
      <p id={labelId}>{label}</p>
      <Progress value={pct} getValueLabel={() => count} aria-labelledby={labelId} />
      <p className={SMALL}>{count}</p>
    </div>
  )
}

/* ── code ─────────────────────────────────────────────────────────── */

/**
 * code → Monaco 11px/1.5 (DESIGN.md `mono`, Menlo and Courier New behind it)
 * in the window's sunken white well, 8px in. Pre-wrapped, so a long line
 * folds at the page's edge and the whitespace stays as written; a run with
 * nowhere to break (a URL, a hash) scrolls sideways inside the well rather
 * than widening the page. The well takes the focus so a keyboard can
 * scroll it too.
 */
export function Code({ text }: Of<"code">) {
  return (
    <WindowWell>
      <pre
        tabIndex={0}
        className={`overflow-x-auto p-2 font-(family-name:--y2k-font-mono) text-[11px] leading-[1.5] whitespace-pre-wrap text-(--y2k-ink) ${FOCUS}`}
      >
        <code>{text}</code>
      </pre>
    </WindowWell>
  )
}

/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
