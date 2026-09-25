import type { Entry, Site } from "@/lib/content"

import { fileNameOf } from "./names"

/**
 * The desktop's address. `?open=<path>` names a window: the path is the
 * Finder's — file names from the volume, `/`-joined, each URL-encoded
 * (`?open=Journal/First%20frost.txt`) — and a name may also be a title
 * without its suffix. The desktop opens it at load and keeps it in step
 * with the front window (desktop.tsx). No React here, so next.config can
 * import it for the old site's routes (`desktopRedirects`).
 */

/** The query's pieces, `&`-split — except that a piece with no `=` right
 *  after `open=` is the rest of a name that held a bare `&` (typed by hand,
 *  or decoded by a redirect), so it goes back on the name. */
function pieces(search: string): string[] {
  const out: string[] = []
  for (const p of search.replace(/^\?/, "").replace(/&+$/, "").split("&")) {
    const last = out.at(-1)
    if (last?.startsWith("open=") && !p.includes("=")) out[out.length - 1] = `${last}&${p}`
    else if (p) out.push(p)
  }
  return out
}

/** The `open` parameter's names, decoded one by one (so a name may carry
 *  an encoded slash), or null when there is none or it cannot be read. */
export function readOpen(search: string): string[] | null {
  const raw = pieces(search).find((p) => p.startsWith("open="))
  if (!raw) return null
  try {
    const names = raw
      .slice(5)
      .split("/")
      .map((s) => decodeURIComponent(s.replace(/\+/g, " ")))
      .filter((s) => s.trim())
    return names.length ? names : null
  } catch {
    return null
  }
}

/** A search string with `open` set to a Finder path (less the volume), or
 *  taken out (`path` null) — every other parameter kept as it was. */
export function withOpen(search: string, path: string[] | null): string {
  const rest = pieces(search).filter((p) => !p.startsWith("open="))
  if (path?.length) rest.push(`open=${path.map(encodeURIComponent).join("/")}`)
  return rest.length ? `?${rest.join("&")}` : ""
}

/** A link to a window from anywhere on the site: `/?open=<path>`. */
export const openHref = (path: string[]) => `/${withOpen("", path)}`

type Redirect = { source: string; destination: string; permanent: false }

/**
 * next.config's `redirects()`: every entry's old `route` to its window,
 * then `more` — old routes that were not one entry, each to a path of
 * titles or file names, or to null for the desktop itself
 * (`{ "/blog/page/2": ["Journal"], "/home": null }`). Not permanent: the
 * mapping moves when the content does.
 *
 * Next decodes a destination once before it sends it, so each name is
 * encoded twice here, and a name with `&`, `+`, `%` or an accent arrives
 * whole.
 */
export function desktopRedirects(site: Site, more: Record<string, string[] | null> = {}): Redirect[] {
  const routes: [string, string[] | null][] = []
  const walk = (entries: Entry[], path: string[]) => {
    for (const entry of entries) {
      const p = [...path, fileNameOf(entry, site)]
      if (entry.route) routes.push([entry.route, p])
      if (entry.type === "collection") walk(entry.items, p)
    }
  }
  walk(site.entries, [])
  routes.push(...Object.entries(more))
  return routes
    .filter(([source]) => source !== "/")
    .map(([source, path]) => ({
      source,
      destination: path?.length ? `/?open=${path.map((s) => encodeURIComponent(encodeURIComponent(s))).join("/")}` : "/",
      permanent: false,
    }))
}

/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
