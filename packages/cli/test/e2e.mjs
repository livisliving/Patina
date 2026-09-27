#!/usr/bin/env node
/**
 * End-to-end test of the Patina CLI: real installs into copies of a clean
 * create-next-app, from a registry (a local build of the site by default),
 * each case in its own folder, every command's output kept in a log.
 *
 *   node test/e2e.mjs [--cli <bin/patina.mjs | @pat1na/cli@x.y.z>]
 *                     [--registry <url>] [--work <dir>] [--template <dir>]
 *                     [--only <case,…>]
 *
 * --cli       the CLI under test: a path runs it with node, anything else is
 *             an npm spec run with npx (default: this checkout's bin)
 * --registry  the registry init installs from (default the local one,
 *             http://localhost:4700/Patina/r; its site must serve /setup/)
 * --work      where the sample projects and logs go (default: a new folder
 *             under the system's temp folder)
 * --template  a clean create-next-app to copy for each case; without it one
 *             is made in <work>/template, or in the temp folder's
 *             patina-e2e/template without --work, and reused from there
 * --only      the cases to run, comma-separated; a prefix names several
 *             ("rerun" is rerun-tty and rerun-page)
 *
 * The setup and rerun-page cases drive the Setup Assistant in Chrome with
 * Playwright: PATINA_PLAYWRIGHT is a folder to require playwright-core
 * from, PATINA_CHROME the browser's executable. Without them those cases
 * are skipped, not failed. `update` and `outdated` ask api.github.com,
 * which allows 60 requests an hour without a GITHUB_TOKEN. Nothing opens
 * on screen: a stand-in `open` records the page's address instead.
 * Exits 1 when a case fails.
 */

import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import crypto from "node:crypto"
import { spawn, spawnSync } from "node:child_process"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PTY = path.join(HERE, "under-pty.py")
const REPO = "livisliving/Patina"
/** What an "Other" answer says until the owner says more (brief.mjs). */
const NOT_SURE = "Not sure — recommend one for me"
/** The installed file the cases edit, to see whether an edit survives. */
const EDITED = "components/ui/button.tsx"
const EDIT = "\n// e2e: a local edit\n"
/** The copies init makes besides the registry's items (project.mjs › COPIES). */
const COPIES = ["DESIGN.md", "scripts/check-y2k.mjs", ".claude/skills/check-y2k/SKILL.md", ".claude/skills/y2k-ify/SKILL.md"]
const MIN = 60_000

const { values: opt } = parseArgs({
  options: {
    cli: { type: "string" },
    registry: { type: "string", default: "http://localhost:4700/Patina/r" },
    work: { type: "string" },
    template: { type: "string" },
    only: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
})
if (opt.help) {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").match(/\/\*\*([\s\S]*?)\*\//)[1].replace(/^ \* ?/gm, ""))
  process.exit(0)
}

const CLI = opt.cli ?? path.join(HERE, "..", "bin", "patina.mjs")
const CLI_IS_PATH = fs.existsSync(CLI) || /\.m?js$/.test(CLI)
const REGISTRY = opt.registry.replace(/\/+$/, "")
const WORK = path.resolve(opt.work ?? fs.mkdtempSync(path.join(os.tmpdir(), "patina-e2e-")))
const RUN = path.join(WORK, `run-${new Date().toISOString().replace(/[:.]/g, "-")}`)
const LOGS = path.join(RUN, "logs")
fs.mkdirSync(LOGS, { recursive: true })

/* ─────────────────────────────────────────────── processes */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, "").replace(/\x1b[()][A-Z0-9]/g, "").replace(/\r/g, "")
const tail = (s, n = 12) => stripAnsi(s).trimEnd().split("\n").slice(-n).join("\n")

/** A stand-in for `open` (and xdg-open): the Setup Assistant's address is
 *  appended to $PATINA_OPEN_LOG, and no browser window appears. */
const BIN = path.join(WORK, "bin")
fs.mkdirSync(BIN, { recursive: true })
for (const name of ["open", "xdg-open"]) {
  fs.writeFileSync(path.join(BIN, name), `#!/bin/sh\nprintf '%s\\n' "$*" >> "\${PATINA_OPEN_LOG:-/dev/null}"\n`, { mode: 0o755 })
}

/** The environment for every command: the stand-in open first on PATH, and
 *  none of the npm_* variables `npm test` sets — npm_config_local_prefix
 *  would send the npx and npm install inside a sample project here. */
function env(extra = {}) {
  const e = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^npm_/i.test(k) && k !== "INIT_CWD"))
  return { ...e, PATH: `${BIN}${path.delimiter}${process.env.PATH}`, NEXT_TELEMETRY_DISABLED: "1", ...extra }
}

/** Process groups still running, stopped on the way out whatever happens.
 *  SIGKILL: an init left waiting on its page has nothing to tidy up. */
const groups = new Set()
const stopGroup = (pgid) => {
  try {
    process.kill(-pgid, "SIGKILL")
  } catch {
    /* already gone */
  }
}
process.on("exit", () => groups.forEach(stopGroup))
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => process.exit(130))

/**
 * Start a command in its own process group, output to a log and kept for
 * waitFor. With tty, it runs under under-pty.py, so stdin is a terminal
 * and the test types into it with send().
 */
