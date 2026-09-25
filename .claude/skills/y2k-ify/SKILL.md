---
name: y2k-ify
description: Rewrite an existing page, component or whole site in the Y2K pack — Mac OS X Aqua structure in a millennium tone. Use when asked to "y2k-ify", "make this Y2K", "apply the pack", to turn a site (portfolio, blog, product pages) into an Aqua desktop, or to restyle a default-looking shadcn/Tailwind page in a project that has the pack's DESIGN.md.
---

# /y2k-ify

Restyle what is already there. A tool keeps doing what it did — same routes,
same data, same behaviour — and comes out looking like Mac OS X 10.0. A site
that is read (a portfolio, a blog, a product's pages) becomes a desktop: its
content is sorted into the Content model and the pack's desktop renders it.

**Read `DESIGN.md` first.** It is in the project root and it is the spec; this
file only says in what order to work. If there is no DESIGN.md, stop and say
the project needs `npx @pat1na/cli init` first.

## First, the tone

Look for `data-tone` on the project's `<html>` (app/layout, pages/_document
or index.html). If it is there, use that tone and do not change it. If it is
not, do not start and do not assume pink. List the five and ask the user
which one they want:

1. Y2K pink — 2001–06, McBling: Juicy Couture velour, the pink Razr
2. Aqua — 1998–01: the Bondi Blue iMac, Mac OS X's own blue
3. Lime — 1999–02: iMac Lime, Nickelodeon slime, Matrix terminals
4. Tangerine — 1999–03: iMac Tangerine, orange translucent plastic
5. Grape — 2000–04: iMac Grape, MSN Messenger purple

Then set `data-tone="<pink|aqua|lime|tangerine|grape>"` on `<html>`.
Installing the pack for someone works the same way: ask first, then run
`npx @pat1na/cli init --tone <name>`.

## Order of work

Content before structure, structure before colour. A page with a hero, a
centred column and three feature cards is still a page after you paint it
pink — fixing that is most of the job, and doing it last means redoing the
paint.

