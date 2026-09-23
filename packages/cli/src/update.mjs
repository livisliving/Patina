/**
 * patina update — bring a project's copy of the pack up to a Patina release.
 *
 * The pack is copied into a project, not imported from it, so a new Patina
 * reaches a project only when its files are copied again. `update` does
 * that, and no more:
 *
 *   - It updates only the items the project has, as patina.json lists them
 *     (init writes it). A project that has none gets one, inferred from the
 *     theme and the pack's components found under its ui folder — never
 *     the desktop items, whose folder a site often fills with its own.
 *   - A file changed in the project since it was installed (its fingerprint
 *     no longer matches patina.json's) is kept and named, unless --force.
 *   - A new npm dependency is installed with the project's package manager.
 *   - It reads a release: the files as they were tagged on GitHub, not
 *     whatever is on main this minute — so an update is a step between two
 *     versions someone chose to publish.
 */

import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { spawnSync } from "node:child_process"

import { COMPONENTS, COPIES, aliasDir, childEnv, projectDirs } from "./init.mjs"

/** The pack's own repository, and where its built registry sits in it. */
const REPO = "livisliving/Patina"
const REGISTRY_DIR = "apps/web/public/r"
export const MANIFEST = "patina.json"
const NOTE =
  "Written by @pat1na/cli. `npx @pat1na/cli update` reads it: which of the pack's items this project has, the Patina version they came from, and each file as the pack wrote it (a file that no longer matches is kept on update)."

const tick = (s) => `  ✓ ${s}`
const skip = (s) => `  · ${s}`
const warn = (s) => `  ! ${s}`

const fingerprint = (text) => crypto.createHash("sha256").update(text).digest("hex").slice(0, 16)

/** shadcn drops a file's opening comment when it installs it, so a file
 *  that differs from the pack's only by that comment is the pack's. */
const withoutLead = (text) => text.replace(/^\s*(?:\/\*[\s\S]*?\*\/\s*)+/, "")

/** The release to update to: GitHub's latest, or null when there is none. */
async function latestRelease() {
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { accept: "application/vnd.github+json", ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) },
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`could not ask GitHub for Patina's latest release (HTTP ${res.status})`)
  return (await res.json()).tag_name
}

/** Where the pack's files are read from: the repository's root, as a URL
 *  (raw.githubusercontent.com at a tag) or a folder (a checkout). `read`
 *  returns a file's text, or null when this version has no such file. */
function sourceAt(root) {
  const remote = /^https?:\/\//.test(root)
  const base = root.replace(/\/+$/, "")
  return {
    root: base,
    async read(rel) {
      if (!remote) {
        const file = path.join(base, rel)
        return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null
      }
      const res = await fetch(`${base}/${rel}`)
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`${rel}: HTTP ${res.status} from ${base}`)
      return res.text()
    },
  }
}

/** Where a registry target lands in this project: under the alias its
 *  components.json names (and src/ when the project has one), as shadcn
 *  puts it. */
function targetPath(cwd, target) {
  const places = [
    ["components/ui/", () => aliasDir(cwd, "ui")],
    ["lib/", () => aliasDir(cwd, "lib")],
    ["components/", () => aliasDir(cwd, "components")],
    ["app/", () => projectDirs(cwd).app ?? path.join(cwd, "app")],
  ]
  for (const [prefix, dir] of places) if (target.startsWith(prefix)) return path.join(dir(), target.slice(prefix.length))
  return path.join(cwd, target)
}

/** The pack's files import from the default aliases; a project with other
 *  ones gets its own, as shadcn rewrites them on install. */