function start(cmd, args, { cwd, name, tty = false, extraEnv }) {
  const log = fs.createWriteStream(path.join(LOGS, `${name}.log`))
  log.write(`$ cd ${cwd} && ${[cmd, ...args].join(" ")}${tty ? "   (under a pty)" : ""}\n\n`)
  const child = tty
    ? spawn("python3", [PTY, cmd, ...args], { cwd, env: env(extraEnv), stdio: ["pipe", "pipe", "pipe"], detached: true })
    : spawn(cmd, args, { cwd, env: env(extraEnv), stdio: ["ignore", "pipe", "pipe"], detached: true })
  const mine = [child.pid]
  groups.add(child.pid)
  const p = { raw: "", code: undefined, lastData: Date.now(), log: path.join(LOGS, `${name}.log`) }
  const take = (s) => {
    p.raw += s
    p.lastData = Date.now()
    log.write(s)
  }
  child.stdout.on("data", (d) => take(d.toString()))
  child.stderr.on("data", (d) => {
    let s = d.toString()
    // under-pty.py names the child it forked: a session of its own, stopped by its pgid.
    s = s.replace(/pty-child (\d+)\n?/, (_, pid) => {
      mine.push(Number(pid))
      groups.add(Number(pid))
      return ""
    })
    take(s)
  })
  p.exited = new Promise((resolve) =>
    child.on("close", (code, signal) => {
      p.code = code ?? signal
      // Anything it left behind in its groups goes with it.
      mine.forEach((g) => (stopGroup(g), groups.delete(g)))
      log.end(`\n[exit ${p.code}]\n`)
      resolve(p.code)
    })
  )
  p.text = () => stripAnsi(p.raw)
  p.note = (s) => log.write(`\n[e2e: ${s}]\n`)
  p.send = (s) => child.stdin?.write(s)
  p.stop = () => mine.forEach((g) => (stopGroup(g), groups.delete(g)))
  /** Resolves with the match, or null once it has exited or the time is up. */
  p.waitFor = async (re, ms) => {
    for (const end = Date.now() + ms; Date.now() < end; await sleep(200)) {
      const m = p.text().match(re)
      if (m || p.code !== undefined) return m
    }
    return null
  }
  /** The exit code, or "timeout" (then it is stopped). */
  p.wait = async (ms) => {
    const code = await Promise.race([p.exited, sleep(ms).then(() => "timeout")])
    if (code === "timeout") p.stop()
    return code
  }
  return p
}

/** Run to the end: { code, out }. */
async function run(cmd, args, { timeout = 10 * MIN, ...o }) {
  const p = start(cmd, args, o)
  const code = await p.wait(timeout)
  return { code, out: p.text(), log: p.log }
}

/** The CLI under test, as a command line. */
const cliCmd = (args) => (CLI_IS_PATH ? ["node", [path.resolve(CLI), ...args]] : ["npx", ["--yes", CLI, ...args]])
const cli = (args, o) => run(...cliCmd(args), o)
const startCli = (args, o) => start(...cliCmd(args), o)

/* ─────────────────────────────────────────────── projects */

/** A clean create-next-app: the one given, the one made last time, or a new
 *  one. Without --work each run's folder is new, so it is kept outside it. */
function template() {
  if (opt.template) return path.resolve(opt.template)
  const home = opt.work ? WORK : path.join(os.tmpdir(), "patina-e2e")
  const dir = path.join(home, "template")
  // Installed, not only begun: a create-next-app that stopped part-way is made again.
  if (fs.existsSync(path.join(dir, "node_modules", "next"))) return dir
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(home, { recursive: true })
  console.log(`  making a create-next-app in ${dir} (once)…`)
  const res = spawnSync(
    "npx",
    ["--yes", "create-next-app@latest", "template", "--ts", "--tailwind", "--eslint", "--app", "--no-src-dir", "--import-alias", "@/*", "--use-npm", "--yes"],
    { cwd: home, env: env(), encoding: "utf8" }
  )
  fs.writeFileSync(path.join(LOGS, "create-next-app.log"), `${res.stdout}\n${res.stderr}`)
  if (res.status !== 0) throw new Error(`create-next-app failed; see ${path.join(LOGS, "create-next-app.log")}`)
  return dir
}

/** A copy of a project (a clone on APFS, so node_modules costs nothing). */
function copy(from, to) {
  fs.rmSync(to, { recursive: true, force: true })
  const res = spawnSync("cp", [process.platform === "darwin" ? "-Rc" : "-R", from, to])
  if (res.status !== 0) throw new Error(`cp ${from} ${to}: ${res.stderr}`)
  return to
}

const read = (dir, rel) => fs.readFileSync(path.join(dir, rel), "utf8")
/** The line init puts in a site's head when it has no desktop. */
const GENERATOR = /<meta name="generator" content="Patina OS[^"]*"/
const exists = (dir, rel) => fs.existsSync(path.join(dir, rel))
const json = (dir, rel) => {
  try {
    return JSON.parse(read(dir, rel))
  } catch {
    return null
  }
}
const sha = (buf) => crypto.createHash("sha256").update(buf).digest("hex")
const hashOf = (dir, rel) => (exists(dir, rel) ? sha(fs.readFileSync(path.join(dir, rel))) : null)

/** Every file under a folder and its hash, node_modules and .next left out. */
function hashTree(dir) {
  const out = {}
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name === ".next") continue
      const abs = path.join(d, e.name)
      if (e.isDirectory()) walk(abs)
      else if (e.isFile()) out[path.relative(dir, abs)] = sha(fs.readFileSync(abs))
    }
  }
  walk(dir)
  return out
}

