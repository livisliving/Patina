"use client"

import * as React from "react"

import { TreeView } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { DocumentEntry } from "@/lib/content"

import { Blocks, Inlines, countMovies, countPictures, countSections, plural } from "./blocks"
import { prefersReducedMotion } from "./use-media-query"
import { DocumentWindow, type WinEntry } from "./windows"

/**
 * A document as TextEdit shows it: the pinstripe chrome round a white page,
 * the title, subtitle and meta line at its head, then its blocks; an
 * outline down the left when it has three sections or more; the counts in
 * the status bar.
 *
 * The outline is the pack's TreeView — 10.0's tree view is exactly "a list
 * with hierarchy you can click": the document's file name is the root
 * folder, its sections the rows under it. A row scrolls the page to its
 * heading (smoothly, unless motion is reduced); the section in view takes
 * the tone, as a selected list row does. Clicking a row holds that row
 * until the reader scrolls for themselves — otherwise a short last
 * section, which can never reach the top of the page, would hand the
 * highlight straight to the section after it.
 */

/** The page's padding (DESIGN.md `window-document`: 20px): a heading
 *  scrolled to lands where the page's first line does. */
const PAGE_PADDING = 20
/** A heading this close to the page's top edge is the section in view. */
const IN_VIEW = 24
/** An outline needs this many sections to be worth its column. */
const OUTLINE_MIN = 3

const VIEWPORT = '[data-slot="window-scroll-viewport"]'

export function DocumentView({ win, doc }: { win: WinEntry; doc: DocumentEntry }) {
  const toc = doc.outline && doc.outline.length >= OUTLINE_MIN ? doc.outline : null
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const [current, setCurrent] = React.useState<string | null>(toc?.[0]?.id ?? null)
  // Set by a click on the outline; cleared by the reader's own scrolling.
  const held = React.useRef(false)

  // The section in view, from the headings' positions in the scroll
  // viewport: the last heading at or above the in-view line, the first
  // before any has reached it, the last once the page is scrolled to its
  // end (a short last section never reaches the line).
  React.useEffect(() => {
    const body = bodyRef.current
    const vp = body?.closest<HTMLElement>(VIEWPORT)
    if (!toc || !body || !vp) return
    let raf = 0
    const spy = () => {
      raf = 0
      if (held.current) return
      const headings = Array.from(body.querySelectorAll<HTMLElement>("[data-section]"))
      if (!headings.length) return
      const scrolls = vp.scrollHeight > vp.clientHeight + 2
      const atEnd = scrolls && vp.scrollTop + vp.clientHeight >= vp.scrollHeight - 2
      let id = headings[0].dataset.section!
      if (atEnd) id = headings[headings.length - 1].dataset.section!
      else {
        const top = vp.getBoundingClientRect().top
        for (const h of headings) if (h.getBoundingClientRect().top - top <= IN_VIEW) id = h.dataset.section!
      }
      setCurrent(id)
    }
    const ask = () => {
      if (!raf) raf = requestAnimationFrame(spy)
    }
    const release = () => {
      held.current = false
    }
    vp.addEventListener("scroll", ask, { passive: true })
    // The reader taking over — the wheel, a finger, the keyboard, the
    // scroll bar (a sibling of the viewport, so the area round both).
    const area = vp.parentElement ?? vp
    const takeovers = ["wheel", "touchstart", "pointerdown", "keydown"] as const
    for (const ev of takeovers) area.addEventListener(ev, release, { passive: true })
    const ro = new ResizeObserver(ask)
    ro.observe(vp)
    spy()
    return () => {
      if (raf) cancelAnimationFrame(raf)
      vp.removeEventListener("scroll", ask)
      for (const ev of takeovers) area.removeEventListener(ev, release)
      ro.disconnect()
    }
  }, [toc])

  const goTo = (id: string) => {
    const heading = bodyRef.current?.querySelector<HTMLElement>(`[data-section="${id}"]`)
    const vp = heading?.closest<HTMLElement>(VIEWPORT)
    if (!heading || !vp) return
    held.current = true
    setCurrent(id)
    const top = heading.getBoundingClientRect().top - vp.getBoundingClientRect().top + vp.scrollTop - PAGE_PADDING
    vp.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? "auto" : "smooth" })
  }

  const outline = toc && (
    <TreeView
      aria-label="Outline"
      items={[
        {
          label: win.name,
          defaultOpen: true,
          children: toc.map((t) => ({
            label: (
              <button
                type="button"
                // The full label on hover: the 176px column less the tree's
                // child indent leaves 118px, so a long one ends in an
                // ellipsis as a Finder name does.
                title={t.label}
                aria-current={current === t.id ? "location" : undefined}
                onClick={() => goTo(t.id)}
                className="block w-full cursor-default truncate text-left outline-none"
              >
                {t.label}
              </button>
            ),
          })),
        },
      ]}
      className={cn(
        // The panel fills the outline column. 12px, as DESIGN.md sets list
        // rows (and as the Finder's sidebar is).
        "min-h-full text-[12px]",
        // The row of the section in view takes the tone, as a selected list
        // row does (DESIGN.md › Selection). The pack's TreeView draws
        // structure only, so the row is found from its label: the row div
        // holding the current entry.
        "[&_li>div:has([aria-current])]:bg-(--y2k-tone-selection) [&_li>div:has([aria-current])]:text-(--y2k-tone-selection-text)",
        // A label fills its row, so the whole row is the click target, and
        // the keyboard focus ring sits on the row's edge.
        "[&_li>div>span]:flex-1 [&_li>div:has(:focus-visible)]:outline-3 [&_li>div:has(:focus-visible)]:-outline-offset-3 [&_li>div:has(:focus-visible)]:outline-(--y2k-tone-focus)"
      )}
    />
  )

  const sections = countSections(doc.blocks)
  const movies = countMovies(doc.blocks)
  const status = [sections ? plural(sections, "section") : null, plural(countPictures(doc.blocks), "picture"), movies ? plural(movies, "movie") : null]
    .filter(Boolean)
    .join(", ")

  return (
    // With an outline it opens 900px wide (DESIGN.md's window-document):
    // room for the outline and a page of pictures; without, TextEdit's 640.
    <DocumentWindow win={win} outline={outline} status={status} className={toc ? "md:w-[900px]" : undefined}>
      <div ref={bodyRef}>
        {/* The page header: the title as a document heading, then the
            entry's comment (the line its card carried) and the subtitle in
            black body text (never a grey subtitle at body size), the meta
            line as the small secondary line. */}
        <header className="mb-3 flex flex-col gap-1">
          <h1 className="text-[13px] leading-[1.3] font-bold">{doc.title}</h1>
          {doc.comment && (
            <p data-comment>
              <Inlines text={doc.comment} />
            </p>
          )}
          {doc.subtitle && <p>{doc.subtitle}</p>}
          {doc.meta && <p className="text-[11px] leading-[1.35] text-(--y2k-ink-secondary)">{doc.meta}</p>}
        </header>
        {/* The window's id keeps two documents' anchors apart. */}
        <Blocks blocks={doc.blocks} anchorPrefix={win.id.replace(/[^\w-]+/g, "-")} />
      </div>
    </DocumentWindow>
  )
}
