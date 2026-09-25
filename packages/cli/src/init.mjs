/**
 * `patina init` — put the pack into a project.
 *
 * First the brief: what the site is and what it should become (brief.mjs).
 * A person at a terminal answers in the Setup Assistant page, which init
 * serves locally (setup-server.mjs) — or at the terminal with --terminal;
 * a script or an agent answers with flags (--yes), and whatever they leave
 * out is written down as unanswered for /y2k-ify to ask. Nothing is written
 * until the answers are in. Then five things, in this order:
 *   1. DESIGN.md at the project root (the spec the coding agent reads),
 *   2. the Y2K theme + components, pulled from the registry by shadcn,
 *   3. .claude/skills/ + the /check-y2k scanner,
 *   4. a pointer in CLAUDE.md, so the agent reads DESIGN.md before it builds,
 *      and `data-tone` on the project's <html>,
 *   5. the font note — Lucida Grande is not ours to ship.
 * When the site becomes a desktop (scope whole or content; --desktop), step 2
 * also installs the Content model and the desktop that renders it (the
 * `content` and `desktop` items, and `ipod` when it is wanted), and then a
 * content/site.ts with the owner's name in it and — only over
 * create-next-app's own — app/page.tsx.
 *
 * Nothing is overwritten without --force — a project's own button.tsx
 * included, so a project that already has shadcn's components stops and asks
 * for it — and every step can be skipped, so a re-run on a project that
 * already has the pack is safe.
 */

import fs from "node:fs"
import path from "node:path"
import readline from "node:readline/promises"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

import { COMPONENTS, COPIES, aliasDir, childEnv, projectDirs, readComponentsJson, skip, stop, tick } from "./project.mjs"
import { MANIFEST, recordInstall } from "./update.mjs"
import { QUESTIONS, TONES, toTone, scanProject, defaultsFrom, briefFromFlags, askInTerminal, makeBrief, writeBrief } from "./brief.mjs"
import { startSetupServer } from "./setup-server.mjs"

const HERE = path.dirname(fileURLToPath(import.meta.url))

/** The desktop items: the Content model and the OS layer that renders it,
 *  and the file each item writes — [components.json alias, path under it].
 *  `ipod` is an extra: installed only when the brief asks for it. */
const DESKTOP = {
  content: ["lib", "content.ts"],
  desktop: ["components", "desktop/desktop.tsx"],
  ipod: ["components", "desktop/ipod/ipod.tsx"],
}

/** The extras that are registry items, and the item each one is. */
const EXTRA_ITEMS = { marquee: "marquee", visitorCounter: "visitor-counter" }

const TONE_LIST = TONES.map(([id, label, era], i) => `    ${i + 1}. ${label.padEnd(10)} --tone ${id.padEnd(10)} ${era}`).join("\n")

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
 * Which tone a flags-only run gets. `--tone` answers it; anything else (a
 * script, an agent, `--yes`) is stopped before a file is written, with the
 * list, so whoever is running it asks the user instead of taking pink by
 * default. A person at a terminal is asked in the assistant, not here.
 */