/** What differs between two hashTree()s, for a failure's detail. */
function treeDiff(a, b) {
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  return keys.filter((k) => a[k] !== b[k]).map((k) => `${!(k in a) ? "added" : !(k in b) ? "removed" : "changed"} ${k}`)
}

/** The pack's files as patina.json records them, hashed as they are now. */
const packHashes = (dir) => Object.fromEntries(Object.keys(json(dir, "patina.json")?.files ?? {}).map((rel) => [rel, hashOf(dir, rel)]))

/** A registry item, one request at a time and tried three times: the
 *  local registry is a small server that refuses a burst. */
async function registryItem(name) {
  for (let i = 0; i < 3; i++, await sleep(300)) {
    const res = await fetch(`${REGISTRY}/${name}.json`).catch(() => null)
    if (res?.ok) return res.json()
  }
  return null
}

/** Every file of every item patina.json lists has its fingerprint there:
 *  a file left out would lose a local edit to the next update, unannounced. */
async function recordsEveryFile(t, dir) {
  const manifest = json(dir, "patina.json")
  const missing = []
  for (const name of manifest?.items ?? []) {
    const item = await registryItem(name)
    if (!item) missing.push(`${name}.json (unreadable here)`)
    for (const f of item?.files ?? []) if (!((f.target ?? f.path) in (manifest.files ?? {}))) missing.push(f.target ?? f.path)
  }
  t.ok(manifest?.items?.length && missing.length === 0, "patina.json has a fingerprint for every file of every item it lists", `missing: ${missing.join(", ")}`)
}

/** The version the CLI under test is. */
function cliVersion() {
  if (CLI_IS_PATH) return JSON.parse(fs.readFileSync(path.join(path.dirname(path.resolve(CLI)), "..", "package.json"), "utf8")).version
  const res = spawnSync("npm", ["view", CLI, "version"], { env: env(), encoding: "utf8" })
  return res.stdout.trim().split("\n").pop().replace(/^.*'(.*)'$/, "$1")
}

/** GitHub's latest Patina release, asked once a run. */
let latestAsked
const latestTag = () =>
  (latestAsked ??= fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { accept: "application/vnd.github+json", ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) },
    signal: AbortSignal.timeout(15_000),
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => j?.tag_name ?? null)
    .catch(() => null))

/** The CLI's own help, asked once: a case whose command it lacks is skipped. */
let helpAsked
const helpText = () => (helpAsked ??= cli(["help"], { cwd: RUN, name: "help-probe", timeout: 3 * MIN }).then((r) => r.out))

/* ─────────────────────────────────────────────── the Setup Assistant */

function playwright() {
  const from = process.env.PATINA_PLAYWRIGHT
  const exe = process.env.PATINA_CHROME
  if (!from || !exe) return { why: "PATINA_PLAYWRIGHT and PATINA_CHROME are not both set" }
  if (!fs.existsSync(exe)) return { why: `PATINA_CHROME: no such file ${exe}` }
  try {
    const { chromium } = createRequire(from.endsWith("/") ? from : `${from}/`)("playwright-core")
    return { chromium, exe }
  } catch (err) {
    return { why: `playwright-core not found from ${from}: ${err.message}` }
  }
}

