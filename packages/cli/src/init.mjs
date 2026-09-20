/**
 * `patina init` — put the pack into a project.
 *
 * Four things, in this order:
 *   1. DESIGN.md at the project root (the spec the coding agent reads),
 *   2. the Y2K theme + components, pulled from the registry by shadcn,
 *   3. .claude/skills/ + the /check-y2k scanner,
 *   4. the font note — Lucida Grande is not ours to ship.
 *
 * Nothing is overwritten without --force, and every step can be skipped, so a
 * re-run on a project that already has the pack is safe.
 */

import fs from "node:fs"
import path from "node:path"
import readline from "node:readline/promises"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))

/** The registry items installed by default, in dependency order (theme first). */
const ITEMS = [
  "theme", "button", "window", "sidebar", "group",
  "progress", "tabs", "toast", "marquee", "visitor-counter",
]

/**
 * Where the shipped copies live. In a published package they sit in assets/
 * (written by scripts/sync-assets.mjs at pack time); running from a checkout
 * of the monorepo they are the repo's own files, so dev needs no build step.
 */
function assetRoot() {
  const packed = path.join(HERE, "..", "assets")
  if (fs.existsSync(path.join(packed, "DESIGN.md"))) return packed
  const repo = path.join(HERE, "..", "..", "..")
  if (fs.existsSync(path.join(repo, "DESIGN.md"))) return repo
  throw new Error("cannot find the pack's files (no assets/ and no DESIGN.md above the package).")
}

/** Files copied verbatim: [source relative to assetRoot, target relative to cwd]. */
const COPIES = [
  ["DESIGN.md", "DESIGN.md"],
  ["scripts/check-y2k.mjs", "scripts/check-y2k.mjs"],
  [".claude/skills/check-y2k/SKILL.md", ".claude/skills/check-y2k/SKILL.md"],
  [".claude/skills/y2k-ify/SKILL.md", ".claude/skills/y2k-ify/SKILL.md"],
]

const tick = (s) => `  ✓ ${s}`
const skip = (s) => `  · ${s}`

async function confirm(question, { yes }) {
  if (yes) return true
  if (!process.stdin.isTTY) return true
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const answer = (await rl.question(`${question} [Y/n] `)).trim().toLowerCase()
  rl.close()
  return answer === "" || answer === "y" || answer === "yes"
}

/** Every y2k.css under the project (shallow: root, styles/, src/…, app/). */
function findThemes(cwd, depth = 4) {
  const found = []
  const stack = [[cwd, 0]]
  while (stack.length) {
    const [dir, level] = stack.pop()
    let entries
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const e of entries) {
      if (e.isFile() && e.name === "y2k.css") found.push(path.join(dir, e.name))
      if (e.isDirectory() && level < depth && !e.name.startsWith(".") && e.name !== "node_modules") {
        stack.push([path.join(dir, e.name), level + 1])
      }
    }
  }
  return found
}

/**
 * Make the theme's `@import` resolve, and drop one that no longer does.
 *
 * shadcn writes the theme file at a project-relative target but adds the
 * `@import` to the Tailwind entry, where the path is resolved relative to THAT
 * file — so the two only agree when the file lands next to the entry. The
 * registry aims for that, but a project with its own aliases (or an install
 * from an older version of the pack) ends up with an import that points
 * nowhere and a build that fails on it. Only the installer can see both
 * paths, so it repairs the line here.
 */
function fixThemeImport(cwd, { dryRun }) {
  const cfgPath = path.join(cwd, "components.json")
  if (!fs.existsSync(cfgPath)) return
  let cssRel
  try {
    cssRel = JSON.parse(fs.readFileSync(cfgPath, "utf8"))?.tailwind?.css
  } catch {
    return
  }
  if (!cssRel) return

  const cssPath = path.join(cwd, cssRel)
  if (!fs.existsSync(cssPath)) return
  const themes = findThemes(cwd)
  if (!themes.length) return

  // The copy beside the entry wins; otherwise the shallowest one.
  const beside = themes.find((t) => path.dirname(t) === path.dirname(cssPath))
  const theme = beside ?? themes.sort((a, b) => a.split(path.sep).length - b.split(path.sep).length)[0]

  let want = path.relative(path.dirname(cssPath), theme).split(path.sep).join("/")
  if (!want.startsWith(".")) want = `./${want}`

  const css = fs.readFileSync(cssPath, "utf8")
  const lines = css.split("\n")
  const kept = []
  let have = false
  let dropped = 0
  for (const line of lines) {
    const m = line.match(/^[ \t]*@import\s+["']([^"']*y2k\.css)["'];?[ \t]*$/)
    if (!m) {
      kept.push(line)
      continue
    }
    if (m[1] === want) {
      have = true
      kept.push(line)
      continue
    }
    // An import of a y2k.css that is not there any more: drop it.
    if (!fs.existsSync(path.resolve(path.dirname(cssPath), m[1]))) {
      dropped++
      continue
    }
    kept.push(line)
  }

  let next = kept.join("\n")
  if (!have) {
    const lastImport = [...next.matchAll(/^[ \t]*@import[^\n]*$/gm)].pop()
    next = lastImport
      ? next.slice(0, lastImport.index + lastImport[0].length) + `\n@import "${want}";` + next.slice(lastImport.index + lastImport[0].length)
      : `@import "${want}";\n${next}`
  }

  if (next === css) return
  if (!dryRun) fs.writeFileSync(cssPath, next)
  const what = [have ? null : `theme import → ${want}`, dropped ? `${dropped} stale import dropped` : null].filter(Boolean)
  console.log(tick(`${cssRel} — ${what.join(", ")}`))
}

