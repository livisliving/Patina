/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
/**
 * Patina content — what a site says, written down once, independent of any
 * taste pack. DESIGN.md › Content says how to sort a site into these types;
 * a pack's desktop renders them (Y2K: a document opens in TextEdit, a
 * collection in the Finder, a picture in Preview). Switching packs changes
 * the rendering, never this file.
 *
 * An agent converting a site does two things: classify each page and each
 * block into the types below, and transcribe the words, numbers, pictures
 * and links verbatim. It never invents a component, a sentence or a URL — a
 * link whose address isn't known has `href: ""` and renders greyed.
 */

/* ── Media ─────────────────────────────────────────────────────────── */

/** A picture under public/, measured once so its viewer can title it and
 *  print "1184 × 632, 96 KB" without loading it. `name` is the file name
 *  the viewer shows ("Babel revamp timeline.jpg"). */
export type Img = {
  src: string
  w: number
  h: number
  bytes: number
  name: string
  alt: string
}

/** A share of a frame, each 0–1: `x`/`y` its top left, `w`/`h` its size.
 *  A movie exported with bars baked in (black or white round the picture)
 *  shows only this box, in the page and in QuickTime Player. */
export type Crop = { x: number; y: number; w: number; h: number }

/** A movie under public/. `crop` needs the poster (its frame gives the
 *  picture's proportions in the page). */
export type Movie = { src: string; name: string; poster?: Img; crop?: Crop }

/* ── Running text ──────────────────────────────────────────────────── */

/** Plain text, a bold run (the site's emphasis), or a link. `href: ""`
 *  means the site links here but the address isn't known. A link to
 *  another entry of the site ("Read the rest of the journal") is `to`, a
 *  path of titles from the site's root (["Journal"]): it opens that
 *  entry's window. */
export type Inline = string | { b: string } | { a: string; href: string } | { a: string; to: string[] }

/** Text given as a plain string or as runs. */
export type Text = string | Inline[]

/* ── Blocks: what a document is made of ────────────────────────────── */

export type Block =
  /** A section heading; `id` is its anchor in the document's outline. */
  | { type: "h2"; id: string; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: Text }
  | { type: "list"; ordered?: boolean; items: Text[] }
  /** The document's properties: Timeline, Team, Role, Client, Year… */
  | { type: "facts"; items: { label: string; value: Text }[] }
  /** Problems, risks, pain points — each a title and a line. */
  | { type: "problems"; intro?: Text; items: { title: string; body: Text }[] }
  /** Things done or delivered ("I led…", "Features") — all ticked. */
  | { type: "checklist"; items: { title: string; body?: Text }[] }
  /** A process in order ("Step 1…", "retire → reorganise → refine").
   *  `intro` is the source's own lead-in, shown as an Introduction pane
   *  before the steps; without one the first pane is the first step. A
   *  step may carry the command or snippet it asks for (`code`). */
  | { type: "steps"; title?: string; intro?: Text; items: { title: string; body: Text; code?: string }[] }
  /** A note set apart from the text: `note` for a tip or an aside
   *  ("Note", "Tip", "Good to know"), `caution` for a warning ("Warning",
   *  "Before you start"). A banner that announces something is a `note`. */
  | { type: "callout"; kind: "note" | "caution"; title?: string; text: Text }
  /** A quotation or testimonial. */
  | { type: "quote"; text: Text; by?: string }
  /** Questions with answers that fold (FAQ, accordions). */
  | { type: "faq"; items: { q: string; a: Text }[] }
  | { type: "figure"; image: Img; caption?: string }
  | { type: "gallery"; images: Img[]; caption?: string }
  /** Before / after, variants, A / B: one set of pictures per state.
   *  `initial` is the label of the tab shown first — the one the site
   *  shows by default; without it, the first. */
  | { type: "compare"; tabs: { label: string; images: Img[] }[]; caption?: string; initial?: string }
  /** Results under categories ("56% fewer components"). Changes, not
   *  fractions: never drawn as a progress bar. A result is the site's line
   *  as it is, or — where the site sets a number apart from what it counts
   *  — the number and its label ({ value: "3×", label: "more orders a
   *  week" }). */
  | { type: "metrics"; rows: { category: string; results: (string | { value: string; label: Text })[] }[] }
  /** Any other table the site has (pricing, specs, schedules). */
  | { type: "table"; head: string[]; rows: Text[][] }
  /** A true fraction of a whole: "3 of 5 done", "72% complete". */
  | { type: "progress"; label: string; value: number; max: number }
  /** A live third-party embed (FigJam, Figma, YouTube, CodePen): `src` is
   *  the embed URL, `href` opens it in its own app; `image` stands in when
   *  there is no embed URL. */
  | { type: "embed"; title: string; href: string; src?: string; image?: Img; caption?: string }
  | { type: "video"; movie: Movie; caption?: string }
  /** A picture still to come: a plate of its proportions (w / h). */
  | { type: "placeholder"; caption: string; ratio: number }
  /** Buttons that go somewhere (the site's "View…" pills). */
  | { type: "links"; items: { label: string; href?: string }[] }
  | { type: "code"; text: string }

