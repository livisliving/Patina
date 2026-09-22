/*
 * Patina desktop icons.
 *
 * The photographic Aqua icons render Olivia's own PNG artwork from
 * /public/icons/*.png — NOT redrawn SVG.
 *
 * Tone adaptation:
 *   • StarIcon (Patina brand mark) recolours the single pink gel PNG via the
 *     CSS var --y2k-star-filter, set per tone in y2k.css — zero JS.
 *   • FolderIcon/HeartIcon swap the PNG *file* per tone (real per-colour art),
 *     so they read the active tone. They share ONE document-level tone
 *     subscription (the `useTone` hook, also used by the wallpaper) instead of
 *     one MutationObserver per icon.
 *
 * Two document icons: DocIcon = simple clean-paper doc (INSIDE windows / file
 * lists), NoteIcon = detailed letter+pen scene (the DOCK).
 *
 * LogoIcon is Olivia's chrome Patina wordmark: About Patina's icon.
 *
 * Icons with no PNG yet (PillIcon/Components, PrefsIcon, ComputerIcon,
 * HomeIcon) keep their SVG.
 */
"use client"

import * as React from "react"
import { useId } from "react"
import { cn } from "@patina/ui"

import type { Tone } from "./tones"
import { useTone } from "./use-tone"

type IconProps = React.ComponentProps<"svg">
type ImgProps = Omit<React.ComponentProps<"img">, "src" | "alt">

const Svg = ({ children, ...props }: IconProps) => (
  <svg viewBox="0 0 128 128" width={128} height={128} aria-hidden="true" {...props}>
    {children}
  </svg>
)

/* tone shorthand: color-mix of the active tone toward white/black */
const tone = (pct: number, mix: "white" | "black") =>
  `color-mix(in srgb, var(--y2k-tone) ${pct}%, ${mix})`

/** The wrapper fills the caller's sized box, whether the caller sizes the icon
    directly (className="size-16") or sizes a parent box and expects the icon to
    fill it (the `[&_svg]:size-full` call sites). */
const WRAP = "inline-flex h-full w-full items-center justify-center"

function PngIcon({ src, alt, className, style, ...props }: ImgProps & { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={className}
      style={{ display: "block", width: "100%", height: "100%", objectFit: "contain", ...style }}
      {...props}
    />
  )
}

/** Factory for a neutral (non-tone) PNG icon. */
function makePngIcon(src: string, alt: string) {
  function PngIconComponent({ className, style }: IconProps) {
    return (
      <span className={cn(WRAP, className)} style={style}>
        <PngIcon src={src} alt={alt} />
      </span>
    )
  }
  PngIconComponent.displayName = `${alt}Icon`
  return PngIconComponent
}

/* ── Tone-adaptive PNG icons (swap the file per tone) ──────────────── */

const FOLDER_BY_TONE: Record<Tone, string> = {
  pink: "/icons/folder-pink.png",
  aqua: "/icons/folder-blue.png",
  lime: "/icons/folder-green.png",
  tangerine: "/icons/folder-orange.png",
  grape: "/icons/folder-purple.png",
}
const HEART_BY_TONE: Record<Tone, string> = {
  pink: "/icons/heart-pink.png",
  aqua: "/icons/heart-aqua.png",
  lime: "/icons/heart-green.png",
  tangerine: "/icons/heart-orange.png",
  grape: "/icons/heart-red.png",
}

/** Aqua folder — tone-matched to the active data-tone. */
export function FolderIcon({ className, style }: IconProps) {
  const t = useTone()
  return (
    <span className={cn(WRAP, className)} style={style}>
      <PngIcon src={FOLDER_BY_TONE[t]} alt="Folder" />
    </span>
  )
}

/** Gel heart — tone-matched. Favourites + the Window demo. */
export function HeartIcon({ className, style }: IconProps) {
  const t = useTone()
  return (
    <span className={cn(WRAP, className)} style={style}>
      <PngIcon src={HEART_BY_TONE[t]} alt="Heart" />
    </span>
  )
}

/** Patina brand mark — a pink gel star, recoloured per tone via the
    --y2k-star-filter CSS var (set in y2k.css, calibrated for the pink base).
    Zero-JS tone technique. Used for the menu-bar mark. */
export function StarIcon({ className, style }: IconProps) {
  return (
    <span className={cn(WRAP, className)} style={style}>
      <PngIcon src="/icons/star.webp" alt="Patina" style={{ filter: "var(--y2k-star-filter, none)" }} />
    </span>
  )
}

/** Finder — the Aqua smiley face. Olivia's own artwork (drawn for Patina, not
    Apple's icon), painted blue; --y2k-face-filter (set per tone in y2k.css)
    rotates it to the active tone, so the default reading is the pink face.
    Same zero-JS recolour technique as StarIcon. */
