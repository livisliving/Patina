/**
 * The brief: what the person installing Patina wants their site to become.
 *
 * `init` asks six questions (plus the tone and a confirmation of the names
 * it detected) in the Setup Assistant page, at the terminal (--terminal) or
 * from flags (--yes, a script, an agent). The answers go into
 * `patina.json › brief`, where the installer reads the tone, the scope and
 * the extras, and `/y2k-ify` reads the rest — the About box's kind, what to
 * feature, which routes keep their pages, where to transcribe from — and
 * asks whatever is in `unanswered` before it starts.
 *
 * This file is the one source of the questions (ids, copy, options): the
 * page renders `QUESTIONS` as served, the terminal prints them, the skill
 * points at them. Change the copy here and nowhere else.
 */

import fs from "node:fs"
import path from "node:path"
import readline from "node:readline/promises"

export const BRIEF_VERSION = 1

/** The five tones, as the demo's Tone Preferences describes them. */
export const TONES = [
  ["pink", "Y2K pink", "2001–06, McBling: Juicy Couture velour, the pink Razr, rhinestones"],
  ["aqua", "Aqua", "1998–01: the Bondi Blue iMac, Mac OS X's water-and-gel blue"],
  ["lime", "Lime", "1999–02: iMac Lime, Nickelodeon slime, Matrix terminals"],
  ["tangerine", "Tangerine", "1999–03: iMac Tangerine, Fanta, orange translucent plastic"],
  ["grape", "Grape", "2000–04: iMac Grape, MSN Messenger purple, Lisa Frank"],
]

/** A tone from what someone typed: its number, id or label. */
export function toTone(input) {
  const v = String(input ?? "").trim().toLowerCase()
  const byNumber = /^[1-5]$/.test(v) ? TONES[Number(v) - 1] : null
  return (byNumber ?? TONES.find(([id, label]) => v === id || v === label.toLowerCase()))?.[0] ?? null
}

/** What an "Other" answer says until the owner says more: the agent,
 *  which has read the site, recommends one of the options instead. */
export const NOT_SURE = "Not sure — recommend one for me."

/** The last option of a question whose list may not fit every site: the
 *  owner's own words, kept in `answers.notes` under the question's id. */
const OTHER = { value: "other", label: "Other", field: { id: "note", label: "In your words", placeholder: "In your words", value: NOT_SURE } }

/** The questions, one pane each, in the order the assistant asks them. */
export const QUESTIONS = [
  {
    id: "about",
    title: "Who is the site about?",
    prompt: "The About box is theirs: their name in the menu bar, their picture, their story.",
    options: [
      { value: "person", label: "One person" },
      { value: "team", label: "A team or studio" },
      { value: "product", label: "A product or company" },
      { value: "event", label: "An event" },
      { value: "show", label: "A show (a podcast or a series)" },
      OTHER,
    ],
    fields: [
      { id: "name", label: "Name", placeholder: "Their name" },
      { id: "role", label: "What they do", placeholder: "One line", optional: true },
    ],
  },
  {
    id: "first",
    title: "What should a visitor do first?",
    prompt: "It decides what is open when the desktop appears, and what sits on it and in the Dock.",
    options: [
      { value: "work", label: "Look at the work" },
      { value: "read", label: "Read" },
      { value: "details", label: "Find the details (hours, dates, a place)" },
      { value: "act", label: "Sign up or buy" },
      { value: "listen", label: "Listen or watch" },
      OTHER,
    ],
    pick: "routes",
  },
  {
    id: "scope",
    title: "How much of the site becomes a desktop?",
    prompt: "Pages people read become windows on one desktop. Pages people use — a sign-up, a basket, a dashboard — can keep their own address.",
    options: [
      { value: "whole", label: "The whole site" },
      { value: "content", label: "Its pages to read; tools keep their pages" },
      { value: "components", label: "None: keep the pages, restyle the components" },
      OTHER,
    ],
    pick: "tools",
  },
  {
    id: "source",
    title: "Where is the real content?",
    prompt: "Your agent copies every word, picture and link from here — never invents them.",
    options: [
      { value: "project", label: "This project" },
      { value: "live", label: "A live site", field: { id: "where", label: "Address", placeholder: "https://…" } },
      { value: "export", label: "An export (Figma Sites, Framer, Webflow)", field: { id: "where", label: "Folder", placeholder: "./export" } },
      { value: "folder", label: "A folder of files", field: { id: "where", label: "Folder", placeholder: "./content" } },
      OTHER,
    ],
  },
  {
    id: "look",
    title: "Choose a tone",
    prompt: "Every gel control, the selection and the wallpaper take it.",
    options: TONES.map(([value, label, era]) => ({ value, label, era })),
    fields: [
      { id: "volume", label: "Volume name", placeholder: "Your Name HD" },
      { id: "description", label: "One line about the site", placeholder: "What the site says about itself", optional: true },
    ],
  },
  {
    id: "extras",
    title: "Anything else?",
    prompt: "Small things from 2001, each optional.",
    multiple: true,
    options: [
      { value: "ipod", label: "An iPod that plays music" },
      { value: "wallpaper", label: "Your own wallpaper", field: { id: "wallpaper", label: "Folder", placeholder: "./public/wallpaper" } },
      { value: "visitor-counter", label: "A visitor counter" },
      { value: "marquee", label: "A scrolling marquee" },
    ],
  },
  {
    id: "oldUrls",
    title: "Your old addresses",
    prompt: "If people have shared your pages, or search engines list them, each old address can open its window on the desktop.",
    options: [
      { value: "redirect", label: "Keep them working (recommended)" },
      { value: "drop", label: "No need" },
    ],
  },
]

