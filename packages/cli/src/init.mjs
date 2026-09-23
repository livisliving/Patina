/**
 * `patina init` — put the pack into a project.
 *
 * First the tone: the user picks one of the five (or passes --tone); nothing
 * is written until they have. Then five things, in this order:
 *   1. DESIGN.md at the project root (the spec the coding agent reads),
 *   2. the Y2K theme + components, pulled from the registry by shadcn,
 *   3. .claude/skills/ + the /check-y2k scanner,
 *   4. a pointer in CLAUDE.md, so the agent reads DESIGN.md before it builds,
 *      and `data-tone` on the project's <html>,
 *   5. the font note — Lucida Grande is not ours to ship.
 * With --desktop, step 2 also installs the Content model and the desktop that
 * renders it (the `content`, `desktop` and `ipod` items), and then an example
 * content/site.ts and — only over create-next-app's own — app/page.tsx.
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
  "menu-bar": "menu-bar.tsx",
  dock: "dock.tsx",
  wallpaper: "wallpaper.tsx",
  icons: "icons.tsx",
}
const ITEMS = ["theme", ...Object.keys(COMPONENTS)]

/** `--desktop`: the Content model and the OS layer that renders it, and the
 *  file each item writes — [components.json alias, path under it]. */
const DESKTOP = {
  content: ["lib", "content.ts"],
  desktop: ["components", "desktop/desktop.tsx"],
  ipod: ["components", "desktop/ipod/ipod.tsx"],
}

/** The five tones, as the demo's Tone Preferences describes them. */
const TONES = [
  ["pink", "Y2K pink", "2001–06, McBling: Juicy Couture velour, the pink Razr, rhinestones"],
  ["aqua", "Aqua", "1998–01: the Bondi Blue iMac, Mac OS X's water-and-gel blue"],
  ["lime", "Lime", "1999–02: iMac Lime, Nickelodeon slime, Matrix terminals"],
  ["tangerine", "Tangerine", "1999–03: iMac Tangerine, Fanta, orange translucent plastic"],
  ["grape", "Grape", "2000–04: iMac Grape, MSN Messenger purple, Lisa Frank"],
]
const TONE_LIST = TONES.map(([id, label, era], i) => `    ${i + 1}. ${label.padEnd(10)} --tone ${id.padEnd(10)} ${era}`).join("\n")

/** A tone from what someone typed: its number, id or label. */
function toTone(input) {
  const v = String(input ?? "").trim().toLowerCase()
  const byNumber = /^[1-5]$/.test(v) ? TONES[Number(v) - 1] : null
  return (byNumber ?? TONES.find(([id, label]) => v === id || v === label.toLowerCase()))?.[0] ?? null
}

/** The note left in CLAUDE.md (and an AGENTS.md, when there is one), so the
 *  coding agent knows the pack and the tone without being told each time. */