0. **The owner's brief.** Read `patina.json › brief` before anything else.
   `npx @pat1na/cli init` asked the owner a few questions, and their answers
   (`brief.answers`) are theirs: they override every guess you would make
   from the pages. `about.kind` (person, team, product, event, show) is the
   About box's kind — team, event and show mean one document per person,
   not one About box; `about.name` and `about.role` are the names.
   `first.goal` and `first.featured` are what opens at load and what sits
   on the desktop and in the Dock (`SITE.featured`). `scope` and
   `keepRoutes` say which routes keep their pages (`content`: the listed
   tools stay pages; `whole`: everything becomes a window; `components`:
   no desktop at all, restyle the components only). `source` says where to
   transcribe from (this project, a live URL, an export, a folder) — never
   anywhere else. `look.volume` and `look.description` are the volume's
   name and `SITE.description`. `extras.wallpaper` is the owner's own
   wallpaper folder. `oldUrls` says whether to write `desktopRedirects`
   (`redirect`) or not (`drop`). `brief.detected` is what the scan found;
   `brief.unanswered` lists the questions nobody answered. An answer of
   `other` (`about.kind`, `first.goal`, `scope`, `source.kind`) comes with
   the owner's words in `brief.answers.notes.<question>`: when they say
   what it is (a collective, a CMS), follow them; when they are unsure
   ("Not sure — recommend one for me."), read the site, recommend one of
   that question's options with a one-line reason, and put it to them.
   `scope: other` installed the desktop, so any scope is still open.
   **Ask every unanswered question, and settle every `other`, in one
   message before you start**, in the words `brief.ask` carries (each
   one's title, prompt and options — the same the assistant showed), and
   write the answers back into
   `patina.json › brief.answers` before going on. No `patina.json`, or one without a `brief`? Ask the gist
   of all six in one message: who the site is about (one person, a team, a
   product, an event or a show — and their name and what they do); what a
   visitor should do first (look at the work, read, find the details, sign
   up or buy, listen or watch — and up to three pages to keep at hand); how
   much becomes a desktop (the whole site, its pages to read with tools
   keeping their pages, or none: components only); where the real content
   is (this project, a live site, an export, a folder); the tone; and the
   extras (an iPod, their own wallpaper, a visitor counter, a marquee) and
   whether old addresses should keep working.
1. **Content, then structure.** Read DESIGN.md › Content first.
   a. **Inventory** every page in reading order — every heading, paragraph,
      picture, link and number. Take originals and real URLs from the
      owner's source before the live site (on a site that fades in as it
      scrolls, stop on every screen before you copy it); list anything you
      cannot find. Pictures: use the original file; one wider than 1400px
      (2400px for a board people must read) is scaled down to that width —
      never up — as JPEG at quality 80, and a narrower one is used as it is
      (a picture with transparency stays PNG). On a Mac, per file:

      ```bash
      sips -g pixelWidth in.jpg        # over 1400? then:
      sips --resampleWidth 1400 -s format jpeg -s formatOptions 80 in.jpg --out out.jpg
      ```

      Not `sips -Z 1400`: it caps the longer side, so a 375 × 2494 phone
      screenshot would come out 210 wide. Without sips (and without Node),
      ImageMagick does the same in one step: `magick in.jpg -resize '1400x>'
      -quality 80 out.jpg` (`>` only ever shrinks). Measure the file you
      ship — its `w`, `h` and `bytes` go in the `Img`.
   b. **Classify each page**, the first yes decides: a set of items that
      each open → a collection; one text read through → a document; a
      person or the product → the About box (`site.person`); a picture or
      a movie → its file; something to fill in and submit → a dialog.
   c. **Classify each block** of a document by DESIGN.md › Content (the
      table below) and write it into `content/*.ts` in the Content model
      (`@/lib/content`); `content/site.ts` exports `SITE`. Transcribe:
      words, numbers and links verbatim, and a link whose address you do
      not have is `href: ""`. A block the table doesn't cover stays a `p`
      and goes on the "unmapped" list — do not invent a component for it.
   d. **The `desktop` item renders the content** — the Finder, TextEdit,
      Preview, QuickTime Player, the About box, the desktop icons and the
      Dock, all from `SITE`. Wire the page (below) and let it. Do not
      hand-build windows, a Finder or Dock icons, and never wrap an
      article's sections in `WindowGroup`.
   e. **What is not content** — a tool, a form, a settings panel — is a
      window on that desktop: one `WindowFrame` per thing it is about, a
      `WindowWell` for a sunken area (a list, a preview, a field's
      background), a `WindowGroup` only around a dialog's controls.
   f. **Old URLs open their windows.** Give each entry its old address as
      `route` (`route: "/journal/first-frost"`) — a collection's too, when
      the site had an index page for it — and let the `desktop` item write
      the redirects with `desktopRedirects`. Never redirect a page to `/`
      when it became a window, and never write `?open=` addresses by hand:
      a name with `&`, `+`, `%` or an accent must be encoded twice for
      Next, which the helper does. Routes that were not one entry go in its
      second argument, each to a path of titles, or to `null` for a page
      that became the desktop itself (home, or about when there is no
      About entry). In `next.config.ts`:

      ```ts
      import type { NextConfig } from "next"
      import { desktopRedirects } from "@/components/desktop/redirects"
      import { SITE } from "@/content/site"

      const nextConfig: NextConfig = {
        async redirects() {
          return desktopRedirects(SITE, { "/journal/page/:n": ["Journal"], "/home": null })
        },
      }

      export default nextConfig
      ```

      `next.config` now reads `content/`: there, import values by relative
      path (`../lib/links`, `./posts`). Next compiles the config's imports
      with `@/` rewritten to `./`, which resolves from the importing file's
      folder, so `@/lib/links` in `content/site.ts` fails the build. Type-only
      imports (`import type … from "@/lib/content"`) are erased and fine.

      The desktop opens the named window at load and keeps the address in
      step with the front window; `openHref(path)` is a link to a window
      from anywhere on the site.
2. **Controls.** Swap the defaults for the pack's components, one for one —
   see the table below. Do not restyle a `<button>` by hand when the pack
   exports `Button`.
3. **Colour.** Everything gel and the wallpaper take the tone; ink stays
   black. Use the `--y2k-*` variables, never new hex values. Never mix two
   tones on one screen, never tint the pinstripes, the traffic lights or text.
4. **Type.** `--y2k-font-ui` everywhere; 13px is the default UI size, 11px for
   captions and status lines, 12px for list and table rows. Font sizes
   do **not** snap to the 4px grid — everything else does.
5. **Strip the tells.** Grey cards, soft drop shadows, the purple→blue AI
   gradient, thin-line icons, `text-muted-foreground`, helper text under every
   field, friendly empty-state illustrations. They all go.

## Wiring the desktop

The desktop needs three registry items: `content` (the model,
`lib/content.ts`), `desktop` (`components/desktop/`) and `ipod`.
`npx @pat1na/cli init --desktop` installs them. A project installed without
`--desktop` adds them first:

```bash
npx shadcn@latest add <registry>/content.json <registry>/desktop.json <registry>/ipod.json
```

(`<registry>` is `https://livisliving.github.io/Patina/r` unless the project
was installed from another.) Then the page is three imports and one element:

```tsx
// app/page.tsx
import { Desktop } from "@/components/desktop/desktop"
import { IPod } from "@/components/desktop/ipod/ipod"
import { SITE } from "@/content/site"
export default function Page() {
  return <Desktop site={SITE} volume="Your Name HD" ipod={IPod} />
}
```

