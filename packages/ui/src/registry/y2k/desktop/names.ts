import type { Block, DocumentEntry, Entry, Site } from "@/lib/content"

/**
 * What an entry is called on the disk — no React here, so next.config can
 * read it too (redirects.ts). Naming: a document is `fileName`, or its title
 * with `.rtf` when it holds a picture (10.0's format for words with
 * pictures) and `.txt` when it is words alone; an alias takes its target's
 * suffix; a picture or a movie keeps its file's name.
 */

/** Does a document hold a picture (anything that would open Preview or
 *  QuickTime, or a plate waiting for one)? Then it is rich text. */
const hasPicture = (blocks: Block[]) =>
  blocks.some(
    (b) =>
      b.type === "figure" ||
      b.type === "gallery" ||
      b.type === "compare" ||
      b.type === "video" ||
      b.type === "placeholder" ||
      (b.type === "embed" && !!b.image)
  )

const documentName = (doc: DocumentEntry) => doc.fileName ?? `${doc.title}${hasPicture(doc.blocks) ? ".rtf" : ".txt"}`

/** An entry's title: what an alias's `to` and `site.featured` name it by. */
export function titleOf(entry: Entry): string {
  switch (entry.type) {
    case "picture":
      return entry.image.name
    case "movie":
      return entry.movie.name
    default:
      return entry.title
  }
}

/** The entry a path of titles leads to, from the site's root. */
export function findEntry(entries: Entry[], titles: string[]): Entry | undefined {
  let level: Entry[] | undefined = entries
  let found: Entry | undefined
  for (const title of titles) {
    found = level?.find((e) => titleOf(e) === title)
    if (!found) return undefined
    level = found.type === "collection" ? found.items : undefined
  }
  return found
}

/** An entry's name on the disk. An alias needs the site, to read its
 *  target's suffix. */
export function fileNameOf(entry: Entry, site: Site): string {
  switch (entry.type) {
    case "document":
      return documentName(entry)
    case "collection":
    case "about":
      return entry.title
    case "picture":
      return entry.image.name
    case "movie":
      return entry.movie.name
    case "alias": {
      if (entry.fileName) return entry.fileName
      const target = findEntry(site.entries, entry.to)
      const name = target && target.type !== "alias" ? fileNameOf(target, site) : ""
      const dot = name.lastIndexOf(".")
      return `${entry.title}${dot > 0 ? name.slice(dot) : ""}`
    }
  }
}
