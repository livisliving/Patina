/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
"use client"

import * as React from "react"

import { ICONS } from "@/components/ui/icons"
import { cn } from "@/lib/utils"
import type { Block, DocumentEntry, Entry, Img, Site, Text } from "@/lib/content"

import { asset } from "./asset"
import { DiskIcon, DocIcon, FaceIcon, FolderIcon } from "./icons"
import { dateValue, fileNameOf, titleOf } from "./names"
import { kb } from "./windows"

export { fileNameOf, findEntry, titleOf } from "./names"

/**
 * The volume the Finder shows, built from a Site. The site is a disk, not a
 * page: a document is a TextEdit file, a collection a folder, a picture a
 * JPEG that opens in Preview, a movie QuickTime's, an alias a second name
 * for another entry, and the About entry an application. Every fact in a
 * row comes from the content — nothing here is invented. Names are
 * names.ts's; Kind is the entry's `category`, or what the Finder would call
 * the file.
 */

/* ── Kind ─────────────────────────────────────────────────────────── */

/** The Finder's Kind column. */
export function kindOf(entry: Entry): string {
  if (entry.category) return entry.category
  return {
    document: "TextEdit document",
    collection: "Folder",
    picture: "JPEG image",
    movie: "QuickTime movie",
    alias: "Alias",
    about: "Application",
  }[entry.type]
}

/* ── The index ────────────────────────────────────────────────────── */

/** Every entry on the disk once, with both its addresses: its titles from
 *  the site's root (what content refers to it by) and its Finder path, the
 *  volume then the file names (what the Finder and the windows go by). */
export type Node = { entry: Entry; titles: string[]; path: string[]; children?: Node[] }

export function indexSite(site: Site, volume: string): Node[] {
  const walk = (entries: Entry[], titles: string[], path: string[]): Node[] =>
    entries.map((entry) => {
      const t = [...titles, titleOf(entry)]
      const p = [...path, fileNameOf(entry, site)]
      return { entry, titles: t, path: p, children: entry.type === "collection" ? walk(entry.items, t, p) : undefined }
    })
  return walk(site.entries, [], [volume])
}

/** The node a path of titles leads to. `follow` takes an alias to its
 *  target (and an alias of an alias, a few deep at most); one that leads
 *  nowhere is undefined. */
export function findNode(nodes: Node[], titles: string[], follow = true): Node | undefined {
  let level: Node[] | undefined = nodes
  let found: Node | undefined
  for (const title of titles) {
    found = level?.find((n) => n.titles.at(-1) === title)
    if (!found) return undefined
    level = found.children
  }
  if (!follow) return found
  for (let hops = 0; found?.entry.type === "alias" && hops < 4; hops++) found = findNode(nodes, found.entry.to, false)
  return found?.entry.type === "alias" ? undefined : found
}

/* ── Deep links ───────────────────────────────────────────────────── */

/**
 * `?open=<path>` (read and written by redirects.ts): a name is a file name
 * or a title, in any case, with or without its suffix
 * (`?open=Journal/first%20frost`). One name that is not at the top finds
 * the first entry of that name anywhere on the disk. A path that leads
 * nowhere finds nothing.
 */
const norm = (s: string) => s.trim().toLowerCase()
const bare = (s: string) => s.replace(/\.[a-z0-9]{1,4}$/i, "")
const named = (n: Node, seg: string) => {
  const s = norm(seg)
  const name = norm(n.path.at(-1) ?? "")
  const title = norm(n.titles.at(-1) ?? "")
  return s === name || s === title || bare(s) === bare(name) || bare(s) === title
}

/** The node a deep link names. */
export function findOpen(nodes: Node[], names: string[], volume: string): Node | undefined {
  const path = names.length && norm(names[0]) === norm(volume) ? names.slice(1) : names
  if (!path.length) return undefined
  let level: Node[] = nodes
  let found: Node | undefined
  for (const name of path) {
    // An exact file name first, then a title or a name without its suffix.
    found = level.find((n) => n.path.at(-1) === name) ?? level.find((n) => named(n, name))
    if (!found) break
    level = found.children ?? []
  }
  if (found) return found
  if (path.length > 1) return undefined
  return everyNode(nodes).find((n) => named(n, path[0]))
}