`volume` is the root volume, `‹owner› HD`. Leave `ipod` out for a desktop
without one; pass `wallpaper` for the owner's own pictures per tone.

## What content maps to what

The model's types, from `@/lib/content`, and what the `desktop` item makes
of them. DESIGN.md › Content is the authority; this is the lookup.

| The source has… | Write | The desktop shows |
| --- | --- | --- |
| a portfolio, an archive, a blog index | `collection` | a Finder folder; a Kind source list when the items have two categories or more |
| a case study, a post, a doc page | `document` (`outline` for its table of contents) | TextEdit, 900 wide with an outline (three sections or more), 640 without |
| about me, a team, the product's "about" | `site.person`, and an `about` entry at the site's root so the person appears in the Finder (recommended — the About box works either way) | the About box, panes on a pop-up button |
| a picture, a movie | `picture`, `movie` | Preview, QuickTime Player |
| an item that is another entry (an archive's case study) | `alias` | an alias that opens the original |
| a hero, a footer, social links, the copyright | `site.person`, `site.home` | the desktop at load, the About box, the ★ menu |
| the one line on a card, a folder's (an archive's) intro | `comment` on that entry | Show Info's Comments in the Finder's column view; under a document's title |
| section headings | `h2` (its `id` in `outline`), `h3` | bold headings, listed in the outline |
| paragraphs, lists | `p`, `list` | 13px black text, OS-blue links without arrows |
| a link to another page of the site ("See more in the archive →") | `{ a, to: [titles] }` in the text, the arrow dropped | an OS-blue link that opens that entry's window |
| timeline, team, role, client | `facts` | right-aligned labels beside values |
| problems, risks, pain points | `problems` | Warning-icon rows |
| a note, a tip, an aside, a warning, a banner | `callout` (`kind: "note"`, or `"caution"` for a warning; `title` if it has one) | the Note or Caution icon beside the text |
| what was done, features | `checklist` | checked, read-only check boxes |
| step 1… step n | `steps` (a step's command or snippet in its `code`) | a Setup Assistant pane: Go Back / Continue, a progress bar |
| a quotation, a testimonial | `quote` | a Stickies note |
| an FAQ, an accordion | `faq` | disclosure triangles |
| before / after, variants | `compare` (`initial`: the tab the site shows first) | folder tabs |
| results ("56% fewer") | `metrics`; a number set apart from its label is `{ value, label }` | a Table — never Progress; the value bold, then the label |
| any other table | `table` | the Table |
| a true fraction ("3 of 5 done") | `progress` | Progress |
| one picture with a caption | `figure` | the picture, bare, opening Preview |
| a row of pictures, a carousel, a logo strip | `gallery` | a strip of 240px-tall pictures that scrolls sideways; a smaller one (a logo) at its own size |
| a FigJam, Figma or YouTube embed | `embed` | inline in a well, `Open in ‹app›` |
| a video | `video` | its poster, opening QuickTime Player |
| a picture you don't have yet | `placeholder` | a pinstripe plate, `Picture to come` |
| "View…" buttons | `links` | white push buttons |
| code | `code` | Monaco 11px |
| tags, badges | a `facts` row, or `category` | a fact, or the Finder's Kind — never pills |
| an item listed with no page of its own (a card that links to `#`) | a `document` holding only what its card held — its picture, its line as `comment`, its date; its "Read more" to nowhere left out | a file that opens to its card |
| the site's name, role and meta description | `site.person.name`, `site.person.role`, `site.description` | the page's title, `Name — Role` (the page template writes it) |

## What maps to what

| Default | Pack |
| --- | --- |
| `Card` / a bordered panel | `WindowFrame` (standalone) or `WindowGroup` (a group of controls inside a window). A card that is content — a project, a post — is an entry in `content/*.ts` |
| `Dialog` / `Sheet` / modal | `Window` + `WindowTrigger` + `WindowContent`; a confirm → `WindowAlert` inside it |
| `AlertDialog` | `WindowAlert` (64px icon, bold message, informative text, button row) |
| `Button` | `Button` — `variant="white"` normally, `isDefault` for the one default action per window (`pulsing` for the dialogue throb); `BevelButton` for a `Choose…`. shadcn's `variant`/`size` names still compile after install — replace them anyway: they are a bridge |
| A text link / `variant="link"` | a plain `<a>` in `text-(--y2k-link) underline`, or `Button variant="link"` |
| `Checkbox` | `Checkbox` (supports `"mixed"`) |
| `RadioGroup` | `RadioGroup` + `Radio` |
| `Input` | `TextField`; a search box → `SearchField` |
| `Slider` | `Slider` (`thumb="round"`, or `"pointer"` with `ticks`) |
| number input + ± buttons | `Stepper` |
| `Select` / combobox | `PopupButton`; any other dropdown wears `menuContentClass` / `menuItemClass` |
| `Table` | `Table` — same part names as shadcn's (`TableHeader`, `TableHead`, `TableRow`, `TableCell`…) |
| nested list / file tree | `TreeView` |
| File list, "list view" | `Table` (list header, zebra rows in the tone) |
| Nav rail, file tree, settings list | `WindowSidebar` + `WindowSidebarGroup` + `WindowSidebarItem` |
| `Tabs` | `Tabs` — folder tabs on a pinstriped panel; the selected tab in the light tone gel, black ink |
| `ToggleGroup` / segmented buttons | `SegmentedControl` |
| `Toast` / `Sonner` | `Nudge` (+ `NudgeProvider`, `NudgeViewport`) |
| `Progress` / spinner | `Progress` (indeterminate = barber pole) |
| Badge, pill, "New!" | `Marquee` or `VisitorCounter` where it fits; otherwise plain text |
| Scroll container | `WindowScrollArea` (15px Aqua scrollbars — vertical, and along the foot when content is too wide) |
| Status line, result count | `WindowStatusBar`, 11px, left-aligned, on the placard stripe |
| Site header, top nav | `MenuBar`: the product's name as the bold app menu, its sections as menus |
| Footer, bottom nav | `Dock` (one icon per place), or nothing |
| Page background, hero backdrop | `Wallpaper` (the tone's swoosh; the project's own photos via `photos`) |
| lucide / heroicons / feather icon | the pack's icon: `ICONS[lucideToPack.Settings]` from `components/ui/icons` (e.g. `<IconPreferences className="size-8" />`); 32px in toolbars, 16px in lists, 64px in alerts. No match in `lucideToPack` → remove it |
| `text-muted-foreground` | `text-(--y2k-ink-secondary)` |
| `bg-card` / `bg-background` | pinstripes (`--y2k-pinstripe`) |
| Arbitrary accent colour | `var(--y2k-tone)` and its `--y2k-tone-*` gradients |

Dialog layout, when you build one: labels right-aligned in a column, fields
beside them, the button row bottom-right, **Cancel to the left of the default
button**, 12px between them.

## Finish with /check-y2k

Always, as the last step:

```bash
node scripts/check-y2k.mjs <the paths you touched>
```

Not clean? Keep going — an error is a line in DESIGN.md you have not applied
yet. If you believe an error is wrong, say so to the human and propose the
DESIGN.md wording; never loosen the checker, and never silently leave a
violation in.

Then run it on the whole project once (`node scripts/check-y2k.mjs .`): the
shadcn components the page no longer imports — `card.tsx`, `badge.tsx`,
`input.tsx` and their like — still fail it. Delete them; dead default-styled
code is the look the pack exists to remove.

The checker only reads what a regex can see. It cannot tell you the page still
*reads* as a landing page, that two tones ended up on one screen, or that the
window is 900px wide because you kept the old container. Look at the result.

If you start a server to look at the result, use a free port and stop it by
that port or its PID — never `pkill` or `killall` by name: other servers on
the machine are someone's work.

## Do not

- Edit the pack's own files (`components/ui/*`, `components/desktop/*`,
  `y2k.css`, DESIGN.md, these skills). `patina update` keeps an edited file
  and skips the pack's fixes to it. If the pack lacks something the site
  needs, put the content in the nearest type and say so in your report;
  `/check-y2k` warns on an edited file (`pack-modified`).
- Remove what names Patina OS and Olivia Forster: the first line of every
  pack file (the MIT licence asks that it stay), the ★ menu's About Patina
  OS, the Patina line on About The Finder, the generator tag.
- Change the framework, the data layer or any business logic. The one change
  to routing the pack makes is a site's pages becoming one desktop, each old
  route redirecting to its window (step 1f); a tool's routes stay.
- Invent content. A sentence, a number, a link or a picture you cannot find
  in the source is a placeholder and a line on the list, never a guess.
- Remove functionality because it has no Aqua equivalent — a search field is
  still a search field; give it the sunken white well and move on.
- Invent tokens, hex values or components. Everything you need is in
  `y2k.css` and the pack's components; if something is genuinely missing, say
  so rather than improvising a lookalike.
- Add a dark mode. Aqua is one theme in five tones.

## Report back

Say what you restyled, what you left alone and why, and paste the final
`/check-y2k` result. If you changed structure — a page became windows — say
that first: it is the change the human will want to look at. For a site,
list how each page was classified, the unmapped blocks, and everything the
source did not give you (pictures, links, numbers); the redirects, old route
→ `/?open=` path; which pictures you scaled down. If you started a server,
say which port and that you stopped it by that port or PID.
