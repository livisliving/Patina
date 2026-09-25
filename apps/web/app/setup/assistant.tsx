"use client"

import * as React from "react"
import {
  Button,
  Checkbox,
  IconInfo,
  IconWarning,
  Progress,
  Radio,
  RadioGroup,
  TextField,
  Wallpaper,
  WindowAlert,
  WindowFrame,
  WindowWell,
  cn,
} from "@patina/ui"

import { asset } from "@/components/asset"
import { Mono } from "@/components/mono"
import { TONES } from "@/components/tones"
import { SAMPLE, sampleItems } from "./sample"
import type { Answers, Project, Question, QuestionId, Session, Status, Tone } from "./types"

/**
 * The Patina Setup Assistant — `npx @pat1na/cli init`'s questions as a
 * Mac OS X 10.0 Setup Assistant (Aqua HIG 2002, ch. 14): an Introduction,
 * one question to a pane, Go Back and Continue at the foot with Continue the
 * default button, a progress bar to the left of Go Back, and a Conclusion.
 * The grammar is the desktop's Steps block (blocks-more.tsx › Steps): the
 * counter in 11px secondary ink, the pane in a sunken well.
 *
 * The CLI serves the page and its API from one origin; the API sits at the
 * origin's root (not under the base path) and every call echoes the page's
 * `?t=` token. When the session can't be fetched — the page opened on
 * GitHub Pages, or in `next dev` — it runs on a sample project (demo mode)
 * and says so at the top.
 */

/** The demo's own wallpapers, a 16:9 one and a phone one per tone; the tone
 *  on <html> picks one (Wallpaper). */
const WALLPAPERS = Object.fromEntries(
  TONES.map((t) => [t.id, { desktop: asset(`/wallpapers/${t.id}.webp`), mobile: asset(`/wallpapers/${t.id}-mobile.webp`) }])
)

const API = "/api/patina"
const NOT_ANSWERING = "The installer is not answering."

/** DESIGN.md's `body-sm`: the only size secondary ink may take. */
const SMALL = "text-[11px] leading-[1.35] text-(--y2k-ink-secondary)"

/* ── The answers being drawn up ───────────────────────────────────── */

/** What the panes hold while the person answers: a choice per question, the
 *  checked options of a question that takes several, the text fields (keyed
 *  `question.field`, or `question.option` for an option's own field), the
 *  pages kept at hand and the tools that keep their pages. */
type Draft = {
  choice: Partial<Record<QuestionId, string>>
  checks: Partial<Record<QuestionId, string[]>>
  text: Record<string, string>
  featured: string[]
  keep: string[]
}

const tools = (p: Project) => p.routes.filter((r) => r.guess === "tool").map((r) => r.path)
/** The pages that can be kept at hand: not the home page (it is the desktop
 *  itself) and not a detail template (`/work/[slug]` is not one page). */
const pickable = (p: Project) => p.routes.filter((r) => r.guess !== "home" && r.guess !== "detail").map((r) => r.path)

function draftFrom({ defaults: d, project }: Session): Draft {
  const text: Record<string, string> = {}
  const put = (k: string, v?: string) => {
    if (v) text[k] = v
  }
  put("about.name", d.about?.name)
  put("about.role", d.about?.role)
  put("look.volume", d.look?.volume)
  put("look.description", d.look?.description ?? project.description)
  if (d.source?.kind) put(`source.${d.source.kind}`, d.source.where)
  put("extras.wallpaper", d.extras?.wallpaper)
  const x = d.extras
  return {
    choice: {
      about: d.about?.kind,
      first: d.first?.goal,
      scope: d.scope,
      source: d.source?.kind,
      look: d.look?.tone,
      oldUrls: d.oldUrls ?? undefined,
    },
    checks: {
      extras: [x?.ipod && "ipod", x?.wallpaper && "wallpaper", x?.visitorCounter && "visitor-counter", x?.marquee && "marquee"].filter(
        (v): v is string => !!v
      ),
    },
    text,
    featured: (d.first?.featured ?? []).filter((r) => pickable(project).includes(r)).slice(0, 3),
    keep: d.keepRoutes ?? tools(project),
  }
}

const filled = (d: Draft, k: string) => !!d.text[k]?.trim()

/** A pane has its answer: a choice (for a question that takes one), a path
 *  in the field of the option chosen, and every text field filled. */