const agentNote = (tone, desktop) => `<!-- BEGIN:patina -->
# Patina — the Y2K taste pack

This project's UI follows \`DESIGN.md\`: Mac OS X 10.0 Aqua in a millennium
tone. The tone is **${tone}** (\`data-tone="${tone}"\` on \`<html>\`); keep it
unless the user asks for another. Before building or restyling any UI, read
\`DESIGN.md\` and use the pack's components (Button, WindowFrame, WindowGroup,
Table, TextField and the rest, installed by shadcn). To restyle an existing
page, use the \`/y2k-ify\` skill. Finish every UI change with \`/check-y2k\`
(\`node scripts/check-y2k.mjs <paths>\`).${desktop ? `
The site's content lives in \`content/*.ts\`, in the Content model
(\`@/lib/content\`); the \`desktop\` item (\`components/desktop/\`) renders it.
Change the words there, not in the windows (DESIGN.md › Content).` : ""}
<!-- END:patina -->`
const NOTE_BLOCK = /<!-- BEGIN:patina -->[\s\S]*?<!-- END:patina -->/

/**
 * Which tone the project gets. `--tone` answers it; a person at a terminal is
 * shown the five and asked; anything else (a script, an agent, `--yes`) is
 * stopped before a file is written, with the list, so whoever is running it
 * asks the user instead of taking pink by default.
 */
async function chooseTone({ tone, yes, dryRun }) {
  if (tone !== undefined) {
    const picked = toTone(tone)
    if (!picked) console.error(`patina: "${tone}" is not a tone. The five are:\n${TONE_LIST}\n`)
    return picked
  }
  if (yes || !process.stdin.isTTY) {
    if (dryRun) return "pink"
    console.error(`patina: which tone? The five are:\n${TONE_LIST}\n
  Run again with --tone <name>. If you are an agent running this for someone,
  show them the list and ask which one they want.\n`)
    return null
  }
  console.log(`  Which tone? Every gel control, the selection and the wallpaper take it.\n${TONE_LIST}\n`)
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    for (;;) {
      const picked = toTone(await rl.question("  Tone [1-5]: "))
      if (picked) return picked
      console.log("  Type a number from 1 to 5, or a tone's name.")
    }
  } finally {
    rl.close()
  }
}

/** Every file that can hold the page's <html>: the App Router layout, the
 *  Pages Router document, a Vite index.html. */
const HTML_FILES = ["app", "src/app"]
  .flatMap((d) => ["tsx", "jsx", "js", "ts"].map((x) => `${d}/layout.${x}`))
  .concat(["pages", "src/pages"].flatMap((d) => ["tsx", "jsx", "js"].map((x) => `${d}/_document.${x}`)), ["index.html"])

/** Put `data-tone` on the project's <html>, or say where it goes. */
function applyTone(cwd, tone, { dryRun }) {
  for (const rel of HTML_FILES) {
    const file = path.join(cwd, rel)
    if (!fs.existsSync(file)) continue
    const src = fs.readFileSync(file, "utf8")
    const tag = src.match(/<html\b[^>]*>/)
    if (!tag) continue
    const want = `data-tone="${tone}"`
    const next = /\sdata-tone=/.test(tag[0])
      ? tag[0].replace(/data-tone=(?:"[^"]*"|'[^']*'|\{[^}]*\})/, want)
      : tag[0].replace(/^<html\b/, `<html ${want}`)
    if (next === tag[0]) {
      console.log(skip(`${rel} already has ${want}`))
      return
    }
    if (!dryRun) fs.writeFileSync(file, src.replace(tag[0], next))
    console.log(tick(`${rel} — ${want} on <html>`))
    return
  }
  console.log(skip(`no <html> found — add data-tone="${tone}" to yours`))
}

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

/** Where shadcn puts an alias's files (`ui`, `lib`, `components`):
 *  components.json's alias, resolved against the root and src/ (the two
 *  layouts create-next-app makes). */
function aliasDir(cwd, key = "ui") {
  const fallback = { ui: "@/components/ui", lib: "@/lib", components: "@/components" }[key]
  let alias = fallback
  try {
    alias = JSON.parse(fs.readFileSync(path.join(cwd, "components.json"), "utf8"))?.aliases?.[key] ?? alias
  } catch {
    /* no components.json yet: shadcn init will write the default */
  }
  const rel = alias.replace(/^@\//, "")
  const candidates = [path.join(cwd, rel), path.join(cwd, "src", rel)]
  return candidates.find((d) => fs.existsSync(d)) ?? (fs.existsSync(path.join(cwd, "src")) ? candidates[1] : candidates[0])
}
const uiDir = (cwd) => aliasDir(cwd, "ui")

/** The `--desktop` items' files that are not there: item names. A file may
 *  land under the alias or at the root / src/ path shadcn chose for a target,
 *  so any of them counts. */
function missingDesktop(cwd) {
  return Object.entries(DESKTOP)
    .filter(([, [key, file]]) => ![aliasDir(cwd, key), path.join(cwd, key), path.join(cwd, "src", key)].some((d) => fs.existsSync(path.join(d, file))))
    .map(([item]) => item)
}

/** The folder `@/` points at (tsconfig's `@/*`: the root or src/), where
 *  content/ goes; and the App Router folder, where page.tsx is. */
