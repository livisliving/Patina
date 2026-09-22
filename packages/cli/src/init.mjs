/**
 * `patina init` — put the pack into a project.
 *
 * Five things, in this order:
 *   1. DESIGN.md at the project root (the spec the coding agent reads),
 *   2. the Y2K theme + components, pulled from the registry by shadcn,
 *   3. .claude/skills/ + the /check-y2k scanner,
 *   4. a pointer in CLAUDE.md, so the agent reads DESIGN.md before it builds,
 *   5. the font note — Lucida Grande is not ours to ship.
 *
 * Nothing is overwritten without --force — a project's own button.tsx
 * included, so a project that already has shadcn's components stops and asks
 * for it — and every step can be skipped, so a re-run on a project that
 * already has the pack is safe.
 */

import fs from "node:fs"
import path from "node:path"
import readline from "node:readline/promises"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))

/** The registry items installed by default, in dependency order (theme
 *  first), and the file each one writes under the project's ui folder — what
 *  the install is checked against afterwards. */
const COMPONENTS = {
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
}
const ITEMS = ["theme", ...Object.keys(COMPONENTS)]

/** The note left in CLAUDE.md (and an AGENTS.md, when there is one), so the
 *  coding agent knows the pack is here without being told each time. */
const AGENT_NOTE = `<!-- BEGIN:patina -->
# Patina — the Y2K taste pack

This project's UI follows \`DESIGN.md\`: Mac OS X 10.0 Aqua in a millennium
tone. Before building or restyling any UI, read \`DESIGN.md\` and use the
pack's components (Button, WindowFrame, WindowGroup, Table, TextField and the
rest, installed by shadcn). To restyle an existing page, use the \`/y2k-ify\`
skill. Finish every UI change with \`/check-y2k\`
(\`node scripts/check-y2k.mjs <paths>\`).
<!-- END:patina -->`

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
const stop = (s) => `  ✗ ${s}`

/** The environment for a child npx: npm leaks the flags of the npx that ran
 *  us into it as npm_config_*, and `--package=` would make the child resolve
 *  our package instead of shadcn. */
function childEnv() {
  const env = { ...process.env }
  delete env.npm_config_package
  return env
}

/** Where shadcn puts the components: components.json's `ui` alias, resolved
 *  against the root and src/ (the two layouts create-next-app makes). */
function uiDir(cwd) {
  let alias = "@/components/ui"
  try {
    alias = JSON.parse(fs.readFileSync(path.join(cwd, "components.json"), "utf8"))?.aliases?.ui ?? alias
  } catch {
    /* no components.json yet: shadcn init will write the default */
  }
  const rel = alias.replace(/^@\//, "")
  const candidates = [path.join(cwd, rel), path.join(cwd, "src", rel)]
  return candidates.find((d) => fs.existsSync(d)) ?? (fs.existsSync(path.join(cwd, "src")) ? candidates[1] : candidates[0])
}

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
      // first when the project has none: the Radix base (the pack's parts are
      // Radix; shadcn's default is Base UI, for which it rewrites `asChild`
      // into a `render` prop Radix does not have) with its Nova preset.
      let bootstrapped = false
      if (!fs.existsSync(path.join(cwd, "components.json"))) {
        console.log("  no components.json — running shadcn init first (Radix base)")
        const boot = spawnSync("npx", ["shadcn@latest", "init", "-y", "--base", "radix", "--preset", "nova", "--no-monorepo"], { cwd, stdio: "inherit", shell: false, env: childEnv() })
        if (boot.status !== 0) {
          console.log(skip("shadcn init failed — add the components yourself once it is set up:"))
          console.log(`    npx shadcn@latest add ${urls.join(" ")}`)
          return 1
        }
        bootstrapped = true
      }

      // The project's own components in the pack's way (a shadcn button.tsx,
      // say) are the user's work: without --force, stop and say so rather
      // than let shadcn's overwrite prompt quietly answer itself "no" and
      // leave half a pack behind. `bootstrapped` means shadcn's own init
      // wrote its stubs seconds ago — replacing those clobbers nothing.
      const dir = uiDir(cwd)
      const taken = Object.values(COMPONENTS).filter((f) => fs.existsSync(path.join(dir, f)))
      let overwrite = force || bootstrapped
      if (taken.length && !overwrite) {
        console.log(`  ${taken.length} of the pack's files already exist in ${path.relative(cwd, dir)}/: ${taken.join(", ")}`)
        overwrite = await confirm("  replace them with the pack's?", { yes: false })
        if (!overwrite) {
          console.log(stop("components not installed — re-run with --force to replace them, or move yours aside first."))
          return 1
        }
      }
      // Pass our own flags through: shadcn asks before replacing a theme or a
      // component, and an unanswered prompt in a non-interactive shell just
      // stalls the install.
      const flags = [...(yes ? ["--yes"] : []), ...(overwrite ? ["--overwrite"] : [])]
      const started = Date.now()
      const res = spawnSync("npx", ["shadcn@latest", "add", ...flags, ...urls], { cwd, stdio: "inherit", shell: false, env: childEnv() })
      // Then check the files are really there, and really new: shadcn's exit
      // code says nothing about a prompt it answered for itself.
      const missing = Object.entries(COMPONENTS)
        .filter(([, f]) => {
          const at = path.join(uiDir(cwd), f)
          return !fs.existsSync(at) || fs.statSync(at).mtimeMs < started - 1000
        })
        .map(([item]) => item)
      if (res.status !== 0 || missing.length) {
        const why = res.status !== 0 ? `shadcn exited ${res.status ?? "with an error"}` : `shadcn left ${missing.join(", ")} as they were`
        console.log(stop(`${why} — the files above are still in place.`))
        console.log(`    retry: npx shadcn@latest add --overwrite ${urls.join(" ")}`)
        return 1
      }
      fixThemeImport(cwd, { dryRun })
    }
  } else {
    console.log(skip("components skipped (--no-components)"))
  }

  /* 4 — the pointer for the coding agent. */
  for (const name of ["CLAUDE.md", "AGENTS.md"]) {
    const target = path.join(cwd, name)
    const exists = fs.existsSync(target)
    if (name === "AGENTS.md" && !exists) continue
    const have = exists ? fs.readFileSync(target, "utf8") : ""
    if (have.includes("<!-- BEGIN:patina -->")) {
      console.log(skip(`${name} already points at DESIGN.md`))
      continue
    }
    if (!dryRun) fs.writeFileSync(target, have ? `${have.trimEnd()}\n\n${AGENT_NOTE}\n` : `${AGENT_NOTE}\n`)
    console.log(tick(`${name} — ${exists ? "a note added" : "written"}: read DESIGN.md before building UI`))
    written++
  }

  /* 5 — what the installer cannot do for you. */
  console.log(`
  Fonts: Lucida Grande is Apple's and is not ours to ship. The pack asks for it
  first and falls back to Lato, which IS open source — add it in your app:
    @import url("https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap");

  Next:
    node scripts/check-y2k.mjs .     # or: npx @patina/cli init --help
    Ask your coding agent to build a page — it reads DESIGN.md.
    Pages that used shadcn's Button variants (outline, ghost, lg…) will not
    type-check until /y2k-ify has been over them: the pack's Button has its
    own (white, tone, isDefault, sm, icon).
`)

  if (blocked && !force) console.log(`  ${blocked} file(s) kept as they were. Re-run with --force to replace them.\n`)
  return written || dryRun ? 0 : 1
}
