/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/forms"
import { IconGlobe, IconInfo, IconWarning } from "@/components/ui/icons"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WindowScrollArea, WindowWell } from "@/components/ui/window"
import { cn } from "@/lib/utils"
import type { Block, Img, Movie, Text } from "@/lib/content"

import { asset } from "./asset"
import { cropStyle, croppedSize } from "./crop"
import { Code, DataTable, Faq, ProgressBlock, Quote, Steps } from "./blocks-more"
import { useDesktop } from "./context"
import { findNode } from "./disk"
import { withOpen } from "./redirects"
import { useReducedMotion } from "./use-media-query"

/**
 * The blocks of a TextEdit document — one renderer per Block type
 * (lib/content.ts), each drawn with the pack's own components, and each
 * choice with its reason in a comment, because every component should be
 * there for one. Steps, Quote, FAQ, Table, Progress and Code are drawn in
 * blocks-more.tsx.
 *
 * The text is the site's, verbatim; nothing here invents copy. A link whose
 * URL isn't known renders greyed with "Link not supplied" — never a dead
 * link, never a guessed one.
 *
 * Typography is DESIGN.md's three sizes and nothing else: 13px body and
 * bold headings, 11px captions and secondary ink, 12px inside the Table.
 * The tone never goes on text, so emphasis is weight; the colour in a
 * document comes from the controls — a ticked box, the selected tab, the
 * sorted list header, the Warning icon — and from the pictures. Every
 * non-text value sits on the 4px grid, bar the pack's own named metrics.
 */

/* ── Running text ─────────────────────────────────────────────────── */

/** A text link: 13px OS blue, underlined — DESIGN.md's `link`, the one
 *  blue Aqua never lets go of. */
const LINK =
  "text-(--y2k-link) underline underline-offset-2 outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-(--y2k-tone-focus)"

/**
 * A link to another entry of the site: the same OS blue, and it opens that
 * entry's window as a double-click in the Finder would — in front, never a
 * second copy. Its address is the entry's deep link (`?open=<path>`), so a
 * new tab or a copied link opens the same window. One whose entry is not on
 * the disk is greyed with the Finder's words for a broken alias.
 */
function EntryLink({ to, children }: { to: string[]; children: React.ReactNode }) {
  const { nodes, openEntry } = useDesktop()
  const node = findNode(nodes, to)
  if (!node)
    return (
      <span role="link" aria-disabled="true" title="The original item cannot be found." className="text-(--y2k-ink-secondary)">
        {children}
      </span>
    )
  return (
    <a
      href={withOpen("", node.path.slice(1))}
      onClick={(e) => {
        // A new tab or window (a modifier, the middle button) follows the address.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
        e.preventDefault()
        openEntry(node.entry, node.path)
      }}
      className={LINK}
    >
      {children}
    </a>
  )
}

/**
 * Inline runs: plain text, the site's emphasis as bold (the tone never goes
 * on text, so emphasis can only be weight), and its links in OS blue —
 * one to another site opening in a new tab, one to another entry opening
 * its window (EntryLink). A link with an empty href is greyed in secondary
 * ink with no underline and the title "Link not supplied": it says a link
 * belongs here without pretending to be one. A plain string is one run.
 */
export function Inlines({ text }: { text: Text }) {
  if (typeof text === "string") return <>{text}</>
  return (
    <>
      {text.map((run, i) => {
        if (typeof run === "string") return <React.Fragment key={i}>{run}</React.Fragment>
        if ("b" in run)
          return (
            <strong key={i} className="font-bold">
              {run.b}
            </strong>
          )
        if ("to" in run)
          return (
            <EntryLink key={i} to={run.to}>
              {run.a}
            </EntryLink>
          )
        return run.href ? (
          <a key={i} href={run.href} {...linkTarget(run.href)} className={LINK}>
            {run.a}
          </a>
        ) : (
          <span key={i} role="link" aria-disabled="true" title="Link not supplied" className="text-(--y2k-ink-secondary)">
            {run.a}
          </span>
        )
      })}
    </>
  )
}

/* ── Pictures ─────────────────────────────────────────────────────── */

/** A long screenshot — a phone page, a full-length capture — is taller
 *  than twice its width. In a strip it shows its top, cropped. */
const isLong = (img: Img) => img.h > img.w * 2

/** The caption under a figure: 11px secondary ink, the only place
 *  secondary ink goes at all (DESIGN.md: never at body size). */
