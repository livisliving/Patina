#!/usr/bin/env node
/**
 * /check-y2k — does this code follow the Y2K pack?
 *
 * The rules are NOT invented here. They are the anti-rules DESIGN.md already
 * states ("Don't" under Do's and Don'ts) plus its grid, and the grid's numbers
 * — the unit, the off-grid metrics, the radius scale — are READ from
 * DESIGN.md's front matter (`spacing:` and `rounded:`) at run time, so they
 * live in exactly one place. Every finding cites the DESIGN.md line it comes
 * from.
 *
 * Usage:
 *   node scripts/check-y2k.mjs [paths...] [--design <DESIGN.md>] [--json] [--strict]
 *
 * Exit code: 1 if there is any error (or any warning with --strict), else 0.
 *
 * Bias: under-report. A rule that cannot be checked without guessing intent is
 * a warning, not an error — a checker that cries wolf gets turned off.
 *
 * Opting out: a file whose first 40 lines carry `check-y2k: ignore-file` is
 * skipped, and a line carrying `check-y2k: ignore` is not checked. This file
 * uses the first one on itself — its rules are written as the very strings
 * they look for, so without it the checker reports itself in every project
 * that installs it.
 *
 * check-y2k: ignore-file
 */

import fs from "node:fs"
import path from "node:path"

const SCAN_EXT = new Set([".tsx", ".ts", ".jsx", ".js", ".mjs", ".css"])
const SKIP_DIR = new Set(["node_modules", ".next", ".git", "dist", "build", "out", "coverage", ".turbo", ".vercel"])

/* ── DESIGN.md: the source of the rules ───────────────────────────── */

/** Line number (1-based) of the first line matching `re`, or 0. */
function lineOf(text, re) {
  const lines = text.split("\n")
  for (let i = 0; i < lines.length; i++) if (re.test(lines[i])) return i + 1
  return 0
}

/**
 * A flat `name: <number>px` map from DESIGN.md's front matter — `spacing:` or
 * `rounded:`. The front matter is the machine-readable half of the spec (the
 * design.md format defines it, and `design.md export` emits it as tokens), so
 * the grid and the radius scale are read from there rather than scraped out
 * of the prose. Anything in the map that is not `<number>px` stops the run:
 * the checker reads the spec, it does not guess at it.
 */
function readPxMap(design, key) {
  const fm = design.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (!fm) throw new Error("check-y2k: DESIGN.md has no front matter (--- … ---); the grid and radius rules are read from it.")
  const lines = fm[1].split(/\r?\n/)
  const start = lines.findIndex((l) => l.trimEnd() === `${key}:`)
  if (start === -1) throw new Error(`check-y2k: DESIGN.md front matter has no \`${key}:\` map.`)

  const map = new Map()
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) break // the next top-level key
    const entry = line.replace(/\s+#.*$/, "").trim()
    if (!entry) continue
    const kv = entry.match(/^([\w-]+):\s*(\d+(?:\.\d+)?)px$/)
    if (!kv) throw new Error(`check-y2k: can't read \`${key}\` entry "${entry}" in DESIGN.md — expected \`name: <number>px\`.`)
    map.set(kv[1], Number(kv[2]))
  }
  if (!map.size) throw new Error(`check-y2k: DESIGN.md's \`${key}:\` map is empty.`)
  return map
}

/**
 * What the grid accepts, straight from the tokens:
 *   unit      — `spacing.unit`, the grid itself;
 *   offGrid   — every other spacing token that is NOT a multiple of the unit
 *               (the Aqua 10.0 metrics: title bar, menu bar, scroll bar …),
 *               value → token names, so a finding can say what IS allowed;
 *   radii     — the `rounded:` scale (window tops, buttons, group boxes …),
 *               accepted for `rounded-*` whatever the unit says.
 */
function readGrid(design) {
  const spacing = readPxMap(design, "spacing")
  const rounded = readPxMap(design, "rounded")
  const unit = spacing.get("unit")
  if (!unit) throw new Error("check-y2k: DESIGN.md's `spacing:` map has no `unit` — the grid is defined by it.")

  const offGrid = new Map()
  for (const [name, v] of spacing) {
    if (name === "unit" || v % unit === 0) continue
    offGrid.set(v, [...(offGrid.get(v) ?? []), name])
  }
  const radii = new Map()
  for (const [name, v] of rounded) radii.set(v, [...(radii.get(v) ?? []), name])
  return { unit, offGrid, radii }
}


/**
 * Every `--y2k-*` custom property the installed theme declares. A page that
 * paints with a name the stylesheet does not define gets silently nothing —
 * a blank wallpaper, a transparent surface — and no error anywhere, which is
 * exactly the kind of quiet failure a checker should catch. Returns null when
 * y2k.css cannot be found, and the rule then stays quiet.
 */