/** The address init printed and the one the stand-in open was given. */
async function setupUrl(p, openLog, t) {
  const waiting = await p.waitFor(/Waiting for the answers in the browser/, 3 * MIN)
  t.must(waiting, "prints “Waiting for the answers in the browser…”", tail(p.text()))
  const printed = p.text().match(/Answer in the browser[^:]*: (\S+)/)?.[1]
  let opened = null
  for (let i = 0; i < 50 && !opened; i++, await sleep(200)) opened = fs.existsSync(openLog) ? fs.readFileSync(openLog, "utf8").trim().split("\n").pop() || null : null
  t.must(opened, "the stand-in open was given the page's address")
  t.ok(opened === printed, "open was given the address init printed", `opened ${opened}, printed ${printed}`)
  t.ok(/^http:\/\/127\.0\.0\.1:\d+\//.test(opened), "the page is served from 127.0.0.1", opened)
  return opened
}

/**
 * Load the Setup Assistant through the CLI's proxy, check it really
 * rendered, answer every pane and press Install, then Done. `other` answers
 * the first question "Other"; `replace` is the answer to the files-here
 * pane when it comes. Returns what it saw.
 */
async function walkSetup(pw, url, { tone = "Lime", other = false, replace = "replace" }, t) {
  const seen = { errors: [], titles: [], files: [] }
  const browser = await pw.chromium.launch({ executablePath: pw.exe })
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    page.on("console", (m) => m.type() === "error" && seen.errors.push(`console: ${m.text()}`))
    page.on("pageerror", (e) => seen.errors.push(`page error: ${e.message}`))
    page.on("requestfailed", (r) => seen.errors.push(`failed: ${r.url()} (${r.failure()?.errorText})`))
    page.on("response", (r) => r.status() >= 400 && seen.errors.push(`${r.status()}: ${r.url()}`))

    const res = await page.goto(url, { waitUntil: "networkidle", timeout: 2 * MIN })
    t.ok(res?.status() === 200, "the page comes through the proxy (200)", `status ${res?.status()}`)
    // A white page passes every status check, so look at what is drawn:
    // the heading, the scan (fetched from the CLI's API once the script
    // runs), and no preview banner (which means the session never came).
    const heading = page.getByRole("heading", { name: "Welcome to Patina" })
    await heading.waitFor({ state: "visible", timeout: 30_000 }).catch(() => {})
    t.must(await heading.isVisible(), "the page renders: “Welcome to Patina” is visible", (await page.locator("body").innerText().catch(() => "")).slice(0, 300) || "(no text)")
    const scan = page.getByText("The scan found:")
    await scan.waitFor({ state: "visible", timeout: 30_000 }).catch(() => {})
    t.ok(await scan.isVisible(), "the welcome pane shows what the scan found (the CLI's session came through)")
    t.ok((await page.getByText("This is a preview").count()) === 0, "a live session, not the preview")
    const box = await page.getByText("Patina Setup Assistant", { exact: true }).last().boundingBox()
    t.ok(box && box.width > 0 && box.height > 0, "the window is drawn (styled, not a bare page)", JSON.stringify(box))
    t.ok(seen.errors.length === 0, "no console errors or failed requests on load", seen.errors.join("; "))
    const loadErrors = seen.errors.length

    const next = page.getByRole("button", { name: /^(Continue|Install|Done)$/ })
    const pick = (label) => page.getByText(label, { exact: true }).click()
    const title = async () => ((await page.locator("h2").first().textContent()) ?? "").trim()
    for (let i = 0; i < 15; i++) {
      await next.click()
      await page.waitForTimeout(250)
      const now = await title()
      seen.titles.push(now)
      if (now === "Ready to install") break
      if (now === "Who is the site about?") {
        if (other) {
          await pick("Other")
          seen.other = await page.getByLabel("In your words").inputValue()
        } else await pick("One person")
      } else if (now === "What should a visitor do first?") await pick("Look at the work")
      else if (now === "How much of the site becomes a desktop?") await pick("The whole site")
      else if (now === "Where is the real content?") await pick("This project")
      else if (now === "Choose a tone") await pick(tone)
      else if (now === "Your old addresses") await pick("Keep them working (recommended)")
      else if (now === "Some files are here already") {
        seen.files = await page.locator('ul[aria-label="Files already here"] li').allTextContents()
        await pick(replace === "keep" ? "Keep mine; add only what is missing" : "Replace them with Patina's (recommended)")
      } else if (now !== "Anything else?") seen.unknown = now
    }
    t.must(seen.titles.at(-1) === "Ready to install", "every pane answered, up to “Ready to install”", seen.titles.join(" → "))

    await next.click() // Install
    // Not getByRole("alert"): Next's route announcer is one, on every page.
    const done = page.getByRole("button", { name: "Done" })
    const stopped = page.getByRole("heading", { name: "The install stopped" })
    seen.outcome = await Promise.race([
      done.waitFor({ state: "visible", timeout: 10 * MIN }).then(() => "done"),
      stopped.waitFor({ state: "visible", timeout: 10 * MIN }).then(() => "error"),
    ]).catch(() => "timeout")
    if (seen.outcome === "error") seen.alert = await page.locator("[role=alert]").filter({ hasText: /\S/ }).first().innerText().catch(() => "")
    if (seen.outcome === "done") {
      seen.progress = (await page.locator("body").innerText()).match(/\d+ of \d+ items installed/)?.[0]
      for (let i = 0; i < 40 && !(await done.isEnabled()); i++) await page.waitForTimeout(250)
      await done.click()
      seen.closing = await page.getByText("You can close this page.").isVisible()
    }
    seen.laterErrors = seen.errors.slice(loadErrors)
    return seen
  } finally {
    await browser.close()
  }
}

/** init --setup in dir, its page answered to the end: what the walk saw,
 *  and init's exit code and output once it is over. */
async function initByPage(t, pw, dir, name, walk) {
  const openLog = path.join(RUN, `${name}-open.log`)
  const p = startCli(["init", "--setup", "--registry", REGISTRY], { cwd: dir, name, extraEnv: { PATINA_OPEN_LOG: openLog } })
  try {
    const seen = await walkSetup(pw, await setupUrl(p, openLog, t), walk, t)
    return { seen, code: await p.wait(5 * MIN), out: p.text() }
  } finally {
    p.stop()
  }
}

/**
 * Answer init's terminal questions: when the output has gone quiet on a
 * prompt, the first rule whose pattern fits the last line types its keys.
 */
function answerPrompts(p, rules) {
  let answered = -1
  const timer = setInterval(() => {
    const s = p.text()
    if (Date.now() - p.lastData < 400 || s.length === answered) return
    const last = s.slice(s.lastIndexOf("\n") + 1)
    const rule = rules.find(([re]) => re.test(last))
    if (!rule) return
    answered = s.length
    p.send(rule[1])
  }, 150)
  p.exited.then(() => clearInterval(timer))
}

/* ─────────────────────────────────────────────── cases */

class Skip extends Error {}
class Abort extends Error {}

/** A case's checks: ok() records one, must() stops the case when it fails. */
function checker(name) {
  const t = { name, checks: [], notes: [] }
  t.ok = (cond, what, detail) => {
    t.checks.push({ ok: !!cond, what, ...(cond ? {} : { detail: detail === undefined ? undefined : String(detail).slice(0, 1500) }) })
    return !!cond
  }
  t.must = (cond, what, detail) => {
    if (!t.ok(cond, what, detail)) throw new Abort(what)
    return cond
  }
  t.skip = (why) => {
    throw new Skip(why)
  }
  t.note = (s) => t.notes.push(s)
  /** A fresh copy of the template for this case. */
  t.fresh = (label = name) => copy(template(), path.join(RUN, label))
  return t
}

