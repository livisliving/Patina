"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Patina Wallpaper — DESIGN.md › Elevation & Depth › The wallpaper.
 *
 * The desktop behind every window, fixed to the viewport. By default it is
 * the pack's own: a deep-to-light diagonal of the tone with two blurred white
 * ribbons sweeping up to the right (Aqua's swoosh, recoloured), drawn on the
 * --y2k-wall-* stops so it follows the tone. Pass `photos` — per tone, a 16:9
 * image and an optional portrait one for phones (below md) — to use your own
 * artwork; a tone without one keeps the swoosh.
 */

type WallpaperPhoto = { desktop: string; mobile?: string }

/** The tones, as y2k.css names them on <html data-tone> (pink when unset). */
const TONES = ["pink", "aqua", "lime", "tangerine", "grape"] as const
type ToneId = (typeof TONES)[number]

/** Which picture shows is CSS's choice, not React's: each tone's pictures
 *  are custom properties on the element, and the tone on <html> picks one.
 *  So the server's HTML already paints the right one (it cannot know the
 *  tone; the stylesheet can), a tone change needs no render, and only the
 *  picture in use is fetched. Class names are spelled out for Tailwind. */
const PICK =
  "[--wp:var(--wp-pink,none)] [--wp-m:var(--wp-m-pink,none)] " +
  "[html[data-tone=aqua]_&]:[--wp:var(--wp-aqua,none)] [html[data-tone=aqua]_&]:[--wp-m:var(--wp-m-aqua,none)] " +
  "[html[data-tone=lime]_&]:[--wp:var(--wp-lime,none)] [html[data-tone=lime]_&]:[--wp-m:var(--wp-m-lime,none)] " +
  "[html[data-tone=tangerine]_&]:[--wp:var(--wp-tangerine,none)] [html[data-tone=tangerine]_&]:[--wp-m:var(--wp-m-tangerine,none)] " +
  "[html[data-tone=grape]_&]:[--wp:var(--wp-grape,none)] [html[data-tone=grape]_&]:[--wp-m:var(--wp-m-grape,none)]"
/** The swoosh steps aside for a tone that has a picture (the picture would
 *  cover it anyway; hidden, it is not drawn). */
const HIDE_SWOOSH: Record<ToneId, string> = {
  pink: "[html:not([data-tone])_&]:hidden [html[data-tone=pink]_&]:hidden",
  aqua: "[html[data-tone=aqua]_&]:hidden",
  lime: "[html[data-tone=lime]_&]:hidden",
  tangerine: "[html[data-tone=tangerine]_&]:hidden",
  grape: "[html[data-tone=grape]_&]:hidden",
}

function Wallpaper({ photos, className }: { photos?: Partial<Record<string, WallpaperPhoto>>; className?: string }) {
  const toned = TONES.filter((t) => photos?.[t])
  const vars = Object.fromEntries(
    toned.flatMap((t) => [
      [`--wp-${t}`, `url(${photos![t]!.desktop})`],
      [`--wp-m-${t}`, `url(${photos![t]!.mobile ?? photos![t]!.desktop})`],
    ])
  ) as React.CSSProperties
  return (
    <>
      <WallpaperSwoosh className={cn(toned.map((t) => HIDE_SWOOSH[t]), className)} />
      {toned.length > 0 && (
        <div
          aria-hidden="true"
          data-slot="wallpaper"
          className={cn(
            "pointer-events-none fixed inset-0 -z-10 size-full bg-(image:--wp-m) bg-cover bg-center bg-no-repeat md:bg-(image:--wp)",
            PICK,
            className
          )}
          style={vars}
        />
      )}
    </>
  )
}

/** The swoosh: translucent curved sheets of the tone, one dark fold,
 *  a bright edge — SVG so the fills follow the --y2k-wall-* variables. */
function WallpaperSwoosh({ className }: { className?: string }) {
  const id = React.useId()
  const ref = (name: string) => `url(#${id}${name})`
  return (
    <svg
      aria-hidden="true"
      data-slot="wallpaper"
      className={cn("pointer-events-none fixed inset-0 -z-10 size-full", className)}
      viewBox="0 0 1024 768"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`${id}wp-base`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--y2k-wall-mid)" }} />
          <stop offset="0.55" style={{ stopColor: "var(--y2k-wall-mid)" }} />
          <stop offset="1" style={{ stopColor: "var(--y2k-wall-lo)" }} />
        </linearGradient>
        <linearGradient id={`${id}wp-sheet`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: "var(--y2k-wall-hi)" }} stopOpacity="0" />
          <stop offset="0.4" style={{ stopColor: "var(--y2k-wall-hi)" }} stopOpacity="0.55" />
          <stop offset="1" style={{ stopColor: "var(--y2k-wall-hi)" }} stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id={`${id}wp-fold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--y2k-wall-lo)" }} stopOpacity="0.9" />
          <stop offset="1" style={{ stopColor: "var(--y2k-wall-lo)" }} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}wp-glow`} cx="0.72" cy="0.38" r="0.6">
          <stop offset="0" style={{ stopColor: "var(--y2k-wall-hi)" }} stopOpacity="0.55" />
          <stop offset="1" style={{ stopColor: "var(--y2k-wall-hi)" }} stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}wp-blur-lg`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <filter id={`${id}wp-blur-sm`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <rect width="1024" height="768" fill={ref("wp-base")} />
      <rect width="1024" height="768" fill={ref("wp-glow")} />
      {/* dark fold sweeping from the left */}
      <path
        d="M-100 250 C 150 180, 280 300, 330 420 C 380 540, 300 700, 120 820 L -200 820 Z"
        fill={ref("wp-fold")}
        filter={ref("wp-blur-lg")}
      />
      {/* big light sheet */}
      <path
        d="M200 -50 C 500 150, 620 350, 1100 300 L 1100 600 C 700 620, 520 430, 260 560 C 140 620, 60 700, -50 780 L -50 200 Z"
        fill={ref("wp-sheet")}
        filter={ref("wp-blur-lg")}
        opacity="0.9"
      />
      {/* second, thinner sheet */}
      <path
        d="M560 900 C 620 520, 760 380, 1200 340 L 1200 560 C 900 520, 760 640, 700 900 Z"
        fill={ref("wp-sheet")}
        filter={ref("wp-blur-lg")}
        opacity="0.6"
      />
      {/* bright edge highlights */}
      <path
        d="M120 330 C 250 240, 330 330, 360 430"
        stroke="var(--y2k-wall-hi)"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
        filter={ref("wp-blur-sm")}
      />
      <path
        d="M330 520 C 520 360, 700 330, 1040 300"
        stroke="var(--y2k-wall-hi)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
        filter={ref("wp-blur-sm")}
      />
    </svg>
  )
}

export { Wallpaper, type WallpaperPhoto }
