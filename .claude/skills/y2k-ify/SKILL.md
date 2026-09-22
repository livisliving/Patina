---
name: y2k-ify
description: Rewrite an existing page or component in the Y2K pack — Mac OS X Aqua structure in a millennium tone. Use when asked to "y2k-ify", "make this Y2K", "apply the pack", or to restyle a default-looking shadcn/Tailwind page in a project that has the pack's DESIGN.md.
---

# /y2k-ify

Restyle what is already there. The page keeps doing what it did — same routes,
same data, same behaviour — and comes out looking like Mac OS X 10.0.

**Read `DESIGN.md` first.** It is in the project root and it is the spec; this
file only says in what order to work. If there is no DESIGN.md, stop and say
the project needs `npx @patina/cli init` first.

## Order of work

Structure before colour. A page with a hero, a centered column and three
feature cards is still a page after you paint it pink — fixing that is most of
the job, and doing it last means redoing the paint.

1. **Structure.** The viewport is a desktop, not a document: a wallpaper, and
   content in windows that sit on it. Replace the centered `max-w-*` column,
   the hero and the footer. One `WindowFrame` per thing the page is about.
   A `<section>` inside a window becomes a `WindowGroup`; a sunken area (a
   list, a preview, a field's background) becomes a `WindowWell`.
2. **Controls.** Swap the defaults for the pack's components, one for one —
   see the table below. Do not restyle a `<button>` by hand when the pack
   exports `Button`.
3. **Colour.** Everything gel and the wallpaper take the tone; ink stays
   black. Use the `--y2k-*` variables, never new hex values. Never mix two
   tones on one screen, never tint the pinstripes, the traffic lights or text.
4. **Type.** `--y2k-font-ui` everywhere; 13px is the default UI size, 11px for
   captions and status lines, 12px for list rows and document body. Font sizes
   do **not** snap to the 4px grid — everything else does.
5. **Strip the tells.** Grey cards, soft drop shadows, the purple→blue AI
   gradient, thin-line icons, `text-muted-foreground`, helper text under every
   field, friendly empty-state illustrations. They all go.

## What maps to what

| Default | Pack |
| --- | --- |
| `Card` / a bordered panel | `WindowFrame` (standalone) or `WindowGroup` (inside a window) |
| `Dialog` / `Sheet` / modal | `Window` + `WindowTrigger` + `WindowContent`; a confirm → `WindowAlert` inside it |
| `AlertDialog` | `WindowAlert` (64px icon, bold message, informative text, button row) |
| `Button` | `Button` — `variant="white"` normally, `isDefault` for the one default action per window (`pulsing` for the dialog throb); `BevelButton` for a `Choose…` |
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

The checker only reads what a regex can see. It cannot tell you the page still
*reads* as a landing page, that two tones ended up on one screen, or that the
window is 900px wide because you kept the old container. Look at the result.

## Do not

- Change the framework, the routing, the data layer or any business logic.
- Remove functionality because it has no Aqua equivalent — a search field is
  still a search field; give it the sunken white well and move on.
- Invent tokens, hex values or components. Everything you need is in
  `y2k.css` and the pack's components; if something is genuinely missing, say
  so rather than improvising a lookalike.
- Add a dark mode. Aqua is one theme in five tones.

## Report back

Say what you restyled, what you left alone and why, and paste the final
`/check-y2k` result. If you changed structure — a page became windows — say
that first: it is the change the human will want to look at.
