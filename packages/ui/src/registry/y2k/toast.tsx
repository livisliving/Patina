"use client"

import * as React from "react"
import { Toast as ToastPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Patina Toast — the MSN Messenger "Nudge".
 *
 * A small Aqua window that slides up from the Dock and shakes once, then slides
 * back down on dismiss. Built on Radix Toast.
 *
 *   <NudgeProvider>
 *     <NudgeTrigger … />        // your own button calling the imperative API,
 *     <Nudge open={…} onOpenChange={…} title="…">body</Nudge>
 *     <NudgeViewport />
 *   </NudgeProvider>
 *
 * NudgeProvider is Radix Toast.Provider; NudgeViewport is the fixed
 * bottom-center region the toasts stack in (above the Dock).
 */

const NudgeProvider = ToastPrimitive.Provider

function NudgeViewport({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Viewport>) {
  return (
    <ToastPrimitive.Viewport
      data-slot="nudge-viewport"
      className={cn(
        // Sits above the Dock, centered.
        "fixed bottom-24 left-1/2 z-[120] flex w-[min(90vw,20rem)] -translate-x-1/2 flex-col gap-2 outline-none",
        className
      )}
      {...props}
    />
  )
}

function Nudge({
  className,
  title,
  children,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Root> & { title?: React.ReactNode }) {
  return (
    <ToastPrimitive.Root
      data-slot="nudge"
      className={cn(
        // A mini Aqua window: pinstripe frame, rounded top, deep shadow.
        "relative overflow-hidden rounded-(--y2k-window-radius) border-[0.5px] border-(--y2k-window-border)",
        "bg-(image:--y2k-pinstripe) text-(--y2k-ink) shadow-(--y2k-shadow-window)",
        "data-[state=open]:animate-[y2k-nudge-in_600ms_var(--y2k-ease-aqua)]",
        "data-[state=closed]:animate-[y2k-nudge-out_180ms_ease-in]",
        "data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform",
        "motion-reduce:animate-none",
        className
      )}
      {...props}
    >
      {title != null && (
        <ToastPrimitive.Title
          className="flex h-(--y2k-titlebar-h) items-center bg-(image:--y2k-titlebar) px-3 text-[13px] font-bold text-(--y2k-title-ink) [text-shadow:var(--y2k-title-lift)]"
        >
          {title}
        </ToastPrimitive.Title>
      )}
      <ToastPrimitive.Description className="px-3 py-2.5 text-[13px] leading-[1.45]">
        {children}
      </ToastPrimitive.Description>
    </ToastPrimitive.Root>
  )
}

function NudgeClose(props: React.ComponentProps<typeof ToastPrimitive.Close>) {
  return <ToastPrimitive.Close data-slot="nudge-close" {...props} />
}

export { NudgeProvider, NudgeViewport, Nudge, NudgeClose }
