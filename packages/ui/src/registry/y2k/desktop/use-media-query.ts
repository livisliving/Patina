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
