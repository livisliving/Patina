import type { DocumentEntry, Site } from "@/lib/content"

/**
 * Your site, written down once in the Content model (lib/content.ts) — the
 * desktop draws the Finder, the documents and the About box from it.
 *
 * This is an example of the shape, not content: replace every word. /y2k-ify
 * fills it from your real site, transcribing words, numbers, pictures and
 * links as they are and never inventing one. A link whose address you don't
 * have yet is `href: ""` and shows greyed. DESIGN.md › Content says which
 * block each part of a page becomes.
 *
 * next.config reads this file for the redirects: import values from other
 * files by relative path (`./posts`), never `@/` — only `import type` may
 * use `@/`.
 */

/** A document read start to finish. Three sections or more, so it gets an
 *  outline; `id`s in `outline` are the `h2` ids, in order. */
const CASE_STUDY: DocumentEntry = {
  type: "document",
  title: "A case study",
  subtitle: "What the project was, in one line.",
  meta: "2026 · Research, Interaction design",
  category: "Case study",
  date: "2026",
  // Its address on the old site: next.config sends it to this window
  // (desktopRedirects, in the desktop item).
  route: "/work/a-case-study",
  outline: [
    { id: "overview", label: "Overview" },
    { id: "process", label: "Process" },
    { id: "results", label: "Results" },
    { id: "questions", label: "Questions" },
  ],
  blocks: [
    {
      type: "facts",
      items: [
        { label: "Timeline", value: "12 weeks" },
        { label: "Role", value: "Lead designer" },
        { label: "Team", value: "2 designers, 4 engineers" },
      ],
    },
    { type: "h2", id: "overview", text: "Overview" },
    { type: "p", text: ["What the problem was, who had it, and ", { b: "what changed" }, " because of the work."] },
    { type: "placeholder", caption: "The finished screen", ratio: 16 / 10 },
    // Two states of one thing. `initial` is the tab the site shows first.
    {
      type: "compare",
      tabs: [
        { label: "Before", images: [] },
        { label: "After", images: [] },
      ],
      initial: "After",
      caption: "The screen before and after the work.",
    },
    { type: "h2", id: "process", text: "Process" },
    {
      type: "steps",
      title: "How the work went",
      items: [
        { title: "Research", body: "Who was asked, and what they said." },
        { title: "Design", body: "What was tried, and what was kept." },
        { title: "Launch", body: "What shipped, and when.", code: "npm run release" },
      ],
    },
    { type: "h2", id: "results", text: "Results" },
    // A result is the site's line as it is, or its number and its label.
    {
      type: "metrics",
      rows: [
        { category: "Use", results: [{ value: "3×", label: "people each week, a year on" }, "One screen, not four"] },
        { category: "Support", results: ["Half the tickets"] },
      ],
    },
    // A link to another entry opens its window: `to` is its path of titles.
    { type: "p", text: ["More of the work is in the ", { a: "Work", to: ["Work"] }, " folder."] },
    { type: "h2", id: "questions", text: "Questions" },
    {
      type: "faq",
      items: [
        { q: "A question people ask", a: "Its answer, as the site gives it." },
        { q: "Where can I see it?", a: [{ a: "The live product", href: "" }, " — its address goes here."] },
      ],
    },
  ],
}

export const SITE: Site = {
  owner: "Your Name",
  // The site's own one-line description (its meta description), as it is.
  description: "One sentence the site says about itself.",
  person: {
    name: "Your Name",
    role: "What you do",
    panes: [
      {
        label: "General",
        blocks: [
          { type: "p", text: "A line or two about who you are and what you make." },
          {
            type: "facts",
            items: [
              { label: "Based in", value: "Your city" },
              { label: "Email", value: [{ a: "you@example.com", href: "" }] },
            ],
          },
        ],
      },
      {
        label: "Experience",
        blocks: [
          {
            type: "facts",
            items: [
              { label: "2023–now", value: "Your role, Your company" },
              { label: "2020–23", value: "Your role, Your company" },
            ],
          },
        ],
      },
    ],
    copyright: "© 2026 Your Name",
  },
  entries: [
    CASE_STUDY,
    {
      type: "collection",
      title: "Work",
      // The line the site puts over the folder (an archive's intro), or on
      // an item's card: the Finder shows it as the item's comment.
      comment: "The line the site puts over this folder.",
      route: "/work",
      items: [
        {
          type: "document",
          title: "Project one",
          category: "Product design",
          date: "2025",
          comment: "What it was, in the line its card carried.",
          blocks: [{ type: "p", text: "What it was, in a paragraph." }],
        },
        {
          type: "document",
          title: "Project two",
          category: "Branding",
          date: "2024",
          blocks: [{ type: "p", text: "What it was, in a paragraph." }],
        },
        // The case study again, in the Work folder: an alias of it, not a copy.
        { type: "alias", title: "A case study", category: "Case study", to: ["A case study"] },
      ],
    },
  ],
  // What sits on the desktop beside the volume, and in the Dock: at most three.
  featured: [["A case study"]],
}