export async function init({ cwd, registry, components, force, dryRun, yes }) {
  const src = assetRoot()

  if (!fs.existsSync(path.join(cwd, "package.json"))) {
    console.error("patina: no package.json here. Run this inside the project you want to restyle.")
    return 1
  }

  console.log(`\npatina init${dryRun ? " (dry run)" : ""}\n`)

  /* 1 + 3 — the files. */
  let written = 0
  let blocked = 0
  for (const [from, to] of COPIES) {
    const source = path.join(src, from)
    if (!fs.existsSync(source)) {
      console.log(skip(`${to} — not in this build of the pack yet`))
      continue
    }
    const target = path.join(cwd, to)
    if (fs.existsSync(target) && !force) {
      console.log(skip(`${to} already exists — kept (use --force to overwrite)`))
      blocked++
      continue
    }
    if (!dryRun) {
      fs.mkdirSync(path.dirname(target), { recursive: true })
      fs.copyFileSync(source, target)
    }
    console.log(tick(to))
    written++
  }

  /* 2 — the components, via shadcn. */
  if (components) {
    const base = registry.replace(/\/+$/, "")
    const urls = ITEMS.map((n) => `${base}/${n}.json`)
    console.log(`\n  components from ${base}`)
    const go = dryRun ? false : await confirm(`  run: npx shadcn@latest add ${ITEMS.length} items?`, { yes })
    if (!go) {
      console.log(skip("components skipped — run this when you are ready:"))
      console.log(`    npx shadcn@latest add ${urls.join(" ")}`)
    } else {
      // shadcn cannot add anything without a components.json, and it asks for
      // one interactively — which stalls in a non-interactive shell. Create it
      // first with shadcn's own defaults when the project has none.
      let bootstrapped = false
      if (!fs.existsSync(path.join(cwd, "components.json"))) {
        console.log("  no components.json — running shadcn init first")
        const boot = spawnSync("npx", ["shadcn@latest", "init", "-d", "-y"], { cwd, stdio: "inherit", shell: false })
        if (boot.status !== 0) {
          console.log(skip("shadcn init failed — add the components yourself once it is set up:"))
          console.log(`    npx shadcn@latest add ${urls.join(" ")}`)
          return 1
        }
        bootstrapped = true
      }

      // Pass our own flags through: shadcn asks before replacing a theme or a
      // component, and an unanswered prompt in a non-interactive shell just
      // stalls the install.
      // `bootstrapped` means shadcn's own init just wrote its stub components
      // seconds ago — replacing those is not clobbering the user's work, so it
      // does not need --force.
      const flags = [...(yes ? ["--yes"] : []), ...(force || bootstrapped ? ["--overwrite"] : [])]
      const res = spawnSync("npx", ["shadcn@latest", "add", ...flags, ...urls], { cwd, stdio: "inherit", shell: false })
      if (res.status !== 0) {
        console.log(skip(`shadcn exited ${res.status ?? "with an error"} — the files above are still in place.`))
        console.log(`    retry: npx shadcn@latest add ${urls.join(" ")}`)
      } else {
        fixThemeImport(cwd, { dryRun })
      }
    }
  } else {
    console.log(skip("components skipped (--no-components)"))
  }

  /* 4 — what the installer cannot do for you. */
  console.log(`
  Fonts: Lucida Grande is Apple's and is not ours to ship. The pack asks for it
  first and falls back to Lato, which IS open source — add it in your app:
    @import url("https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap");

  Next:
    node scripts/check-y2k.mjs .     # or: npx @patina/cli init --help
    Ask your coding agent to build a page — it reads DESIGN.md.
`)

  if (blocked && !force) console.log(`  ${blocked} file(s) kept as they were. Re-run with --force to replace them.\n`)
  return written || dryRun ? 0 : 1
}
