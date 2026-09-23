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
