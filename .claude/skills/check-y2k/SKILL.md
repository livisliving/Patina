---
name: check-y2k
description: Check code against the Y2K pack's DESIGN.md — the forbidden fonts, grey cards, AI gradients, card radii and shadows, thin-line icons, page-shaped layout, the 4px grid, and the Content rules (articles in group boxes, link arrows, framed pictures, changes drawn as progress, clipped descenders). Use after writing or restyling UI in a project that has a Y2K DESIGN.md, and always at the end of /y2k-ify.
---

# /check-y2k

Answers one question: **does this code follow the pack?** It does not restyle
anything — that is `/y2k-ify`.

## Run it

```bash
node scripts/check-y2k.mjs <paths...>
```

- Pass the directories you touched; with no paths it scans the whole project.
- `--json` for machine-readable output, `--design <path>` if DESIGN.md is not
  at the project root, `--strict` to fail on warnings too.
- Exit code 1 means there are errors.

## What it checks

Errors (`✗`):

- `banned-font`, `system-ui-first` — Inter, Geist, Roboto, Helvetica or
  Arial named as a face; `system-ui` anywhere but the tail of the stack.
- `grey-card` — `#F4F4F5`, `bg-zinc|slate|stone|gray-*` surfaces.
- `ai-gradient` — the purple→blue gradient.
- `card-radius` — `rounded-xl` and up.
- `thin-icons` — lucide, heroicons, feather imports.
- `muted-foreground` — `text-muted-foreground`.
- `page-layout`, `page-footer` — a centred `max-w-* mx-auto` column; a
  `<footer>`.
- `grid` — a layout length off the 4px grid that no DESIGN.md token names.
- `unknown-token` — a `--y2k-*` name y2k.css does not declare.
- `article-in-group` — a group box (`WindowGroup`, or the pack's `Group`)
  holding an article's section instead of controls: a `<p>` of more than 12
  words (entities such as `&ldquo;` count as part of their word); running
  text mapped from data into a `<p>`, `<li>`, `<dd>`, `<blockquote>` or
  table cell — a field named `body`, `text`, `description`, `summary` … ,
  an item of an array in the same file whose longest string is over 12
  words, or `{p}` mapped into a `<p>`; a heading (`h1`–`h6`) over a
  paragraph, list or table; a picture; or a table or a `<dl>` with no
  control beside it (a Results table, a spec list). A group of controls (check boxes,
  radio buttons, fields, sliders, pop-ups, labels) passes, and so does a
  dialog's small print (11px or smaller, or the secondary ink) and a type
  specimen (a `style={{ fontSize | fontFamily }}` from data). An article's
  section is a document (DESIGN.md › Content).
- `empty-document` (warning) — a `document` in the content that opens to
  nothing: no blocks and no `comment` or `subtitle`, or only a link to
  nowhere (a card's "Read more" to `#` or `""`). An item with no page of
  its own holds what its card held (DESIGN.md › Content).
- `pack-modified` (warning) — one of the pack's own files, changed since
  the pack wrote it (its fingerprint in `patina.json`). `patina update`
  keeps an edited file, so it stops getting the pack's fixes; if the pack
  lacked something, the report says so.
- `link-arrow` — →, ←, ↗, ↘, » or « (or `&rarr;`, `&larr;`, `&raquo;`,
  `&laquo;`, `\u2192` …) at the start or end of a link's or a button's
  label: the text of `<a>`, `<Link>`, `<Button>` or any `…Button`, its
  `label="…"`, or a `label:`/`a:` string in an object with an `href`. Aqua
  links have no arrow. (↗ at the end of any label is flagged anywhere.)

Warnings (`!`):

- `card-shadow` — `shadow-md` and up, allowed on windows, menus, tooltips,
  the Dock and gel controls only.
- `picture-border` — a picture drawn with a frame: an `<img>`/`<Image>`
  with a `border` class or style, or one picture alone in a `WindowWell`
  (with at most a caption). A picture sits bare on the page. Not in the
  Finder's views, the column inspector, the desktop's icons or the Dock
  (`finder`, `disk`, `icons`, `dock`, `inspector`, `column*`, `thumb*`
  files, or an image whose tag says `icon`/`thumb`): a file's thumbnail
  keeps its hairline. A well of several pictures (a strip), an embed or
  code is what a well is for.
- `change-as-progress` — a `Progress` (or a `type: "progress"` block) whose
  label is a change: a number with % or × beside "reduction", "increase",
  "fewer" or "more". A change is not a fraction — use `metrics` (a Table).
- `clipped-descenders` — `leading-none` with 11–13px text in a fixed
  `h-4`, `h-5`, `h-[17px]` or `h-[18px]` box.

## Read the output

Each line is `file:line:col  rule  message  (DESIGN.md:NNN)`. The citation is
the point: every rule comes from a line in DESIGN.md, and that line — not this
skill, not your taste — is the authority.

- `✗` **error** — DESIGN.md forbids it in so many words. Fix the code.
- `!` **warning** — the rule has exceptions a regex cannot judge (a shadow is
  allowed on a window, menu, tooltip, the Dock or a gel control). Look at the
  call site and decide.

## Waiving one finding

When a finding is deliberate and the human agrees, waive that rule at that
place, with the reason written beside it:

```tsx
{/* check-y2k-ignore article-in-group: a specimen of the mistake, for the docs */}
<WindowGroup label="Don't">…</WindowGroup>
```

```ts
// check-y2k-ignore link-arrow, picture-border: <reason>
```

It goes on the finding's line or the line above it and waives only the
rules it names. **The reason is required** — an ignore without one waives
nothing. (`check-y2k: ignore` on a line skips every rule on that line, and
`check-y2k: ignore-file` in a file's first 40 lines skips the file; prefer
the named waiver.) Never waive to make a run go green: a waiver is a
decision someone can read and disagree with.

## When the checker and the design disagree

An error on something that is deliberate means one of two things, and you do
not get to pick silently:

1. The code is wrong → fix the code.
2. **DESIGN.md is wrong or incomplete** → say so to the human and propose the
   change. The grid is read from DESIGN.md's front matter at run time: the
   unit is `spacing.unit`, an off-grid value is allowed only when a `spacing:`
   token names it, and a radius only when a `rounded:` token does. So widening
   an exception means adding a named token there — an edit to the spec, which
   is the human's call. Never loosen the checker to make a run go green.

## What it does not check

Anything that needs judgment about intent: whether a shadow sits on a window,
whether a 20px value is an HIG button or a coincidence, whether the layout
*reads* as a desktop. Those belong in review, not in a regex. The checker is
deliberately biased towards under-reporting — one false positive and people
stop running it.

It reads one file at a time. Text mapped from an array in another file is
judged by its field's name (`{x.body}` is prose, `{x.name}` is not known),
and a group box filled by a component (`<Sections />`) is judged by that
component's own file, not at the call site. Keep content in `content/*.ts`
and let the `desktop` item render it, and the question does not arise.