function answered(q: Question, d: Draft) {
  const fields = (q.fields ?? []).every((f) => f.optional || filled(d, `${q.id}.${f.id}`))
  const optionField = (v: string) => !q.options.find((o) => o.value === v)?.field || filled(d, `${q.id}.${v}`)
  if (q.multiple) return fields && (d.checks[q.id] ?? []).every(optionField)
  const v = d.choice[q.id]
  return !!v && q.options.some((o) => o.value === v) && optionField(v) && fields
}

/** The Answers the CLI takes. With no desktop — or when the CLI didn't ask —
 *  the first thing to do and the old addresses are null; only the tools of a
 *  content desktop keep pages. */
function toAnswers(d: Draft): Answers {
  const t = (k: string) => (d.text[k] ?? "").trim()
  const scope = (d.choice.scope ?? "whole") as Answers["scope"]
  const desktop = scope !== "components"
  const kind = (d.choice.source ?? "project") as Answers["source"]["kind"]
  const extras = d.checks.extras ?? []
  return {
    about: { kind: d.choice.about as Answers["about"]["kind"], name: t("about.name"), role: t("about.role") },
    first: desktop && d.choice.first ? { goal: d.choice.first as NonNullable<Answers["first"]>["goal"], featured: d.featured } : null,
    scope,
    keepRoutes: scope === "content" ? d.keep : [],
    source: kind !== "project" && t(`source.${kind}`) ? { kind, where: t(`source.${kind}`) } : { kind },
    look: { tone: (d.choice.look ?? "pink") as Tone, volume: t("look.volume"), description: t("look.description") },
    extras: {
      ipod: extras.includes("ipod"),
      ...(extras.includes("wallpaper") && { wallpaper: t("extras.wallpaper") }),
      visitorCounter: extras.includes("visitor-counter"),
      marquee: extras.includes("marquee"),
    },
    oldUrls: desktop ? ((d.choice.oldUrls ?? null) as Answers["oldUrls"]) : null,
  }
}

/* ── Panes ────────────────────────────────────────────────────────── */

type PaneId = "welcome" | QuestionId | "ready" | "install"

/** The install as the page sees it: not started, or the CLI's Status. */
type Run = Status | { phase: "idle"; done: number; total: number; current?: string; message?: string }

/** A label beside its value, as Show Info lists a file's properties (the
 *  desktop's `facts` block): right-aligned 11px labels, 13px values. */
function Facts({ rows }: { rows: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1">
      {rows.map((r) => (
        <React.Fragment key={r.label}>
          <dt className="text-right text-[11px] leading-[1.35] text-(--y2k-ink-secondary)">{r.label}</dt>
          <dd className="min-w-0 break-words">{r.value}</dd>
        </React.Fragment>
      ))}
    </dl>
  )
}

function Welcome({ project }: { project?: Project }) {
  return (
    <>
      <p>
        This assistant asks a few questions about your site, then installs the pack. Your answers are saved in patina.json, where your
        agent reads them when it turns your pages into a desktop.
      </p>
      {project && (
        <div className="mt-4">
          <p className="mb-2">The scan found:</p>
          <Facts
            rows={[
              { label: "Project", value: project.name },
              { label: "Framework", value: project.framework },
              { label: "Pages", value: project.routes.length },
              { label: "Forms", value: project.forms.length ? project.forms.join(", ") : "None" },
              ...(project.title ? [{ label: "Title", value: project.title }] : []),
            ]}
          />
        </div>
      )}
    </>
  )
}

/** One question's controls: its options (radio buttons, or check boxes for a
 *  question that takes several), each option's own field, the routes it
 *  picks from, then its text fields in a 2001 dialog's columns. */
