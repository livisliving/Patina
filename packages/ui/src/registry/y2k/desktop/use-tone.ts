"use client"

import * as React from "react"

import type { Tone } from "./tones"

/**
 * The active tone, read from `data-tone` on <html> (written by the desktop from
 * React state). All consumers — icons that swap PNGs per tone, the wallpaper —
 * share ONE document-level MutationObserver via useSyncExternalStore rather
 * than each mounting its own. SSR-safe: falls back to "pink" on the server and
 * the first client render, then syncs after mount.
 */
export function subscribeTone(cb: () => void) {
  if (typeof document === "undefined") return () => {}
  const obs = new MutationObserver(cb)
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tone"] })
  return () => obs.disconnect()
}

export const getToneSnapshot = () =>
  (typeof document !== "undefined" && document.documentElement.getAttribute("data-tone")) || "pink"

export function useTone(): Tone {
  return React.useSyncExternalStore(subscribeTone, getToneSnapshot, () => "pink") as Tone
}

/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