/** An installed project to start from: the flags case's, or one made now. */
let installedDir = null
async function installed(t) {
  if (installedDir) return installedDir
  const dir = path.join(RUN, "installed")
  copy(template(), dir)
  const r = await cli(["init", "--yes", "--tone", "aqua", "--desktop", "--registry", REGISTRY], { cwd: dir, name: "installed-init" })
  t.must(r.code === 0 && exists(dir, "patina.json"), "an installed project to start from (init --yes --tone aqua --desktop)", tail(r.out))
  return (installedDir = dir)
}

const CASES = []
const kase = (name, what, fn) => CASES.push({ name, what, fn })

kase("help", "help names --setup, outdated and other=; init --help installs nothing", async (t) => {
  const r = await cli(["help"], { cwd: RUN, name: "help" })
  t.ok(r.code === 0, "`help` exits 0", `exit ${r.code}`)
  for (const s of ["--setup", "outdated", "other="]) t.ok(r.out.includes(s), `help mentions ${s}`)
  const dir = path.join(RUN, "help-project")
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, "package.json"), "{}\n")
  const before = hashTree(dir)
  const h = await cli(["init", "--help"], { cwd: dir, name: "init-help" })
  t.ok(h.code === 0, "`init --help` exits 0", `exit ${h.code}`)
  t.ok(treeDiff(before, hashTree(dir)).length === 0, "`init --help` writes nothing", treeDiff(before, hashTree(dir)).join(", "))
})

kase("outdated", "outdated exits 0 and says the right thing in four states", async (t) => {
  if (!(await helpText()).includes("outdated")) t.skip("this CLI has no `outdated` (its help does not name it)")
  const latest = await latestTag()
  if (!latest) t.note("could not ask GitHub for the latest release; the version in the messages is not checked")
  const states = [
    ["an older version", { version: "v0.4.1" }, latest ? new RegExp(`Patina ${latest.replace(/\./g, "\\.")} is out; this project has v0\\.4\\.1`) : /Patina \S+ is out; this project has v0\.4\.1/],
    ["the latest version", latest ? { version: latest } : null, /Up to date/],
    ["no version", { items: ["theme"] }, /not recorded/],
    ["no patina.json", undefined, /Patina is not installed here/],
  ]
  for (const [label, manifest, want] of states) {
    if (manifest === null) {
      t.note(`${label}: not run (no latest release to write)`)
      continue
    }
    const dir = path.join(RUN, `outdated-${label.replace(/\W+/g, "-")}`)
    fs.mkdirSync(dir, { recursive: true })
    if (manifest) fs.writeFileSync(path.join(dir, "patina.json"), `${JSON.stringify(manifest, null, 2)}\n`)
    const r = await cli(["outdated"], { cwd: dir, name: `outdated-${label.replace(/\W+/g, "-")}`, timeout: 2 * MIN })
    t.ok(r.code === 0, `${label}: exits 0`, `exit ${r.code}\n${tail(r.out)}`)
    t.ok(want.test(r.out), `${label}: says ${want}`, tail(r.out))
  }
})

kase("flags", "init --yes --tone aqua --desktop: files, version, licence line, /check-y2k, next build", async (t) => {
  const dir = t.fresh("flags")
  const r = await cli(["init", "--yes", "--tone", "aqua", "--desktop", "--registry", REGISTRY], { cwd: dir, name: "flags-init" })
  t.must(r.code === 0, "init exits 0", `exit ${r.code}\n${tail(r.out)}`)
  if (!installedDir) installedDir = copy(dir, path.join(RUN, "installed"))

  for (const rel of [...COPIES, "patina.json", "components/ui/button.tsx", "components/ui/window.tsx", "components/ui/table.tsx", "components/ui/menu-bar.tsx", "components/ui/icons.tsx", "lib/content.ts", "components/desktop/desktop.tsx", "content/site.ts"]) {
    t.ok(exists(dir, rel), `${rel} is there`)
  }
  t.ok(exists(dir, ".claude/skills/y2k-ify") && exists(dir, ".claude/skills/check-y2k"), "both skills' folders are there")
  const manifest = json(dir, "patina.json")
  const want = `v${cliVersion()}`
  t.ok(manifest?.version === want, `patina.json records version ${want}`, `version: ${JSON.stringify(manifest?.version)}`)
  await recordsEveryFile(t, dir)
  t.ok(manifest?.brief?.answeredBy === "flags", "the brief was answered by flags", manifest?.brief?.answeredBy)
  t.ok(/<html[^>]*data-tone="aqua"/.test(read(dir, "app/layout.tsx")), "data-tone=\"aqua\" is on <html>")
  t.ok(/@\/components\/desktop\/desktop/.test(read(dir, "app/page.tsx")), "app/page.tsx renders the desktop")
  t.ok(!GENERATOR.test(read(dir, "app/layout.tsx")), "the layout has no generator tag of its own: the desktop carries one")

  // Every source file the pack installed ends with its licence line.
  const sources = Object.keys(manifest?.files ?? {}).filter((rel) => /\.(tsx?|css|mjs)$/.test(rel) && exists(dir, rel))
  const unsigned = sources.filter((rel) => !read(dir, rel).trimEnd().split("\n").pop().includes("© 2026 Olivia Forster"))
  t.ok(sources.length > 0 && unsigned.length === 0, `all ${sources.length} .ts/.tsx/.css/.mjs pack files end with “© 2026 Olivia Forster”`, `without it: ${unsigned.join(", ")}`)

  // The scan covers the whole project, and create-next-app's own layout
  // (Geist) is rightly an error until /y2k-ify restyles it; what must be
  // clean is everything the pack and init wrote.
  const check = await run("node", ["scripts/check-y2k.mjs", ".", "--json"], { cwd: dir, name: "flags-check-y2k", timeout: 3 * MIN })
  let findings = null
  try {
    findings = JSON.parse(check.out.slice(check.out.indexOf("{"))).findings
  } catch {
    /* not JSON: reported below */
  }
  t.must(findings && (check.code === 0 || check.code === 1), "node scripts/check-y2k.mjs . runs", `exit ${check.code}\n${tail(check.out)}`)
  const ours = new Set([...Object.keys(manifest?.files ?? {}), "content/site.ts", "app/page.tsx"])
  const errors = findings.filter((f) => f.severity === "error").map((f) => ({ ...f, rel: path.relative(dir, path.resolve(dir, f.file)) }))
  const mine = errors.filter((f) => ours.has(f.rel))
  t.ok(mine.length === 0, "check-y2k: 0 errors in the files the pack and init wrote", mine.map((f) => `${f.rel}:${f.line} ${f.rule} ${f.msg}`).join("\n"))
  const theirs = errors.filter((f) => !ours.has(f.rel))
  if (theirs.length) t.note(`check-y2k exits ${check.code}: ${theirs.length} error(s) in create-next-app's own files — ${theirs.map((f) => `${f.rel}:${f.line} ${f.rule}`).join(", ")}`)

  const build = await run("npx", ["next", "build"], { cwd: dir, name: "flags-next-build", timeout: 10 * MIN })
  t.ok(build.code === 0, "npx next build passes", `exit ${build.code}\n${tail(build.out, 25)}`)
})

