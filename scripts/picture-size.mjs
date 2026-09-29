/**
 * One size for Olivia's pictures. Her art sits in its square with uneven
 * room round it (the Finder face fills 70% of its square, the Bin 94%), so
 * side by side the pictures look different sizes. evenSize reframes one, from
 * the original art and before a script's one resize, so it looks as big as
 * the rest; scripts/desktop-icons.mjs and scripts/site-images.mjs both call
 * it, so a changed picture is sized again when they run.
 *
 * A picture's size is its box in its square (the pixels over alpha 24), as
 * the mean of the box's long side and the square root of its area: a tall
 * iPod looks as big as a square face with less area. The square is cut or
 * widened about its centre until that is 86% of it, the median of the
 * desktop's icons. About its centre, not the box's: each picture stays where
 * Olivia put it (a folder sits above its shadow), and none is resampled
 * here, only cropped or padded.
 *
 * Within 3.3% of 86% is left as it is: the document (3.1% over it) and
 * Music (3%) among them, so the Dock's document keeps its size.
 * Only pixels at alpha 24 or under may fall outside the new square (the
 * Finder face's and the iPod's faintest shadow, 10 of 255 at most); anything
 * more stops the script.
 */

import fs from "node:fs"
import sharp from "sharp"

const SEEN = 24
const SIZE = 0.86
const CLOSE = 0.033

/** The picture at `file` sized as the rest: a PNG of the new square, or the
 *  file's own bytes when it is close enough. `by` names the script in the
 *  line it logs for a picture it resizes. */
export async function evenSize(file, by) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  let [x0, y0, x1, y1] = [w, h, 0, 0]
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (data[(y * w + x) * 4 + 3] > SEEN) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x + 1), Math.max(y1, y + 1)]
  const [bw, bh] = [x1 - x0, y1 - y0]
  const square = Math.max(w, h)
  const size = (Math.max(bw, bh) + Math.sqrt(bw * bh)) / 2 / square
  if (Math.abs(size / SIZE - 1) <= CLOSE) return fs.readFileSync(file)

  // The new square's side is odd or even as the picture's width is, so the
  // picture stays centred on whole pixels.
  let side = Math.round((square * size) / SIZE)
  if ((side - w) % 2) side++
  const [dx, dy] = [(side - w) / 2, Math.floor((side - h) / 2)]
  const out = Buffer.alloc(side * side * 4)
  let cut = 0
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const [i, tx, ty] = [(y * w + x) * 4, x + dx, y + dy]
      if (tx >= 0 && tx < side && ty >= 0 && ty < side) data.copy(out, (ty * side + tx) * 4, i, i + 4)
      else cut = Math.max(cut, data[i + 3])
    }
  if (cut > SEEN) throw new Error(`${file}: its new square would cut off pixels at alpha ${cut}`)
  console.log(`${by}: ${file.split("/").pop()} drawn ${(square / side).toFixed(2)}× in its square`)
  return sharp(out, { raw: { width: side, height: side, channels: 4 } }).png().toBuffer()
}
