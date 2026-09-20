"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Patina Marquee — the old-web <marquee>, done right.
 *
 * Scrolls its children horizontally in an endless loop. The content is
 * duplicated so the loop is seamless (the track is 200% wide and slides -50%).
 * Pauses on hover; respects prefers-reduced-motion (stops, shows static).
 *
 *   <Marquee speed={40}>★ welcome to my homepage ★ sign my guestbook ★</Marquee>
 */
function Marquee({
  className,
  children,
  /** Seconds for one full loop. Lower = faster. */
  speed = 30,
  ...props
}: React.ComponentProps<"div"> & { speed?: number }) {
  return (
    <div
      data-slot="marquee"
      className={cn(
        "group/marquee relative flex overflow-hidden font-(family-name:--y2k-font-ui) text-[13px] text-(--y2k-ink)",
        className
      )}
      {...props}
    >
      <div
        data-slot="marquee-track"
        className={cn(
          "flex w-max shrink-0 items-center gap-8 pr-8",
          "animate-[y2k-marquee_linear_infinite] group-hover/marquee:[animation-play-state:paused]",
          "motion-reduce:animate-none"
        )}
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
        {/* duplicate for a seamless loop */}
        <span aria-hidden="true" className="flex items-center gap-8 pr-8">
          {children}
        </span>
      </div>
    </div>
  )
}

export { Marquee }