function QuestionControls({
  q,
  d,
  set,
  project,
  labelledBy,
}: {
  q: Question
  d: Draft
  set: (f: (d: Draft) => Draft) => void
  project: Project
  labelledBy: string
}) {
  const id = React.useId()
  const text = (k: string) => d.text[k] ?? ""
  const setText = (k: string, v: string) => set((d) => ({ ...d, text: { ...d.text, [k]: v } }))
  const chosen = (v: string) => (q.multiple ? (d.checks[q.id] ?? []).includes(v) : d.choice[q.id] === v)

  /** An option's own field (a URL, a folder), beside its label: live while
   *  its option is chosen, dimmed otherwise. */
  const optionField = (o: Question["options"][number]) =>
    o.field && (
      <TextField
        aria-label={o.field.label}
        placeholder={o.field.placeholder}
        value={text(`${q.id}.${o.value}`)}
        disabled={!chosen(o.value)}
        onChange={(e) => setText(`${q.id}.${o.value}`, e.target.value)}
        className="w-full sm:w-64"
      />
    )

  const detail = (o: Question["options"][number]) => o.era && <p className={cn(SMALL, "pl-6")}>{o.era}</p>

  const options = q.multiple ? (
    <div role="group" aria-labelledby={labelledBy} className="flex flex-col gap-2">
      {q.options.map((o) => (
        <div key={o.value} className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Checkbox
            label={o.label}
            checked={chosen(o.value)}
            onCheckedChange={(on) =>
              set((d) => {
                const now = (d.checks[q.id] ?? []).filter((v) => v !== o.value)
                return { ...d, checks: { ...d.checks, [q.id]: on === true ? [...now, o.value] : now } }
              })
            }
          />
          {optionField(o)}
          {detail(o)}
        </div>
      ))}
    </div>
  ) : (
    <RadioGroup
      aria-labelledby={labelledBy}
      value={d.choice[q.id] ?? ""}
      onValueChange={(v) => set((d) => ({ ...d, choice: { ...d.choice, [q.id]: v } }))}
      className="gap-2"
    >
      {q.options.map((o) => (
        <div key={o.value}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Radio value={o.value} label={o.label} />
            {optionField(o)}
          </div>
          {detail(o)}
          {/* scope › content: the tools found, each keeping its page while
              checked. */}
          {q.pick === "tools" && o.value === "content" && (
            <div className="mt-1 flex flex-col gap-1 pl-6">
              {tools(project).length ? (
                tools(project).map((r) => (
                  <Checkbox
                    key={r}
                    label={`${r} keeps its page`}
                    disabled={!chosen("content")}
                    checked={d.keep.includes(r)}
                    onCheckedChange={(on) =>
                      set((d) => ({ ...d, keep: on === true ? [...d.keep.filter((k) => k !== r), r] : d.keep.filter((k) => k !== r) }))
                    }
                  />
                ))
              ) : (
                <p className={SMALL}>The scan found no tools.</p>
              )}
            </div>
          )}
        </div>
      ))}
    </RadioGroup>
  )

  return (
    <>
      {options}
      {/* first: the pages to keep at hand, at most three. */}
      {q.pick === "routes" && (
        <div role="group" aria-labelledby={`${id}-routes`} className="mt-4">
          <p id={`${id}-routes`} className="mb-2">
            Pages to keep at hand <span className={SMALL}>(at most three)</span>
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
            {pickable(project).map((r) => {
              const on = d.featured.includes(r)
              return (
                <Checkbox
                  key={r}
                  label={r}
                  checked={on}
                  disabled={!on && d.featured.length >= 3}
                  onCheckedChange={(next) =>
                    set((d) => ({ ...d, featured: next === true ? [...d.featured.filter((f) => f !== r), r].slice(0, 3) : d.featured.filter((f) => f !== r) }))
                  }
                />
              )
            })}
          </div>
        </div>
      )}
      {q.fields?.length ? (
        <div className="mt-4 grid grid-cols-1 items-center gap-x-3 gap-y-2 sm:grid-cols-[auto_minmax(0,1fr)]">
          {q.fields.map((f) => (
            <React.Fragment key={f.id}>
              <label htmlFor={`${id}-${f.id}`} className="sm:text-right">
                {f.label}
              </label>
              <TextField
                id={`${id}-${f.id}`}
                placeholder={f.placeholder}
                value={text(`${q.id}.${f.id}`)}
                onChange={(e) => setText(`${q.id}.${f.id}`, e.target.value)}
                className="w-full"
              />
            </React.Fragment>
          ))}
        </div>
      ) : null}
    </>
  )
}

