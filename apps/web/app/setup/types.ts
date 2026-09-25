/**
 * The Setup Assistant's side of the contract with `npx @pat1na/cli init`
 * (the CLI serves Session and Status, and takes Answers). The shapes are the
 * contract's; the CLI owns the question list (`packages/cli/src/brief.mjs ›
 * QUESTIONS`) and the page renders whatever it is sent, in order.
 */

/** `replace` is asked only when the install would find Patina's files
 *  already in the project (brief.mjs › replaceQuestion). */
export type QuestionId = "about" | "first" | "scope" | "source" | "look" | "extras" | "oldUrls" | "replace"

export type Route = { path: string; guess: "home" | "list" | "detail" | "about" | "form" | "tool" | "page" }

export type Project = {
  name: string
  framework: string
  title?: string
  description?: string
  routes: Route[]
  forms: string[]
}

/** A text field; an `optional` one may be left empty; `value` is what it
 *  starts with (Other's "Not sure — recommend one for me."). */
export type Field = { id: string; label: string; placeholder?: string; optional?: boolean; value?: string }

export type Question = {
  id: QuestionId
  title: string
  prompt: string
  /** `era`: a tone's era line (brief.mjs adds it to the tones), shown as a
   *  second, 11px line under the option's label. */
  options: { value: string; label: string; era?: string; field?: Field }[]
  multiple?: boolean
  fields?: Field[]
  pick?: "routes" | "tools"
  /** replace: the files already here, listed under the options. */
  files?: string[]
}

export type Tone = "pink" | "aqua" | "lime" | "tangerine" | "grape"

/** `other` on about, first, scope and source: the owner's words are in
 *  `notes`, under the question's id. */
export type Answers = {
  about: { kind: "person" | "team" | "product" | "event" | "show" | "other"; name: string; role: string }
  first: { goal: "work" | "read" | "details" | "act" | "listen" | "other"; featured: string[] } | null
  scope: "whole" | "content" | "components" | "other"
  keepRoutes: string[]
  source: { kind: "project" | "live" | "export" | "folder" | "other"; where?: string }
  look: { tone: Tone; volume: string; description: string }
  extras: { ipod: boolean; wallpaper?: string; visitorCounter: boolean; marquee: boolean }
  oldUrls: "redirect" | "drop" | null
  notes: Partial<Record<QuestionId, string>>
  /** Only when the replace pane was asked: an install instruction, not
   *  part of the brief. */
  replace?: "replace" | "keep"
}

/** What the scan suggests. The contract types it `Partial<Answers>`; the
 *  page reads it one level deeper, so a scan that knows the name but not
 *  the kind can still prefill the name. */
export type Defaults = {
  about?: Partial<Answers["about"]>
  first?: Partial<NonNullable<Answers["first"]>> | null
  scope?: Answers["scope"]
  keepRoutes?: string[]
  source?: Partial<Answers["source"]>
  look?: Partial<Answers["look"]>
  extras?: Partial<Answers["extras"]>
  oldUrls?: Answers["oldUrls"]
  replace?: Answers["replace"]
}

export type Session = {
  mode: "live" | "demo"
  project: Project
  questions: Question[]
  defaults: Defaults
}

export type Status = {
  phase: "waiting" | "installing" | "done" | "error"
  done: number
  total: number
  current?: string
  message?: string
}
