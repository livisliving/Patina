"use client"

import * as React from "react"

/**
 * Desktop sparkle layer: little Y2K 4-point star glints that twinkle at random
 * positions. Each glint fades fully in then out (y2k-twinkle), and jumps to a
 * new random spot + size on every loop — so no two flashes are in the same
 * place. Purely decorative (pointer-events-none, aria-hidden); sits above the
 * wallpaper and below icons/windows. Honours prefers-reduced-motion (the
 * keyframe is disabled in the theme, so the glints sit still). Stars only.
 *
 * The layer renders nothing on the server or while the page hydrates, so its
 * random positions can never mismatch the server's HTML.
 */

const COUNT = 14
const MIN_SIZE = 28
const MAX_SIZE = 56
// Fast enough to read as a Y2K glitter shimmer, not a slow fade.
const MIN_DUR = 0.7
const MAX_DUR = 1.3

type Spark = { x: number; y: number; size: number; dur: number; delay: number }

const rand = (min: number, max: number) => min + Math.random() * (max - min)

/** A fresh random position + size. */
const place = () => ({ x: rand(2, 96), y: rand(4, 94), size: rand(MIN_SIZE, MAX_SIZE) })

/** Initial spawn: random place + a lifetime-fixed duration and staggered start. */
const spawn = (): Spark => ({
  ...place(),
  dur: rand(MIN_DUR, MAX_DUR),
  // negative delay so the initial flashes are staggered, not all in sync
  delay: -rand(0, MAX_DUR),
})

const noSubscription = () => () => {}

export function Stars() {
  const hydrated = React.useSyncExternalStore(noSubscription, () => true, () => false)
  const [sparks, setSparks] = React.useState<Spark[]>(() => Array.from({ length: COUNT }, spawn))

  if (!hydrated) return null

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-[9] hidden overflow-hidden md:block">
      {sparks.map((s, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="absolute animate-[y2k-twinkle_var(--dur)_var(--y2k-ease-aqua)_infinite] motion-reduce:animate-none"
          style={{
            left: `${s.x}vw`,
            top: `${s.y}vh`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            ["--dur" as string]: `${s.dur}s`,
            // Bright white glow + a faint dark rim so the glint reads on both
            // light photo wallpapers and darker ones.
            filter:
              "drop-shadow(0 0 4px #fff) drop-shadow(0 0 8px var(--y2k-wall-hi)) drop-shadow(0 1px 1px rgba(0,0,0,0.35))",
          }}
          // On each fade loop (opacity back at 0) move the glint to a fresh spot
          // so the next flash is elsewhere. Only x/y/size change — dur and delay
          // stay fixed, so the CSS animation is NOT restarted (changing timing
          // props would restart it and fire iteration again in a tight loop).
          onAnimationIteration={() =>
            setSparks((prev) => {
              const next = prev.slice()
              next[i] = { ...prev[i], ...place() }
              return next
            })
          }
        >
          {/* Long 8-point Y2K sparkle: a long thin 4-point star with a shorter
              diagonal 4-point star behind it, plus a wet white core. Solid white. */}
          <path
            d="M12 -1 C12.5 9.2, 14.8 11.5, 25 12 C14.8 12.5, 12.5 14.8, 12 25 C11.5 14.8, 9.2 12.5, -1 12 C9.2 11.5, 11.5 9.2, 12 -1 Z"
            fill="#ffffff"
          />
          <path
            d="M12 4 C12.35 10, 14 11.65, 20 12 C14 12.35, 12.35 14, 12 20 C11.65 14, 10 12.35, 4 12 C10 11.65, 11.65 10, 12 4 Z"
            transform="rotate(45 12 12)"
            fill="#ffffff"
            opacity="0.85"
          />
          <circle cx="12" cy="12" r="1.8" fill="#ffffff" />
        </svg>
      ))}
    </div>
  )
}