function Caption({ className, ...props }: React.ComponentProps<"figcaption">) {
  return <figcaption className={cn("mt-1 text-[11px] leading-[1.35] text-(--y2k-ink-secondary)", className)} {...props} />
}

/** Where a link opens: another site's address in a new tab, as a link out
 *  of a document did; the site's own routes (`/reservations`), mail and
 *  phone links where they are. */
export const linkTarget = (href: string) => (/^https?:\/\//i.test(href) ? { target: "_blank", rel: "noreferrer" } : {})

/** A strip's height, and the width a long screenshot is cropped to (3:4). */
const STRIP_H = 240
const CROP_W = 180

/**
 * The thumbnail itself. On the page it fills the page's width and scales
 * with the window. `strip` = it stands in a strip that scrolls sideways:
 * 240px tall, whole, its width from its own proportions — but a long
 * screenshot is cropped to its top (object-cover object-top) in a
 * 180 × 240 box, so a 375 × 2494 page shows its hero and not a 36px
 * sliver. No border: pictures are often whole white-ground sheets and
 * phones with their own rounded corners — a hairline round a rounded phone
 * reads as a rendering fault, and TextEdit set a picture into the page
 * bare. The file's width and height are on the element, so the box has
 * its proportions before the picture loads and the page (and the
 * outline's scroll targets) never jump as each one arrives. A picture
 * smaller than its box (a 240 × 80 logo) stands at its own size: scaled
 * down to fit, never up.
 */
function Thumb({ img, strip }: { img: Img; strip?: boolean }) {
  const crop = strip && isLong(img)
  const small = strip && !crop && img.h < STRIP_H
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a thumbnail of a file already in public/, sized by the document
    <img
      src={asset(img.src)}
      alt={img.alt}
      width={img.w}
      height={img.h}
      loading="lazy"
      decoding="async"
      draggable={false}
      style={strip ? { width: crop ? CROP_W : small ? img.w : Math.round((STRIP_H * img.w) / img.h) } : { maxWidth: img.w }}
      className={cn("block", strip ? cn("max-w-none", !small && "h-60", crop && "object-cover object-top") : "h-auto w-full")}
    />
  )
}

/** What a picture that opens Preview looks like: the magnifier (it opens
 *  bigger), the tone focus ring, nothing else. */
const OPENER = "block max-w-full cursor-zoom-in outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-(--y2k-tone-focus)"

/**
 * A picture in a document is a thumbnail that opens Preview — the one rule
 * for every picture on the disk (a document's, the Finder's icon view, the
 * column inspector's): click it and a Preview window opens titled with the
 * file's name, the picture filling it, its size in the status bar. The
 * title attribute is that file name, so hovering says what will open.
 */
function Picture({ img, strip }: { img: Img; strip?: boolean }) {
  const { openImage } = useDesktop()
  return (
    <button type="button" title={img.name} onClick={() => openImage(img)} className={cn(OPENER, strip ? "max-w-none shrink-0" : "w-full")}>
      <Thumb img={img} strip={strip} />
    </button>
  )
}

/** Several pictures in one row that scrolls sideways: a window in the
 *  page — a well, as the compare tabs' panel is — with the Aqua scrollbar
 *  along its foot saying there is more. Each picture stands 240px tall and
 *  whole (a long screenshot shows its top); a stack would hide all but the
 *  first, and a wrapped row makes a wall. */
function Strip({ images }: { images: Img[] }) {
  return (
    <WindowWell className="block">
      <WindowScrollArea>
        <div className="flex items-center gap-2 p-2">
          {images.map((img) => (
            <Picture key={img.src} img={img} strip />
          ))}
        </div>
      </WindowScrollArea>
    </WindowWell>
  )
}

/* ── The blocks ───────────────────────────────────────────────────── */

/**
 * facts → the 2001 dialog layout DESIGN.md asks for inside a window:
 * labels right-aligned in a column, values left-aligned beside them. This
 * is Show Info's language for a file's properties (Kind, Size, Where…), and
 * Timeline / Team / Role are exactly that — the document's properties.
 * Labels 11px secondary, values 13px black; a definition list, since that
 * is what it is.
 */
