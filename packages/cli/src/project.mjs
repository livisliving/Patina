/**
 * What init and update share: the pack's default items and copied files,
 * where a project keeps things (components.json's aliases, the App Router
 * folder), and how they print.
 */

import fs from "node:fs"
import path from "node:path"

/** The registry items installed by default, in dependency order (theme
 *  first), and the file each one writes under the project's ui folder — what
 *  the install is checked against afterwards. */
export const COMPONENTS = {
  button: "button.tsx",
  window: "window.tsx",
  sidebar: "window-sidebar.tsx",
  group: "group.tsx",
  progress: "progress.tsx",
  tabs: "tabs.tsx",
  toast: "toast.tsx",
  marquee: "marquee.tsx",
  "visitor-counter": "visitor-counter.tsx",
  forms: "forms.tsx",
  table: "table.tsx",
  popup: "popup.tsx",
  segmented: "segmented.tsx",
  "menu-bar": "menu-bar.tsx",
  dock: "dock.tsx",
  wallpaper: "wallpaper.tsx",
  icons: "icons.tsx",
}

/** Files copied verbatim: [source relative to assetRoot, target relative to cwd]. */
export const COPIES = [
  ["DESIGN.md", "DESIGN.md"],
  ["scripts/check-y2k.mjs", "scripts/check-y2k.mjs"],
  [".claude/skills/check-y2k/SKILL.md", ".claude/skills/check-y2k/SKILL.md"],
  [".claude/skills/y2k-ify/SKILL.md", ".claude/skills/y2k-ify/SKILL.md"],
]

export const tick = (s) => `  ✓ ${s}`
export const skip = (s) => `  · ${s}`
export const stop = (s) => `  ✗ ${s}`

/** The environment for a child npx: npm leaks the flags of the npx that ran
 *  us into it as npm_config_*, and `--package=` would make the child resolve
 *  our package instead of shadcn. */
export function childEnv() {
  const env = { ...process.env }
  delete env.npm_config_package
  return env
}

/** components.json, parsed; null when the project has none (or it is not JSON). */
export function readComponentsJson(cwd) {
  try {
    return JSON.parse(fs.readFileSync(path.join(cwd, "components.json"), "utf8"))
  } catch {
    return null
  }
}

/** Where shadcn puts an alias's files (`ui`, `lib`, `components`):
 *  components.json's alias, resolved against the root and src/ (the two
 *  layouts create-next-app makes). */
export function aliasDir(cwd, key = "ui") {
  const fallback = { ui: "@/components/ui", lib: "@/lib", components: "@/components" }[key]
  // No components.json yet: shadcn init will write the default.
  const alias = readComponentsJson(cwd)?.aliases?.[key] ?? fallback
  const rel = alias.replace(/^@\//, "")
  const candidates = [path.join(cwd, rel), path.join(cwd, "src", rel)]
  return candidates.find((d) => fs.existsSync(d)) ?? (fs.existsSync(path.join(cwd, "src")) ? candidates[1] : candidates[0])
}

/** The folder `@/` points at (tsconfig's `@/*`: the root or src/), where
 *  content/ goes; and the App Router folder, where page.tsx is. */
export function projectDirs(cwd) {
  let base = null
  try {
    const ts = fs.readFileSync(path.join(cwd, "tsconfig.json"), "utf8")
    const target = JSON.parse(ts)?.compilerOptions?.paths?.["@/*"]?.[0]
    if (target) base = path.join(cwd, target.replace(/\*$/, ""))
  } catch {
    /* a tsconfig with comments, or none: guess from the folders below */
  }
  const src = fs.existsSync(path.join(cwd, "src", "app"))
  base ??= src ? path.join(cwd, "src") : cwd
  const app = [path.join(cwd, "app"), path.join(cwd, "src", "app")].find((d) => fs.existsSync(d)) ?? null
  return { base, app }
}