kase("components", "init --scope components names Patina in the head; a later --desktop takes the line out", async (t) => {
  const dir = t.fresh("components")
  const r = await cli(["init", "--yes", "--tone", "lime", "--scope", "components", "--registry", REGISTRY], { cwd: dir, name: "components-init" })
  t.must(r.code === 0, "init exits 0", `exit ${r.code}\n${tail(r.out)}`)
  const layout = read(dir, "app/layout.tsx")
  t.ok(GENERATOR.test(layout), "the layout carries Patina's generator tag", tail(layout, 30))
  t.ok(/<body\b[^>]*>\s*\n\s*<meta name="generator"/.test(layout), "it is the first thing in <body> (React puts it in the head)")
  // The tag is written after the components, so they need not be added again.
  const again = await cli(["init", "--yes", "--force", "--no-components", "--tone", "lime", "--scope", "components", "--registry", REGISTRY], { cwd: dir, name: "components-again" })
  t.ok(again.code === 0 && read(dir, "app/layout.tsx").match(new RegExp(GENERATOR.source, "g"))?.length === 1, "a second run leaves one tag, not two", tail(again.out))
  const build = await run("npx", ["next", "build"], { cwd: dir, name: "components-next-build", timeout: 10 * MIN })
  t.ok(build.code === 0, "npx next build passes", `exit ${build.code}\n${tail(build.out, 25)}`)
  const html = exists(dir, ".next/server/app/index.html") ? read(dir, ".next/server/app/index.html") : ""
  const head = html.slice(0, html.indexOf("</head>"))
  t.ok(/<meta name="generator" content="Patina OS — built by Olivia Forster"\/?>/.test(head), "the built page has it in its <head>", head.slice(-400))
  const desk = await cli(["init", "--yes", "--force", "--tone", "lime", "--desktop", "--registry", REGISTRY], { cwd: dir, name: "components-then-desktop" })
  t.ok(desk.code === 0 && !GENERATOR.test(read(dir, "app/layout.tsx")), "made a desktop later, the layout's line is taken out", tail(desk.out))
})

kase("dry-run", "init --dry-run writes nothing, fresh or installed (--force)", async (t) => {
  const fresh = t.fresh("dry-run-fresh")
  const before = hashTree(fresh)
  const r = await cli(["init", "--dry-run", "--tone", "lime", "--desktop", "--registry", REGISTRY], { cwd: fresh, name: "dry-run-fresh" })
  t.ok(r.code === 0, "fresh: exits 0", `exit ${r.code}\n${tail(r.out)}`)
  t.ok(/dry run/i.test(r.out), "fresh: says it is a dry run")
  const diff = treeDiff(before, hashTree(fresh))
  t.ok(diff.length === 0, "fresh: nothing written", diff.join("\n"))

  const dir = copy(await installed(t), path.join(RUN, "dry-run-installed"))
  const before2 = hashTree(dir)
  const r2 = await cli(["init", "--dry-run", "--force", "--tone", "grape", "--desktop", "--registry", REGISTRY], { cwd: dir, name: "dry-run-installed" })
  t.ok(r2.code === 0, "installed, --force: exits 0", `exit ${r2.code}\n${tail(r2.out)}`)
  const diff2 = treeDiff(before2, hashTree(dir))
  t.ok(diff2.length === 0, "installed, --force: nothing written", diff2.join("\n"))
})