function projectDirs(cwd) {
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

/** create-next-app's own page, untouched: its only import is next/image and
 *  it still carries the template's links. Anything else is the user's. */
function isStarterPage(src) {
  const imports = src.match(/^import\b.*$/gm) ?? []
  return (
    imports.every((l) => /from\s+["']next\/image["']/.test(l)) &&
    /utm_source=create-next-app/.test(src) &&
    /\/next\.svg/.test(src)
  )
}

/**
 * The desktop's two project files. content/site.ts is written only when it
 * is not there; the page only over create-next-app's own starter — a page
 * the user has written is theirs, so they get the lines to add instead.
 * --force changes neither: both are the user's content, not the pack's.
 */
function scaffoldDesktop(cwd, { dryRun }) {
  const templates = path.join(HERE, "templates")
  const { base, app } = projectDirs(cwd)
  const rel = (p) => path.relative(cwd, p).split(path.sep).join("/")

  const site = path.join(base, "content", "site.ts")
  if (fs.existsSync(site)) {
    console.log(skip(`${rel(site)} already exists — kept`))
  } else {
    if (!dryRun) {
      fs.mkdirSync(path.dirname(site), { recursive: true })
      fs.copyFileSync(path.join(templates, "site.ts"), site)
    }
    console.log(tick(`${rel(site)} — an example SITE to replace with yours`))
  }

  const pageSrc = fs.readFileSync(path.join(templates, "page.tsx"), "utf8")
  const page = app && ["tsx", "jsx", "js"].map((x) => path.join(app, `page.${x}`)).find((p) => fs.existsSync(p))
  const current = page ? fs.readFileSync(page, "utf8") : null
  if (current === pageSrc) {
    console.log(skip(`${rel(page)} already renders the desktop`))
  } else if (app && (!page || isStarterPage(current))) {
    const target = page ?? path.join(app, "page.tsx")
    if (!dryRun) fs.writeFileSync(target, pageSrc)
    console.log(tick(`${rel(target)} — ${page ? "create-next-app's starter replaced by" : "written:"} the desktop`))
  } else {
    console.log(skip(`${page ? `${rel(page)} is your own page — kept` : "no app/ folder"}. To show the desktop, render it:`))
    console.log(pageSrc.split("\n").filter((l) => l.startsWith("import")).map((l) => `      ${l}`).join("\n"))
    console.log(`      <Desktop site={SITE} volume="Your Name HD" ipod={IPod} />`)
  }
}

/** Ask at a terminal; `--yes` answers yes, and a script (no TTY) gets the
 *  fallback — yes for "go ahead?", no for "replace your files?". */
async function confirm(question, { yes, fallback = true }) {
  if (yes) return true
  if (!process.stdin.isTTY) return fallback
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const answer = (await rl.question(`${question} ${fallback ? "[Y/n]" : "[y/N]"} `)).trim().toLowerCase()
  rl.close()
  return fallback ? answer === "" || answer === "y" || answer === "yes" : answer === "y" || answer === "yes"
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
function fixThemeImport(cwd, themes, { dryRun }) {
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

export async function init({ cwd, registry, components, desktop, force, dryRun, yes, tone: toneArg }) {
  const src = assetRoot()

  if (!fs.existsSync(path.join(cwd, "package.json"))) {
    console.error("patina: no package.json here. Run this inside the project you want to restyle.")
    return 1
  }

  console.log(`\npatina init${dryRun ? " (dry run)" : ""}\n`)

  const tone = await chooseTone({ tone: toneArg, yes, dryRun })
  if (!tone) return 2
  console.log(tick(`tone: ${TONES.find(([id]) => id === tone)[1]}${toneArg === undefined && dryRun ? " (a real run asks first)" : ""}\n`))

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
  let desktopReady = false
  if (components) {
    const base = registry.replace(/\/+$/, "")
    const items = [...ITEMS, ...(desktop ? Object.keys(DESKTOP) : [])]
    const urls = items.map((n) => `${base}/${n}.json`)
    console.log(`\n  components from ${base}`)
    const go = dryRun ? false : await confirm(`  run: npx shadcn@latest add ${items.length} items?`, { yes })
    if (!go) {
      console.log(skip(`components ${dryRun ? "not installed (dry run)" : "skipped"} — run this when you are ready:`))
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
      const taken = [
        ...findThemes(cwd).map((t) => path.relative(cwd, t)),
        ...Object.values(COMPONENTS).filter((f) => fs.existsSync(path.join(dir, f))).map((f) => path.relative(cwd, path.join(dir, f))),
        ...(desktop
          ? Object.entries(DESKTOP)
              .filter(([item]) => !missingDesktop(cwd).includes(item))
              .map(([, [key, file]]) => path.relative(cwd, path.join(aliasDir(cwd, key), file)))
          : []),
      ]
      let overwrite = force || bootstrapped
      if (taken.length && !overwrite) {
        console.log(`  ${taken.length} of the pack's files already exist: ${taken.join(", ")}`)
        // Only a person at a terminal can say yes here; --yes and a script cannot.
        overwrite = !yes && (await confirm("  replace them with the pack's?", { yes: false, fallback: false }))
        if (!overwrite) {
          console.log(stop("components not installed — re-run with --force to replace them, or move yours aside first."))
          return 1
        }
      }
      // Pass our own flags through: shadcn asks before replacing a theme or a
      // component, and an unanswered prompt in a non-interactive shell just
      // stalls the install.
      const flags = [...(yes ? ["--yes"] : []), ...(overwrite ? ["--overwrite"] : [])]
      const res = spawnSync("npx", ["shadcn@latest", "add", ...flags, ...urls], { cwd, stdio: "inherit", shell: false, env: childEnv() })
      // Then check every file is really there, where shadcn put them (it may
      // have made the folder): its exit code says nothing about a prompt it
      // answered for itself.
      const installedTo = uiDir(cwd)
      const missing = Object.entries(COMPONENTS)
        .filter(([, f]) => !fs.existsSync(path.join(installedTo, f)))
        .map(([item]) => item)
      if (desktop) missing.push(...missingDesktop(cwd))
      const themes = findThemes(cwd)
      if (!themes.length) missing.unshift("theme")
      if (res.status !== 0 || missing.length) {
        const why = res.status !== 0 ? `shadcn exited ${res.status ?? "with an error"}` : `shadcn did not write ${missing.join(", ")}`
        console.log(stop(`${why} — the files above are still in place.`))
        console.log(`    retry: npx shadcn@latest add --overwrite ${urls.join(" ")}`)
        return 1
      }
      fixThemeImport(cwd, themes, { dryRun })
      desktopReady = desktop
    }
  } else {
    console.log(skip("components skipped (--no-components)"))
  }

  /* 2b — the desktop's content and page, once its items are in. A dry run
     shows what a real one would write. */
  if (desktop) {
    console.log("")
    if (desktopReady || (dryRun && components)) scaffoldDesktop(cwd, { dryRun })
    else console.log(skip("content/site.ts and the page not written — they need the content, desktop and ipod items first"))
  }

  /* 4 — the tone on <html>, and the pointer for the coding agent. */
  applyTone(cwd, tone, { dryRun })
  const note = agentNote(tone, desktop || fs.existsSync(path.join(projectDirs(cwd).base, "content", "site.ts")))
  for (const name of ["CLAUDE.md", "AGENTS.md"]) {
    const target = path.join(cwd, name)
    const exists = fs.existsSync(target)
    if (name === "AGENTS.md" && !exists) continue
    const have = exists ? fs.readFileSync(target, "utf8") : ""
    // A re-run with another tone rewrites the note in place.
    const next = NOTE_BLOCK.test(have) ? have.replace(NOTE_BLOCK, note) : have ? `${have.trimEnd()}\n\n${note}\n` : `${note}\n`
    if (next === have) {
      console.log(skip(`${name} already points at DESIGN.md`))
      continue
    }
    if (!dryRun) fs.writeFileSync(target, next)
    console.log(tick(`${name} — ${!exists ? "written" : NOTE_BLOCK.test(have) ? "note updated" : "a note added"}: read DESIGN.md, tone ${tone}`))
    written++
  }

  /* 5 — what the installer cannot do for you. */
  console.log(`
  Fonts: Lucida Grande is Apple's and is not ours to ship. The pack asks for it
  first and falls back to Lato, which IS open source — add it in your app:
    @import url("https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap");

  Next:
    node scripts/check-y2k.mjs .     # or: npx @pat1na/cli init --help
    Ask your coding agent to build a page — it reads DESIGN.md.
    Existing pages still build: the pack's Button accepts shadcn's variant
    and size names. /y2k-ify is what turns them into Aqua.${desktop ? `
    The desktop draws content/site.ts: ask your agent to /y2k-ify your site
    into it — it sorts every page and block by DESIGN.md › Content.` : ""}
`)

  if (blocked && !force) console.log(`  ${blocked} file(s) kept as they were. Re-run with --force to replace them.\n`)
  return written || dryRun ? 0 : 1
}
