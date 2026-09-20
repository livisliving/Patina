---
version: alpha
name: Y2K — Aqua × Pink
description: >-
  The future as it was imagined in 2000. Structure is Mac OS X Aqua
  (2000–2005): pinstripes, brushed metal, traffic lights, gel buttons, a
  translucent Dock. Color is a millennium "tone" — Pink (McBling) by default,
  switchable to Aqua, Lime, Tangerine or Grape. Tokens are
  normative; the prose says how to apply them and what is forbidden.
colors:
  # ── Tone: Pink (default). bright = lighten(.22), container = darken(.28) ─
  primary: "#E8449A"
  on-primary: "#000000"
  primary-bright: "#ED6DB0"
  primary-container: "#A7316F"
  primary-tint: "#FFE3F1"
  # ── Aqua constants (never toned) ───────────────────────────────────
  secondary: "#2765CA"
  on-secondary: "#FFFFFF"
  tertiary: "#888D99"
  on-tertiary: "#000000"
  neutral: "#ECECEC"
  on-neutral: "#000000"
  neutral-bright: "#FFFFFF"
  neutral-dim: "#D4D4D4"
  neutral-tint: "#F8F8F8"
  neutral-variant: "#7F7F7F"
  neutral-glass: "rgba(248, 248, 248, 0.75)"
  surface: "#E8449A"
  surface-bright: "#F298C7"
  surface-dim: "#681F45"
  on-surface: "#FFFFFF"
  outline: "rgba(0, 0, 0, 0.4)"
  error: "#C13A2D"
  on-error: "#FFFFFF"
  traffic-yellow: "#CA820D"
  traffic-green: "#6FAE3A"
  # ── Other tones (swap into primary / primary-bright / primary-container)
  tone-aqua: "#2765CA"
  tone-aqua-bright: "#5787D6"
  tone-aqua-container: "#1C4991"
  tone-lime: "#7FC31C"
  tone-lime-bright: "#9BD04E"
  tone-lime-container: "#5B8C14"
  tone-tangerine: "#E8891A"
  tone-tangerine-bright: "#EDA34C"
  tone-tangerine-container: "#A76313"
  tone-grape: "#8344C4"
  tone-grape-bright: "#9E6DD1"
  tone-grape-container: "#5E318D"
typography:
  display-wordmark:
    fontFamily: EB Garamond
    fontSize: 44px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: 0em
  headline-lg:
    fontFamily: Lucida Grande
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0em
  headline-md:
    fontFamily: Lucida Grande
    fontSize: 15px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0em
  title-window:
    fontFamily: Lucida Grande
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0em
  menu:
    fontFamily: Lucida Grande
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0em
  body-md:
    fontFamily: Lucida Grande
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0em
  body-sm:
    fontFamily: Lucida Grande
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: 0em
  label-button:
    fontFamily: Lucida Grande
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0em
  label-small:
    fontFamily: Lucida Grande
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: 0em
  input:
    fontFamily: Lucida Grande
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 0em
  mono:
    fontFamily: Monaco
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
rounded:
  none: 0px
  check: 3px
  control: 6px
  window: 7.2px
  button: 14px
  pill: 9999px
spacing:
  unit: 4px
  xs: 2px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  2xl: 24px
  menubar: 25px
  titlebar: 22px
  button-h: 20px      # Apple HIG 2002: push button height 20px fixed
  button-h-small: 17px # Apple HIG 2002: small push button 17px
  popup-h: 20px       # Apple HIG 2002: pop-up / combo 20px (small 17px)
  toolbar-item: 56px
  dock-icon: 48px
  dock-h: 56px
  traffic-light: 14px # Figma Apple OS X design system: 14px (22px pitch)
  traffic-gap: 8px
  window-padding: 16px
