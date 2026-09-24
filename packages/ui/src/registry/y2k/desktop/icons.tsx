"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

import { BIN, DISK, DOC, FINDER, FOLDER_AQUA, FOLDER_GRAPE, FOLDER_LIME, FOLDER_PINK, FOLDER_TANGERINE, IPOD, NOTE } from "./icon-data"
import type { Tone } from "./tones"

/**
 * The desktop's icons: Olivia's own PNG artwork, inlined by
 * scripts/desktop-icons.mjs (icon-data.ts) so they install with the source.
 * An icon looks the same in every tone; only the Folder follows it, in the
 * tone's own colour of folder (real per-colour art, swapped by file).
 *
 * Two document icons: DocIcon, the clean sheet, for a file in a window or
 * on the desktop; NoteIcon, the letter and pen, for TextEdit itself.
 */

type IconProps = { className?: string; style?: React.CSSProperties }

/** The wrapper fills the caller's box, whether the caller sizes the icon
 *  (className="size-16") or sizes a parent and expects it to fill that (the
 *  `[&_svg]:size-full` call sites). A block, as an <img> or <svg> is:
 *  inline, it would sit on the text's baseline, and in a box shorter than the
 *  line (a 16px icon by a 13px title) drop 2px below it. */
const WRAP = "flex h-full w-full items-center justify-center"

function Png({ src, alt, className, style }: IconProps & { src: string; alt: string }) {
  return (
    <span className={cn(WRAP, className)} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a data URI, nothing for next/image to optimise */}
      <img src={src} alt={alt} draggable={false} className="block size-full object-contain" />
    </span>
  )
}

function makeIcon(src: string, alt: string) {
  function PngIcon(props: IconProps) {
    return <Png src={src} alt={alt} {...props} />
  }
  PngIcon.displayName = `${alt}Icon`
  return PngIcon
}

/** Finder — the Aqua smiley face, drawn for Patina (not Apple's icon). */
export const FaceIcon = makeIcon(FINDER, "Finder")
/** The hard disk: the volume the site is. */
export const DiskIcon = makeIcon(DISK, "Disk")
/** A document: the clean sheet. */
export const DocIcon = makeIcon(DOC, "Document")
/** TextEdit: the letter and pen. */
export const NoteIcon = makeIcon(NOTE, "TextEdit")
/** The Bin — wire mesh. */
export const TrashIcon = makeIcon(BIN, "Bin")
/** The iPod: its Dock tile and its app icon. */
export const IPodIcon = makeIcon(IPOD, "iPod")

const FOLDER_BY_TONE: Record<Tone, string> = {
  pink: FOLDER_PINK,
  aqua: FOLDER_AQUA,
  lime: FOLDER_LIME,
  tangerine: FOLDER_TANGERINE,
  grape: FOLDER_GRAPE,
}

/** Each tone's folder as CSS, keyed to the tone on <html> (pink when
 *  unset). The server's HTML then paints the right folder — it cannot know
 *  the tone; the stylesheet can — and a tone change needs no render. React
 *  hoists the one <style> into the head, however many folders there are. */
const FOLDER_CSS = [
  `.y2k-folder{background:url(${FOLDER_BY_TONE.pink}) center/contain no-repeat}`,
  ...(["aqua", "lime", "tangerine", "grape"] as const).map((t) => `html[data-tone="${t}"] .y2k-folder{background-image:url(${FOLDER_BY_TONE[t]})}`),
].join("\n")

/** An Aqua folder in the tone's colour. */
export function FolderIcon({ className, style }: IconProps) {
  return (
    <>
      <style href="y2k-folder" precedence="default">
        {FOLDER_CSS}
      </style>
      <span role="img" aria-label="Folder" className={cn(WRAP, "y2k-folder", className)} style={style} />
    </>
  )
}

/** The Patina star, flat in the current colour: where a display has its
 *  logo (the iPod's, at rest). The pack's IconStar's outline. */
export function StarMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 128" aria-hidden className={className}>
      <path
        d="M62.1 13.6Q64 9 65.9 13.6L76.8 41.1Q78.7 45.8 83.7 46.1L113.2 48.1Q118.2 48.4 114.4 51.6L91.6 70.5Q87.8 73.7 89 78.6L96.3 107.3Q97.5 112.1 93.3 109.4L68.2 93.7Q64 91 59.8 93.7L34.7 109.4Q30.5 112.1 31.7 107.3L39 78.6Q40.2 73.7 36.4 70.5L13.6 51.6Q9.8 48.4 14.8 48.1L44.3 46.1Q49.3 45.8 51.2 41.1Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Computer and the Aqua star are the pack's own. */
export { IconComputer as ComputerIcon, IconStar as StarIcon } from "@/components/ui/icons"