/** The Ready pane's summary: the answers as Show Info would list them. */
function summary(questions: Question[], d: Draft) {
  const a = toAnswers(d)
  const label = (id: QuestionId, v?: string | null) => questions.find((q) => q.id === id)?.options.find((o) => o.value === v)?.label ?? v ?? ""
  const has = (id: QuestionId) => questions.some((q) => q.id === id)
  const rows: { label: string; value: React.ReactNode }[] = []
  if (has("about")) rows.push({ label: "About", value: label("about", a.about.kind) }, { label: "Name", value: a.about.name }, { label: "What they do", value: a.about.role })
  if (has("first") && a.first)
    rows.push({ label: "First", value: label("first", a.first.goal) }, { label: "At hand", value: a.first.featured.join(", ") || "None" })
  if (has("scope")) {
    rows.push({ label: "Desktop", value: label("scope", a.scope) })
    if (a.scope === "content") rows.push({ label: "Own pages", value: a.keepRoutes.join(", ") || "None" })
  }
  if (has("source")) rows.push({ label: "Content from", value: a.source.where ? `${label("source", a.source.kind)}: ${a.source.where}` : label("source", a.source.kind) })
  if (has("look"))
    rows.push({ label: "Tone", value: label("look", a.look.tone) }, { label: "Volume", value: a.look.volume }, { label: "One line", value: a.look.description })
  if (has("extras")) {
    const x = (d.checks.extras ?? []).map((v) => (v === "wallpaper" && a.extras.wallpaper ? `${label("extras", v)}: ${a.extras.wallpaper}` : label("extras", v)))
    rows.push({ label: "Extras", value: x.join(", ") || "None" })
  }
  if (has("oldUrls") && a.oldUrls) rows.push({ label: "Old addresses", value: label("oldUrls", a.oldUrls) })
  return rows
}

/** Copies `/y2k-ify`: the clipboard where the page may use it (127.0.0.1 is
 *  a secure context), a selection copy where it may not. */
async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    const el = document.createElement("textarea")
    el.value = value
    document.body.append(el)
    el.select()
    const ok = document.execCommand("copy")
    el.remove()
    return ok
  }
}

function Install({ run, onCopy, copied, closing }: { run: Run; onCopy: () => void; copied: boolean; closing: boolean }) {
  if (run.phase === "error")
    return (
      <WindowAlert
        role="alert"
        className="p-0"
        icon={<IconWarning />}
        message={run.message || "The installer reported an error."}
        informative={
          <>
            Go Back to try again, or look at the terminal where you ran <Mono>npx @pat1na/cli init</Mono>.
          </>
        }
      />
    )
  const done = run.phase === "done"
  const known = run.total > 0
  return (
    <>
      <p aria-live="polite" className="truncate">
        {done ? "The pack is installed." : run.current ? `Installing ${run.current}…` : "Waiting for the installer…"}
      </p>
      <Progress
        value={known ? (run.done / run.total) * 100 : undefined}
        aria-label="Installing"
        getValueLabel={() => (known ? `${run.done} of ${run.total} items` : "Waiting")}
        className="mt-2"
      />
      <p className={cn(SMALL, "mt-2")}>{known ? `${run.done} of ${run.total} items installed` : " "}</p>
      {done && (
        <div className="mt-6">
          <p>
            Ask your agent to run <Mono>/y2k-ify</Mono>. It reads your answers from <Mono>patina.json</Mono>.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <TextField readOnly value="/y2k-ify" aria-label="Command for your agent" className="w-40 font-(family-name:--y2k-font-mono) text-[11px]" />
            <Button onClick={onCopy}>Copy</Button>
            <span role="status" className={SMALL}>
              {copied ? "Copied." : ""}
            </span>
          </div>
          {closing && <p className="mt-4">You can close this page.</p>}
        </div>
      )}
    </>
  )
}

/* ── The assistant ────────────────────────────────────────────────── */

