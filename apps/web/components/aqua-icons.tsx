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

/** Computer — a white iMac with a black edge and a dark glass screen; the
 *  same in every tone. A stand-in until there is PNG art. */
export function ComputerIcon(props: IconProps) {
  const u = useId()
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={`${u}-shell`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#e3e9f1" />
          <stop offset="1" stopColor="#b8c4d3" />
        </linearGradient>
        <linearGradient id={`${u}-trim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a4a4a" />
          <stop offset="1" stopColor="#0a0a0a" />
        </linearGradient>
        <linearGradient id={`${u}-screen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4a4a4a" />
          <stop offset="0.55" stopColor="#1c1c1c" />
          <stop offset="1" stopColor="#050505" />
        </linearGradient>
      </defs>
      <ellipse cx="64" cy="117" rx="40" ry="5" fill="rgba(0,0,0,0.22)" />
      {/* Foot, then the rounded shell with its black edge */}
      <path d="M44 102h40l8 12H36z" fill={`url(#${u}-shell)`} stroke="#333" strokeWidth="1.5" />
      <path
        d="M18 28c0-12 8-17 20-17h52c12 0 20 5 20 17l2 58c0 14-8 20-22 20H38c-14 0-22-6-22-20z"
        fill={`url(#${u}-trim)`}
      />
      <path
        d="M22 29c0-9 6-13 16-13h52c10 0 16 4 16 13l2 57c0 11-6 16-18 16H40c-12 0-18-5-18-16z"
        fill={`url(#${u}-shell)`}
      />
      {/* The dark glass, with a diagonal catch of light */}
      <rect x="32" y="22" width="64" height="52" rx="4" fill={`url(#${u}-screen)`} stroke="rgba(0,0,0,0.6)" />
      <path d="M33 23h40L33 63z" fill="rgba(255,255,255,0.14)" />
      {/* Speakers and the disc slot */}
      <circle cx="36" cy="90" r="4" fill={`url(#${u}-trim)`} />
      <circle cx="92" cy="90" r="4" fill={`url(#${u}-trim)`} />
      <rect x="46" y="88" width="36" height="4" rx="2" fill="#8795a8" />
    </Svg>
  )
}

/** Home — a cream house with a dark roof edge, a wooden door and shuttered
 *  window, as the 10.1 toolbar draws it; the same in every tone. A stand-in
 *  until there is PNG art. */
export function HomeIcon(props: IconProps) {
  const u = useId()
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={`${u}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbf7ee" />
          <stop offset="1" stopColor="#d8ccb2" />
        </linearGradient>
        <linearGradient id={`${u}-wood`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8a4618" />
          <stop offset="0.5" stopColor="#c87a36" />
          <stop offset="1" stopColor="#8a4618" />
        </linearGradient>
      </defs>
      <ellipse cx="64" cy="114" rx="42" ry="5" fill="rgba(0,0,0,0.22)" />
      <rect x="84" y="24" width="11" height="28" fill="#d8ccb2" stroke="#6b5a3e" strokeWidth="1.5" />
      {/* The wall and gable, under a dark roof edge */}
      <path d="M26 58L64 24l38 34v52H26z" fill={`url(#${u}-wall)`} stroke="#6b5a3e" strokeWidth="1.5" />
      <path d="M14 64L64 19l50 45" fill="none" stroke="#2b2724" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      {/* A shuttered window and the door */}
      <rect x="55" y="44" width="18" height="16" fill="#f7f4ec" stroke="#6b5a3e" />
      <rect x="49" y="44" width="6" height="16" fill={`url(#${u}-wood)`} />
      <rect x="73" y="44" width="6" height="16" fill={`url(#${u}-wood)`} />
      <rect x="54" y="74" width="20" height="36" fill={`url(#${u}-wood)`} stroke="#5a2e0e" strokeWidth="1.5" />
      <path d="M60 78v28M68 78v28" stroke="rgba(0,0,0,0.25)" />
      <circle cx="70" cy="93" r="1.6" fill="#f3d27a" />
    </Svg>
  )
}