function rewriteImports(cwd, text) {
  let aliases = {}
  try {
    aliases = JSON.parse(fs.readFileSync(path.join(cwd, "components.json"), "utf8"))?.aliases ?? {}
  } catch {
    return text
  }
  const pairs = [
    ["@/components/ui", aliases.ui],
    ["@/lib/utils", aliases.utils],
    ["@/lib", aliases.lib],
    ["@/components", aliases.components],
  ].filter(([from, to]) => to && to !== from)
  if (!pairs.length) return text
  return text.replace(/(from\s*|import\s*\(\s*)(["'])(@\/[^"']+)\2/g, (whole, lead, quote, spec) => {
    const hit = pairs.find(([from]) => spec === from || spec.startsWith(`${from}/`))
    return hit ? `${lead}${quote}${hit[1]}${spec.slice(hit[0].length)}${quote}` : whole
  })
}

function readManifest(cwd) {
  const file = path.join(cwd, MANIFEST)
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"))
  } catch {
    throw new Error(`${MANIFEST} is not valid JSON — fix it or delete it to start again`)
  }
}

/** A project with no patina.json: the theme and the default components
 *  whose files are under its ui folder. */
function inferItems(cwd) {
  const ui = aliasDir(cwd, "ui")
  const items = Object.entries(COMPONENTS)
    .filter(([, file]) => fs.existsSync(path.join(ui, file)))
    .map(([item]) => item)
  if (fs.existsSync(targetPath(cwd, "app/y2k.css"))) items.unshift("theme")
  return items
}

/** A registry dependency's item name ("https://…/r/theme.json" → "theme"). */
const itemName = (dep) => path.basename(dep).replace(/\.json$/, "")

/** Whether package.json already has an npm dependency ("radix-ui@^1" → "radix-ui"). */
function missingPackages(cwd, deps) {
  let pkg = {}
  try {
    pkg = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8"))
  } catch {
    return []
  }
  const have = { ...pkg.dependencies, ...pkg.devDependencies }
  return [...deps].filter((dep) => !have[dep.replace(/(.)@.*$/, "$1")])
}

/** The project's package manager, from its lockfile. */
function installCommand(cwd, packages) {
  const has = (f) => fs.existsSync(path.join(cwd, f))
  if (has("pnpm-lock.yaml")) return ["pnpm", ["add", ...packages]]
  if (has("yarn.lock")) return ["yarn", ["add", ...packages]]
  if (has("bun.lockb") || has("bun.lock")) return ["bun", ["add", ...packages]]
  return ["npm", ["install", ...packages]]
}

/**
 * What a version of the pack would write, file by file, for these items
 * (and the items they depend on) and the copied files: each with its state
 * against the project — same, new, update, or edited (changed here since it
 * was installed, so kept).
 */
async function plan(cwd, source, items, manifest, force) {
  const files = []
  const deps = new Set()
  const done = new Set()
  const queue = [...items]
  const absent = []
  const judge = (abs, next) => {
    const rel = path.relative(cwd, abs)
    const have = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null
    const recorded = manifest?.files?.[rel]
    const state =
      have === null
        ? "new"
        : have === next || have === withoutLead(next)
          ? "same"
          : recorded && fingerprint(have) !== recorded && !force
            ? "edited"
            : "update"
    files.push({ rel, abs, have, next, state, recorded })
  }
  while (queue.length) {
    const name = queue.shift()
    if (done.has(name)) continue
    done.add(name)
    const json = await source.read(`${REGISTRY_DIR}/${name}.json`)
    if (!json) {
      absent.push(name)
      continue
    }
    const item = JSON.parse(json)
    for (const dep of item.dependencies ?? []) deps.add(dep)
    for (const dep of item.registryDependencies ?? []) {
      const n = itemName(dep)
      if (!done.has(n) && !queue.includes(n)) queue.push(n)
    }
    for (const file of item.files ?? []) judge(targetPath(cwd, file.target ?? file.path), rewriteImports(cwd, file.content))
  }
  for (const [from, to] of COPIES) {
    const text = await source.read(from)
    if (text !== null) judge(path.join(cwd, to), text)
  }
  return { files, deps, items: [...done].filter((n) => !absent.includes(n)), absent }
}

export async function update({ cwd, to, source: sourceArg, force, dryRun, add = [] }) {
  const manifest = readManifest(cwd)
  let items = manifest?.items ?? inferItems(cwd)
  if (!items.length && !add.length) {
    console.log(warn(`no ${MANIFEST} and none of the pack's components under ${path.relative(cwd, aliasDir(cwd, "ui")) || "."} — nothing to update. Install with: npx @pat1na/cli init`))
    return 1
  }
  items = [...new Set([...items, ...add])]

  // The version: a folder or URL given outright, else a tag (--to, or the
  // latest release), else main when Patina has published none yet.
  // With --source, --to only names the version the files are (a checkout
  // of a tag, say).
  let version = sourceArg ? (to ?? null) : null
  let root = sourceArg
  if (!root) {
    version = to ?? (await latestRelease()) ?? "main"
    root = `https://raw.githubusercontent.com/${REPO}/${version}`
  }
  const source = sourceAt(root)
  const from = sourceArg ? `${source.root}${version ? ` (${version})` : ""}` : version
  console.log(`\n  Patina ${from}${manifest?.version ? ` (this project: ${manifest.version})` : manifest ? "" : ` — no ${MANIFEST} yet, so the items are the ones found here`}`)
  console.log(`  items: ${items.join(", ")}\n`)

  const { files, deps, items: resolved, absent } = await plan(cwd, source, items, manifest, force)
  for (const name of absent) console.log(warn(`${name} — not in this version of the pack; left as it is`))
  const added = resolved.filter((n) => !items.includes(n))
  if (added.length) console.log(tick(`also ${added.join(", ")} — what the items above now need`))

  const count = { same: 0, new: 0, update: 0, edited: 0 }
  for (const f of files) {
    count[f.state]++
    if (f.state === "same") continue
    if (f.state === "edited") {
      console.log(warn(`${f.rel} — changed here since it was installed; kept (--force replaces it)`))
      continue
    }
    if (!dryRun) {
      fs.mkdirSync(path.dirname(f.abs), { recursive: true })
      fs.writeFileSync(f.abs, f.next)
    }
    console.log(tick(`${f.rel} — ${f.state === "new" ? "added" : "updated"}`))
  }
  console.log(skip(`${count.same} file(s) already as this version has them`))

  // npm packages the new files import and the project does not have.
  const missing = missingPackages(cwd, deps)
  if (missing.length) {
    const [bin, args] = installCommand(cwd, missing)
    if (dryRun) console.log(skip(`would run: ${bin} ${args.join(" ")}`))
    else {
      console.log(`  ${bin} ${args.join(" ")}`)
      const res = spawnSync(bin, args, { cwd, stdio: "inherit", shell: false, env: childEnv() })
      if (res.status !== 0) {
        console.log(warn(`${bin} exited ${res.status} — install ${missing.join(" ")} yourself`))
        return 1
      }
    }
  }

  // The record: what is installed, at which version, and each file's
  // fingerprint as it now is on disk — a file kept as edited keeps the
  // fingerprint it had, so it stays marked until it is replaced.
  const record = {
    $comment: NOTE,
    version: version ?? manifest?.version ?? null,
    // An item this version lacks stays listed, its files' fingerprints
    // with it, for the next version that has it again.
    items: [...new Set([...items, ...added])],
    files: Object.fromEntries(
      Object.entries({
        ...manifest?.files,
        ...Object.fromEntries(files.map((f) => [f.rel, f.state === "edited" ? f.recorded : fingerprint(f.state === "same" ? f.have : f.next)])),
      }).sort(([a], [b]) => a.localeCompare(b))
    ),
  }
  if (!dryRun) fs.writeFileSync(path.join(cwd, MANIFEST), `${JSON.stringify(record, null, 2)}\n`)
  console.log(`\n  ${dryRun ? "Dry run — nothing written." : `${MANIFEST} written.`} ${count.update} updated, ${count.new} added, ${count.edited} kept, ${count.same} unchanged.\n`)
  return 0
}

/** After init: record what it installed, so the first update knows which
 *  items are the pack's and what each file looked like. The files are
 *  hashed as they are on disk now, just written. */
export async function recordInstall(cwd, { registry, items }) {
  const files = {}
  const base = registry.replace(/\/+$/, "")
  for (const name of items) {
    let item
    try {
      const res = /^https?:\/\//.test(base) ? await fetch(`${base}/${name}.json`) : null
      item = res ? (res.ok ? await res.json() : null) : JSON.parse(fs.readFileSync(path.join(base, `${name}.json`), "utf8"))
    } catch {
      item = null
    }
    for (const file of item?.files ?? []) {
      const abs = targetPath(cwd, file.target ?? file.path)
      if (fs.existsSync(abs)) files[path.relative(cwd, abs)] = fingerprint(fs.readFileSync(abs, "utf8"))
    }
  }
  for (const [, to] of COPIES) {
    const abs = path.join(cwd, to)
    if (fs.existsSync(abs)) files[to] = fingerprint(fs.readFileSync(abs, "utf8"))
  }
  const record = {
    $comment: NOTE,
    version: null,
    items,
    files: Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b))),
  }
  fs.writeFileSync(path.join(cwd, MANIFEST), `${JSON.stringify(record, null, 2)}\n`)
  return record
}