/** Every node on the disk, folders before what is in them. */
export const everyNode = (nodes: Node[]): Node[] => nodes.flatMap((n) => [n, ...everyNode(n.children ?? [])])

/* ── Icons ────────────────────────────────────────────────────────── */

/** A picture as its icon: the picture at the box's size, kept in shape,
 *  behind a hairline. An alias wears the badge on the picture's
 *  bottom-left corner (the picture's, not the square's, so it sits on it
 *  whatever its shape). A block, as the other icons are: inline, a
 *  picture wider than tall sat on the line's baseline, below the middle. */
export function Thumb({ img, alias }: { img: Img; alias?: boolean }) {
  return (
    <span className="flex size-full items-center justify-center">
      <span className={cn("relative", img.w >= img.h ? "w-full" : "h-full")} style={{ aspectRatio: `${img.w} / ${img.h}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- an icon-sized thumbnail of a file already in public/ */}
        <img src={asset(img.src)} alt="" draggable={false} className="block size-full border border-black/40 bg-white" />
        {alias && <AliasBadge />}
      </span>
    </span>
  )
}

/** The 10.x alias badge: the curved black arrow in a white box. A quarter
 *  of the icon's width, never under 8px — 12px on a 48px icon, 8px on a
 *  16px row, 32px in the inspector. */
function AliasBadge() {
  return (
    // Important, because every icon box sizes the svgs in it to fill it.
    <svg viewBox="0 0 12 12" aria-label="Alias" role="img" className="absolute bottom-0 left-0 block h-auto! w-[max(8px,25%)]!">
      <rect x="0.5" y="0.5" width="11" height="11" fill="#fff" stroke="#000" />
      <path d="M3.5 10V7.5a2.5 2.5 0 0 1 2.5-2.5h1.5" fill="none" stroke="#000" strokeWidth="1.6" />
      <path d="M6.8 2.3L10.2 5 6.8 7.7z" fill="#000" />
    </svg>
  )
}

/** An entry's icon: its `cover` when it has one (a picture's own image, a
 *  movie's poster), else its app's. An alias shows its target's, badged. */
export function iconOf(entry: Entry, target?: Entry, alias = false): React.ReactNode {
  const cover = entry.cover ?? (entry.type === "picture" ? entry.image : entry.type === "movie" ? entry.movie.poster : undefined)
  if (cover) return <Thumb img={cover} alias={alias || entry.type === "alias"} />
  if (entry.type === "alias") return target ? iconOf(target, undefined, true) : <Badged><DocIcon /></Badged>
  const icon =
    entry.type === "collection" ? <FolderIcon /> : entry.type === "about" ? <FaceIcon /> : entry.type === "movie" ? <ICONS.music /> : entry.type === "picture" ? <ICONS.preview /> : <DocIcon />
  return alias ? <Badged>{icon}</Badged> : icon
}

function Badged({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-flex size-full">
      {children}
      <AliasBadge />
    </span>
  )
}

/* ── The Finder's rows ────────────────────────────────────────────── */

/** One row of the Finder: what the list and column views render, and what
 *  the column inspector describes. */
export type FinderItem = {
  label: string
  icon: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  kind: string
  size: string
  created: string
  /** The entry's own lines for the inspector ("Client: Budweiser"). */
  info?: { label: string; value: string }[]
  /** Its comment, as Show Info's Comments field holds it: plain text. */
  comment?: string
  /** What else the search finds it by, past its name and its Kind. */
  keywords?: string[]
  /** Its entry's category, when it has one: a folder whose items have two
   *  or more gets the Kind filter. */
  category?: string
  /** A folder's contents: opening it shows them (a further column, in the
   *  column view). An empty array is still a folder — it just opens empty. */
  contents?: FinderItem[]
}

/** Text as plain words — runs joined, links by their words: a comment as
 *  Show Info's Comments field holds it. */
export const plainText = (text: Text) =>
  typeof text === "string" ? text : text.map((run) => (typeof run === "string" ? run : "b" in run ? run.b : run.a)).join("")

/** The words in a document, less its pictures and links: what a text file
 *  of it would weigh. */
function textBytes(doc: DocumentEntry) {
  const strings = (v: unknown, key?: string): string[] => {
    if (key === "href" || key === "to" || key === "id" || key === "type" || key === "src" || key === "initial" || key === "kind") return []
    if (typeof v === "string") return [v]
    if (Array.isArray(v)) return v.flatMap((x) => strings(x))
    if (v && typeof v === "object") {
      if ("src" in v) return [] // an Img or a Movie
      return Object.entries(v).flatMap(([k, x]) => strings(x, k))
    }
    return []
  }
  return new TextEncoder().encode([doc.title, doc.subtitle ?? "", doc.comment ? plainText(doc.comment) : "", ...strings(doc.blocks)].join("\n")).length
}

/** The pictures a document carries, by weight: an .rtf file holds them. */
function pictureBytes(blocks: Block[]) {
  const imgs = blocks.flatMap((b): Img[] => {
    switch (b.type) {
      case "figure":
        return [b.image]
      case "gallery":
        return b.images
      case "compare":
        return b.tabs.flatMap((t) => t.images)
      case "embed":
        return b.image ? [b.image] : []
      default:
        return []
    }
  })
  return imgs.reduce((n, img) => n + img.bytes, 0)
}

function sizeOf(entry: Entry): string {
  switch (entry.type) {
    case "document":
      return kb(textBytes(entry) + pictureBytes(entry.blocks))
    case "picture":
      return kb(entry.image.bytes)
    default:
      return "—"
  }
}

/** A folder's Date Created, read off what it holds: the oldest date of
 *  anything in it, at any depth (a folder is no younger than its first
 *  file). Nothing dated inside, no date — never a made-up one. */
function oldestIn(nodes: Node[]): string | undefined {
  const dates = everyNode(nodes)
    .map((n) => n.entry.date)
    .filter((d): d is string => !!d && !Number.isNaN(dateValue(d)))
  return dates.sort((a, b) => dateValue(a) - dateValue(b))[0]
}

export type Openers = { open: (node: Node) => void; about: () => void }

/** The disk as the Finder's volumes list: one volume, holding the site. */
export function buildDisk(nodes: Node[], volume: string, opens: Openers): FinderItem[] {
  const row = (node: Node): FinderItem => {
    const { entry } = node
    const target = entry.type === "alias" ? findNode(nodes, entry.to) : undefined
    const shown = target?.entry ?? entry
    const comment = entry.comment ? plainText(entry.comment) : undefined
    return {
      label: node.path.at(-1)!,
      icon: iconOf(entry, target?.entry),
      // A broken alias, as the Finder shows one whose original is gone: dimmed.
      disabled: entry.type === "alias" && !target,
      onClick: entry.type === "about" ? opens.about : entry.type === "collection" ? undefined : () => opens.open(node),
      kind: kindOf(entry),
      size: sizeOf(shown),
      created: entry.date ?? (node.children ? oldestIn(node.children) : undefined) ?? "—",
      info: entry.info,
      comment,
      category: entry.category,
      keywords: [
        titleOf(entry),
        ...(entry.category ? [entry.category] : []),
        ...(entry.keywords ?? []),
        ...(entry.info?.map((i) => i.value) ?? []),
        ...(entry.type === "document" && entry.subtitle ? [entry.subtitle] : []),
        ...(comment ? [comment] : []),
      ],
      contents: node.children?.map(row),
    }
  }
  return [{ label: volume, icon: <DiskIcon />, kind: "Volume", size: "—", created: "—", contents: nodes.map(row) }]
}