kase("setup", "init --setup with no terminal: the page renders through the proxy, every pane, then the install", async (t) => {
  const pw = playwright()
  if (!pw.chromium) t.skip(pw.why)
  const dir = t.fresh("setup")
  const { seen, code, out } = await initByPage(t, pw, dir, "setup-init", { tone: "Lime", other: true })
  t.ok(seen.other === NOT_SURE || seen.other === `${NOT_SURE}.`, `“Other” comes with “${NOT_SURE}” in its field`, JSON.stringify(seen.other))
  t.ok(!seen.unknown, "no pane the walk did not know", seen.unknown)
  t.ok(seen.outcome === "done", "the page reaches Done", `${seen.outcome}${seen.alert ? `: ${seen.alert}` : ""}`)
  t.ok(seen.closing, "Done says “You can close this page.”")
  t.ok(seen.laterErrors.length === 0, "no console errors while answering and installing", seen.laterErrors.join("; "))
  t.ok(code === 0, "init exits 0 after the last pane", `exit ${code}\n${tail(out)}`)
  for (const rel of [...COPIES, "patina.json", "components/ui/button.tsx", "components/desktop/desktop.tsx"]) t.ok(exists(dir, rel), `${rel} is there`)
  const brief = json(dir, "patina.json")?.brief
  await recordsEveryFile(t, dir)
  t.ok(brief?.answeredBy === "setup", "the brief was answered in the browser", brief?.answeredBy)
  t.ok(brief?.answers?.look?.tone === "lime", "the tone chosen (lime) is the brief's", brief?.answers?.look?.tone)
  t.ok(brief?.answers?.about?.kind === "other" && (brief?.answers?.notes?.about ?? "").startsWith(NOT_SURE), "“Other” and its words are in the brief", JSON.stringify(brief?.answers?.notes))
  t.ok(/<html[^>]*data-tone="lime"/.test(read(dir, "app/layout.tsx")), "data-tone=\"lime\" is on <html>")
})

/** Make the local edit, and what the pack's files and the edit's
 *  fingerprint are before a re-run. */
function beforeRerun(dir) {
  fs.appendFileSync(path.join(dir, EDITED), EDIT)
  return { hashes: packHashes(dir), print: json(dir, "patina.json")?.files?.[EDITED] }
}

/** What a re-run should leave: keep changes no pack file (the edit stays,
 *  and stays marked as an edit for update); replace rewrites them. */
function afterRerun(t, dir, choice, before) {
  const edited = read(dir, EDITED).includes(EDIT.trim())
  if (choice === "keep") {
    // The same files as before: the re-run's answers may list fewer items.
    const changed = Object.keys(before.hashes).filter((rel) => before.hashes[rel] !== hashOf(dir, rel))
    t.ok(changed.length === 0, "keep: every pack file's hash is unchanged", changed.join(", "))
    t.ok(edited, `keep: the local edit to ${EDITED} is still there`)
    const print = json(dir, "patina.json")?.files?.[EDITED]
    t.ok(print === before.print, `keep: patina.json still has ${EDITED}'s fingerprint as installed, so update keeps the edit`, `before ${before.print}, after ${print}`)
  } else {
    t.ok(!edited, `replace: ${EDITED} is rewritten (the local edit is gone)`)
  }
}

