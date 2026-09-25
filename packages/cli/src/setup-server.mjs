/**
 * The Setup Assistant's local server.
 *
 * `init` starts it on 127.0.0.1 at a free port and opens the page in the
 * browser. The browser only ever talks to this server — the page, its
 * assets and the API share one origin, so there is no mixed content and no
 * Private Network Access prompt:
 *
 *   GET  /api/patina/session?t=T   what the scan found, the questions, the prefills
 *   POST /api/patina/answers?t=T   the answers → the install starts
 *   GET  /api/patina/status?t=T    how the install is going (polled)
 *   GET  <prefix>/*                the page and its assets, proxied from the
 *                                  setup origin (the demo site on Pages)
 *
 * The token is random per run and required on every API call: another
 * page open in the same browser cannot read the project or start an
 * install. Nothing else is served. Zero dependencies: node:http and fetch.
 */

import http from "node:http"
import crypto from "node:crypto"
import { spawn } from "node:child_process"
import { Readable } from "node:stream"

import { checkAnswers } from "./brief.mjs"

const API = "/api/patina/"
const IDLE_MS = 30 * 60 * 1000
const AFTER_DONE_MS = 10 * 1000
const BODY_LIMIT = 256 * 1024

/** The setup origin and the page's prefix from the registry URL: the
 *  registry is `<origin><prefix>/r`, the page `<origin><prefix>/setup/`. */
export function setupOriginOf(registry) {
  const u = new URL(registry.replace(/\/+$/, "").replace(/\/r$/, ""))
  return { origin: u.origin, prefix: u.pathname.replace(/\/$/, "") }
}

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" })
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on("data", (c) => {
      size += c.length
      if (size > BODY_LIMIT) {
        reject(new Error("body too large"))
        req.destroy()
      } else chunks.push(c)
    })
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    req.on("error", reject)
  })
}

/** Open a URL in the person's browser, whichever platform; a failure to
 *  open is not an error, since the URL is printed too. */
export function openInBrowser(url) {
  const [cmd, args] =
    process.platform === "darwin" ? ["open", [url]] : process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : ["xdg-open", [url]]
  try {
    const child = spawn(cmd, args, { stdio: "ignore", detached: true })
    child.on("error", () => {})
    child.unref()
  } catch {
    /* no opener: the URL is on screen */
  }
}

/**
 * Start the server. Resolves with the handle once it listens:
 *   url        — the page's address, token included; print it
 *   answers    — resolves with the Answers once the page posts them, or
 *                null after 30 minutes with none
 *   setStatus  — what /status reports from now on
 *   finish     — resolves when the page has fetched `phase: "done"` once
 *                (or 10 s after done was set), then closes the server
 *   close      — close now
 */
export async function startSetupServer({ session, registry, open = true }) {
  const { origin, prefix } = setupOriginOf(registry)
  const token = crypto.randomBytes(16).toString("hex")

  let status = { phase: "waiting", done: 0, total: 0 }
  let resolveAnswers
  let resolveDoneSeen
  const answers = new Promise((r) => (resolveAnswers = r))
  const doneSeen = new Promise((r) => (resolveDoneSeen = r))
  let answered = false

  const idle = setTimeout(() => resolveAnswers(null), IDLE_MS)
  idle.unref()

  const api = async (req, res, url) => {
    if (url.searchParams.get("t") !== token) return sendJson(res, 403, { error: "This page was opened without the token init printed. Open the URL from the terminal." })
    const route = url.pathname.slice(API.length)
    if (route === "session" && req.method === "GET") return sendJson(res, 200, session)
    if (route === "status" && req.method === "GET") {
      if (status.phase === "done" || status.phase === "error") resolveDoneSeen()
      return sendJson(res, 200, status)
    }
    if (route === "answers" && req.method === "POST") {
      if (answered) return sendJson(res, 409, { error: "The answers were already received; the install is under way." })
      let body
      try {
        body = JSON.parse(await readBody(req))
      } catch {
        return sendJson(res, 400, { error: "The body must be JSON." })
      }
      const bad = checkAnswers(body)
      if (bad.length) return sendJson(res, 400, { error: "Some answers are not among the options.", details: bad })
      answered = true
      clearTimeout(idle)
      sendJson(res, 200, { ok: true })
      resolveAnswers(body)
      return
    }
    return sendJson(res, 404, { error: "No such call." })
  }

  /** The page and its assets, from the setup origin, as they come:
   *  status and content type through, never cached. Not the length: fetch
   *  asks for gzip and hands back the body unzipped, so the origin's
   *  content-length is the zipped one, and a browser would cut every file
   *  short at it. */
  const proxy = async (req, res, url) => {
    let upstream
    try {
      upstream = await fetch(`${origin}${url.pathname}${url.search}`, { redirect: "follow", headers: { accept: req.headers.accept ?? "*/*" } })
    } catch (err) {
      res.writeHead(502, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" })
      return res.end(`Could not reach ${origin}: ${err.message}\nThe setup page lives there; check the connection, or run again with --terminal.\n`)
    }
    const headers = { "cache-control": "no-store" }
    for (const h of ["content-type", "last-modified", "etag"]) if (upstream.headers.has(h)) headers[h] = upstream.headers.get(h)
    res.writeHead(upstream.status, headers)
    if (!upstream.body) return res.end()
    Readable.fromWeb(upstream.body).on("error", () => res.destroy()).pipe(res)
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1")
    if (url.pathname.startsWith(API)) return api(req, res, url).catch((err) => sendJson(res, 500, { error: err.message }))
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { "content-type": "text/plain; charset=utf-8" })
      return res.end("Only GET.\n")
    }
    if (url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)) return proxy(req, res, url)
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" })
    res.end("Not here.\n")
  })

  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })
  const { port } = server.address()
  const url = `http://127.0.0.1:${port}${prefix}/setup/?t=${token}`
  if (open) openInBrowser(url)

  const close = () =>
    new Promise((resolve) => {
      clearTimeout(idle)
      server.closeAllConnections?.()
      server.close(() => resolve())
    })

  return {
    url,
    port,
    token,
    answers,
    setStatus(next) {
      status = { ...status, ...next }
    },
    async finish() {
      if (status.phase !== "done" && status.phase !== "error") status = { ...status, phase: "done" }
      const grace = new Promise((r) => setTimeout(r, AFTER_DONE_MS).unref())
      await Promise.race([doneSeen, grace])
      await close()
    },
    close,
  }
}