/** One more pane, only when an install would find Patina's files already
 *  in the project (an earlier install, or the project's own shadcn
 *  components): replace them, or keep them and add what is missing. Asked
 *  in the page, so the install never waits on the terminal. */
export const replaceQuestion = (files) => ({
  id: "replace",
  title: "Some files are here already",
  prompt: `${files.length === 1 ? "One of the files Patina installs is" : `${files.length} of the files Patina installs are`} already in this project, from an earlier install or your own. Your pages and your content are not touched either way.`,
  options: [
    { value: "replace", label: "Replace them with Patina's (recommended)" },
    { value: "keep", label: "Keep mine; add only what is missing" },
  ],
  files,
})

const byId = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]))
const values = (id) => byId[id].options.map((o) => o.value)

/* ---------------------------------------------------------------- the scan */

const PAGE_EXTS = ["tsx", "jsx", "ts", "js", "mdx"]
const LIST_NAMES = /^(blog|posts|work|archive|docs|episodes|speakers)$/
const ABOUT_NAMES = /^(about|team|hosts|story)$/
const TOOL_NAMES = /^(signup|login|account|cart|checkout|dashboard|settings|admin|app)$/

function readText(file) {
  try {
    return fs.readFileSync(file, "utf8")
  } catch {
    return null
  }
}

/** Every page file under an App Router folder: [route, file]. Route groups
 *  `(marketing)` vanish from the address, parallel `@slots` and private
 *  `_folders` are not pages, and a dynamic segment keeps its brackets. */
function appRoutes(dir) {
  const found = []
  const walk = (folder, segments) => {
    let entries
    try {
      entries = fs.readdirSync(folder, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (e.name.startsWith("_") || e.name.startsWith("@") || e.name === "api" || e.name === "node_modules") continue
        walk(path.join(folder, e.name), /^\(.*\)$/.test(e.name) ? segments : [...segments, e.name])
      } else if (PAGE_EXTS.some((x) => e.name === `page.${x}`)) {
        found.push([`/${segments.join("/")}`, path.join(folder, e.name)])
      }
    }
  }
  walk(dir, [])
  return found
}

/** Every page under a Pages Router folder: [route, file]. `index` is the
 *  folder itself; `_app`, `_document`, `_error` and `api/` are not pages. */
function pagesRoutes(dir) {
  const found = []
  const walk = (folder, segments) => {
    let entries
    try {
      entries = fs.readdirSync(folder, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (e.name === "api" || e.name === "node_modules") continue
        walk(path.join(folder, e.name), [...segments, e.name])
        continue
      }
      const m = e.name.match(/^(.+)\.(tsx|jsx|ts|js|mdx)$/)
      if (!m || m[1].startsWith("_") || m[1].endsWith(".d")) continue
      const parts = m[1] === "index" ? segments : [...segments, m[1]]
      found.push([`/${parts.join("/")}`, path.join(folder, e.name)])
    }
  }
  walk(dir, [])
  return found
}

