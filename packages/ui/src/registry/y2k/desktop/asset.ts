/* Patina OS · © 2026 Olivia Forster · MIT licence (DESIGN.md › Licence) · https://github.com/livisliving/Patina */
/** A file in public/, under the path the site is served from: "" on Vercel,
 *  "/Patina" on GitHub Pages without a custom domain (next.config.ts sets it). Next adds the prefix to
 *  its own links and scripts, not to a plain <img src> or a CSS url(). */
export const asset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`