components:
  # ── Buttons (Aqua push buttons) ───────────────────────────────────
  button-white:
    backgroundColor: "{colors.neutral-bright}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.label-button}"
    rounded: "{rounded.button}"
    height: "{spacing.button-h}"
    padding: 16px
  button-white-active:
    backgroundColor: "{colors.neutral-dim}"
  button-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-button}"
    rounded: "{rounded.button}"
    height: "{spacing.button-h}"
    padding: 16px
  button-default-hover:
    backgroundColor: "{colors.primary-bright}"
  button-default-active:
    backgroundColor: "{colors.primary-container}"
  button-small:
    backgroundColor: "{colors.neutral-bright}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.label-small}"
    rounded: "{rounded.pill}"
    height: "{spacing.button-h-small}"
    padding: 12px
  button-disabled:
    backgroundColor: "{colors.neutral-tint}"
  # ── Window ───────────────────────────────────────────────────────
  window:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-neutral}"
    rounded: "{rounded.window}"
  window-titlebar:
    backgroundColor: "{colors.neutral-dim}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.title-window}"
    height: "{spacing.titlebar}"
  window-titlebar-inactive:
    textColor: "{colors.neutral-variant}"
  window-body:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.body-md}"
    padding: "{spacing.window-padding}"
  window-close:
    backgroundColor: "{colors.error}"
    size: "{spacing.traffic-light}"
  window-minimize:
    backgroundColor: "{colors.traffic-yellow}"
    size: "{spacing.traffic-light}"
  window-zoom:
    backgroundColor: "{colors.traffic-green}"
    size: "{spacing.traffic-light}"
  window-toolbar-item:
    textColor: "{colors.on-neutral}"
    typography: "{typography.label-small}"
    rounded: "{rounded.control}"
    width: "{spacing.toolbar-item}"
  window-statusbar:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.body-sm}"
    height: 20px
  window-document:
    backgroundColor: "{colors.neutral-bright}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.body-md}"
    padding: 20px
  # ── System chrome ────────────────────────────────────────────────
  menubar:
    backgroundColor: "{colors.neutral-tint}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.menu}"
    height: "{spacing.menubar}"
  menu:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.body-md}"
    height: 24px
    padding: 16px
  menu-item-highlighted:
    backgroundColor: "{colors.primary}"
  dock:
    backgroundColor: "{colors.neutral-glass}"
    size: "{spacing.dock-icon}"
    height: "{spacing.dock-h}"
    padding: 8px
  desktop:
    backgroundColor: "{colors.surface}"
  # ── Controls ─────────────────────────────────────────────────────
  input:
    backgroundColor: "{colors.neutral-bright}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.input}"
    rounded: "{rounded.none}"
    height: 22px
    padding: 6px
  search-field:
    backgroundColor: "{colors.neutral-bright}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.input}"
    rounded: "{rounded.pill}"
    height: "{spacing.popup-h}"
    padding: 8px
  popup:
    backgroundColor: "{colors.neutral-bright}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.label-button}"
    rounded: "{rounded.control}"
    height: "{spacing.popup-h}"
    padding: 8px
  segmented:
    backgroundColor: "{colors.neutral-bright}"
    textColor: "{colors.on-neutral}"
    rounded: "{rounded.control}"
    height: "{spacing.popup-h}"
    width: 28px
  segmented-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-secondary}"
  checkbox-checked:
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.check}"
    size: 14px
  selection:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-secondary}"
  sidebar-selected:
    backgroundColor: "{colors.primary-bright}"
    textColor: "{colors.on-secondary}"
  focus-ring:
    backgroundColor: "{colors.primary-tint}"
    width: 3px
  scroll-thumb:
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    width: 15px
  progress-fill:
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    height: 15px
  tooltip:
    backgroundColor: "{colors.neutral-tint}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.label-small}"
    rounded: "{rounded.check}"
    padding: 4px
  dock-label:
    backgroundColor: "#262626"
    textColor: "{colors.neutral-bright}"
    typography: "{typography.body-md}"
    rounded: "{rounded.pill}"
    padding: 12px
  # ── Tone mapping: the same button in each tone ──────────────────
  button-default-aqua:
    backgroundColor: "{colors.tone-aqua}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.button}"
  button-default-lime:
    backgroundColor: "{colors.tone-lime}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.button}"
  button-default-tangerine:
    backgroundColor: "{colors.tone-tangerine}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.button}"
  button-default-grape:
    backgroundColor: "{colors.tone-grape}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.button}"
---

# Y2K — Aqua × Pink

## Overview

**Y2K is a taste pack for AI coding agents** — pack #1 of [Patina](README.md). It
exists because every
vibe-coded product currently looks the same: Inter, a zinc card, a
purple-to-blue gradient, 8px corners. This file makes an agent produce the
opposite — the future as it was imagined in 2000.

The look has two independent layers:

1. **Structure — Mac OS X 10.0 "Aqua" (Public Beta 2000 / 10.0 2001).**
   Every window is white with horizontal pinstripes, has three glossy
   traffic lights top-left and a centered bold title, casts a deep soft
   shadow, and floats over a swirling wallpaper. Controls are *gel*: pill
   buttons that look like candy with light passing through, a default button
   that pulses, translucent menus, a Dock of big 3D icons. This layer never
   changes.