const isDynamic = (segment) => /^\[.*\]$/.test(segment)
const lastSegment = (route) => route.split("/").filter(Boolean).at(-1) ?? ""

/** What a route is for, from its name and its page: the first yes decides. */
function guessKind(route, src, routes) {
  if (route === "/") return "home"
  const name = lastSegment(route)
  const hasDynamicChild = routes.some((r) => r.startsWith(`${route}/`) && isDynamic(r.slice(route.length + 1).split("/")[0]))
  if (LIST_NAMES.test(name) || (/s$/.test(name) && hasDynamicChild)) return "list"
  if (isDynamic(name)) return "detail"
  if (ABOUT_NAMES.test(name)) return "about"
  if (src && /<form\b/i.test(src)) return "form"
  if (TOOL_NAMES.test(name)) return "tool"
  return "page"
}

/** A string literal's text from `key: "…"` in a metadata object, or from
 *  `title: { default: "…" }`; the regex is enough for create-next-app's
 *  layouts and most others, and a miss is a blank field, not a failure. */
function metaValue(src, key) {
  if (!src) return undefined
  const plain = src.match(new RegExp(`\\b${key}\\s*:\\s*(["'\`])((?:\\\\.|(?!\\1).)*)\\1`))
  if (plain) return plain[2].trim() || undefined
  const nested = src.match(new RegExp(`\\b${key}\\s*:\\s*\\{[^}]*?\\bdefault\\s*:\\s*(["'\`])((?:\\\\.|(?!\\1).)*)\\1`))
  return nested ? nested[2].trim() || undefined : undefined
}

/** The project as the assistant describes it: framework, routes and what
 *  each is for, which carry a form, its title and description. */
export function scanProject(cwd) {
  let pkg = {}
  try {
    pkg = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8"))
  } catch {
    /* no package.json: the folder's name will do */
  }
  const name = pkg.name || path.basename(cwd)
  const nextVersion = (pkg.dependencies?.next ?? pkg.devDependencies?.next ?? "").match(/\d+/)?.[0]

  const appDir = [path.join(cwd, "app"), path.join(cwd, "src", "app")].find((d) => fs.existsSync(d))
  const pagesDir = [path.join(cwd, "pages"), path.join(cwd, "src", "pages")].find((d) => fs.existsSync(d))
  const pairs = appDir ? appRoutes(appDir) : pagesDir ? pagesRoutes(pagesDir) : []
  pairs.sort(([a], [b]) => a.localeCompare(b))

  const framework = nextVersion
    ? `Next.js ${nextVersion} (${appDir ? "app router" : pagesDir ? "pages" : "no pages found"})`
    : appDir || pagesDir
      ? `unknown (${appDir ? "app" : "pages"} folder)`
      : "unknown"

  const sources = new Map(pairs.map(([route, file]) => [route, readText(file)]))
  const paths = pairs.map(([route]) => route)
  const routes = paths.map((route) => ({ path: route, guess: guessKind(route, sources.get(route), paths) }))
  const forms = paths.filter((route) => /<form\b/i.test(sources.get(route) ?? ""))

  // The title and description: the root layout's metadata, else the home
  // page's, else a <title> in an index.html (a Vite project).
  const layout = appDir && PAGE_EXTS.map((x) => path.join(appDir, `layout.${x}`)).find((f) => fs.existsSync(f))
  const heads = [layout && readText(layout), sources.get("/"), readText(path.join(cwd, "index.html"))]
  const title = heads.map((h) => metaValue(h, "title") ?? h?.match(/<title>([^<]*)<\/title>/)?.[1]?.trim()).find(Boolean)
  const description = heads.map((h) => metaValue(h, "description") ?? h?.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/)?.[1]).find(Boolean)

  return { name, framework, ...(title ? { title } : {}), ...(description ? { description } : {}), routes, forms }
}

/* ------------------------------------------------------------- defaults */

