/** A file in public/, under the path the site is served from: "" on Vercel,
 *  "/patina" on GitHub Pages (next.config.ts sets it). Next adds the prefix to
 *  its own links and scripts, not to a plain <img src> or a CSS url(). */
export const asset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`
