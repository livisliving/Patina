import type * as React from "react"
import { cn } from "@patina/ui"

/** An inline code token — a token name, a hex value, a command. One place for
 *  the pack's mono style, at the 11px small size. */
export function Mono({ className, ...props }: React.ComponentProps<"code">) {
  return <code className={cn("font-(family-name:--y2k-font-mono) text-[11px]", className)} {...props} />
}