/** A title's two halves: "Kestrel — invoicing for trades" is a name and a
 *  role; "The Slow Post" is a name alone. */
function splitTitle(title) {
  const m = (title ?? "").match(/^(.*?)\s+(?:—|–|\||·|-)\s+(.*)$/)
  return m ? [m[1].trim(), m[2].trim()] : [(title ?? "").trim(), ""]
}

const has = (project, re) => project.routes.some((r) => re.test(lastSegment(r.path)))

/** Not a page to read: a form or a tool keeps its address by default. */
export const toolRoutes = (project) => project.routes.filter((r) => r.guess === "form" || r.guess === "tool").map((r) => r.path)

/** What the scan suggests for each question — the page's and the
 *  terminal's prefills, and what a flags-only run takes when it is safe to. */
export function defaultsFrom(project) {
  const [name, role] = splitTitle(project.title)
  const kind = has(project, /^(hosts|episodes)$/) ? "show"
    : has(project, /^(speakers|schedule|cfp|tickets)$/) ? "event"
    : has(project, /^(team|studio)$/) ? "team"
    : has(project, /^(pricing|features|customers|signup)$/) ? "product"
    : "person"
  const goal = has(project, /^(episodes|podcast|watch|listen)$/) ? "listen"
    : has(project, /^(posts|blog|journal|docs|writing|articles|notes)$/) ? "read"
    : has(project, /^(work|projects|portfolio|case-studies)$/) ? "work"
    : has(project, /^(signup|pricing|shop|cart|tickets)$/) ? "act"
    : "details"
  const readable = project.routes.filter((r) => ["list", "about", "page"].includes(r.guess)).map((r) => r.path)
  const tools = toolRoutes(project)
  return {
    about: { kind, name: name || project.name, role: role || project.description || "" },
    first: { goal, featured: readable.slice(0, 3) },
    scope: tools.length ? "content" : "whole",
    keepRoutes: tools,
    source: { kind: "project" },
    look: { volume: `${name || project.name} HD`, description: project.description ?? "" },
    extras: { ipod: true, visitorCounter: false, marquee: false },
    oldUrls: "redirect",
  }
}

/** Every answer null: what `unanswered` questions look like in the brief. */
export const emptyAnswers = () => ({ about: null, first: null, scope: null, keepRoutes: [], source: null, look: null, extras: null, oldUrls: null, notes: {} })

/* ----------------------------------------------------------- validation */

const isStr = (v) => typeof v === "string"
const isList = (v, ok = isStr) => Array.isArray(v) && v.every(ok)

/**
 * What is wrong with a set of answers, as a list of lines; empty when they
 * are good. Unknown option values are refused, not guessed at, so a typo in
 * a flag or a page out of step with this file never reaches the install.
 */
export function checkAnswers(a) {
  const bad = []
  if (!a || typeof a !== "object") return ["answers must be an object"]
  const opt = (id, v, label = id) => {
    if (!values(id).includes(v)) bad.push(`${label}: "${v}" is not one of ${values(id).join(", ")}`)
  }
  if (a.about !== null) {
    if (!a.about || typeof a.about !== "object") bad.push("about: expected { kind, name, role }")
    else {
      opt("about", a.about.kind, "about.kind")
      if (!isStr(a.about.name)) bad.push("about.name: expected text")
      if (!isStr(a.about.role)) bad.push("about.role: expected text")
    }
  }
  if (a.first !== null && a.first !== undefined) {
    if (!a.first || typeof a.first !== "object") bad.push("first: expected { goal, featured } or null")
    else {
      opt("first", a.first.goal, "first.goal")
      if (!isList(a.first.featured)) bad.push("first.featured: expected a list of routes")
      else if (a.first.featured.length > 3) bad.push("first.featured: at most three")
    }
  }
  if (a.scope !== null) opt("scope", a.scope)
  if (!isList(a.keepRoutes ?? [])) bad.push("keepRoutes: expected a list of routes")
  if (a.source !== null) {
    if (!a.source || typeof a.source !== "object") bad.push("source: expected { kind, where? }")
    else {
      opt("source", a.source.kind, "source.kind")
      if (a.source.where !== undefined && !isStr(a.source.where)) bad.push("source.where: expected text")
    }
  }
  if (a.look !== null) {
    if (!a.look || typeof a.look !== "object") bad.push("look: expected { tone, volume, description }")
    else {
      opt("look", a.look.tone, "look.tone")
      if (!isStr(a.look.volume)) bad.push("look.volume: expected text")
      if (!isStr(a.look.description)) bad.push("look.description: expected text")
    }
  }
  if (a.extras !== null) {
    if (!a.extras || typeof a.extras !== "object") bad.push("extras: expected { ipod, wallpaper?, visitorCounter, marquee }")
    else {
      for (const k of ["ipod", "visitorCounter", "marquee"]) if (typeof a.extras[k] !== "boolean") bad.push(`extras.${k}: expected true or false`)
      if (a.extras.wallpaper !== undefined && !isStr(a.extras.wallpaper)) bad.push("extras.wallpaper: expected a folder")
    }
  }
  if (a.oldUrls !== null && a.oldUrls !== undefined) opt("oldUrls", a.oldUrls)
  if (a.replace !== undefined && !["replace", "keep"].includes(a.replace)) bad.push(`replace: "${a.replace}" is not one of replace, keep`)
  if (a.notes !== undefined && (!a.notes || typeof a.notes !== "object" || !Object.values(a.notes).every(isStr))) bad.push("notes: expected { <question>: text }")
  return bad
}

