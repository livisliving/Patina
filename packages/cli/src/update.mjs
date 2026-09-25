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

import { COMPONENTS, COPIES, aliasDir, childEnv, projectDirs, readComponentsJson, skip, tick } from "./project.mjs"

/** The pack's own repository, and where its built registry sits in it. */
const REPO = "livisliving/Patina"
const REGISTRY_DIR = "apps/web/public/r"
export const MANIFEST = "patina.json"
const NOTE =
  "Written by @pat1na/cli. `npx @pat1na/cli update` reads it: which of the pack's items this project has, the Patina version they came from, and each file as the pack wrote it (a file that no longer matches is kept on update)."

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

/** Where files are read from: a URL (raw.githubusercontent.com at a tag, a
 *  registry) or a folder (a checkout). `read` returns a file's text, or
 *  null when there is no such file. */
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

/** Where this project keeps things, worked out once per run: the folder a
 *  registry target lands in (under components.json's aliases, and src/ when
 *  the project has one, as shadcn puts it), and the aliases the pack's
 *  imports are rewritten to when they are not the defaults. */
function layoutOf(cwd) {
  const aliases = readComponentsJson(cwd)?.aliases ?? {}
  return {
    cwd,
    places: [
      ["components/ui/", aliasDir(cwd, "ui")],
      ["lib/", aliasDir(cwd, "lib")],
      ["components/", aliasDir(cwd, "components")],
      ["app/", projectDirs(cwd).app ?? path.join(cwd, "app")],
    ],
    imports: [
      ["@/components/ui", aliases.ui],
      ["@/lib/utils", aliases.utils],
      ["@/lib", aliases.lib],
      ["@/components", aliases.components],
    ].filter(([from, to]) => to && to !== from),
  }
}

function targetPath(layout, target) {
  const hit = layout.places.find(([prefix]) => target.startsWith(prefix))
  return hit ? path.join(hit[1], target.slice(hit[0].length)) : path.join(layout.cwd, target)
}

function rewriteImports(layout, text) {
  if (!layout.imports.length) return text
  return text.replace(/(from\s*|import\s*\(\s*)(["'])(@\/[^"']+)\2/g, (whole, lead, quote, spec) => {
    const hit = layout.imports.find(([from]) => spec === from || spec.startsWith(`${from}/`))
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

/** patina.json: the items, the version, and each file's fingerprint. The
 *  brief (init's questions and their answers, brief.mjs) is the owner's and
 *  stays as it is across every write. */
function writeManifest(cwd, { version, items, files }) {
  const brief = readManifest(cwd)?.brief
  const record = { $comment: NOTE, version, items, files: Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b))), ...(brief ? { brief } : {}) }
  fs.writeFileSync(path.join(cwd, MANIFEST), `${JSON.stringify(record, null, 2)}\n`)
}

/** A project with no patina.json: the theme and the default components
 *  whose files are under its ui folder. */
function inferItems(layout) {
  const ui = targetPath(layout, "components/ui/")
  const items = Object.entries(COMPONENTS)
    .filter(([, file]) => fs.existsSync(path.join(ui, file)))
    .map(([item]) => item)
  if (fs.existsSync(targetPath(layout, "app/y2k.css"))) items.unshift("theme")
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
 * was installed, so kept). The items are fetched a round at a time, all of
 * a round at once: the listed items, then what they depend on.
 */
async function plan(layout, source, items, manifest, force) {
  const { cwd } = layout
  const files = []
  const deps = new Set()
  const done = new Set()
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
  const copies = Promise.all(COPIES.map(([from]) => source.read(from)))
  let round = [...new Set(items)]
  while (round.length) {
    round.forEach((name) => done.add(name))
    const jsons = await Promise.all(round.map((name) => source.read(`${REGISTRY_DIR}/${name}.json`)))
    const next = new Set()
    jsons.forEach((json, i) => {
      if (!json) return absent.push(round[i])
      const item = JSON.parse(json)
      for (const dep of item.dependencies ?? []) deps.add(dep)
      for (const dep of item.registryDependencies ?? []) if (!done.has(itemName(dep))) next.add(itemName(dep))
      for (const file of item.files ?? []) judge(targetPath(layout, file.target ?? file.path), rewriteImports(layout, file.content))
    })
    round = [...next]
  }
  ;(await copies).forEach((text, i) => text !== null && judge(path.join(cwd, COPIES[i][1]), text))
  return { files, deps, items: [...done].filter((n) => !absent.includes(n)), absent }
}

export async function update({ cwd, to, source: sourceArg, force, dryRun, add = [] }) {
  const layout = layoutOf(cwd)
  const manifest = readManifest(cwd)
  const listed = manifest?.items ?? inferItems(layout)
  if (!listed.length && !add.length) {
    console.log(warn(`no ${MANIFEST} and none of the pack's components under ${path.relative(cwd, targetPath(layout, "components/ui/")) || "."} — nothing to update. Install with: npx @pat1na/cli init`))
    return 1
  }
  const items = [...new Set([...listed, ...add])]

  // The version: a tag (--to, or the latest release), else main when Patina
  // has published none yet. With --source (a folder or URL of the repo's
  // root, a checkout of a tag, say), --to only names the version it is.
  const version = sourceArg ? (to ?? null) : (to ?? (await latestRelease()) ?? "main")
  const source = sourceAt(sourceArg ?? `https://raw.githubusercontent.com/${REPO}/${version}`)
  const from = sourceArg ? `${source.root}${version ? ` (${version})` : ""}` : version
  console.log(`\n  Patina ${from}${manifest?.version ? ` (this project: ${manifest.version})` : manifest ? "" : ` — no ${MANIFEST} yet, so the items are the ones found here`}`)
  console.log(`  items: ${items.join(", ")}\n`)

  const { files, deps, items: resolved, absent } = await plan(layout, source, items, manifest, force)
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
  // fingerprint it had, so it stays marked until it is replaced. An item
  // this version lacks stays listed, its files' fingerprints with it, for
  // the next version that has it again.
  if (!dryRun)
    writeManifest(cwd, {
      version: version ?? manifest?.version ?? null,
      items: [...items, ...added],
      files: {
        ...manifest?.files,
        ...Object.fromEntries(files.map((f) => [f.rel, f.state === "edited" ? f.recorded : fingerprint(f.state === "same" ? f.have : f.next)])),
      },
    })
  console.log(`\n  ${dryRun ? "Dry run — nothing written." : `${MANIFEST} written.`} ${count.update} updated, ${count.new} added, ${count.edited} kept, ${count.same} unchanged.\n`)
  return 0
}

/** After init: record what it installed, so the first update knows which
 *  items are the pack's and what each file looked like. The files are
 *  hashed as they are on disk now, just written; the items' file lists
 *  come from the registry init installed from, all at once. */
export async function recordInstall(cwd, { registry, items }) {
  const layout = layoutOf(cwd)
  const registrySource = sourceAt(registry)
  const jsons = await Promise.all(items.map((name) => registrySource.read(`${name}.json`).catch(() => null)))
  const targets = [
    ...jsons.flatMap((json) => (json ? JSON.parse(json).files ?? [] : [])).map((file) => targetPath(layout, file.target ?? file.path)),
    ...COPIES.map(([, to]) => path.join(cwd, to)),
  ]
  const files = Object.fromEntries(
    targets.filter((abs) => fs.existsSync(abs)).map((abs) => [path.relative(cwd, abs), fingerprint(fs.readFileSync(abs, "utf8"))])
  )
  writeManifest(cwd, { version: null, items, files })
}