function readThemeTokens(roots) {
  const files = []
  const seen = new Set()
  const stack = roots.map((r) => [r, 0])
  while (stack.length) {
    const [dir, level] = stack.pop()
    if (seen.has(dir)) continue
    seen.add(dir)
    let entries
    try {
      entries = fs.statSync(dir).isDirectory() ? fs.readdirSync(dir, { withFileTypes: true }) : []
    } catch {
      continue
    }
    for (const e of entries) {
      const p = path.join(dir, e.name)
      if (e.isFile() && e.name === "y2k.css") files.push(p)
      else if (e.isDirectory() && level < 5 && !SKIP_DIR.has(e.name) && !e.name.startsWith(".")) stack.push([p, level + 1])
    }
  }
  if (!files.length) return null
  const tokens = new Set()
  for (const f of files) {
    for (const m of fs.readFileSync(f, "utf8").matchAll(/(--y2k-[a-z0-9-]+)\s*:/gi)) tokens.add(m[1])
  }
  return tokens.size ? tokens : null
}

/* ── Rules ────────────────────────────────────────────────────────── */

/** Tailwind prefixes whose arbitrary value is a LAYOUT length (grid applies).
 *  Deliberately excludes text-/leading-/tracking- (font sizes never snap),
 *  shadow-/ring-/blur-/border- (hairlines and gel detail) and bg-. */
const GRID_PREFIX = new Set([
  "w", "h", "size", "min-w", "max-w", "min-h", "max-h", "basis",
  "p", "px", "py", "pt", "pr", "pb", "pl", "ps", "pe",
  "m", "mx", "my", "mt", "mr", "mb", "ml", "ms", "me",
  "gap", "gap-x", "gap-y", "space-x", "space-y",
  "top", "right", "bottom", "left", "inset", "inset-x", "inset-y", "start", "end",
  "translate-x", "translate-y", "indent",
  "rounded", "rounded-t", "rounded-r", "rounded-b", "rounded-l",
  "rounded-tl", "rounded-tr", "rounded-br", "rounded-bl",
])

const CSS_GRID_PROP =
  /(?:^|[;{\s])(width|height|min-width|max-width|min-height|max-height|gap|row-gap|column-gap|margin|margin-top|margin-right|margin-bottom|margin-left|padding|padding-top|padding-right|padding-bottom|padding-left|top|right|bottom|left|inset|border-radius)\s*:\s*([^;}]+)/gi