/* ---------------------------------------------------------------- flags */

/**
 * A brief from flags alone (`--yes`, a script, an agent): each flag answers
 * its question; `source` and `oldUrls` take their safe defaults; the
 * questions nobody answered are listed as `unanswered` for the agent to
 * ask. The tone is the caller's business (init insists on --tone).
 */
export function briefFromFlags(args, project) {
  const d = defaultsFrom(project)
  const answers = emptyAnswers()
  const unanswered = []
  const errors = []
  const split = (s) => String(s ?? "").split(",").map((x) => x.trim()).filter(Boolean)
  /** A flag's value; `other=<words>` is "other", its words the note. */
  const other = (id, v) => {
    if (v === undefined) return undefined
    const [value, ...words] = String(v).split("=")
    if (value !== "other") return v
    answers.notes[id] = words.join("=").trim() || NOT_SURE
    return value
  }

  if (args.about !== undefined || args.name !== undefined || args.role !== undefined) {
    answers.about = { kind: other("about", args.about) ?? d.about.kind, name: args.name ?? d.about.name, role: args.role ?? d.about.role }
  } else unanswered.push("about")

  const scope = other("scope", args.scope) ?? (args.desktop ? "whole" : undefined)
  if (scope !== undefined) answers.scope = scope
  else {
    // No flag: no desktop, as init always did without --desktop.
    answers.scope = "components"
    unanswered.push("scope")
  }
  answers.keepRoutes = args.keep !== undefined ? split(args.keep) : answers.scope === "content" ? d.keepRoutes : []

  if (answers.scope === "components") answers.first = null
  else if (args.first !== undefined || args.featured !== undefined) {
    answers.first = { goal: other("first", args.first) ?? d.first.goal, featured: args.featured !== undefined ? split(args.featured) : d.first.featured }
  } else unanswered.push("first")

  if (args.source !== undefined) {
    const [kind, ...rest] = String(args.source).split("=")
    answers.source = kind === "other" ? { kind: other("source", args.source) } : { kind, ...(rest.length ? { where: rest.join("=") } : {}) }
  } else answers.source = d.source

  answers.look = { tone: args.tone ?? null, volume: args.volume ?? d.look.volume, description: args.description ?? d.look.description }

  if (args.extras !== undefined) {
    const on = split(args.extras)
    const wallpaper = on.find((x) => x.startsWith("wallpaper"))
    answers.extras = {
      ipod: on.includes("ipod"),
      ...(wallpaper ? { wallpaper: wallpaper.includes("=") ? wallpaper.slice(wallpaper.indexOf("=") + 1) : "" } : {}),
      visitorCounter: on.includes("visitor-counter"),
      marquee: on.includes("marquee"),
    }
    for (const x of on) if (!["ipod", "visitor-counter", "marquee"].includes(x) && !x.startsWith("wallpaper")) errors.push(`--extras: "${x}" is not one of ipod, wallpaper=<folder>, visitor-counter, marquee`)
  } else unanswered.push("extras")

  if (answers.scope === "components") answers.oldUrls = null
  else answers.oldUrls = args.oldUrls ?? d.oldUrls

  // The tone is checked by init (its own message lists the five).
  errors.push(...checkAnswers({ ...answers, look: { ...answers.look, tone: answers.look.tone ?? "pink" } }))
  return { answers, unanswered, errors }
}