function toneFromFlag({ tone, dryRun }) {
  if (tone !== undefined) {
    const picked = toTone(tone)
    if (!picked) console.error(`patina: "${tone}" is not a tone. The five are:\n${TONE_LIST}\n`)
    return picked
  }
  if (dryRun) return "pink"
  console.error(`patina: which tone? The five are:\n${TONE_LIST}\n
  Run again with --tone <name>. If you are an agent running this for someone,
  show them the list and ask which one they want.\n`)
  return null
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

const uiDir = (cwd) => aliasDir(cwd, "ui")

/** Whether an item's file is there. A desktop item's file may land under
 *  the alias or at the root / src/ path shadcn chose for a target, so any of
 *  them counts. */
function itemInstalled(cwd, item) {
  if (item === "theme") return findThemes(cwd).length > 0
  if (item in COMPONENTS) return fs.existsSync(path.join(uiDir(cwd), COMPONENTS[item]))
  if (item in DESKTOP) {
    const [key, file] = DESKTOP[item]
    return [aliasDir(cwd, key), path.join(cwd, key), path.join(cwd, "src", key)].some((d) => fs.existsSync(path.join(d, file)))
  }
  return false
}

/** Of these items, the ones whose files are not there. */
const missingOf = (cwd, items) => items.filter((item) => !itemInstalled(cwd, item))

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

/** The example site.ts with the owner's own names in it, where the brief
 *  has them: the placeholders are the template's exact strings. */
function renderSite(src, answers) {
  const q = JSON.stringify
  const name = answers.about?.name || "Your Name"
  const role = answers.about?.role ?? "What you do"
  const description = answers.look?.description || "One sentence the site says about itself."
  return src
    .replace('owner: "Your Name"', `owner: ${q(name)}`)
    .replace('name: "Your Name"', `name: ${q(name)}`)
    .replace('role: "What you do"', `role: ${q(role)}`)
    .replace('description: "One sentence the site says about itself."', `description: ${q(description)}`)
    .replace('copyright: "© 2026 Your Name"', `copyright: ${q(`© ${new Date().getFullYear()} ${name}`)}`)
}

/** The page with the volume's name, and without the iPod when it is not
 *  wanted (its import and its prop both go: the item is not installed). */
function renderPage(src, { volume, ipod }) {
  let out = src.replace('volume="Your Name HD"', `volume=${JSON.stringify(volume || "Your Name HD")}`)
  if (!ipod) out = out.replace(/^import \{ IPod \}[^\n]*\n/m, "").replace(/\s+ipod=\{IPod\}/, "")
  return out
}

/**
 * The desktop's two project files. content/site.ts is written only when it
 * is not there; the page only over create-next-app's own starter — a page
 * the user has written is theirs, so they get the lines to add instead.
 * --force changes neither: both are the user's content, not the pack's.
 */
function scaffoldDesktop(cwd, { dryRun, answers, ipod }) {
  const templates = path.join(HERE, "templates")
  const { base, app } = projectDirs(cwd)
  const rel = (p) => path.relative(cwd, p).split(path.sep).join("/")

  const site = path.join(base, "content", "site.ts")
  if (fs.existsSync(site)) {
    console.log(skip(`${rel(site)} already exists — kept`))
  } else {
    if (!dryRun) {
      fs.mkdirSync(path.dirname(site), { recursive: true })
      fs.writeFileSync(site, renderSite(fs.readFileSync(path.join(templates, "site.ts"), "utf8"), answers))
    }
    console.log(tick(`${rel(site)} — an example SITE${answers.about?.name ? ` in ${answers.about.name}'s name,` : ""} to replace with yours`))
  }

  const pageSrc = renderPage(fs.readFileSync(path.join(templates, "page.tsx"), "utf8"), { volume: answers.look?.volume, ipod })
  const page = app && ["tsx", "jsx", "js"].map((x) => path.join(app, `page.${x}`)).find((p) => fs.existsSync(p))
  const current = page ? fs.readFileSync(page, "utf8") : null
  if (current !== null && /from\s+["']@\/components\/desktop\/desktop["']/.test(current)) {
    console.log(skip(`${rel(page)} already renders the desktop`))
  } else if (app && (!page || isStarterPage(current))) {
    const target = page ?? path.join(app, "page.tsx")
    if (!dryRun) fs.writeFileSync(target, pageSrc)
    console.log(tick(`${rel(target)} — ${page ? "create-next-app's starter replaced by" : "written:"} the desktop`))
  } else {
    console.log(skip(`${page ? `${rel(page)} is your own page — kept` : "no app/ folder"}. To show the desktop, render it:`))
    console.log(pageSrc.split("\n").filter((l) => l.startsWith("import")).map((l) => `      ${l}`).join("\n"))
    console.log(`      ${pageSrc.match(/<Desktop[^>]*\/>/)?.[0] ?? "<Desktop site={SITE} volume=\"Your Name HD\" />"}`)
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
  const cssRel = readComponentsJson(cwd)?.tailwind?.css
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

/** A child process as a promise of its exit code, sharing the terminal.
 *  Not spawnSync: the setup server must keep answering the page's polls
 *  while shadcn runs. */
function run(cmd, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, stdio: "inherit", shell: false, env: childEnv() })
    child.on("error", () => resolve(null))
    child.on("close", (code) => resolve(code))
  })
}

/**
 * The brief: the answers, and who gave them. A person at a terminal gets
 * the Setup Assistant page (or the terminal's questions with --terminal);
 * a script, an agent, --yes and a dry run get flags, and every question
 * they leave out is listed as unanswered. Returns null when it cannot go on
 * (no tone, a bad flag, thirty minutes with no answers).
 */
async function collectBrief({ cwd, registry, yes, dryRun, terminal, browser, tone: toneArg, brief: flags, desktop }, ctx) {
  const project = scanProject(cwd)
  const defaults = defaultsFrom(project)
  const toneFlag = toneArg === undefined ? undefined : toTone(toneArg)
  if (toneFlag) defaults.look = { ...defaults.look, tone: toneFlag }
  const interactive = process.stdin.isTTY && !yes && !dryRun

  if (!interactive) {
    const tone = toneFromFlag({ tone: toneArg, dryRun })
    if (!tone) return null
    const { answers, unanswered, errors } = briefFromFlags({ ...flags, tone, desktop }, project)
    if (errors.length) {
      console.error(`patina: ${errors.join("\n        ")}`)
      return null
    }
    return { brief: makeBrief({ answeredBy: "flags", answers, project, unanswered }), tone }
  }

  if (terminal) {
    const answers = await askInTerminal(QUESTIONS, defaults, project)
    return { brief: makeBrief({ answeredBy: "terminal", answers, project }), tone: answers.look.tone }
  }

  const server = await startSetupServer({ session: { mode: "live", project, questions: QUESTIONS, defaults }, registry, open: browser })
  ctx.server = server
  console.log(`  Answer in the browser${browser ? "" : " (open this)"}: ${server.url}`)
  console.log(`  (or run again with --terminal to answer here)\n`)
  const answers = await server.answers
  if (!answers) {
    console.log(stop("no answers after thirty minutes — nothing installed."))
    writeBrief(cwd, makeBrief({ answeredBy: "setup", answers: {}, project, unanswered: QUESTIONS.map((q) => q.id) }))
    console.log(skip(`${MANIFEST} — the brief, every question unanswered, for /y2k-ify to ask`))
    return null
  }
  return { brief: makeBrief({ answeredBy: "setup", answers, project }), tone: answers.look.tone }
}

export async function init(options) {
  // The page polls /status while the install runs, and is told how it ended.
  const ctx = { server: null, message: null }
  let code
  try {
    code = await install(options, ctx)
  } catch (err) {
    if (ctx.server) {
      ctx.server.setStatus({ phase: "error", message: err.message })
      await ctx.server.finish()
    }
    throw err
  }
  if (ctx.server) {
    if (code === 0) ctx.server.setStatus({ phase: "done", message: "Ask your agent to run /y2k-ify. It reads your answers from patina.json." })
    else ctx.server.setStatus({ phase: "error", message: ctx.message ?? "The install stopped — the terminal says why." })
    await ctx.server.finish()
  }
  return code
}

async function install({ cwd, registry, components, force, dryRun, yes, ...rest }, ctx) {
  const src = assetRoot()

  if (!fs.existsSync(path.join(cwd, "package.json"))) {
    console.error("patina: no package.json here. Run this inside the project you want to restyle.")
    return 1
  }

  console.log(`\npatina init${dryRun ? " (dry run)" : ""}\n`)

  const halt = (s) => {
    ctx.message = s
    console.log(stop(s))
  }

  const collected = await collectBrief({ cwd, registry, yes, dryRun, ...rest }, ctx)
  if (!collected) return 2
  const { brief, tone } = collected
  const { answers } = brief
  const server = ctx.server
  const status = (next) => server?.setStatus(next)

  // What the answers change here: the desktop or not, and which extras.
  // Unanswered extras (a flags run without --extras) keep what init always
  // installed: every component, and the iPod with the desktop.
  const desktop = answers.scope !== "components"
  const extras = answers.extras
  const wantIpod = desktop && (extras ? extras.ipod : true)
  const items = [
    "theme",
    ...Object.keys(COMPONENTS).filter((item) => !extras || !Object.entries(EXTRA_ITEMS).some(([k, i]) => i === item && !extras[k])),
    ...(desktop ? ["content", "desktop", ...(wantIpod ? ["ipod"] : [])] : []),
  ]

  console.log(tick(`tone: ${TONES.find(([id]) => id === tone)[1]}${rest.tone === undefined && dryRun ? " (a real run asks first)" : ""}`))
  console.log(tick(`brief: ${brief.answeredBy === "flags" ? "from flags and the scan" : `answered in the ${brief.answeredBy === "setup" ? "browser" : "terminal"}`}${brief.unanswered.length ? ` — unanswered: ${brief.unanswered.join(", ")} (/y2k-ify asks)` : ""}`))
  if (dryRun) {
    console.log(`  ${MANIFEST} › brief would be:\n${JSON.stringify(brief, null, 2).replace(/^/gm, "    ")}\n`)
  } else {
    writeBrief(cwd, brief)
    console.log(tick(`${MANIFEST} — the brief, for /y2k-ify\n`))
  }
  status({ phase: "installing", done: 0, total: components ? items.length : 0 })

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
    const urls = items.map((n) => `${base}/${n}.json`)
    console.log(`\n  components from ${base}`)
    // The page's Install button was the yes; the terminal is not asked twice.
    const go = dryRun ? false : server ? true : await confirm(`  run: npx shadcn@latest add ${items.length} items?`, { yes })
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
        status({ current: "components.json" })
        const boot = await run("npx", ["shadcn@latest", "init", "-y", "--base", "radix", "--preset", "nova", "--no-monorepo"], cwd)
        if (boot !== 0) {
          halt("shadcn init failed — add the components yourself once it is set up:")
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
        ...items.filter((item) => item in COMPONENTS && fs.existsSync(path.join(dir, COMPONENTS[item]))).map((item) => path.relative(cwd, path.join(dir, COMPONENTS[item]))),
        ...items.filter((item) => item in DESKTOP && itemInstalled(cwd, item)).map((item) => path.relative(cwd, path.join(aliasDir(cwd, DESKTOP[item][0]), DESKTOP[item][1]))),
      ]
      let overwrite = force || bootstrapped
      if (taken.length && !overwrite) {
        console.log(`  ${taken.length} of the pack's files already exist: ${taken.join(", ")}`)
        // Only a person at a terminal can say yes here; --yes and a script cannot.
        status({ message: "Answer the question in the terminal to continue." })
        overwrite = !yes && (await confirm("  replace them with the pack's?", { yes: false, fallback: false }))
        status({ message: undefined })
        if (!overwrite) {
          halt("components not installed — re-run with --force to replace them, or move yours aside first.")
          return 1
        }
      }
      // Pass our own flags through: shadcn asks before replacing a theme or a
      // component, and an unanswered prompt in a non-interactive shell just
      // stalls the install. The page's Install button is a yes too: the
      // person is looking at the browser, not at a prompt here.
      const flags = [...(yes || server ? ["--yes"] : []), ...(overwrite ? ["--overwrite"] : [])]
      // Progress for the page: shadcn adds everything in one call, so the
      // fraction is what it has written so far, read off the disk — never a
      // timer. The item shown is the first one still to come.
      const report = () => {
        const missing = missingOf(cwd, items)
        status({ done: items.length - missing.length, total: items.length, current: missing[0] ?? items.at(-1) })
      }
      const ticker = setInterval(report, 400)
      ticker.unref()
      status({ current: "the registry" })
      const res = await run("npx", ["shadcn@latest", "add", ...flags, ...urls], cwd)
      clearInterval(ticker)
      // Then check every file is really there, where shadcn put them (it may
      // have made the folder): its exit code says nothing about a prompt it
      // answered for itself.
      const missing = missingOf(cwd, items)
      const themes = findThemes(cwd)
      report()
      if (res !== 0 || missing.length) {
        const why = res !== 0 ? `shadcn exited ${res ?? "with an error"}` : `shadcn did not write ${missing.join(", ")}`
        halt(`${why} — the files above are still in place.`)
        console.log(`    retry: npx shadcn@latest add --overwrite ${urls.join(" ")}`)
        return 1
      }
      fixThemeImport(cwd, themes, { dryRun })
      desktopReady = desktop
      // What was installed, and each file as it was written: `update` reads
      // it to know which items are the pack's and which files were changed
      // since. The brief written above stays in the file.
      await recordInstall(cwd, { registry: base, items })
      console.log(tick(`${MANIFEST} — the items and files installed, for \`patina update\``))
    }
  } else {
    console.log(skip("components skipped (--no-components)"))
  }

  /* 2b — the desktop's content and page, once its items are in. A dry run
     shows what a real one would write. */
  if (desktop) {
    console.log("")
    if (desktopReady || (dryRun && components)) scaffoldDesktop(cwd, { dryRun, answers, ipod: wantIpod })
    else console.log(skip("content/site.ts and the page not written — they need the content and desktop items first"))
  }

  /* 4 — the tone on <html>, and the pointer for the coding agent. */
  applyTone(cwd, tone, { dryRun })
  const note = agentNote(tone, desktop || fs.existsSync(path.join(projectDirs(cwd).base, "content", "site.ts")))
  const agents = fs.existsSync(path.join(cwd, "AGENTS.md"))
  for (const name of ["CLAUDE.md", "AGENTS.md"]) {
    const target = path.join(cwd, name)
    const exists = fs.existsSync(target)
    if (name === "AGENTS.md" && !exists) continue
    const have = exists ? fs.readFileSync(target, "utf8") : ""
    // A CLAUDE.md that brings in AGENTS.md (`@AGENTS.md`, as create-next-app
    // writes it) reads the note there; a second copy is only noise. One an
    // earlier run left in it is taken out.
    if (name === "CLAUDE.md" && agents && /^@AGENTS\.md\s*$/m.test(have)) {
      if (!NOTE_BLOCK.test(have)) {
        console.log(skip("CLAUDE.md reads AGENTS.md, which carries the note"))
        continue
      }
      if (!dryRun) fs.writeFileSync(target, `${have.replace(/\n*<!-- BEGIN:patina -->[\s\S]*?<!-- END:patina -->/, "").trimEnd()}\n`)
      console.log(tick("CLAUDE.md — its copy of the note taken out: it reads AGENTS.md, which carries it"))
      written++
      continue
    }
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
    Ask your coding agent to run /y2k-ify — it reads DESIGN.md and your
    answers in ${MANIFEST}${brief.unanswered.length ? `, and asks the ${brief.unanswered.length} question(s) left open` : ""}.
    Existing pages still build: the pack's Button accepts shadcn's variant
    and size names.${desktop ? `
    The desktop draws content/site.ts: /y2k-ify sorts every page and block
    into it by DESIGN.md › Content.` : ""}
`)

  if (blocked && !force) console.log(`  ${blocked} file(s) kept as they were. Re-run with --force to replace them.\n`)
  return written || dryRun ? 0 : 1
}
