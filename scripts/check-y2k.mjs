#!/usr/bin/env node
/**
 * /check-y2k — does this code follow the Y2K pack?
 *
 * The rules are NOT invented here. They are the anti-rules DESIGN.md already
 * states ("Don't" under Do's and Don'ts, and the rules under Content) plus its
 * grid, and the grid's numbers
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
 * skipped, and a line carrying `check-y2k: ignore` is not checked. One rule
 * can be waived at one place, with the reason written down:
 *   // check-y2k-ignore <rule>[, <rule>]: <reason>
 * (in JSX, `{/* check-y2k-ignore article-in-group: <reason> *\/}`) on the
 * finding's line or the line above it. Without a reason it waives nothing.
 * This file uses `ignore-file` on itself — its rules are written as the very
 * strings they look for, so without it the checker reports itself in every
 * project that installs it.
 *
 * check-y2k: ignore-file
 */

import crypto from "node:crypto"
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
  {
    id: "link-arrow",
    severity: "error",
    design: /no arrows/,
    test(line) {
      // ↗ (or its escapes) at the END of a label: before a closing tag, a
      // quote, a brace or the end of the line. One in the middle of prose is
      // someone writing about arrows. The other arrows (→ ← » « ↘) are
      // caught only on a link's or a button's label — see FILE_RULES.
      const m = line.match(/(?:↗|\\u2197|&#8599;|&#x2197;|&nearr;)\s*(?=$|<|["'`}])/i)
      if (!m) return null
      return { col: m.index + 1, msg: `"${m[0].trim()}" on a label. Aqua links have no arrow: a link is OS blue and underlined; a button that goes somewhere is a push button.` }
    },
  },
  {
    id: "clipped-descenders",
    // A warning: whether the box actually clips depends on its overflow and
    // on what is around it, which a line cannot show.
    severity: "warn",
    design: /Descenders are never clipped/,
    test(line) {
      if (!line.includes("leading-none")) return null
      // Every class on the line, from every string on it — `cn("h-5", "…")`
      // and a parent and its child on one line both count.
      const classes = [...line.matchAll(/(["'`])((?:(?!\1)[^\\]|\\.)*)\1/g)]
        .flatMap((m) => m[2].split(/\s+/))
        .map((c) => c.replace(/^(?:[\w-]+:)+/, ""))
      const height = classes.find((c) => /^h-(?:4|5|\[17px\]|\[18px\])$/.test(c))
      const size = classes.find((c) => /^text-(?:xs|\[1[123]px\])$/.test(c))
      if (!height || !size || !classes.includes("leading-none")) return null
      const col = line.indexOf("leading-none") + 1
      return { col, msg: `Descenders will be clipped: ${size} at leading-none in a fixed ${height} box. Give the line at least 1.35 × its size, or drop the fixed height.` }
    },
  },
]

/* ── Rules that need more than one line ───────────────────────────── */

/** The same text with its comments blanked out, offsets kept — so a doc
 *  comment that mentions <WindowGroup> is not read as one. `//` after a
 *  colon is a URL, not a comment. */
function maskComments(text) {
  const blank = (s) => s.replace(/[^\n]/g, " ")
  return text
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:"'`\\])(\/\/[^\n]*)/g, (_, pre, c) => pre + blank(c))
}

/** Index just past the `>` that ends the JSX tag opening at `start` —
 *  braces and quotes skipped, so `onClick={() => a > b}` does not end it. */
function tagEnd(text, start) {
  let depth = 0
  let quote = null
  for (let i = start + 1; i < text.length; i++) {
    const c = text[i]
    if (quote) {
      if (c === quote && text[i - 1] !== "\\") quote = null
    } else if (c === '"' || c === "'" || c === "`") quote = c
    else if (c === "{") depth++
    else if (c === "}") depth--
    else if (c === ">" && depth === 0) return i + 1
  }
  return -1
}

/** A span taken out of the text with every offset after it kept: filled
 *  with NULs, which no pattern matches and which part two runs of words
 *  rather than joining them. */
const blankRange = (s, from, to) => s.slice(0, from) + "\0".repeat(to - from) + s.slice(to)

/** An HTML entity is part of the word it sits in — `I&rsquo;m`,
 *  `&ldquo;a website&rdquo;` — never a break between words; `&nbsp;` is a
 *  space. */
const plainEntities = (s) =>
  s.replace(/&(?:nbsp|#160|#xa0);/gi, " ").replace(/&(?:[a-z][a-z0-9]*|#\d+|#x[\da-f]+);/gi, "'")

/** The longest run of plain words in a piece of JSX: tags part it (inline
 *  ones — b, strong, em, a, span, code, Link — don't), `{" "}` and `{"…"}`
 *  are read as their text, entities are letters, a dash between spaces is
 *  punctuation, and a token with code in it ends a run. A paragraph wrapped
 *  over several source lines is one run: a newline is only a space. */
function longestProse(jsx) {
  const text = plainEntities(jsx)
    .replace(/\{\s*(["'`])((?:(?!\1)[^\\]|\\.)*)\1\s*\}/g, " $2 ")
    .replace(/<\/?(?:b|strong|em|i|a|span|code|Link|br)\b[^<>]*>/g, " ")
    .replace(/<[^<>]*>/g, "\0")
  let best = 0
  for (const chunk of text.split(/[\0{}]/)) {
    let run = 0
    for (const tok of chunk.split(/\s+/)) {
      if (!tok || /^[—–-]+$/.test(tok)) continue
      if (/^[("“‘'—–-]*[\p{L}\p{N}][\p{L}\p{N}'’%.,;:!?)"”…—–-]*$/u.test(tok) && !/[=<>{}\[\]$]|=>|\(\)/.test(tok)) {
        best = Math.max(best, ++run)
      } else run = 0
    }
  }
  return best
}

/** The words in a string: whitespace-separated tokens with a letter or a
 *  digit in them. */
const wordCount = (s) => (plainEntities(s).match(/\S+/g) ?? []).filter((w) => /[\p{L}\p{N}]/u.test(w)).length

/** Every JSX element whose name matches `names` (a regex source): where it
 *  starts, where its opening tag ends, where its closing tag starts and
 *  ends. Elements of the same name nested inside are counted, so the close
 *  is its own; a self-closing one has close === open. */
function elements(text, names) {
  const out = []
  for (const m of text.matchAll(new RegExp(`<(${names})(?![\\w.:-])`, "g"))) {
    const open = tagEnd(text, m.index)
    if (open === -1) continue
    if (text[open - 2] === "/") {
      out.push({ name: m[1], start: m.index, open, close: open, end: open })
      continue
    }
    const re = new RegExp(`<(/?)${m[1]}(?![\\w.:-])`, "g")
    re.lastIndex = open
    let depth = 1
    for (let t; (t = re.exec(text)); ) {
      if (!t[1]) {
        const e = tagEnd(text, t.index)
        if (e !== -1 && text[e - 2] !== "/") depth++
      } else if (--depth === 0) {
        out.push({ name: m[1], start: m.index, open, close: t.index, end: text.indexOf(">", t.index) + 1 })
        break
      }
    }
  }
  return out
}

/** Index of the `close` that balances the `open` at `from` (strings
 *  skipped), or -1. */
function balance(text, from, open, close) {
  let depth = 0
  let quote = null
  for (let i = from; i < text.length; i++) {
    const c = text[i]
    if (quote) {
      if (c === quote && text[i - 1] !== "\\") quote = null
    } else if (c === '"' || c === "'" || c === "`") quote = c
    else if (c === open) depth++
    else if (c === close && --depth === 0) return i
  }
  return -1
}

/** The array literal `const NAME = [ … ]` (typed or `as const`) declared in
 *  this file, or null — where a `.map` over NAME gets its words. */
function arrayLiteral(text, name) {
  const m = new RegExp(`\\b(?:const|let|var)\\s+${name.replace(/\$/g, "\\$")}\\b[^=\\n;]*=\\s*\\[`).exec(text)
  if (!m) return null
  const from = m.index + m[0].length - 1
  const to = balance(text, from, "[", "]")
  return to === -1 ? null : text.slice(from, to + 1)
}

/** The longest string in an array literal: the strings themselves when the
 *  array is of strings, else the values of `field:`. */
function longestItem(literal, field) {
  const strings = field
    ? [...literal.matchAll(new RegExp(`(?:^|[\\s,{])${field}\\s*:\\s*(["'\`])((?:(?!\\1)[^\\\\]|\\\\.)*)\\1`, "g"))].map((m) => m[2])
    : /^\[\s*["'`]/.test(literal)
      ? [...literal.matchAll(/(["'`])((?:(?!\1)[^\\]|\\.)*)\1/g)].map((m) => m[2])
      : []
  return Math.max(0, ...strings.map(wordCount))
}

/** A number with % or × beside "reduction", "increase", "fewer" or "more":
 *  a change, not a fraction of a whole. */
const CHANGE =
  /\d+(?:\.\d+)?\s*(?:%|×|x\b|percent\b)[^"'`<>{}\n]{0,24}?\b(?:reduction|increase|fewer|more)\b|\b(?:reduction|increase|fewer|more)\b[^"'`<>{}\n]{0,24}?\d+(?:\.\d+)?\s*(?:%|×)/i

/* ── Content: what a group box holds ──────────────────────────────── */

/** Small print: 11px or smaller, or the secondary ink. A dialog puts a line
 *  of it under its controls, so it is never read as an article. */
const HELP_TEXT =
  /(?:^|[\s"'`])(?:[\w-]+:)*text-(?:\[(?:\d|1[01])(?:\.\d+)?px\]|2xs|\(--y2k-ink-secondary\)|\[var\(--y2k-ink-secondary\)\]|\[#4b4b4b\])(?=[\s"'`/]|$)/i

/** A specimen: text set in a size or face that comes from data (the Type
 *  panel's samples) — it shows the type, it is not an article. */
const SPECIMEN = /\bstyle=\{\{[^}]*\bfont(?:Size|Family)\s*:/

/** Field names that only ever hold running text. */
const PROSE_FIELD = /^(?:body|text|description|desc|summary|content|copy|answer|excerpt|blurb|paragraphs?|para|intro|details?|bio|abstract|lede|story)$/

/** More words than this in one paragraph, or in one item of a mapped list,
 *  is prose. A control's label or a table cell is shorter. */
const PARAGRAPH_WORDS = 12

/** The group boxes in a file: WindowGroup, and Group when it is the pack's
 *  (imported from a `…/group` module — other kits have a layout `Group`). */
function groupNames(text) {
  return /import\s*\{[^}]*\bGroup\b[^}]*\}\s*from\s*["'][^"']*\/group["']/.test(text) ? "WindowGroup|Group" : "WindowGroup"
}

/** `{d}` or `{f.a}` inside a `.map`: is what it renders prose? Answered
 *  from the field's name (`body`, `description` …) or, when the mapped
 *  array is a literal in this file, from the longest string in it. `{p}` in
 *  a `<p>`, mapped from an array this file does not hold, is a paragraph. */
function mappedProse(text, at, ident, prop, tag) {
  let src = null
  let field = prop ?? null
  for (const m of text.slice(Math.max(0, at - 6000), at).matchAll(/([\w$.]+)\s*\.map\(\s*(?:\(\s*)?(?:([A-Za-z_$][\w$]*)|\{([^}]*)\})/g)) {
    if (m[2] === ident) {
      src = m[1]
      field = prop ?? null
    } else if (!prop && m[3] && new RegExp(`(?:^|[\\s,])${ident.replace(/\$/g, "\\$")}(?=[\\s,=]|$)`).test(m[3])) {
      src = m[1]
      field = ident // `.map(({ q, a }) => …)`: {a} is each item's a
    }
  }
  const expr = `{${prop ? `${ident}.${prop}` : ident}}`
  if (field && PROSE_FIELD.test(field) && (src || prop)) return `\`${expr}\`, which is running text`
  if (!src) return null
  const literal = /^[\w$]+$/.test(src) ? arrayLiteral(text, src) : null
  if (literal) {
    const words = longestItem(literal, field)
    return words > PARAGRAPH_WORDS ? `\`${expr}\`, whose longest in \`${src}\` is ${words} words` : null
  }
  return !field && tag === "p" ? `\`${expr}\` mapped into a <p>` : null
}

/** Something to operate: what a group box is for. */
const CONTROL =
  /<(?:input|select|textarea|button|Button|BevelButton|PopupButton|Checkbox|RadioGroup|Radio|TextField|SearchField|Slider|Stepper|SegmentedControl|Switch|Input|Textarea|Select|[A-Z][\w]*(?:Button|Field|Picker|Checkbox))(?![\w.:-])/

/** Why a group box's own body is an article's section, or null. `body` is
 *  the group's inside with its nested groups and its small print blanked;
 *  `base` is where it starts in `text`. */
function articleIn(body, base, text) {
  for (const p of elements(body, "p")) {
    const words = longestProse(body.slice(p.open, p.close))
    if (words > PARAGRAPH_WORDS) return `a ${words}-word paragraph`
  }
  const run = longestProse(body)
  if (run > 40) return `${run} words of running text`
  for (const el of elements(body, "p|li|dd|blockquote|td|TableCell")) {
    if (el.close <= el.open) continue
    const inner = body.slice(el.open, el.close)
    for (const x of inner.matchAll(/\{\s*([A-Za-z_$][\w$]*)(?:\.([A-Za-z_$][\w$]*))?\s*\}/g)) {
      const why = mappedProse(text, base + el.open + x.index, x[1], x[2], el.name)
      if (why) return why
    }
  }
  const heading = body.match(/<(h[1-6])(?![\w.:-])/)
  const block = body.match(/<(p|dl|ul|ol|blockquote|table|Table)(?![\w.:-])/)
  if (heading && block) return `a heading (<${heading[1]}>) over a <${block[1]}>`
  for (const m of body.matchAll(/<(?:img|Image)(?![\w.:-])/g)) {
    const end = tagEnd(body, m.index)
    const tag = body.slice(m.index, end === -1 ? undefined : end)
    if (!/icon|thumb/i.test(tag)) return `a picture (${tag.match(/\bsrc=\{?\s*["'`]([^"'`]+)/)?.[1] ?? "<" + (tag.startsWith("<img") ? "img" : "Image") + ">"})`
  }
  const path = body.match(/=\s*\{?\s*["'`]([^"'`\s]+\.(?:jpe?g|png|webp|avif|gif))["'`]/i)
  if (path && !/icon|thumb/i.test(path[1])) return `a picture (${path[1]})`
  // A table or a list of figures with no control beside it: the group box
  // groups nothing, it frames a section (a Results table, a spec list).
  const data = body.match(/<(table|Table|dl)(?![\w.:-])/)
  if (data && !CONTROL.test(body)) return `a <${data[1]}> and no control`
  return null
}

/* ── Content: link and button labels ──────────────────────────────── */

/** The arrows a label must not start or end with, as a character, an HTML
 *  entity or a JS escape. */
const ARROW =
  "(?:→|←|↗|↘|»|«|&rarr;|&larr;|&nearr;|&searr;|&raquo;|&laquo;|&#8594;|&#8592;|&#8599;|&#8600;|&#187;|&#171;|&#x2192;|&#x2190;|&#x2197;|&#x2198;|&#xbb;|&#xab;|\\\\u2192|\\\\u2190|\\\\u2197|\\\\u2198|\\\\u00bb|\\\\u00ab)"
const ARROW_AT_EDGE = new RegExp(`^${ARROW}|${ARROW}$`, "i")
const ARROW_ANY = new RegExp(ARROW, "gi")

/** Elements whose text is a link's or a button's label. */
const LINKISH = "a|Link|NavLink|button|Button|[A-Z][\\w]*Button"

/** A label as it reads: `{"…"}` is its text, a comment is nothing, any
 *  other `{…}` is a stand-in (so `{name} →` still ends in the arrow), tags
 *  are gone. */
function labelText(jsx) {
  let s = jsx.replace(/\{\s*(["'`])((?:(?!\1)[^\\]|\\.)*)\1\s*\}/g, " $2 ").replace(/\{\s*\}/g, " ")
  for (let i = s.indexOf("{"); i !== -1; i = s.indexOf("{", i + 1)) {
    const j = balance(s, i, "{", "}")
    if (j === -1) break
    s = s.slice(0, i) + " \u0001 " + s.slice(j + 1)
  }
  return s.replace(/<[^<>]*>/g, " ").replace(/\s+/g, " ").trim()
}

/** The `{ … }` object literal around `at`, or "". */
function objectAround(text, at) {
  let depth = 0
  for (let i = at; i >= 0; i--) {
    if (text[i] === "}") depth++
    else if (text[i] === "{" && depth-- === 0) {
      const j = balance(text, i, "{", "}")
      return j === -1 ? "" : text.slice(i, j + 1)
    }
  }
  return ""
}

/** Where file thumbnails live — the Finder's views, its column inspector,
 *  the desktop's icons and the Dock. A thumbnail keeps its hairline: it is
 *  the file's icon, not a picture on a page. */
const THUMBNAIL_FILE = /(?:^|[\\/])(?:finder|disk|icons?|dock|inspector|column[\w-]*|thumb\w*)\.[jt]sx$/i

/** What may stand round the one picture in a well for the well to be only
 *  its frame: wrappers and a caption, nothing that is content of its own. */
const FRAME_ONLY = new Set(["div", "span", "figure", "figcaption", "picture", "source", "img", "Image", "a", "Link"])

const FILE_RULES = [
  {
    id: "empty-document",
    severity: "warn",
    design: /never padded, and never a "Read more" to nowhere/,
    test(text) {
      const out = []
      for (const m of text.matchAll(/\btype\s*:\s*["']document["']/g)) {
        const obj = objectAround(text, m.index)
        const b = obj && /\bblocks\s*:\s*\[/.exec(obj)
        if (!b) continue
        const open = b.index + b[0].length - 1
        const close = balance(obj, open, "[", "]")
        if (close === -1) continue
        const blocks = obj.slice(open + 1, close)
        const types = [...blocks.matchAll(/\btype\s*:\s*["'](\w+)["']/g)].map((t) => t[1])
        if (!types.length && !/\b(?:comment|subtitle)\s*[:,}\n]/.test(obj)) {
          out.push({ index: m.index, msg: "A document with nothing in it: it opens to a blank page. Give it what its card held (its picture, its line as `comment`, its date), or leave it out and list it." })
        } else if (types.length && types.every((t) => t === "links") && !/\bhref\s*:\s*(["'`])(?!#?\1)/.test(blocks)) {
          out.push({ index: m.index, msg: "A document whose only content is a link to nowhere (a card's \"Read more\" to #). Leave that link out: the document holds what its card held." })
        }
      }
      return out
    },
  },
  {
    id: "article-in-group",
    severity: "error",
    design: /A group box groups controls in a dialog; it never divides an article/,
    jsx: true,
    test(text) {
      const groups = elements(text, groupNames(text)).filter((g) => g.close > g.open)
      const out = []
      for (const g of groups) {
        // A group's own inside: the groups nested in it answer for theirs.
        let body = text.slice(g.open, g.close)
        for (const n of groups) {
          if (n.start > g.start && n.start < g.close) body = blankRange(body, n.start - g.open, n.end - g.open)
        }
        // A dialog's small print and a type specimen are not an article.
        for (const el of elements(body, "p|span|div|small|label|figcaption|li|dd|dt|section")) {
          const tag = body.slice(el.start, el.open)
          if (HELP_TEXT.test(tag) || SPECIMEN.test(tag)) body = blankRange(body, el.start, el.end)
        }
        const why = articleIn(body, g.open, text)
        if (!why) continue
        out.push({
          index: g.start,
          msg: `An article's section is not a group box: a group box groups controls in a dialog. Use a document (DESIGN.md › Content). This one holds ${why}.`,
        })
      }
      return out
    },
  },
  {
    id: "link-arrow",
    severity: "error",
    design: /no arrows/,
    test(text, file) {
      const out = []
      const flag = (index, arrow) =>
        out.push({ index, msg: `"${arrow}" on a link or button label. Aqua links have no arrow: a link is OS blue and underlined; a button that goes somewhere is a push button.` })

      // The text of <a>, <Link>, <Button> … and their label="…".
      if (/\.(?:tsx|jsx)$/.test(file)) {
        for (const el of elements(text, LINKISH)) {
          const inner = text.slice(el.open, el.close)
          const label = labelText(inner)
          if (label && ARROW_AT_EDGE.test(label)) {
            const all = [...inner.matchAll(ARROW_ANY)]
            const hit = new RegExp(`^${ARROW}`, "i").test(label) ? all[0] : all[all.length - 1]
            if (hit) flag(el.open + hit.index, hit[0])
            continue
          }
          const tag = text.slice(el.start, el.open)
          const attr = /\blabel=(["'])((?:(?!\1)[^\\]|\\.)*)\1/.exec(tag)
          if (attr && ARROW_AT_EDGE.test(attr[2].trim())) flag(el.start + attr.index, attr[2].trim().match(ARROW_AT_EDGE)[0])
        }
      }

      // `label: "… →"` in an object that is a link (it has an href).
      for (const m of text.matchAll(/(?:^|[\s,{])(label|title|text|a)\s*:\s*(["'`])((?:(?!\2)[^\\]|\\.)*)\2/g)) {
        const value = m[3].trim()
        if (!ARROW_AT_EDGE.test(value)) continue
        if (!/(?:^|[\s,{])(?:href|to|url)\s*:/.test(objectAround(text, m.index + 1))) continue
        flag(m.index + m[0].indexOf(m[2]), value.match(ARROW_AT_EDGE)[0])
      }
      return out
    },
  },
  {
    id: "picture-border",
    severity: "warn",
    design: /set bare into the page/,
    jsx: true,
    test(text, file) {
      if (THUMBNAIL_FILE.test(file)) return []
      const out = []
      // A border on the picture itself.
      for (const m of text.matchAll(/<(?:img|Image)(?![\w.:-])/g)) {
        const end = tagEnd(text, m.index)
        if (end === -1) continue
        const tag = text.slice(m.index, end)
        if (/icon|thumb/i.test(tag)) continue
        const cls = tag.match(/(?:^|[\s"'`{])(?:[\w-]+:)*(border(?:-[trblxyse])?(?:-(?:[1-9]\d*|\[[^\]]*[1-9][^\]]*\]))?)(?=[\s"'`}]|$)/)
        const style = tag.match(/\bborder(?:Top|Right|Bottom|Left)?\s*:\s*["'`]?(?!none\b|0\b)[^,}]*?\d+px/)
        if (!cls && !style) continue
        out.push({ index: m.index, msg: `A picture sits bare on the page: drop the ${cls ? cls[1] : "border"} round this image.` })
      }
      // One picture alone in a WindowWell: the well is its frame. (A strip
      // of pictures, an embed or code in a well is what a well is for.)
      for (const w of elements(text, "WindowWell")) {
        if (w.close <= w.open) continue
        let inner = text.slice(w.open, w.close)
        const pics = [...inner.matchAll(/<(?:img|Image)(?![\w.:-])/g)]
        if (pics.length !== 1 || /\.map\s*\(/.test(inner)) continue
        if ([...inner.matchAll(/<([A-Za-z][\w.]*)/g)].some((t) => !FRAME_ONLY.has(t[1]))) continue
        const picEnd = tagEnd(inner, pics[0].index)
        if (picEnd === -1 || /icon|thumb/i.test(inner.slice(pics[0].index, picEnd))) continue
        inner = blankRange(inner, pics[0].index, picEnd)
        for (const c of elements(inner, "figcaption")) inner = blankRange(inner, c.start, c.end)
        const words = inner.replace(/\0/g, "").replace(/<[^<>]*>/g, " ").replace(/\{\s*(?:["'`]\s*["'`])?\s*\}/g, " ")
        if (words.trim()) continue // the well holds more than the picture
        out.push({ index: w.open + pics[0].index, msg: "A picture sits bare on the page: take this image out of the WindowWell that frames it." })
      }
      return out
    },
  },
  {
    id: "change-as-progress",
    severity: "warn",
    design: /"56% fewer" is a change, not a fraction/,
    test(text) {
      const lines = text.split("\n")
      const out = []
      const starts = []
      for (const m of text.matchAll(/<Progress\b|\btype:\s*["']progress["']/g)) starts.push(m.index)
      for (const index of starts) {
        const line = text.slice(0, index).split("\n").length - 1
        // Its label sits just above or just below it.
        const near = lines.slice(Math.max(0, line - 2), line + 3).join("\n")
        const m = near.match(CHANGE)
        if (!m) continue
        out.push({ index, msg: `A change is not a fraction — use metrics (a Table). "${m[0].trim()}" is drawn as a progress bar here.` })
      }
      return out
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

/** `check-y2k-ignore <rule>[, <rule>]: <reason>` on line `at` (1-based) or
 *  the line above it waives `rule` there. The reason is required. */
function waived(lines, at, rule) {
  for (const l of [lines[at - 1], lines[at - 2]]) {
    const m = l?.match(/check-y2k-ignore\s+([\w-]+(?:\s*,\s*[\w-]+)*)\s*:\s*[^\s*/}]/)
    if (m && m[1].split(/\s*,\s*/).includes(rule)) return true
  }
  return false
}

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
    console.error(`check-y2k: no DESIGN.md at ${designPath}. Run \`npx @pat1na/cli init\` first, or pass --design <path>.`)
    return 2
  }
  const design = fs.readFileSync(designPath, "utf8")
  const grid = readGrid(design)
  const gridLine = lineOf(design, /Spacing unit: \d+px/)
  const colorLine = lineOf(design, /^## Colors/)
  const themeTokens = readThemeTokens(roots.map((r) => path.resolve(r)))
  const ruleLine = new Map([...RULES, ...FILE_RULES].map((r) => [r.id, lineOf(design, r.design)]))

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
          if (hit && !waived(lines, i + 1, rule.id)) {
            findings.push({
              file, line: i + 1, col: hit.col, rule: rule.id,
              severity: rule.severity, msg: hit.msg, designLine: ruleLine.get(rule.id),
            })
          }
        }
        for (const g of gridFindings(line, grid, gridLine)) {
          if (!waived(lines, i + 1, g.rule)) findings.push({ file, line: i + 1, ...g })
        }
        for (const t of tokenFindings(line, themeTokens, colorLine)) {
          if (!waived(lines, i + 1, t.rule)) findings.push({ file, line: i + 1, ...t })
        }
      }
      const masked = maskComments(text)
      const jsx = /\.(?:tsx|jsx)$/.test(file)
      for (const rule of FILE_RULES) {
        if (rule.jsx && !jsx) continue
        if (path.extname(file) === ".css") continue
        for (const hit of rule.test(masked, file)) {
          const before = masked.slice(0, hit.index).split("\n")
          const at = before.length
          if (lines[at - 1].includes("check-y2k: ignore") || waived(lines, at, rule.id)) continue
          findings.push({
            file, line: at, col: before[before.length - 1].length + 1, rule: rule.id,
            severity: rule.severity, msg: hit.msg, designLine: ruleLine.get(rule.id),
          })
        }
      }
    }
  }

  // The pack's own files, against what it wrote (patina.json, the CLI's
  // fingerprints): an edited one is kept by `patina update`, so it stops
  // getting the pack's fixes — and a missing piece belongs in the report.
  for (const root of roots) {
    const manifest = path.join(root, "patina.json")
    if (!fs.existsSync(manifest)) continue
    let files = {}
    try {
      files = JSON.parse(fs.readFileSync(manifest, "utf8")).files ?? {}
    } catch {
      continue
    }
    for (const [rel, print] of Object.entries(files)) {
      const abs = path.join(root, rel)
      if (!fs.existsSync(abs)) continue
      const now = crypto.createHash("sha256").update(fs.readFileSync(abs, "utf8")).digest("hex").slice(0, 16)
      if (now === print) continue
      findings.push({
        file: abs, line: 1, col: 1, rule: "pack-modified", severity: "warn",
        msg: "The pack's own file, changed since the pack wrote it (patina.json). `patina update` will keep this copy and skip the pack's fixes to it. If the pack lacked something, say so in your report rather than editing its files.",
      })
    }
  }

  const seen = new Set()
  const unique = findings.filter((f) => {
    // One arrow is one finding, whether the line rule or the label rule saw it.
    const k = f.rule === "link-arrow" ? `${f.file}:${f.line}:${f.rule}` : `${f.file}:${f.line}:${f.col}:${f.rule}:${f.msg}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  // In each file, top to bottom — the line rules and the file rules merged.
  const fileOrder = new Map()
  for (const f of unique) if (!fileOrder.has(f.file)) fileOrder.set(f.file, fileOrder.size)
  unique.sort((x, y) => fileOrder.get(x.file) - fileOrder.get(y.file) || x.line - y.line || x.col - y.col)
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