/* ------------------------------------------------------- patina.json */

const MANIFEST = "patina.json"

/** The brief in patina.json, or null when there is none. */
export function readBrief(cwd) {
  try {
    return JSON.parse(fs.readFileSync(path.join(cwd, MANIFEST), "utf8")).brief ?? null
  } catch {
    return null
  }
}

/** Put the brief into patina.json, keeping every other key the file has
 *  (update.mjs writes the items and the fingerprints; both sides keep
 *  what the other wrote). */
export function writeBrief(cwd, brief) {
  const file = path.join(cwd, MANIFEST)
  let manifest = {}
  if (fs.existsSync(file)) {
    try {
      manifest = JSON.parse(fs.readFileSync(file, "utf8"))
    } catch {
      throw new Error(`${MANIFEST} is not valid JSON — fix it or delete it to start again`)
    }
  }
  fs.writeFileSync(file, `${JSON.stringify({ ...manifest, brief }, null, 2)}\n`)
}

/** The brief as it is written: the answers (an unanswered one null), what
 *  the scan found, and who answered. */
export function makeBrief({ answeredBy, answers, project, unanswered = [] }) {
  // The unanswered questions travel in the brief itself, words and options:
  // the agent that asks them works in the owner's project, where this file
  // (run by npx) is not. So do those answered "Other", which the agent
  // settles with the owner from their words.
  const a = { ...emptyAnswers(), ...answers }
  const isOther = (v) => v === "other" || v?.kind === "other" || v?.goal === "other"
  const ask = QUESTIONS.filter((q) => unanswered.includes(q.id) || isOther(a[q.id]))
  return { version: BRIEF_VERSION, answeredBy, answers: a, detected: project, unanswered, ask }
}

/* ------------------------------------------------------------- terminal */

/**
 * The same questions at a terminal, for SSH and people who prefer it. One
 * question at a time: its title, its prompt, its options numbered, the
 * default in brackets; Enter takes the default.
 */
