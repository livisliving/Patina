/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
import * as React from "react"

/** The system volume, 0–100, kept outside the desktop's state: the menu
 *  bar's slider sets it and the iPod plays at its own volume times it, so a
 *  drag re-renders those two and nothing else. */
let level = 75
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setVolume(value: number) {
  level = value
  listeners.forEach((listener) => listener())
}

export function useVolume() {
  return React.useSyncExternalStore(subscribe, () => level, () => 75)
}
