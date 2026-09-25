/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
import type * as React from "react"
import type { Crop } from "@/lib/content"

/** The style that shows only `crop` of a picture or movie: the element is
 *  scaled up by the box's share and slid so the box fills its clipped
 *  parent (a parent of the box's own proportions). Nothing is stretched. */
export const cropStyle = (crop?: Crop): React.CSSProperties | undefined =>
  crop && { width: `${100 / crop.w}%`, height: `${100 / crop.h}%`, left: `${(-crop.x / crop.w) * 100}%`, top: `${(-crop.y / crop.h) * 100}%` }

/** A w × h frame's size once `crop` is cut from it: the picture without its bars. */
export const croppedSize = (w: number, h: number, crop?: Crop) => (crop ? { w: w * crop.w, h: h * crop.h } : { w, h })