/* ── Entries: what the site is made of ─────────────────────────────── */

/** What every entry can carry for a file browser: a picture for its icon,
 *  a coarse category (3–5 per collection; the finer labels go in
 *  `keywords`, which stay searchable), a date, extra lines for its
 *  inspector ("Client: Budweiser"), and `comment` — the one line the site
 *  puts on its card or over its folder ("A kiln log, one firing at a
 *  time", "Everything we wrote in 2024"), which a file browser shows as
 *  the file's comment. `route` is the entry's address on the site before
 *  ("/journal/first-frost"): it redirects to the entry's window. */
type EntryMeta = {
  cover?: Img
  category?: string
  date?: string
  keywords?: string[]
  info?: { label: string; value: string }[]
  comment?: Text
  route?: string
}

/** One text read start to finish: a case study, a post, a project page.
 *  An item the site lists but never gave a page of its own (a card that
 *  links nowhere) is a document too, holding only what its card held — its
 *  picture as a `figure`, its line as `comment`, its date — never padded,
 *  and never a "Read more" to nowhere.
 *  `outline` (the site's table of contents) lists the h2 ids in order;
 *  a pack shows it when there are three sections or more. `fileName`
 *  overrides the pack's own naming ("Babel.txt"). */
export type DocumentEntry = EntryMeta & {
  type: "document"
  title: string
  fileName?: string
  subtitle?: string
  /** A short line under the subtitle: "2026 · SEO, Page builder". */
  meta?: string
  outline?: { id: string; label: string }[]
  blocks: Block[]
}

/** A set of items that each open: a portfolio, an archive, a blog index. */
export type CollectionEntry = EntryMeta & {
  type: "collection"
  title: string
  items: Entry[]
}

export type PictureEntry = EntryMeta & { type: "picture"; image: Img }
export type MovieEntry = EntryMeta & { type: "movie"; movie: Movie }

/** An item that is another entry by another name (an archive's case
 *  study): it opens `to`, a path of titles from the site's root
 *  (["Babel tower revamp"]). */
export type AliasEntry = EntryMeta & { type: "alias"; title: string; fileName?: string; to: string[] }

/** The person or product the site is about; opens the About box. */
export type AboutEntry = EntryMeta & { type: "about"; title: string }

export type Entry = DocumentEntry | CollectionEntry | PictureEntry | MovieEntry | AliasEntry | AboutEntry

/* ── The site ──────────────────────────────────────────────────────── */

/** The person or product: an image (with an optional screen its greeting
 *  is typed onto, in percent of the image), a name and a line, and panes
 *  of blocks (General, Experience, Education…). */
export type Person = {
  name: string
  role?: string
  portrait?: {
    image: Img
    screen?: { x: number; y: number; w: number; h: number }
    lines?: string[]
  }
  panes: { label: string; blocks: Block[] }[]
  copyright?: string
}

/** A whole site: who it is about, what is on it, and which entries
 *  matter most (`featured`, paths of titles — at most three).
 *  `description` is the sentence the site gives about itself (its meta
 *  description): with the person's name and role it makes the page's
 *  title and share card. */
export type Site = {
  owner: string
  description?: string
  person: Person
  entries: Entry[]
  featured: string[][]
  /** The live site or the owner's home page, linked from the pack. */
  home?: { label: string; href: string }
}