kase("rerun-tty", "init --terminal at a terminal on an installed project: replace? keep, then replace", async (t) => {
  const base = await installed(t)
  for (const choice of ["keep", "replace"]) {
    const dir = copy(base, path.join(RUN, `rerun-tty-${choice}`))
    const before = beforeRerun(dir)
    const p = startCli(["init", "--terminal", "--registry", REGISTRY], { cwd: dir, name: `rerun-tty-${choice}`, tty: true })
    answerPrompts(p, [
      [/replace them with the pack's\? \[y\/N\] $/, choice === "keep" ? "n\r" : "y\r"],
      [/items\? \[Y\/n\] $/, "y\r"],
      [/Choose \[1-5\]: $/, "2\r"], // the tone has no default: Aqua, as installed
      [/: $/, "\r"], // everything else: its default
      // shadcn's own confirmation (prompts: a key, no Return), after ours.
      [/\(y\/N\)\s*$/, "y"],
    ])
    const code = await p.wait(6 * MIN)
    const out = p.text()
    t.ok(/replace them with the pack's\?/.test(out), `${choice}: the “replace them?” question appears`, tail(out))
    t.ok(code === 0, `${choice}: exits 0`, `exit ${code}\n${tail(out)}`)
    afterRerun(t, dir, choice, before)
  }
})

kase("rerun-page", "init --setup on an installed project: the files-here pane, keep, then replace", async (t) => {
  const pw = playwright()
  if (!pw.chromium) t.skip(pw.why)
  const base = await installed(t)
  for (const choice of ["keep", "replace"]) {
    const dir = copy(base, path.join(RUN, `rerun-page-${choice}`))
    const before = beforeRerun(dir)
    const { seen, code, out } = await initByPage(t, pw, dir, `rerun-page-${choice}`, { tone: "Aqua", replace: choice })
    t.ok(seen.titles.includes("Some files are here already"), `${choice}: the files-here pane appears`, seen.titles.join(" → "))
    t.ok(seen.files.includes(EDITED), `${choice}: it lists the pack's files (${EDITED} among them)`, seen.files.join(", "))
    t.ok(seen.outcome === "done", `${choice}: the page reaches Done`, `${seen.outcome}${seen.alert ? `: ${seen.alert}` : ""}`)
    t.ok(code === 0, `${choice}: init exits 0`, `exit ${code}\n${tail(out)}`)
    afterRerun(t, dir, choice, before)
  }
})

kase("update", "install with @pat1na/cli@0.4.1, edit a file, update with the CLI under test", async (t) => {
  const dir = t.fresh("update")
  const r = await run("npx", ["--yes", "@pat1na/cli@0.4.1", "init", "--yes", "--tone", "aqua", "--registry", REGISTRY], { cwd: dir, name: "update-init-0.4.1" })
  t.must(r.code === 0 && exists(dir, "patina.json"), "@pat1na/cli@0.4.1 init --yes --tone aqua installs", `exit ${r.code}\n${tail(r.out)}`)
  const installedBy041 = json(dir, "patina.json")
  t.note(`0.4.1 recorded version ${installedBy041?.version}`)
  // Update can only know an edit by a fingerprint; 0.4.1 may have left some
  // out (it drops an item it failed to read), so edit one it recorded.
  const edited = installedBy041?.files?.[EDITED] ? EDITED : Object.keys(installedBy041?.files ?? {}).find((rel) => /^components\/ui\/.*\.tsx$/.test(rel))
  t.must(edited, "0.4.1 recorded a component's fingerprint to edit", Object.keys(installedBy041?.files ?? {}).join(", "))
  if (edited !== EDITED) t.note(`0.4.1 recorded no fingerprint for ${EDITED}; edited ${edited} instead`)
  fs.appendFileSync(path.join(dir, edited), EDIT)

  const u = await cli(["update"], { cwd: dir, name: "update" })
  t.ok(u.code === 0, "update exits 0", `exit ${u.code}\n${tail(u.out)}`)
  t.ok(u.out.includes(`${edited} — changed here since it was installed; kept`), `update says it kept ${edited}`, tail(u.out))
  t.ok(read(dir, edited).includes(EDIT.trim()), `the edit to ${edited} is still there`)

  const latest = await latestTag()
  const manifest = json(dir, "patina.json")
  if (!latest) return t.note("could not ask GitHub for the latest release; the files were not compared with it")
  t.ok(manifest?.version === latest, `patina.json records the latest release, ${latest}`, manifest?.version)

  // Every other file as the release has it, read straight from the tag.
  const raw = (rel) => fetch(`https://raw.githubusercontent.com/${REPO}/${latest}/${rel}`).then((res) => (res.ok ? res.text() : null))
  const withoutLead = (s) => s.replace(/^\s*(?:\/\*[\s\S]*?\*\/\s*)+/, "")
  const [items, copies] = await Promise.all([
    Promise.all((manifest?.items ?? []).map((item) => raw(`apps/web/public/r/${item}.json`))),
    Promise.all(COPIES.map(async (rel) => [rel, await raw(rel)])),
  ])
  const wanted = [...items.flatMap((text) => (text ? JSON.parse(text).files ?? [] : []).map((f) => [f.target ?? f.path, f.content])), ...copies]
  const differ = wanted.filter(([rel, content]) => rel !== edited && content !== null && (!exists(dir, rel) || (read(dir, rel) !== content && read(dir, rel) !== withoutLead(content)))).map(([rel]) => rel)
  t.ok(wanted.length > 10 && differ.length === 0, `the other ${wanted.length - 1} files match ${latest}`, `differ: ${differ.join(", ")}`)
})

/* ─────────────────────────────────────────────── run */

const only = opt.only?.split(",").map((s) => s.trim()).filter(Boolean)
const chosen = only ? CASES.filter((c) => only.some((o) => c.name === o || c.name.startsWith(o))) : CASES
if (!chosen.length) {
  console.error(`e2e: no case matches --only ${opt.only}. The cases: ${CASES.map((c) => c.name).join(", ")}`)
  process.exit(2)
}

console.log(`\nPatina CLI end-to-end\n  cli       ${CLI_IS_PATH ? path.resolve(CLI) : CLI}\n  registry  ${REGISTRY}\n  work      ${RUN}\n`)
const results = []
for (const c of chosen) {
  const t = checker(c.name)
  const began = Date.now()
  process.stdout.write(`  ${c.name.padEnd(11)} ${c.what}… `)
  let result = "pass"
  let why = ""
  try {
    await c.fn(t)
    if (t.checks.some((k) => !k.ok)) result = "FAIL"
  } catch (err) {
    if (err instanceof Skip) {
      result = "skipped"
      why = err.message
    } else {
      result = "FAIL"
      if (!(err instanceof Abort)) t.ok(false, "the case ran to the end", err.stack)
    }
  }
  const secs = Math.round((Date.now() - began) / 1000)
  results.push({ case: c.name, result, secs, why, checks: t.checks, notes: t.notes })
  console.log(`${result} (${secs}s)`)
  for (const k of t.checks.filter((k) => !k.ok)) console.log(`      ✗ ${k.what}${k.detail ? `\n${String(k.detail).replace(/^/gm, "          ")}` : ""}`)
}

const width = Math.max(...results.map((r) => r.case.length))
console.log(`\n  ${"case".padEnd(width)}  result   time   checks  note`)
for (const r of results) {
  const passed = r.checks.filter((k) => k.ok).length
  const note = r.why || r.checks.find((k) => !k.ok)?.what || r.notes[0] || ""
  console.log(`  ${r.case.padEnd(width)}  ${r.result.padEnd(7)}  ${`${r.secs}s`.padStart(5)}  ${`${passed}/${r.checks.length}`.padStart(6)}  ${note}`)
}
fs.writeFileSync(path.join(RUN, "results.json"), `${JSON.stringify({ cli: CLI, registry: REGISTRY, results }, null, 2)}\n`)
console.log(`\n  logs and results.json in ${RUN}\n`)
process.exit(results.some((r) => r.result === "FAIL") ? 1 : 0)