export async function askInTerminal(questions, defaults, project, { input = process.stdin, output = process.stdout } = {}) {
  const rl = readline.createInterface({ input, output })
  // Lines are queued, not taken with rl.question: a line that arrives while
  // no question is pending (answers piped in, or typed ahead) would be lost.
  const queued = []
  let waiting = null
  let closed = false
  rl.on("line", (line) => (waiting ? waiting(line) : queued.push(line)))
  rl.on("close", () => {
    closed = true
    waiting?.(null)
  })
  const nextLine = () => {
    if (queued.length) return Promise.resolve(queued.shift())
    if (closed) return Promise.resolve(null)
    return new Promise((resolve) => {
      waiting = (line) => {
        waiting = null
        resolve(line)
      }
    })
  }
  const say = (s = "") => output.write(`${s}\n`)
  const ask = async (label, fallback) => {
    rl.setPrompt(`  ${label}${fallback ? ` [${fallback}]` : ""}: `)
    rl.prompt()
    const line = await nextLine()
    if (line === null) throw new Error("the terminal closed before the questions were answered — nothing written")
    const v = line.trim()
    return v || fallback || ""
  }
  const choose = async (q, fallback) => {
    for (;;) {
      const v = await ask(`Choose [1-${q.options.length}]`, fallback ? String(q.options.findIndex((o) => o.value === fallback) + 1) : "")
      const byNumber = /^\d+$/.test(v) ? q.options[Number(v) - 1] : null
      const picked = byNumber ?? q.options.find((o) => o.value === v.toLowerCase() || o.label.toLowerCase() === v.toLowerCase())
      if (picked) return picked
      say("  Type one of the numbers.")
    }
  }
  const pickRoutes = async (label, routes, preset, max) => {
    if (!routes.length) return []
    routes.forEach((r, i) => say(`    ${i + 1}. ${r}${preset.includes(r) ? "  (suggested)" : ""}`))
    for (;;) {
      const v = await ask(`${label} (numbers, comma-separated${max ? `, up to ${max}` : ""}; "none" for none)`, preset.map((r) => routes.indexOf(r) + 1).filter((n) => n > 0).join(","))
      if (/^none$/i.test(v)) return []
      const picked = v.split(",").map((s) => routes[Number(s.trim()) - 1]).filter(Boolean)
      if (picked.length === v.split(",").filter((s) => s.trim()).length && (!max || picked.length <= max)) return picked
      say(`  Numbers from the list${max ? `, at most ${max}` : ""}.`)
    }
  }

  const answers = emptyAnswers()
  try {
    say(`\n  Welcome to Patina. This assistant asks a few questions about your site, then installs the pack.`)
    say(`  Your answers are saved in patina.json, where your agent reads them when it turns your pages into a desktop.`)
    say(`  Found: ${project.framework}, ${project.routes.length} page(s), ${project.forms.length} with a form${project.title ? `, "${project.title}"` : ""}.`)
    for (const q of questions) {
      if (q.id === "first" && answers.scope === "components") continue
      if (q.id === "oldUrls" && answers.scope === "components") continue
      say(`\n  ${q.title}\n  ${q.prompt}`)
      if (q.multiple) {
        q.options.forEach((o, i) => say(`    ${i + 1}. ${o.label}`))
        const preset = q.id === "extras" ? ["ipod", "wallpaper", "visitor-counter", "marquee"].filter((k) => defaults.extras?.[k === "visitor-counter" ? "visitorCounter" : k]) : []
        const v = await ask("Which? (numbers, comma-separated; \"none\" for none)", preset.map((k) => q.options.findIndex((o) => o.value === k) + 1).join(","))
        const on = /^none$/i.test(v) ? [] : v.split(",").map((s) => q.options[Number(s.trim()) - 1]?.value).filter(Boolean)
        const extras = { ipod: on.includes("ipod"), visitorCounter: on.includes("visitor-counter"), marquee: on.includes("marquee") }
        if (on.includes("wallpaper")) extras.wallpaper = await ask("Wallpaper folder", "")
        answers.extras = extras
        continue
      }
      q.options.forEach((o, i) => say(`    ${i + 1}. ${o.label}${o.era ? `  — ${o.era}` : ""}`))
      const fallback = q.id === "about" ? defaults.about?.kind : q.id === "first" ? defaults.first?.goal : q.id === "look" ? defaults.look?.tone : q.id === "source" ? defaults.source?.kind : defaults[q.id]
      const picked = await choose(q, fallback)
      if (picked.value === "other") answers.notes[q.id] = await ask(picked.field.label, picked.field.value)
      switch (q.id) {
        case "about":
          answers.about = { kind: picked.value, name: await ask("Name", defaults.about?.name), role: await ask("What they do", defaults.about?.role) }
          break
        case "first":
          answers.first = { goal: picked.value, featured: await pickRoutes("Pages to keep at hand", project.routes.filter((r) => r.guess !== "home" && !r.path.includes("[")).map((r) => r.path), defaults.first?.featured ?? [], 3) }
          break
        case "scope":
          answers.scope = picked.value
          answers.keepRoutes = picked.value === "content" ? await pickRoutes("Tools that keep their pages", toolRoutes(project), defaults.keepRoutes ?? [], 0) : []
          if (picked.value === "components") answers.first = null
          break
        case "source":
          answers.source = { kind: picked.value, ...(picked.field && picked.value !== "other" ? { where: await ask(picked.field.label, "") } : {}) }
          break
        case "look":
          answers.look = { tone: picked.value, volume: await ask("Volume name", defaults.look?.volume), description: await ask("One line about the site", defaults.look?.description) }
          break
        case "oldUrls":
          answers.oldUrls = picked.value
          break
      }
    }
    if (answers.scope === "components") answers.oldUrls = null
    say("")
  } finally {
    rl.close()
  }
  return answers
}