2. **Tone — the color of everything gel.** Buttons, the checked checkbox,
   the popup arrows, selection, the scroll thumb, the wallpaper. Five
   millennium color families are defined; **Pink is the default** (the
   McBling pink of Juicy Couture velour, the pink Razr, rhinestones and
   Hello Kitty — warm and saturated, never pastel). Switch with
   `data-tone="pink|aqua|lime|tangerine|grape"` on `<html>`.

**Audience:** designers and developers who vibe-code and can't stand the
result. **Emotional target:** *"this came out of a 2001 iMac, not a Figma
template."*

**The signature is the gel.** A Y2K control is a lozenge of colored
candy: a white gloss across the top half, the tone in the middle, a bright
refraction along the bottom edge, and a hairline of dark outline. If a
surface is colored but doesn't look like you could bite it, it isn't done.
Spend boldness there; the rest — pinstripes, black Lucida Grande, soft
shadows — stays quiet and exactly as Apple drew it.

**Y2K OS**, the product's own website, is a desktop built from this pack:
menu bar, draggable windows, Dock. Everything in this document is what that
desktop follows.

## Colors

Color has two jobs: the **Aqua constants** draw the structure; the **tone**
colors everything gel. Both are always present.

**Tone (Pink, default)**

- **Primary — Hot Pink (#FF3D9E):** the middle of every gel gradient. Default
  buttons, the checked checkbox, popup arrow caps, scroll thumbs, progress,
  highlighted menu items, the running-app triangle's cousin — anything that
  glows. Text on it is **black** (Aqua 10.0 put black text on its blue
  buttons; the gloss makes white unreadable).
- **Primary-bright (#FF9AD1):** the top of the gel and the hover state.
- **Primary-container (#C8107A):** the bottom of the gel and the pressed
  state.
- **Primary-tint (#FFE3F1):** selection highlight, the tinted focus glow.
- **Surface / surface-bright / surface-dim (#FF3D9E / #FF9FD6 / #8C0A52):**
  the wallpaper's mid, ribbon and shadow stops. Desktop icon labels are
  white (`on-surface`) with a black drop shadow (`0 1px 2px rgba(0,0,0,.8)`)
  — the shadow, not the wallpaper, provides their contrast.

**Aqua constants (never toned)**

- **Neutral — Pinstripe white (#FAFAFA) over neutral-dim (#ECECEC):** the
  window material — 1px lines alternating, everywhere inside a window.
  Neutral-bright (#FFFFFF) is the top of a white gel button and the field of
  an input; neutral-tint (#D9D9D9) its bottom. Neutral-variant (#7F7F7F) is
  inactive-window title text. Neutral-glass (white at 55%) is the Dock and
  the menus.
- **Secondary — OS Blue (#4A9FF5):** focus rings and links. The one blue
  Aqua never lets go of, even in a pink tone.
- **Tertiary — Graphite grey (#8E98A8):** disabled control labels.
- **Traffic lights:** close = error red (#EE5A4F), minimize = yellow
  (#F6BD3A), zoom = green (#57C93F). They stay red / yellow / green in every
  tone. Inactive windows show them gray (#D4D4D4).
- **Outline (black at 28%):** the hairline around windows, buttons, popups
  and the Dock.

**The other tones** (swap into primary / primary-bright / primary-container;
wallpaper stops follow):

| Tone | Years · scene | Primary | Bright | Container |
|:--|:--|:--|:--|:--|
| Pink (default) | 2001–06 · McBling — Juicy, pink Razr, Bratz | #FF3D9E | #FF9AD1 | #C8107A |
| Aqua | 1998–01 · Bondi Blue iMac, Mac OS X Aqua | #4A9FF5 | #A4D2FF | #1D63C9 |
| Lime | 1999–02 · iMac Lime, Nickelodeon slime, Matrix | #9BE11F | #D8FF85 | #4F9A0A |
| Tangerine | 1999–03 · iMac Tangerine, Fanta, inflatable chairs | #FFA31A | #FFD57F | #D2690A |
| Grape | 2000–04 · iMac Grape, MSN purple, Lisa Frank | #9B6DE8 | #D0B6FF | #5E37B5 |

Never mix tones on one screen. Never put a tone on text.

## Typography

One family does almost everything, because that is what Aqua did.

- **Lucida Grande** — the system face. 13px regular for body and controls,
  13px bold for window titles and section headings, 11px for small buttons,
  status bars, Dock labels and captions, 15–18px bold for the rare headline
  inside a window. Stack: `"Lucida Grande", "Lucida Sans Unicode", "Lucida
  Sans", "Noto Sans", sans-serif`. It is a humanist sans with wide, open
  letterforms; **Inter, Geist, Roboto, Helvetica and system-ui are not
  acceptable substitutes** — their neutrality is exactly the AI look this
  pack exists to kill.
- **EB Garamond** — the wordmark only (`display-wordmark`, 44px), standing in
  for the Apple Garamond of the "Mac OS X" wordmark in the About box.
  Rendered as gel text (tone gradient clipped to the glyphs). Never for
  headings or body.
- **Monaco** (fallback Menlo) — code, at 11px on a black field.

Case: sentence case everywhere. Buttons say `Save`, `Cancel`, `Don't Save`;
titles say `About Patina`, `Read Me`. Never uppercase, never Title Case
Sentences. Body text is black; secondary text is the neutral-variant gray at
11px, never a "muted foreground" mid-gray at body size.

## Layout

The layout model is a **desktop, not a page.** The viewport is the wallpaper;
a 22px menu bar is pinned to the top and a Dock to the bottom; content lives
in windows that float, overlap and can be dragged by their title bars. There
is no hero section, no max-width container, no footer.

- **Menu bar:** 22px, pinstriped, app name in bold on the left, menus at
  13px, tone indicator and clock on the right.
- **Windows** are 300–520px wide and sized to content. Title bar 22px;
  toolbar (when present) is a row of 62px white buttons with a 32px icon and
  an 11px label; body padding 16px; status line 20px at 11px, centered.
  New windows open cascaded 24px right and down from the last.
- **Inside a window,** lay out like a 2001 dialog: labels right-aligned in a
  column, fields left-aligned beside them, group boxes with a bold 11px
  caption, and the button row bottom-right with **Cancel to the left of the
  default button** and 12px between them.
- **Spacing unit: 4px.** 2 / 4 / 8 / 12 / 16 / 24. Controls are separated by
  8px; groups by 12px.
- **Dock:** bottom center, 48px icons on a translucent white shelf, hover
  magnifies to 1.3×, a black triangle marks running apps.
- **Desktop icons** sit top-right, 48px with a 12px white label.
- **Responsive:** below 768px, windows become full-width and stack in order;
  the menu bar and Dock stay pinned; dragging is off.

## Elevation & Depth

Aqua is *all* depth — but it is the depth of glass and candy, not of paper
cards.

- **Windows** cast one deep, soft shadow: `0 10px 28px rgba(0,0,0,.45)` plus
  a hairline `0 0 0 1px rgba(0,0,0,.28)`. Inactive windows: `0 4px 12px
  rgba(0,0,0,.25)`. Nothing else casts this shadow.
- **Menus and tooltips**: `0 6px 16px rgba(0,0,0,.3)` on a white-at-93%
  backdrop-blurred sheet.
- **Gel** (every colored or white control): three highlights stacked —
  `inset 0 1px 0 rgba(255,255,255,.85)` (top rim), a white-to-transparent
  gloss cap over the top 48%, and `inset 0 -6px 7px -4px
  rgba(255,255,255,.75)` (light coming back out of the bottom) — over
  `0 1px 2px rgba(0,0,0,.35), 0 0 0 1px rgba(0,0,0,.3)`. Pressed: the gloss
  fades to 40% and the shadow inverts to `inset 0 2px 4px rgba(0,0,0,.35)`.
- **Traffic lights** are 14px spheres: a radial gradient lit from the top
  third, a gloss cap, and a hairline. Glyphs (×, –, +) appear only on hover.
- **Pinstripes** are the texture of every window surface, including the title
  bar and the menu bar: `repeating-linear-gradient(180deg, #ECECEC 0 1px,
  #FAFAFA 1px 2px)`. They are neutral in every tone.
- **The wallpaper** is a deep-to-light diagonal of the tone with two wide,
  blurred white ribbons sweeping up to the right — Aqua's swoosh, recolored.
- **Toolbar buttons and group boxes** sit *on* the pinstripes with a 1px
  hairline and a 1–2px shadow. No card floats above another card.

## Shapes

Controls are candy; windows are sheets.

- `pill` (9999px) — every gel button, popup, scroll thumb, progress bar,
  tone swatch.
- `window` (6px) — the two top corners of a window; the bottom corners are
  square, as in 10.0.
- `control` (5px) — toolbar buttons, group boxes, menu bottoms.
- `check` (3px) — checkboxes, the Dock shelf, code fields.
- `none` — inputs (sunken white wells), status bars, menus' top edge.

Never 8–16px. A rounded-rectangle card with an 8–12px radius is the single
strongest tell of a default component library, and it has no equivalent in
Aqua. Icons are 64px glossy objects (a face, a folder, a gel pill, a gear on
a tile, a wire-mesh trash) drawn with gradients and a gloss cap — never a
thin-line icon set.

## Components

**Buttons** — gel pills, 20px tall (Apple HIG fixed height), 13px Lucida
Grande, black label, fully rounded (capsule) ends, minimum 69px wide.
- `button-white` — the regular button: white gel. `Cancel`, `Show All`,
  `Don't Save`.
- `button-default` — the window's one default action: tone gel, and it
  **pulses** (brightness 1 → 1.18, 1.4s, ease-in-out) exactly like Aqua's
  blue `Save`. One per window. `Enter` triggers it.
- `button-small` — 18px, 11px label, for toolbars and dense panels.
- Icon buttons are 21px circles. Disabled buttons are flat light gray with
  graphite (tertiary) text and 60% gloss — exempt from the contrast rule, as
  disabled controls are. Focus is a 3px ring in primary-bright.

**Window** — the Dialog *is* a window; there is no modal card.
1. Title bar (22px): pinstripes, traffic lights at 8px from the left with
   7px gaps, bold centered title. Inactive: gray lights, gray title. The
   title bar is the drag handle.
2. Toolbar (optional): white 62px buttons with a 32px icon.
3. Body: pinstripes, 16px padding, 13px black text; group boxes and sunken
   white wells inside.
4. Button row: right-aligned, Cancel then the default.
5. Status line (optional, 20px, 11px centered): `6 items, 56k available`.
Modal windows open centered at 94% → 100% scale over a 20% black scrim with
an ease-out overshoot (220ms); close is instant. Sheets are not attached to
the parent yet — they are centered windows.

**Popup menu** — a white gel pill whose right end cap is a tone gel with two
stacked black arrows. **Checkbox** — a 14px 3px-radius gel square; checked =
tone gel with a black check. **Input** — a square sunken white well, 22px.

**Menu bar and menus** — pinstriped bar; open menu title inverts to the tone;
menu sheet is white at 93% with a 5px bottom radius; highlighted item = tone
background, black text; check marks for radio items.

**Dock** — translucent white shelf, 64px glossy icons, 1.3× hover
magnification, tooltip label above, black triangle under running apps, Trash
at the far right behind a divider.

**Scroll bar** — a tone gel thumb in a white sunken track, 15px.

**Progress** — a tone gel bar; indeterminate = the Aqua barber pole (45°
stripes scrolling left at 28px/s).

**Toast ("Nudge")** — a small window that slides up from the Dock and shakes
once. **Tabs** — white gel segmented control, selected segment in tone.

**Icons** — 64px glossy objects with a gloss cap and a hairline; fills use
the tone so they re-color with it.

**Copy voice** — system voice, short, sentence case: `Save`, `Cancel`,
`Read Me`, `6 items, 56k available`, `Public Beta (build DAY1)`. No
"Welcome back 👋", no "Get started", no emoji in controls.

## Do's and Don'ts

**Do**
- Do make every control gel: gloss cap, tone middle, bright bottom, hairline.
- Do keep pinstripes on every window surface, including title and menu bars.
- Do put black text on gel; white text belongs only on the wallpaper.
- Do give each window exactly one default button, and let it pulse.
- Do keep the traffic lights red / yellow / green in every tone.
- Do use pills for controls and 6px only for window tops; nothing between.
- Do lay out dialogs with right-aligned labels and Cancel left of the default.
- Do keep WCAG AA: black on pink 6.4:1, black on pinstripe 20:1, black on
  aqua 7.6:1, black on lime 13:1.
- Do respect `prefers-reduced-motion`: no pulse, no window zoom, no Dock
  magnification.

**Don't** (the anti-rules; `/check-y2k` fails on any of them)
- Don't use Inter, Geist, Roboto, Helvetica, Arial or `system-ui`. Lucida
  Grande (with its stack) is the only UI face.
- Don't use grey cards: no `#F4F4F5`, no zinc/slate/stone/gray surfaces, no
  white card on off-white. Surfaces are pinstriped or wallpaper.
- Don't use the purple-to-blue "AI" gradient (`#8B5CF6 → #3B82F6`), aurora
  meshes, or any gradient that isn't a gel or the wallpaper.
- Don't use 8–16px corner radii anywhere.
- Don't put a shadow on anything that isn't a window, a menu, a tooltip, the
  Dock or a gel control. No `0 4px 12px rgba(0,0,0,.1)` card shadows.
- Don't use thin-line icon sets (Lucide, Heroicons, Feather).
- Don't tint the pinstripes, the traffic lights or the text with the tone.
- Don't mix two tones on one screen.
- Don't build a page: no hero, no centered max-width column, no three-column
  feature grid, no footer with link columns.
- Don't use `text-muted-foreground` mid-grays, helper text under every
  field, or friendly empty-state illustrations.