export function FaceIcon({ className, style }: IconProps) {
  return (
    <span className={cn(WRAP, className)} style={style}>
      <PngIcon src="/icons/finder.png" alt="Finder" style={{ filter: "var(--y2k-face-filter, none)" }} />
    </span>
  )
}

/* ── Neutral PNG icons (same across tones) ─────────────────────────── */

/** Hard disk (Patina HD). */
export const DiskIcon = makePngIcon("/icons/disk.png", "Disk")
/** Document — the SIMPLE clean-paper doc. Use inside windows / file lists. */
export const DocIcon = makePngIcon("/icons/doc.png", "Document")
/** Note — the DETAILED letter+pen scene (TextEdit). Use in the Dock. */
export const NoteIcon = makePngIcon("/icons/note.png", "TextEdit")
/** Trash — wire-mesh bin. */
export const TrashIcon = makePngIcon("/icons/bin.png", "Trash")
/** Terminal — the Install step. */
export const TerminalIcon = makePngIcon("/icons/terminal.png", "Terminal")
/** iPod — the music player (Finder toolbar, Dock). */
export const IPodIcon = makePngIcon("/icons/ipod-icon.png", "iPod")

/** Patina logo — the chrome wordmark and its stars: About Patina's icon, in
    the Dock and the About box. Drawn at 120% so the art, not the file's
    transparent margin, spans the box. */
export function LogoIcon({ className, style }: IconProps) {
  return (
    <span className={cn(WRAP, className)} style={style}>
      <PngIcon src="/icons/logo.png" alt="Patina" className="scale-120" />
    </span>
  )
}

/* ── Icons with no PNG art — keep the existing SVG ─────────────────── */

/** Tone preferences — an artist's palette with paint blobs (one tone-tinted). */
export function PrefsIcon(props: IconProps) {
  const u = useId()
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={`${u}-board`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbf3e3" />
          <stop offset="1" stopColor="#e2cfa6" />
        </linearGradient>
        <radialGradient id={`${u}-tone`} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" style={{ stopColor: tone(55, "white") }} />
          <stop offset="1" style={{ stopColor: "var(--y2k-tone)" }} />
        </radialGradient>
      </defs>
      <ellipse cx="64" cy="118" rx="44" ry="5" fill="rgba(0,0,0,0.25)" />
      {/* Palette board: a rounded kidney shape with a thumb-hole */}
      <path
        d="M64 18C30 18 12 40 12 64c0 20 16 34 34 34 10 0 14-6 22-6 9 0 12 8 24 6 18-3 24-20 24-38C116 40 98 18 64 18Z"
        fill={`url(#${u}-board)`}
        stroke="rgba(0,0,0,0.4)"
        strokeWidth="2"
      />
      <path d="M64 18C30 18 12 40 12 64c0 6 1.5 11 4 15 4-30 26-49 60-49 12 0 22 3 30 8-9-11-24-20-42-20Z" fill="rgba(255,255,255,0.5)" />
      {/* Thumb-hole */}
      <ellipse cx="80" cy="82" rx="11" ry="9" fill="#c7ad78" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
      <ellipse cx="80" cy="80" rx="11" ry="9" fill="#fbf3e3" />
      {/* Paint blobs — the top-left one follows the active tone */}
      <circle cx="42" cy="42" r="9" fill={`url(#${u}-tone)`} stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
      <circle cx="66" cy="36" r="8" fill="#4a9ff5" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
      <circle cx="88" cy="46" r="8" fill="#9be11f" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
      <circle cx="34" cy="66" r="8" fill="#ffa31a" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
      <circle cx="52" cy="72" r="7" fill="#9b6de8" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
    </Svg>
  )
}

/** Two gel pills — the Components app (kept as SVG per Olivia). */
export function PillIcon(props: IconProps) {
  const u = useId()
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={`${u}-t`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: tone(72, "black") }} />
          <stop offset="0.5" style={{ stopColor: "var(--y2k-tone)" }} />
          <stop offset="1" style={{ stopColor: tone(78, "white") }} />
        </linearGradient>
        <linearGradient id={`${u}-w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bdbdbd" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id={`${u}-shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <ellipse cx="64" cy="112" rx="50" ry="5" fill="rgba(0,0,0,0.22)" />
      <rect x="12" y="28" width="104" height="30" rx="15" fill={`url(#${u}-t)`} stroke="rgba(0,0,0,0.4)" />
      <rect x="18" y="31" width="92" height="10" rx="5" fill={`url(#${u}-shine)`} />
      <rect x="12" y="70" width="104" height="30" rx="15" fill={`url(#${u}-w)`} stroke="rgba(0,0,0,0.4)" />
      <rect x="18" y="73" width="92" height="10" rx="5" fill={`url(#${u}-shine)`} />
    </Svg>
  )
}

/** Computer and Home are the pack's own now: the same drawings, the same in
 *  every tone. */
export { IconComputer as ComputerIcon, IconHome as HomeIcon } from "@patina/ui"