export function Assistant() {
  const [session, setSession] = React.useState<Session | null>(null)
  const [token, setToken] = React.useState("")
  const [draft, setDraft] = React.useState<Draft | null>(null)
  const [pane, setPane] = React.useState<PaneId>("welcome")
  const [run, setRun] = React.useState<Run>({ phase: "idle", done: 0, total: 0 })
  /** Set when the answers have gone (or, in demo mode, would have): starts
   *  the polling, or the simulated install. */
  const [started, setStarted] = React.useState<{ answers: Answers } | null>(null)
  const [copied, setCopied] = React.useState(false)
  // Done pressed: a page can't close a tab it didn't open, so it says so.
  const [closing, setClosing] = React.useState(false)
  const headingRef = React.useRef<HTMLHeadingElement>(null)
  const defaultRef = React.useRef<HTMLButtonElement>(null)
  const moved = React.useRef(false)
  const headingId = React.useId()

  // The session: the CLI's, or the sample when there is no CLI to ask.
  React.useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("t") ?? ""
    let off = false
    void (async () => {
      let s: Session = SAMPLE
      try {
        const res = await fetch(`${API}/session?t=${encodeURIComponent(t)}`, { cache: "no-store" })
        const json = res.ok ? ((await res.json()) as Session) : null
        if (json && json.project && Array.isArray(json.questions)) s = { ...json, mode: "live", defaults: json.defaults ?? {} }
      } catch {
        // Not JSON, or nothing there: demo mode.
      }
      if (off) return
      setToken(t)
      setSession(s)
      setDraft(draftFrom(s))
    })()
    return () => {
      off = true
    }
  }, [])

  // The tone chosen is the page's tone: the wallpaper, the gel and the
  // progress bar follow it as the radio button changes.
  const tone = draft?.choice.look
  React.useEffect(() => {
    if (tone && TONES.some((t) => t.id === tone)) document.documentElement.dataset.tone = tone
  }, [tone])

  // The install: the CLI's status every 500 ms, or eight items over four
  // seconds in demo mode.
  const demo = session?.mode !== "live"
  React.useEffect(() => {
    if (!started) return
    let stop = false
    let timer: ReturnType<typeof setTimeout> | undefined
    if (demo) {
      const items = sampleItems(started.answers.scope !== "components")
      let done = 0
      const tick = () => {
        done += 1
        setRun(done >= items.length ? { phase: "done", done, total: items.length } : { phase: "installing", done, total: items.length, current: items[done] })
        if (done < items.length) timer = setTimeout(tick, 500)
      }
      timer = setTimeout(tick, 500)
    } else {
      let misses = 0
      const poll = async () => {
        try {
          const res = await fetch(`${API}/status?t=${encodeURIComponent(token)}`, { cache: "no-store" })
          if (!res.ok) throw new Error(String(res.status))
          const s = (await res.json()) as Status
          misses = 0
          if (stop) return
          setRun(s)
          if (s.phase === "done" || s.phase === "error") return
        } catch {
          // Three seconds without an answer: the CLI has gone.
          if (++misses >= 6) {
            if (!stop) setRun((r) => ({ ...r, phase: "error", message: NOT_ANSWERING }))
            return
          }
        }
        if (!stop) timer = setTimeout(poll, 500)
      }
      void poll()
    }
    return () => {
      stop = true
      clearTimeout(timer)
    }
  }, [started, demo, token])

  const questions = React.useMemo(() => session?.questions ?? [], [session])
  const components = draft?.choice.scope === "components"
  const panes: PaneId[] = [
    "welcome",
    ...questions.filter((q) => !(components && (q.id === "first" || q.id === "oldUrls"))).map((q) => q.id),
    "ready",
    "install",
  ]
  const at = Math.max(0, panes.indexOf(pane))
  const question = questions.find((q) => q.id === pane)
  const asked = panes.filter((p) => questions.some((q) => q.id === p))
  const qAt = asked.indexOf(pane as QuestionId)

  const counter =
    pane === "welcome" ? "Introduction" : question ? `Step ${qAt + 1} of ${asked.length}` : pane === "ready" ? "Summary" : "Install"
  const title =
    pane === "welcome"
      ? "Welcome to Patina"
      : question
        ? question.title
        : pane === "ready"
          ? "Ready to install"
          : run.phase === "done"
            ? "All done"
            : run.phase === "error"
              ? "The install stopped"
              : "Installing…"

  const go = (p: PaneId) => {
    moved.current = true
    setPane(p)
  }
  // A new pane takes the focus to its title, so a screen reader reads it
  // and Tab starts at its first control.
  React.useEffect(() => {
    if (moved.current) headingRef.current?.focus()
  }, [pane])

  const install = async () => {
    if (!draft || !session) return
    const answers = toAnswers(draft)
    go("install")
    setCopied(false)
    if (demo) {
      const items = sampleItems(answers.scope !== "components")
      setRun({ phase: "installing", done: 0, total: items.length, current: items[0] })
      setStarted({ answers })
      return
    }
    setRun({ phase: "waiting", done: 0, total: 0 })
    try {
      const res = await fetch(`${API}/answers?t=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(answers),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { message?: string } | null
        throw new Error(j?.message || `The installer did not take the answers (${res.status}).`)
      }
      setStarted({ answers })
    } catch (e) {
      setRun({ phase: "error", done: 0, total: 0, message: e instanceof TypeError ? NOT_ANSWERING : (e as Error).message })
    }
  }

  // The foot: what Go Back and the default button do on this pane.
  const installing = pane === "install" && run.phase !== "done" && run.phase !== "error"
  const canBack = at > 0 && pane !== "install" ? true : pane === "install" && run.phase === "error"
  const back = () => {
    if (pane === "install") {
      setStarted(null)
      setRun({ phase: "idle", done: 0, total: 0 })
      go("ready")
    } else go(panes[at - 1])
  }
  const label = pane === "ready" ? "Install" : pane === "install" && run.phase === "done" ? "Done" : "Continue"
  const canGo = !!draft && (question ? answered(question, draft) : pane === "welcome" || pane === "ready" || run.phase === "done")
  const next = () => {
    if (!canGo) return
    if (pane === "ready") void install()
    else if (pane === "install") setClosing(true)
    else go(panes[at + 1])
  }

  // Return is the default button, wherever the focus is — except on a push
  // button of its own (Go Back, Copy), which Return presses as usual.
  // Esc and ⌘-period cancel nothing: there is nothing here to undo.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.isComposing || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      const el = e.target as HTMLElement | null
      if (el?.closest("button:not([role=radio]):not([role=checkbox]), a, textarea")) return
      e.preventDefault()
      defaultRef.current?.click()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  const asked1 = qAt + 1
  const progress = pane === "welcome" ? 0 : question ? (asked1 / (asked.length + 1)) * 100 : 100

  return (
    <div className="flex min-h-dvh items-center justify-center px-3 py-8 font-(family-name:--y2k-font-ui) text-(--y2k-ink) md:p-8">
      <Wallpaper photos={WALLPAPERS} />
      <h1 className="sr-only">Patina Setup Assistant</h1>
      <WindowFrame title="Patina Setup Assistant" minimizable={false} zoomable={false} className="w-full md:w-[640px]">
        <div className="p-5 text-[13px] leading-[1.45]">
          {session && demo && (
            <p className="mb-3 flex items-center gap-2 text-[11px] leading-[1.35]">
              <IconInfo className="size-4" />
              <span>
                This is a preview. Run <Mono>npx @pat1na/cli init</Mono> in your project to set it up.
              </span>
            </p>
          )}
          {/* Where the person is, in 11px secondary ink (Steps' counter). */}
          <p className={SMALL}>{counter}</p>
          {/* The pane: the sunken well, the same height from pane to pane on
              a laptop so the foot doesn't jump. */}
          <WindowWell className="mt-1 p-4 md:min-h-[420px]">
            <h2 ref={headingRef} id={headingId} tabIndex={-1} className="text-[13px] leading-[1.35] font-bold outline-none">
              {title}
            </h2>
            <div className="mt-1">
              {pane === "welcome" && <Welcome project={session?.project} />}
              {question && draft && session && (
                <>
                  <p>{question.prompt}</p>
                  <div className="mt-4">
                    <QuestionControls q={question} d={draft} set={(f) => setDraft((d) => (d ? f(d) : d))} project={session.project} labelledBy={headingId} />
                  </div>
                </>
              )}
              {pane === "ready" && draft && (
                <>
                  <p>Click Install to set up the pack, or Go Back to change an answer.</p>
                  <div className="mt-4">
                    <Facts rows={summary(questions, draft)} />
                  </div>
                </>
              )}
              {pane === "install" && (
                <div className="mt-3">
                  <Install
                    run={run}
                    copied={copied}
                    closing={closing}
                    onCopy={() => {
                      void copyText("/y2k-ify").then(setCopied)
                    }}
                  />
                </div>
              )}
            </div>
          </WindowWell>
          {/* The foot: the progress bar from the well's left edge, then Go
              Back and the default button, 12px apart. On the install pane
              the pane's own bar is the one that counts. */}
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Progress
              value={progress}
              aria-label="Progress"
              getValueLabel={() => counter}
              className={cn("min-w-24 flex-1", pane === "install" && "invisible")}
            />
            <div className="ml-auto flex items-center gap-3">
              <Button variant="white" disabled={!canBack} onClick={back}>
                Go Back
              </Button>
              <Button ref={defaultRef} isDefault disabled={!canGo || installing} onClick={next}>
                {/* The three labels share one cell, so the button keeps its
                    width as Continue turns into Install and Done. */}
                <span className="grid">
                  {["Continue", "Install", "Done"].map((l) => (
                    <span key={l} className={cn("col-start-1 row-start-1", l !== label && "invisible")}>
                      {l}
                    </span>
                  ))}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </WindowFrame>
    </div>
  )
}