function Facts({ items }: { items: { label: string; value: Text }[] }) {
  return (
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1">
      {items.map((f) => (
        <React.Fragment key={f.label}>
          <dt className="text-right text-[11px] leading-[1.35] text-(--y2k-ink-secondary)">{f.label}</dt>
          <dd>
            <Inlines text={f.value} />
          </dd>
        </React.Fragment>
      ))}
    </dl>
  )
}

/**
 * problems → Aqua's alert grammar: an icon, a bold message, then the
 * informative text beside it. An intro line is followed by the things that
 * went wrong — one alert row each, with the pack's Warning icon at 32px.
 * The yellow comes from the icon itself; the text stays black.
 */
function Problems({ intro, items }: { intro?: Text; items: { title: string; body: Text }[] }) {
  return (
    <div className="flex flex-col gap-2">
      {intro && (
        <p>
          <Inlines text={intro} />
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {items.map((it) => (
          <li key={it.title} className="flex items-start gap-3">
            <IconWarning className="size-8" />
            <div>
              <p className="font-bold">{it.title}</p>
              <p>
                <Inlines text={it.body} />
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * callout → an alert's grammar, as problems are: the 32px Note icon for a
 * note or a tip, the Caution icon for a warning, a bold title when the
 * source gives one, the text beside it — set apart by its icon, never by
 * a tinted box.
 */
function Callout({ kind, title, text }: { kind: "note" | "caution"; title?: string; text: Text }) {
  const Icon = kind === "caution" ? IconWarning : IconInfo
  return (
    <div role="note" className="flex items-start gap-3">
      <Icon className="size-8 shrink-0" />
      <div>
        {title && <p className="font-bold">{title}</p>}
        <p>
          <Inlines text={text} />
        </p>
      </div>
    </div>
  )
}

/**
 * checklist → the pack's Checkbox, every box ticked. A list of what was
 * done or delivered, and a ticked box says "delivered" in a way grey tiles
 * can't — and the tick is the tone, so the list carries colour for a
 * reason. The boxes are read-only: the state is a fact, not a choice. Each
 * label is the bold title and the body on one label, as an Aqua checkbox
 * label runs on.
 */
function Checklist({ items }: { items: { title: string; body?: Text }[] }) {
  const ref = React.useRef<HTMLUListElement>(null)
  // The pack's Checkbox has no read-only mode of its own. `checked` is
  // controlled, so a click could never untick a box, pointer events are off
  // so nothing presses, and the accessibility tree is told the truth:
  // read-only, and out of the tab order.
  React.useEffect(() => {
    ref.current?.querySelectorAll<HTMLElement>('[role="checkbox"]').forEach((box) => {
      box.setAttribute("aria-readonly", "true")
      box.tabIndex = -1
    })
  }, [])
  return (
    <ul ref={ref} className="flex flex-col gap-1 [&_[role=checkbox]]:pointer-events-none">
      {items.map((it) => (
        <li key={it.title}>
          <Checkbox
            checked
            // The box on the first line, not centred on a wrapped label.
            className="items-start"
            label={
              <span>
                <strong className="font-bold">{it.title}</strong>
                {it.body !== undefined && (
                  <>
                    {" "}
                    <Inlines text={it.body} />
                  </>
                )}
              </span>
            }
          />
        </li>
      ))}
    </ul>
  )
}

/**
 * figure → one picture set into the page at the page's width, scaling
 * with the window, its caption under it. A picture is a file, and a file
 * opens in the app that owns it: click → Preview (see Picture).
 */
function Figure({ image, caption }: { image: Img; caption?: string }) {
  return (
    <figure>
      <Picture img={image} />
      {caption && <Caption>{caption}</Caption>}
    </figure>
  )
}

/**
 * gallery → a strip that scrolls sideways (see Strip), each picture
 * opening Preview, the caption under the strip.
 */
function Gallery({ images, caption }: { images: Img[]; caption?: string }) {
  return (
    <figure>
      <Strip images={images} />
      {caption && <Caption>{caption}</Caption>}
    </figure>
  )
}

/**
 * compare → the pack's Tabs: 10.0 folder tabs on a pinstriped panel, one
 * tab per state (Before | After), the panel holding that state's pictures
 * as a strip. The selected tab is the tone gel, so the switch is a
 * control and not two headings. A tab with no pictures says so rather than
 * vanishing: the tab is part of the record.
 */
function Compare({ tabs, caption, initial }: { tabs: { label: string; images: Img[] }[]; caption?: string; initial?: string }) {
  // The tab the site shows first (`initial`, by its label); else the first.
  const first = initial ? tabs.findIndex((t) => t.label.trim().toLowerCase() === initial.trim().toLowerCase()) : -1
  return (
    <figure>
      <Tabs defaultValue={String(Math.max(0, first))}>
        <TabsList>
          {tabs.map((t, i) => (
            <TabsTrigger key={t.label} value={String(i)}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t, i) => (
          <TabsContent key={t.label} value={String(i)}>
            {/* One picture (a whole Before or After sheet) fills the panel;
                several make a strip. */}
            {t.images.length === 1 ? (
              <Picture img={t.images[0]} />
            ) : t.images.length ? (
              <Strip images={t.images} />
            ) : (
              <p className="text-[11px] leading-[1.35] text-(--y2k-ink-secondary)">No pictures.</p>
            )}
          </TabsContent>
        ))}
      </Tabs>
      {caption && <Caption>{caption}</Caption>}
    </figure>
  )
}

/**
 * metrics → the pack's Table, the Aqua list view: Category · Result ·
 * Result, the first header in the tone as a list's sorted column is, every
 * other row the pale tone. The structure IS a table — a category and the
 * results under it. The numbers are changes ("56% reduction", "~3 fewer
 * rounds"), not fractions of a whole, so a Progress bar would misrepresent
 * them; a cell with no number is still shown verbatim — it is what was
 * measured. A result the site sets as a number and a label keeps that
 * shape — the number bold, its label after it, in the one cell — so "4 min"
 * still reads first. 12px text, as list rows are.
 */
type Result = string | { value: string; label: Text }
function Metrics({ rows }: { rows: { category: string; results: Result[] }[] }) {
  const cols = Math.max(1, ...rows.map((r) => r.results.length))
  return (
    <div className="border border-(--y2k-field-border) border-t-(--y2k-field-border-top)">
      <Table>
        <TableHeader>
          <tr>
            {/* The tone header, as a list's first column wears it — but the
                rows are in the site's order, nothing is sorted, so it
                doesn't claim to be. */}
            <TableHead sorted="ascending" aria-sort={undefined}>
              Category
            </TableHead>
            {Array.from({ length: cols }, (_, i) => (
              <TableHead key={i}>Result</TableHead>
            ))}
          </tr>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.category}>
              <TableCell className="align-top whitespace-normal">{r.category}</TableCell>
              {Array.from({ length: cols }, (_, i) => (
                <TableCell key={i} className="align-top whitespace-normal">
                  <ResultCell result={r.results[i]} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function ResultCell({ result }: { result?: Result }) {
  if (result === undefined) return null
  if (typeof result === "string") return <>{result}</>
  return (
    <>
      <strong className="font-bold">{result.value}</strong> <Inlines text={result.label} />
    </>
  )
}

/** The app an embed opens in, named from its address, for the "Open in…"
 *  line; an address it doesn't know opens in the browser. */
function appOf(href: string) {
  let host = ""
  try {
    host = new URL(href).hostname.replace(/^www\./, "")
  } catch {
    return "browser"
  }
  if (host.endsWith("figma.com")) return /\/board\//.test(href) ? "FigJam" : "Figma"
  if (host === "youtu.be" || host.endsWith("youtube.com")) return "YouTube"
  if (host.endsWith("codepen.io")) return "CodePen"
  if (host.endsWith("vimeo.com")) return "Vimeo"
  return "browser"
}

/**
 * embed → the live embed (a FigJam board, a video, a pen) in the page as
 * the site has it, sunk in the window's white content well; under it the
 * caption and "Open in <app>" with the pack's Globe at 16px. The embed's
 * own chrome is its app's — it is the work, shown as it was built, like a
 * picture. No embed URL → the still (→ Preview) or, with neither, a well
 * with the Globe and the embed's name.
 */
function Embed({ title, href, src, image, caption }: { title: string; href: string; src?: string; image?: Img; caption?: string }) {
  const open = `Open in ${appOf(href)}`
  return (
    <figure>
      {src ? (
        <WindowWell className="block p-1">
          <iframe src={src} title={title} loading="lazy" allowFullScreen className="block h-[400px] w-full border-0 bg-white" />
        </WindowWell>
      ) : image ? (
        <Picture img={image} />
      ) : (
        <WindowWell className="inline-flex max-w-full items-center gap-2 p-3 align-top">
          <IconGlobe className="size-8" />
          <span>{title}</span>
        </WindowWell>
      )}
      {/* The caption and the link row are one figcaption: a figure allows
          only one, and it must come last. */}
      <figcaption>
        {caption && <p className="mt-1 text-[11px] leading-[1.35] text-(--y2k-ink-secondary)">{caption}</p>}
        <p className="mt-1 flex items-center gap-1">
          <IconGlobe className="size-4" />
          {href ? (
            <a href={href} {...linkTarget(href)} title={title} className={LINK}>
              {open}
            </a>
          ) : (
            <span title="Link not supplied" className="text-(--y2k-ink-secondary)">
              {open}
            </span>
          )}
        </p>
      </figcaption>
    </figure>
  )
}

/**
 * placeholder → a picture still to come: a plate of the pinstripe (Aqua's
 * grey, not a card) in the picture's proportions, "Picture to come" at its
 * centre in 11px secondary ink, a hairline round it, the caption under it.
 * It holds the picture's place so the document reads in order today.
 */
function Placeholder({ caption, ratio }: { caption: string; ratio: number }) {
  return (
    <figure>
      <div
        role="img"
        aria-label={`${caption} (picture to come)`}
        style={{ aspectRatio: ratio }}
        className="y2k-pinstripe flex w-full items-center justify-center border border-(--y2k-field-border)"
      >
        <span className="text-[11px] leading-[1.35] text-(--y2k-ink-secondary)">Picture to come</span>
      </div>
      <Caption>{caption}</Caption>
    </figure>
  )
}

/**
 * video → a screen recording plays in the page as it does on the site:
 * muted, looping, at the page's width, on its poster until it loads — a
 * picture that moves. A movie is still a file, and a movie's app is
 * QuickTime Player (Aqua's first brushed-metal window): click it and it
 * opens there, with sound and controls. It plays only while it is in
 * view (scrolled off, or its window minimised, it pauses). With reduced
 * motion it stays on its poster until opened. A movie with bars baked in
 * (`crop`) shows only the picture's box, the proportions from the poster.
 */
function Video({ movie, caption }: { movie: Movie; caption?: string }) {
  const { openVideo } = useDesktop()
  const still = useReducedMotion(true)
  const { src, name, poster, crop } = movie
  const ref = React.useRef<HTMLVideoElement>(null)
  React.useEffect(() => {
    const el = ref.current
    if (!el || still) return
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? el.play().catch(() => {}) : el.pause()))
    io.observe(el)
    return () => io.disconnect()
  }, [still])
  const clip = crop && poster ? croppedSize(poster.w, poster.h, crop) : undefined
  const video = (
    <video
      ref={ref}
      src={asset(src)}
      poster={poster ? asset(poster.src) : undefined}
      width={poster?.w}
      height={poster?.h}
      muted
      loop
      playsInline
      preload={still ? "none" : "metadata"}
      aria-label={poster?.alt ?? name}
      className={cn("pointer-events-none block", clip ? "absolute max-w-none" : "h-auto max-w-full")}
      style={clip && cropStyle(crop)}
    />
  )
  return (
    <figure>
      {/* A button shrinks to its content, so the clip (a box of no width of
          its own) needs the button at the page's width. */}
      <button type="button" title={`${name} — open in QuickTime Player`} onClick={() => openVideo(movie)} className={cn(OPENER, clip && "w-full")}>
        {clip ? (
          <div className="relative w-full overflow-hidden" style={{ aspectRatio: `${clip.w} / ${clip.h}` }}>
            {video}
          </div>
        ) : (
          video
        )}
      </button>
      {caption && <Caption>{caption}</Caption>}
    </figure>
  )
}

/**
 * links → a row of the pack's white push buttons: a site's pill links are
 * buttons that go somewhere, and the 10.0 push button is the button
 * (BevelButton is for "Choose…", the default gel for a window's one
 * default action — neither applies). A link with no known URL is disabled,
 * "Link not supplied" on hover; the label is kept so the reader knows what
 * is missing. 12px between them, as a button row is spaced.
 */
function Links({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <div className="flex flex-wrap gap-3 py-1">
      {items.map((l) =>
        l.href ? (
          <Button key={l.label} variant="white" asChild>
            <a href={l.href} {...linkTarget(l.href)}>
              {l.label}
            </a>
          </Button>
        ) : (
          // A disabled button takes no pointer events, so the tooltip
          // lives on a span round it.
          <span key={l.label} title="Link not supplied" className="inline-flex">
            <Button variant="white" disabled>
              {l.label}
            </Button>
          </span>
        )
      )}
    </div>
  )
}

/** One block. `anchorPrefix` keeps h2 ids unique when two documents with
 *  the same section ids (two case studies with a "context") are open. */
function BlockView({ block, anchorPrefix }: { block: Block; anchorPrefix?: string }) {
  switch (block.type) {
    case "h2":
      // 13px bold — DESIGN.md's `heading`, the size a document heading is;
      // 12px above it (a group's gap) and 4px below, so it hugs what it
      // heads. Its id is the outline's target; data-section is how the
      // document finds it inside itself.
      return (
        <h2 id={anchorPrefix ? `${anchorPrefix}-${block.id}` : block.id} data-section={block.id} className="mt-1 -mb-1 text-[13px] leading-[1.3] font-bold">
          {block.text}
        </h2>
      )
    case "h3":
      // Also 13px bold: Aqua has three sizes, and a sub-heading can't be
      // 12 (the bold 12 is a group box's caption). It is a lead-in that
      // hugs its paragraph.
      return <h3 className="mt-1 -mb-1 text-[13px] leading-[1.3] font-bold">{block.text}</h3>
    case "p":
      // 13px/1.45 black — DESIGN.md's `body-md`, set by the document window.
      return (
        <p>
          <Inlines text={block.text} />
        </p>
      )
    case "list": {
      // A plain list with the browser's bullets (or numbers): a list in a
      // document is prose, not a control, and needs no icon.
      const List = block.ordered ? "ol" : "ul"
      return (
        <List className={cn("pl-5", block.ordered ? "list-decimal" : "list-disc")}>
          {block.items.map((item, i) => (
            <li key={i}>
              <Inlines text={item} />
            </li>
          ))}
        </List>
      )
    }
    case "facts":
      return <Facts items={block.items} />
    case "problems":
      return <Problems intro={block.intro} items={block.items} />
    case "checklist":
      return <Checklist items={block.items} />
    case "callout":
      return <Callout kind={block.kind} title={block.title} text={block.text} />
    case "figure":
      return <Figure image={block.image} caption={block.caption} />
    case "gallery":
      return <Gallery images={block.images} caption={block.caption} />
    case "compare":
      return <Compare tabs={block.tabs} caption={block.caption} initial={block.initial} />
    case "metrics":
      return <Metrics rows={block.rows} />
    case "embed":
      return <Embed title={block.title} href={block.href} src={block.src} image={block.image} caption={block.caption} />
    case "placeholder":
      return <Placeholder caption={block.caption} ratio={block.ratio} />
    case "video":
      return <Video movie={block.movie} caption={block.caption} />
    case "links":
      return <Links items={block.items} />
    // The rest are drawn in blocks-more.tsx, each given the block's fields.
    case "steps":
      return <Steps {...block} />
    case "quote":
      return <Quote {...block} />
    case "faq":
      return <Faq {...block} />
    case "table":
      return <DataTable {...block} />
    case "progress":
      return <ProgressBlock {...block} />
    case "code":
      return <Code {...block} />
  }
}

/** A document's body: its blocks 8px apart (a paragraph's gap; headings
 *  add their own 4px). */
export function Blocks({ blocks, anchorPrefix, className }: { blocks: Block[]; anchorPrefix?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} anchorPrefix={anchorPrefix} />
      ))}
    </div>
  )
}

/* ── For the status bar ───────────────────────────────────────────── */

/** How many pictures a document holds — what opens in Preview. A movie's
 *  poster is the movie's, not a picture of the document's. */
export function countPictures(blocks: Block[]) {
  return blocks.reduce((n, b) => {
    switch (b.type) {
      case "figure":
        return n + 1
      case "gallery":
        return n + b.images.length
      case "compare":
        return n + b.tabs.reduce((m, t) => m + t.images.length, 0)
      case "embed":
        return n + (b.image ? 1 : 0)
      default:
        return n
    }
  }, 0)
}

/** How many movies: the status bar counts them apart from pictures. */
export const countMovies = (blocks: Block[]) => blocks.filter((b) => b.type === "video").length

/** How many sections: the h2s, which are what the outline lists. */
export const countSections = (blocks: Block[]) => blocks.filter((b) => b.type === "h2").length

/** "7 sections", "1 picture" — the status bar's counting voice. */
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