/** Font faces DESIGN.md forbids, matched only where a font is being named. */
const BANNED_FACES = /\b(Inter|Geist|Roboto|Helvetica(?: Neue)?|Arial)\b/
const FONT_CONTEXT = /font-family|fontFamily|font-\[|font-\(family-name|next\/font\/google|--[\w-]*font[\w-]*\s*:/i

const RULES = [
  {
    id: "banned-font",
    severity: "error",
    design: /Don't use Inter, Geist/,
    test(line) {
      if (!FONT_CONTEXT.test(line)) return null
      const m = line.match(BANNED_FACES)
      if (!m) return null
      return { col: m.index + 1, msg: `${m[1]} is not a Y2K face. Lucida Grande is the UI face; Lato is its open-source stand-in.` }
    },
  },
  {
    id: "system-ui-first",
    severity: "error",
    design: /Don't use Inter, Geist/,
    test(line) {
      const m = line.match(/(?:font-family|fontFamily)\s*:\s*["']?\s*system-ui/i)
      if (!m) return null
      return { col: m.index + 1, msg: "system-ui belongs at the TAIL of the stack, never as the named face." }
    },
  },
  {
    id: "grey-card",
    severity: "error",
    design: /Don't use grey cards/,
    test(line) {
      const hex = line.match(/#[fF]4[fF]4[fF]5\b/)
      if (hex) return { col: hex.index + 1, msg: "#F4F4F5 is the shadcn grey card. Surfaces are pinstriped or wallpaper." }
      const cls = line.match(/\bbg-(zinc|slate|stone|gray)-\d{2,3}\b/)
      if (cls) return { col: cls.index + 1, msg: `${cls[0]} is a grey-card surface. Use a pinstriped surface or the wallpaper.` }
      return null
    },
  },
  {
    id: "ai-gradient",
    severity: "error",
    design: /Don't use the purple-to-blue/,
    test(line) {
      const m = line.match(/#8[bB]5[cC][fF]6|#3[bB]82[fF]6|from-violet-500[^"'`]*to-blue-500/)
      if (!m) return null
      return { col: m.index + 1, msg: "The purple→blue AI gradient. Gradients are gels or the wallpaper, nothing else." }
    },
  },
  {
    id: "card-radius",
    severity: "error",
    design: /Don't put an 8–16px radius/,
    test(line) {
      const m = line.match(/\brounded-(xl|2xl|3xl)\b/)
      if (!m) return null
      return { col: m.index + 1, msg: `${m[0]} is a card radius. Use the DESIGN.md \`rounded:\` scale — pills for controls, the named radii for windows, wells and group boxes.` }
    },
  },
  {
    id: "thin-icons",
    severity: "error",
    design: /Don't use thin-line icon sets/,
    test(line) {
      const m = line.match(/from\s+["']([^"']*(lucide|heroicons|react-feather|feather-icons)[^"']*)["']/)
      if (!m) return null
      return { col: m.index + 1, msg: `${m[1]} is a thin-line icon set. Aqua icons are glossy objects — use the pack's (components/ui/icons: \`ICONS[lucideToPack.<Name>]\`), or none.` }
    },
  },
  {
    id: "muted-foreground",
    severity: "error",
    design: /Don't use `text-muted-foreground`/,
    test(line) {
      const m = line.match(/\btext-muted-foreground\b/)
      if (!m) return null
      return { col: m.index + 1, msg: "text-muted-foreground is the mid-grey helper-text look. Ink is black; secondary ink is #4b4b4b." }
    },
  },
  {
    id: "page-layout",
    severity: "error",
    design: /Don't build a page/,
    test(line) {
      const m = line.match(/\bmax-w-(?:screen-)?[a-z0-9]+\b(?=[^"'`]*\bmx-auto\b)|\bmx-auto\b(?=[^"'`]*\bmax-w-)/)
      if (!m) return null
      return { col: m.index + 1, msg: "A centered max-width column is a page. The viewport is the wallpaper; content lives in windows." }
    },
  },
  {
    id: "page-footer",
    severity: "error",
    design: /Don't build a page/,
    test(line) {
      const m = line.match(/<footer[\s>]/)
      if (!m) return null
      return { col: m.index + 1, msg: "No footer: a desktop has a Dock, not a footer with link columns." }
    },
  },
  {
    id: "card-shadow",
    // A warning, not an error: DESIGN.md allows a shadow on a window, menu,
    // tooltip, the Dock or a gel control, and no regex can tell which this is.
    severity: "warn",
    design: /Don't put a shadow on anything/,
    test(line) {
      const m = line.match(/\bshadow-(md|lg|xl|2xl)\b/)
      if (!m) return null
      return { col: m.index + 1, msg: `${m[0]} — allowed only on a window, menu, tooltip, the Dock or a gel control. Check which this is.` }
    },
  },
]


/** `var(--y2k-…)` and Tailwind's `(--y2k-…)` naming a token the theme never
 *  declares. Only runs when y2k.css was found. */
function tokenFindings(line, tokens, designLine) {
  if (!tokens) return []
  const out = []
  for (const m of line.matchAll(/--y2k-[a-z0-9-]+/gi)) {
    const name = m[0]
    if (tokens.has(name)) continue
    // `var(--y2k-light-${color})` — the name is assembled at run time and only
    // its prefix is literal, so there is nothing here to check.
    if (line.slice(m.index + name.length).startsWith("$")) continue
    out.push({
      rule: "unknown-token",
      severity: "error",
      col: m.index + 1,
      msg: `${name} is not declared in y2k.css — it paints nothing. Check the name against the theme.`,
      designLine,
    })
  }
  return out
}

/* ── The grid ─────────────────────────────────────────────────────── */

/** "26px titlebar, 22px menubar" — the named exceptions, for a message. */
const describe = (m) =>
  [...m].sort(([a], [b]) => a - b).map(([v, names]) => `${v}px ${names.join("/")}`).join(", ")

function gridFindings(line, grid, designLine) {
  const { unit, offGrid, radii } = grid
  const out = []
  const ok = (v, prefix) =>
    v % unit === 0 || offGrid.has(v) || (prefix.startsWith("rounded") && radii.has(v))
  const flag = (col, value, where, isRadius) =>
    out.push({
      rule: "grid",
      severity: "error",
      col,
      msg:
        `${value}px in ${where} is off the ${unit}px grid and is not a named token ` +
        `(${isRadius ? `rounded: ${describe(radii)}` : `off-grid spacing: ${describe(offGrid)}`}).`,
      designLine,
    })

  // Tailwind arbitrary values: w-[176px], gap-[6px], rounded-[8px] …
  for (const m of line.matchAll(/(?:^|[\s"'`{(:])(-?[a-z][a-zA-Z0-9-]*)-\[([^\]]+)\]/g)) {
    const prefix = m[1].replace(/^-/, "").replace(/^[a-z]+:/, "")
    if (!GRID_PREFIX.has(prefix)) continue
    const value = m[2]
    if (/var\(|calc\(|%|rem|em|vh|vw|ch|\bfr\b/.test(value)) continue
    for (const px of value.matchAll(/(\d+(?:\.\d+)?)px/g)) {
      const v = Number(px[1])
      if (ok(v, prefix)) continue
      flag(m.index + 1, px[1], `${prefix}-[…]`, prefix.startsWith("rounded"))
    }
  }

  // Plain CSS declarations.
  for (const m of line.matchAll(CSS_GRID_PROP)) {
    const value = m[2]
    if (/var\(|calc\(|%|rem|em|vh|vw/.test(value)) continue
    for (const px of value.matchAll(/(\d+(?:\.\d+)?)px/g)) {
      const v = Number(px[1])
      const isRadius = m[1] === "border-radius"
      if (ok(v, isRadius ? "rounded" : m[1])) continue
      flag(m.index + 1, px[1], m[1], isRadius)
    }
  }

  return out
}

/* ── Walk & report ────────────────────────────────────────────────── */

function* walk(root) {
  const st = fs.statSync(root)
  if (st.isFile()) {
    yield root
    return
  }
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.name !== ".claude") continue
    if (SKIP_DIR.has(entry.name)) continue
    const p = path.join(root, entry.name)
    if (entry.isDirectory()) yield* walk(p)
    else if (SCAN_EXT.has(path.extname(entry.name))) yield p
  }
}

function main(argv) {
  const args = argv.slice(2)
  const json = args.includes("--json")
  const strict = args.includes("--strict")
  const di = args.indexOf("--design")
  const designPath = di !== -1 ? args[di + 1] : "DESIGN.md"
  const paths = args.filter((a, i) => !a.startsWith("--") && !(di !== -1 && i === di + 1))
  const roots = paths.length ? paths : ["."]

  if (!fs.existsSync(designPath)) {
    console.error(`check-y2k: no DESIGN.md at ${designPath}. Run \`npx @patina/cli init\` first, or pass --design <path>.`)
    return 2
  }
  const design = fs.readFileSync(designPath, "utf8")
  const grid = readGrid(design)
  const gridLine = lineOf(design, /Spacing unit: \d+px/)
  const colorLine = lineOf(design, /^## Colors/)
  const themeTokens = readThemeTokens(roots.map((r) => path.resolve(r)))
  const ruleLine = new Map(RULES.map((r) => [r.id, lineOf(design, r.design)]))

  const findings = []
  for (const root of roots) {
    for (const file of walk(root)) {
      const text = fs.readFileSync(file, "utf8")
      const lines = text.split("\n")
      if (lines.slice(0, 40).some((l) => l.includes("check-y2k: ignore-file"))) continue
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) continue // prose in comments isn't code
        if (line.includes("check-y2k: ignore")) continue
        for (const rule of RULES) {
          const hit = rule.test(line)
          if (hit) {
            findings.push({
              file, line: i + 1, col: hit.col, rule: rule.id,
              severity: rule.severity, msg: hit.msg, designLine: ruleLine.get(rule.id),
            })
          }
        }
        for (const g of gridFindings(line, grid, gridLine)) {
          findings.push({ file, line: i + 1, ...g })
        }
        for (const t of tokenFindings(line, themeTokens, colorLine)) {
          findings.push({ file, line: i + 1, ...t })
        }
      }
    }
  }

  const seen = new Set()
  const unique = findings.filter((f) => {
    const k = `${f.file}:${f.line}:${f.col}:${f.rule}:${f.msg}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  findings.length = 0
  findings.push(...unique)

  const errors = findings.filter((f) => f.severity === "error")
  const warns = findings.filter((f) => f.severity === "warn")

  if (json) {
    const plain = (m) => Object.fromEntries([...m].sort(([a], [b]) => a - b))
    console.log(JSON.stringify({ design: designPath, grid: { unit: grid.unit, offGrid: plain(grid.offGrid), radii: plain(grid.radii) }, findings }, null, 2))
  } else {
    for (const f of findings) {
      const where = `${path.relative(process.cwd(), f.file)}:${f.line}:${f.col}`
      const cite = f.designLine ? ` (${designPath}:${f.designLine})` : ""
      console.log(`${f.severity === "error" ? "✗" : "!"} ${where}  ${f.rule}  ${f.msg}${cite}`)
    }
    const files = new Set(findings.map((f) => f.file)).size
    console.log(
      findings.length
        ? `\n${errors.length} error${errors.length === 1 ? "" : "s"}, ${warns.length} warning${warns.length === 1 ? "" : "s"} in ${files} file${files === 1 ? "" : "s"}.`
        : "✓ check-y2k: clean."
    )
  }

  return errors.length || (strict && warns.length) ? 1 : 0
}

try {
  process.exit(main(process.argv))
} catch (err) {
  console.error(err.message)
  process.exit(2)
}
