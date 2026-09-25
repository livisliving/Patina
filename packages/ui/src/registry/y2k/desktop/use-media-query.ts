/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
"use client"

import * as React from "react"

/**
 * Subscribe to a CSS media query. SSR-safe: returns `false` on the server and
 * the first client render, then syncs after mount (so it never reads
 * `window.matchMedia` during SSR).
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia(query)
    const update = () => setMatches(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [query])
  return matches
}

/** The floating desktop needs a screen 768 wide AND 480 tall; below either
 *  (a phone held sideways is 844 × 390) the windows stack — in one column,
 *  or two side by side when the phone is held sideways (pair: in y2k.css).
 *  The CSS says the same with the desk: / max-desk: variants (y2k.css). */
export const DESKTOP = "(min-width: 768px) and (min-height: 480px)"

const REDUCE = "(prefers-reduced-motion: reduce)"

/** Whether the visitor asked for less motion, read once (in a handler). */
export const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia(REDUCE).matches

const subscribeReduce = (cb: () => void) => {
  const mq = window.matchMedia(REDUCE)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

/** Whether the visitor asked for less motion, kept up to date. `onServer`
 *  is the answer before the page is in a browser: false where motion is
 *  the safe guess (the TV's typing), true where stillness is (a movie). */
export const useReducedMotion = (onServer = false) =>
  React.useSyncExternalStore(subscribeReduce, prefersReducedMotion, () => onServer)
