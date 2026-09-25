import type { Question, Session } from "./types"

/**
 * The questions, as the CLI words them (packages/cli/src/brief.mjs ›
 * QUESTIONS, from CONTRACT.md › The questions). The CLI owns the list and
 * serves it in `session.questions`; this copy is only for demo mode, so a
 * preview shows the real thing. Keep it the same as brief.mjs.
 */
export const QUESTIONS: Question[] = [
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
    ],
    pick: "routes",
  },
  {
    id: "scope",
    title: "How much of the site becomes a desktop?",
    prompt:
      "Pages people read become windows on one desktop. Pages people use — a sign-up, a basket, a dashboard — can keep their own address.",
    options: [
      { value: "whole", label: "The whole site" },
      { value: "content", label: "Its pages to read; tools keep their pages" },
      { value: "components", label: "None: keep the pages, restyle the components" },
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
    ],
  },
  {
    id: "look",
    title: "Choose a tone",
    prompt: "Every gel control, the selection and the wallpaper take it.",
    // The five tones as `init` lists them (packages/cli/src/brief.mjs › TONES).
    options: [
      { value: "pink", label: "Y2K pink", era: "2001–06, McBling: Juicy Couture velour, the pink Razr, rhinestones" },
      { value: "aqua", label: "Aqua", era: "1998–01: the Bondi Blue iMac, Mac OS X's water-and-gel blue" },
      { value: "lime", label: "Lime", era: "1999–02: iMac Lime, Nickelodeon slime, Matrix terminals" },
      { value: "tangerine", label: "Tangerine", era: "1999–03: iMac Tangerine, Fanta, orange translucent plastic" },
      { value: "grape", label: "Grape", era: "2000–04: iMac Grape, MSN Messenger purple, Lisa Frank" },
    ],
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
    prompt:
      "If people have shared your pages, or search engines list them, each old address can open its window on the desktop.",
    options: [
      { value: "redirect", label: "Keep them working (recommended)" },
      { value: "drop", label: "No need" },
    ],
  },
]

/**
 * Demo mode's project: a small studio site, as the scan would find it. The
 * defaults are what a scan can know (names, the meta description, the tool
 * routes); the kind of site, the first thing to do and the tone are left
 * for the person to answer.
 */
export const SAMPLE: Session = {
  mode: "demo",
  project: {
    name: "linden-studio",
    framework: "Next.js 16 (app router)",
    title: "Linden Studio — Identities, books and type",
    description: "An independent design studio in Bristol making identities, books and typefaces.",
    routes: [
      { path: "/", guess: "home" },
      { path: "/work", guess: "list" },
      { path: "/work/[slug]", guess: "detail" },
      { path: "/journal", guess: "list" },
      { path: "/journal/[slug]", guess: "detail" },
      { path: "/about", guess: "about" },
      { path: "/contact", guess: "form" },
      { path: "/press", guess: "page" },
      { path: "/shop", guess: "tool" },
    ],
    forms: ["/contact"],
  },
  questions: QUESTIONS,
  defaults: {
    about: { name: "Linden Studio", role: "Identities, books and type" },
    first: { featured: ["/work"] },
    scope: "content",
    keepRoutes: ["/shop"],
    source: { kind: "project" },
    look: { volume: "Linden Studio HD", description: "An independent design studio in Bristol making identities, books and typefaces." },
    extras: { ipod: false, visitorCounter: false, marquee: false },
    oldUrls: "redirect",
  },
}

/** What demo mode pretends to install: eight items over about four
 *  seconds. A desktop brings the content model and the desktop; a
 *  restyle brings more components instead. */
export function sampleItems(desktop: boolean) {
  return ["DESIGN.md", "theme", "button", "window", "forms", "wallpaper", ...(desktop ? ["content", "desktop"] : ["table", "popup"])]
}
