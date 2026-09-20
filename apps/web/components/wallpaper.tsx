"use client"

import type { Tone } from "./tones"
import { useTone } from "./use-tone"

/**
 * The desktop wallpaper. Every tone ships a Y2K photo-collage wallpaper
 * (Olivia's artwork in /public/wallpapers). The tone-reactive SVG abstract is
 * kept only as a safety net for any tone without a photo. The active tone is
 * read from `data-tone` on <html> via the shared `useTone` subscription.
 */

/** Photo wallpaper per tone. All five tones have one. */
const PHOTO_BY_TONE: Partial<Record<Tone, string>> = {
  pink: "/wallpapers/pink.webp",
  aqua: "/wallpapers/aqua.webp",
  lime: "/wallpapers/lime.webp",
  tangerine: "/wallpapers/tangerine.webp",
  grape: "/wallpapers/grape.webp",
}

export function Wallpaper() {
  const tone = useTone()
  const photo = PHOTO_BY_TONE[tone]

  if (photo) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 size-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${photo})` }}
      />
    )
  }

  // Aqua (and any future tone without a photo): the original tone-reactive SVG.
  return <WallpaperAbstract />
}

/** Aqua-style abstract: translucent curved sheets of the tone, one dark fold,
 *  a bright edge — SVG so the fills follow the --y2k-wall-* variables. */
function WallpaperAbstract() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 size-full"
      viewBox="0 0 1024 768"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="wp-base" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--y2k-wall-mid)" }} />
          <stop offset="0.55" style={{ stopColor: "var(--y2k-wall-mid)" }} />
          <stop offset="1" style={{ stopColor: "var(--y2k-wall-lo)" }} />
        </linearGradient>
        <linearGradient id="wp-sheet" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: "var(--y2k-wall-hi)" }} stopOpacity="0" />
          <stop offset="0.4" style={{ stopColor: "var(--y2k-wall-hi)" }} stopOpacity="0.55" />
          <stop offset="1" style={{ stopColor: "var(--y2k-wall-hi)" }} stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="wp-fold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--y2k-wall-lo)" }} stopOpacity="0.9" />
          <stop offset="1" style={{ stopColor: "var(--y2k-wall-lo)" }} stopOpacity="0" />
        </linearGradient>
        <radialGradient id="wp-glow" cx="0.72" cy="0.38" r="0.6">
          <stop offset="0" style={{ stopColor: "var(--y2k-wall-hi)" }} stopOpacity="0.55" />
          <stop offset="1" style={{ stopColor: "var(--y2k-wall-hi)" }} stopOpacity="0" />
        </radialGradient>
        <filter id="wp-blur-lg" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <filter id="wp-blur-sm" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <rect width="1024" height="768" fill="url(#wp-base)" />
      <rect width="1024" height="768" fill="url(#wp-glow)" />
      {/* dark fold sweeping from the left */}
      <path
        d="M-100 250 C 150 180, 280 300, 330 420 C 380 540, 300 700, 120 820 L -200 820 Z"
        fill="url(#wp-fold)"
        filter="url(#wp-blur-lg)"
      />
      {/* big light sheet */}
      <path
        d="M200 -50 C 500 150, 620 350, 1100 300 L 1100 600 C 700 620, 520 430, 260 560 C 140 620, 60 700, -50 780 L -50 200 Z"
        fill="url(#wp-sheet)"
        filter="url(#wp-blur-lg)"
        opacity="0.9"
      />
      {/* second, thinner sheet */}
      <path
        d="M560 900 C 620 520, 760 380, 1200 340 L 1200 560 C 900 520, 760 640, 700 900 Z"
        fill="url(#wp-sheet)"
        filter="url(#wp-blur-lg)"
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
        filter="url(#wp-blur-sm)"
      />
      <path
        d="M330 520 C 520 360, 700 330, 1040 300"
        stroke="var(--y2k-wall-hi)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
        filter="url(#wp-blur-sm)"
      />
    </svg>
  )
}
