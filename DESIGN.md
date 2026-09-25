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
  primary-selection: "#B53578"   # the selection, deepened until white ink reads (AA)
  primary-list: "#B15887"        # the sidebar's selected row at its lightest (top)
  # ── Aqua constants (never toned) ───────────────────────────────────
  secondary: "#2765CA"
  on-secondary: "#FFFFFF"
  tertiary: "#8D8D8D"
  on-tertiary: "#000000"
  neutral: "#DEDEDE"
  on-neutral: "#000000"
  neutral-bright: "#FFFFFF"
  neutral-dim: "#D4D4D4"
  neutral-tint: "#F8F8F8"
  neutral-variant: "#7F7F7F"
  neutral-glass: "rgba(236, 236, 236, 0.55)"
  neutral-veil: "rgba(250, 250, 250, 0.9)"
  surface: "#E8449A"
  surface-bright: "#F298C7"
  surface-dim: "#681F45"
  on-surface: "#FFFFFF"
  outline: "rgba(0, 0, 0, 0.4)"
  error: "#F04646"
  on-error: "#FFFFFF"
  traffic-yellow: "#F4B01E"
  traffic-green: "#46BE2D"
  # ── A Stickies note (10.0), measured off 512 Pixels' screenshot; content,
  #    never toned
  note-paper: "#FFFFA1"
  note-strip: "#FFE53E"
  note-rim: "#FFC700"
  # ── Other tones (swap into primary / primary-bright / primary-container)
  tone-aqua: "#4D83D2"
  tone-aqua-bright: "#749EDC"
  tone-aqua-container: "#375E97"
  tone-lime: "#7FC31C"
  tone-lime-bright: "#9BD04E"
  tone-lime-container: "#5B8C14"
  tone-tangerine: "#E8891A"
  tone-tangerine-bright: "#EDA34C"
  tone-tangerine-container: "#A76313"
  tone-grape: "#7A3ABA"
  tone-grape-bright: "#9765C9"
  tone-grape-container: "#582A86"
  # ── Gel body under a button label (the darkest stop the text sits on) and
  #    the light control gel (checkbox, radio, selected segment, pop-up gem)
  primary-gel: "#EC7BAF"
  primary-control: "#FF8AC1"
  tone-aqua-gel: "#6E9FD3"
  tone-lime-gel: "#A6D776"
  tone-tangerine-gel: "#EFAC6F"
  tone-grape-gel: "#8963BA"
typography:
  display-wordmark:
    fontFamily: EB Garamond
    fontSize: 44px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: 0em
  heading:
    fontFamily: Lucida Grande
    fontSize: 13px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0em
  legend:
    fontFamily: Lucida Grande
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0em
  title-window:
    fontFamily: Lucida Grande
    fontSize: 13px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0em
  menu:
    fontFamily: Lucida Grande
    fontSize: 13px
    fontWeight: 400
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
    fontWeight: 400
    lineHeight: 1
    letterSpacing: 0em
  label-small:
    fontFamily: Lucida Grande
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: 0em
  label-dock:
    fontFamily: Lucida Grande
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0em
  input:
    fontFamily: Lucida Grande
    fontSize: 13px
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
  field: 2px          # text fields, tree view, bevel button
  check: 3px          # menu-bar highlight, the Dock shelf
  segment: 4px        # segmented and pop-up ends, slider groove
  group: 5px          # group box, tab panel, menu foot
  toggle: 6px         # the title-bar toolbar oval
  tab: 7px            # folder-tab top corners
  window-bottom: 6px  # Aqua 10.0 window foot
  control: 8px
  window: 8px         # Aqua 10.0 window top
  search: 10px        # search field
  button: 14px
  pill: 9999px
spacing:
  unit: 4px
  hairline: 1px       # borders and separators — the only 1px the grid allows
  xs: 2px
  gel-highlight: 3px  # Aqua gloss detail; dies if rounded to 4
  sm: 4px
  legend-inset: 5px   # group-box caption inset; radio dot
  field-inset: 6px    # text inside a text field; control-to-label gap
  slider-track: 7px   # slider groove; disclosure triangle width
  md: 8px
  disclosure: 9px     # disclosure triangle height
  popup-inset: 10px   # pop-up / search / bevel text inset; tab-row indent
  lg: 12px
  traffic-light: 13px # Aqua 10.0 title-bar button; stepper width
  checkbox: 14px      # the radio's cell (a 12px ball inside)
  xl: 16px
  bevel-h: 18px       # bevel button; menu shortcut gap
  slider-pointer-h: 19px
  stepper-h: 21px     # stepper pill; the pop-up's gem width
  2xl: 24px
  menubar: 22px       # Aqua 10.0 menu bar
  titlebar: 26px      # Aqua 10.0 document title bar
  segment-h: 20px     # segment face; its shadow hangs 4px below
  segment-w: 25px     # minimum segment; an icon segment exactly
  button-h: 20px      # push button height, fixed
  button-h-small: 17px # small push button
  popup-h: 20px       # pop-up button
  scrollbar: 15px     # scroller width; check-box cell; slider ball
  toolbar-item: 56px
  dock-icon: 64px
  dock-h: 70px
  traffic-gap: 5px
  window-padding: 20px
components:
  # ── Buttons (Aqua push buttons) ───────────────────────────────────
  button-white:
    backgroundColor: "{colors.neutral-bright}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.label-button}"
    rounded: "{rounded.pill}"
    height: "{spacing.button-h}"
    padding: 14px
  button-white-active:
    backgroundColor: "{colors.neutral-dim}"
  button-default:
    backgroundColor: "{colors.primary-gel}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-button}"
    rounded: "{rounded.pill}"
    height: "{spacing.button-h}"
    padding: 14px
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
    backgroundColor: "{colors.neutral-tint}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.body-sm}"
    height: 24px
  window-document:
    backgroundColor: "{colors.neutral-bright}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.body-md}"
    padding: 20px
    width: 900px            # with an outline; without one, 640px
    height: 520px
  window-outline:
    width: 192px
  window-finder:
    width: 640px            # at least 512px on a narrow screen
    height: 400px
  window-about-person:
    width: 448px
  # ── System chrome ────────────────────────────────────────────────
  menubar:
    backgroundColor: "{colors.neutral-tint}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.menu}"
    height: "{spacing.menubar}"
  menu:
    backgroundColor: "{colors.neutral-veil}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.body-md}"
    rounded: "{rounded.group}"
    height: 19px
    padding: 22px
  menu-item-highlighted:
    backgroundColor: "{colors.primary}"
  dock:
    backgroundColor: "{colors.neutral-glass}"
    size: "{spacing.dock-icon}"
    height: "{spacing.dock-h}"
    padding: 4px
  desktop:
    backgroundColor: "{colors.surface}"
  # ── Controls ─────────────────────────────────────────────────────
  input:
    backgroundColor: "{colors.neutral-bright}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.input}"
    rounded: "{rounded.field}"
    height: 24px
    padding: 6px
  search-field:
    backgroundColor: "{colors.neutral-bright}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.input}"
    rounded: "{rounded.search}"
    height: 24px
    padding: 10px
  popup:
    backgroundColor: "{colors.neutral-bright}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.label-button}"
    rounded: "{rounded.segment}"
    height: "{spacing.popup-h}"
    padding: 10px
  segmented:
    backgroundColor: "{colors.neutral-bright}"
    textColor: "{colors.on-neutral}"
    rounded: "{rounded.segment}"
    height: "{spacing.segment-h}"
    width: "{spacing.segment-w}"
  segmented-selected:
    backgroundColor: "{colors.primary-control}"
    textColor: "{colors.on-primary}"
  checkbox-checked:
    backgroundColor: "{colors.primary-control}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.none}"
    size: "{spacing.lg}"
  radio-on:
    backgroundColor: "{colors.primary-control}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    size: "{spacing.lg}"
  tab:
    backgroundColor: "{colors.neutral-bright}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.body-md}"
    rounded: "{rounded.tab}"
    height: 24px
    padding: 16px
  tab-selected:
    backgroundColor: "{colors.primary-control}"
    textColor: "{colors.on-primary}"
  tab-panel:
    backgroundColor: "{colors.neutral}"
    rounded: "{rounded.group}"
    padding: 12px
  group-box:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-neutral}"
    rounded: "{rounded.group}"
    padding: 20px
  bevel-button:
    backgroundColor: "{colors.neutral-bright}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.label-small}"
    rounded: "{rounded.field}"
    height: "{spacing.bevel-h}"
    padding: 10px
  slider-track:
    backgroundColor: "{colors.neutral-variant}"
    rounded: "{rounded.segment}"
    height: "{spacing.slider-track}"
  stepper:
    backgroundColor: "{colors.neutral-bright}"
    rounded: "{rounded.pill}"
    width: "{spacing.traffic-light}"
    height: "{spacing.stepper-h}"
  table-header:
    backgroundColor: "{colors.neutral-tint}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.input}"
    height: 17px
  table-row-alt:
    backgroundColor: "#EDF3FE"
    textColor: "{colors.on-neutral}"
  tree-view:
    backgroundColor: "{colors.neutral-bright}"
    textColor: "{colors.on-neutral}"
    rounded: "{rounded.field}"
  toolbar-toggle:
    backgroundColor: "{colors.neutral-bright}"
    rounded: "{rounded.toggle}"
    width: 20px
    height: 12px
  selection:
    backgroundColor: "{colors.primary-selection}"
    textColor: "{colors.on-secondary}"
  sidebar-selected:
    backgroundColor: "{colors.primary-list}"
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
    rounded: "{rounded.none}"
    height: 18px
  tooltip:
    backgroundColor: "{colors.neutral-tint}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.label-small}"
    rounded: "{rounded.check}"
    padding: 4px
  dock-label:
    textColor: "{colors.neutral-bright}"
    typography: "{typography.label-dock}"
  link:
    textColor: "{colors.secondary}"
    typography: "{typography.body-md}"
  # ── A Stickies note (a quote in a document): content, never toned ──
  stickies-note:
    backgroundColor: "{colors.note-paper}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: 8px
  stickies-note-strip:
    backgroundColor: "{colors.note-strip}"
    height: 12px
  stickies-note-rim:
    backgroundColor: "{colors.note-rim}"
    width: 1px
  # ── Tone mapping: the same button in each tone ──────────────────
  button-default-aqua:
    backgroundColor: "{colors.tone-aqua-gel}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
  button-default-aqua-hover:
    backgroundColor: "{colors.tone-aqua-bright}"
  button-default-aqua-active:
    backgroundColor: "{colors.tone-aqua-container}"
  desktop-aqua:
    backgroundColor: "{colors.tone-aqua}"
  button-default-lime:
    backgroundColor: "{colors.tone-lime-gel}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
  button-default-lime-hover:
    backgroundColor: "{colors.tone-lime-bright}"
  button-default-lime-active:
    backgroundColor: "{colors.tone-lime-container}"
  desktop-lime:
    backgroundColor: "{colors.tone-lime}"
  button-default-tangerine:
    backgroundColor: "{colors.tone-tangerine-gel}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
  button-default-tangerine-hover:
    backgroundColor: "{colors.tone-tangerine-bright}"
  button-default-tangerine-active:
    backgroundColor: "{colors.tone-tangerine-container}"
  desktop-tangerine:
    backgroundColor: "{colors.tone-tangerine}"
  button-default-grape:
    backgroundColor: "{colors.tone-grape-gel}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
  button-default-grape-hover:
    backgroundColor: "{colors.tone-grape-bright}"
  button-default-grape-active:
    backgroundColor: "{colors.tone-grape-container}"
  desktop-grape:
    backgroundColor: "{colors.tone-grape}"
---

# Y2K — Aqua × Pink

## Overview

**Y2K is the pack of [Patina OS](README.md) — Aqua × millennium for coding agents.** It
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

**Patina OS**, the product's own website, is a desktop built from this pack:
menu bar, draggable windows, Dock. Everything in this document is what that
desktop follows.

## Colors

Color has two jobs: the **Aqua constants** draw the structure; the **tone**
colors everything gel. Both are always present.

**Tone (Pink, default)**

- **Primary — Y2K pink (#E8449A):** the middle of every gel gradient. Default
  buttons, the checked checkbox, popup arrow caps, scroll thumbs, progress,
  highlighted menu items, the running-app triangle's cousin — anything that
  glows. Text on it is **black** (Aqua 10.0 put black text on its blue
  buttons; the gloss makes white unreadable).
- **Primary-bright (#ED6DB0):** the top of the gel and the hover state.
- **Primary-container (#A7316F):** the bottom of the gel and the pressed
  state.
- **Primary-tint (#FFE3F1):** the tinted focus glow. The live focus ring is
  the base at 25% alpha; selection is the base at 88%, with white ink in
  pink / aqua / grape and black ink in lime / tangerine. Where white ink
  would miss AA, the colour is deepened in its own hue until it reads:
  pink selects in #B53578 (**Primary-selection**), and its sidebar row runs
  #B15887 → #9E2E69 (**Primary-list** at the top). Aqua takes the deeper
  highlight blue #336ABD, because the original's lighter #4D83D2 row gives
  white text only 3.8:1.
- **The gels are measured, not guessed.** Every gel, tab, control, progress
  and menu-highlight gradient is the Aqua 10.0 lighting curve (see
  `scripts/tones.mjs`): Aqua takes it as measured, the other tones keep the
  same curve in their own hue. Menu highlights carry white ink in every
  tone, as the Finder's do: where white would miss AA on a stop (lime,
  tangerine), the whole highlight is deepened in its hue until it reads.
- **Surface / surface-bright / surface-dim (#E8449A / #F298C7 / #681F45):**
  the wallpaper's mid, ribbon and shadow stops. Desktop icon labels are
  white (`on-surface`) with a black drop shadow (`0 1px 2px rgba(0,0,0,.8)`)
  — the shadow, not the wallpaper, provides their contrast.

**Aqua constants (never toned)**

- **Neutral — the 10.0 pinstripe (#DEDEDE):** the window material, 1px rows
  on a 4px period — #DEDEDE, #EBEBEB, #DEDEDE, #D7D7D7 — everywhere inside a
  window. Menus use a lighter stripe (#FAFAFA / #E9E9E9 / #FAFAFA / #FFFFFF),
  status bars a placard stripe (#F1F1F1 / #FFFFFF / #F1F1F1 / #EAEAEA).
  Neutral-bright (#FFFFFF) is the field of an input; neutral-tint (#F8F8F8)
  the status bar. Neutral-variant (#7F7F7F) is dimmed text; #8D8D8D is a
  disabled label and #4B4B4B secondary text. Neutral-glass (#ECECEC at 55%,
  pinstriped) is the Dock shelf.
- **Secondary — OS blue (#2765CA, `--y2k-link`):** links, underlined. The
  one blue Aqua never lets go of, even in a pink tone.
- **Tertiary — disabled grey (#8D8D8D):** disabled control labels; the
  control itself fades to 55%.
- **Traffic lights:** radial-gradient spheres, not flat discs — a bright core,
  a saturated middle and a deep rim. Their middles are close = #F04646,
  minimize = #F4B01E, zoom = #46BE2D. They stay red / yellow / green in every
  tone; an inactive window shows all three as the plain white gel. A light
  a window can't use is that same plain gel and does nothing: an About box
  only closes, so its yellow and green are off.
- **Outline:** a window is ringed and its title bar footed by 1px #7F7F7F; a
  text field's rim is #A9A9A9, darker (#949494) along the top; separators are
  20% black.

**The other tones** (swap into primary / primary-bright / primary-container;
wallpaper stops follow):

| Tone | Years · scene | Primary | Bright | Container |
|:--|:--|:--|:--|:--|
| Y2K pink (default) | 2001–06 · McBling — Juicy, pink Razr, Bratz | #E8449A | #ED6DB0 | #A7316F |
| Aqua | 1998–01 · Bondi Blue iMac, Mac OS X Aqua | #4D83D2 | #749EDC | #375E97 |
| Lime | 1999–02 · iMac Lime, Nickelodeon slime, Matrix | #7FC31C | #9BD04E | #5B8C14 |
| Tangerine | 1999–03 · iMac Tangerine, Fanta, inflatable chairs | #E8891A | #EDA34C | #A76313 |
| Grape | 2000–04 · iMac Grape, MSN purple, Lisa Frank | #7A3ABA | #9765C9 | #582A86 |

Never mix tones on one screen. Never put a tone on text.

## Typography

One family does almost everything, because that is what Aqua did.

- **Lucida Grande** — the system face. Aqua 10.0 uses exactly three sizes:
  **11** small (status bars, placards, segments, toolbar labels, bevel
  buttons, small push buttons), **12** legend (group-box captions in bold;
  list and table rows), **13** system (body, buttons, menus, fields, window
  titles and document headings in bold). Nothing is 10, 14 or 15px — bar
  one: the Dock's name label is **14** bold (`label-dock`), measured off
  10.1.
  **Font sizes are never snapped to
  the 4px grid** — they are Apple's own values and stay exactly as drawn. Stack: `"Lucida Grande", "Lucida Sans Unicode", "Lucida
  Sans Unicode", Lato, "Hiragino Sans", ui-sans-serif, system-ui,
  sans-serif` — **Lato** is the open-source stand-in on machines without
  Lucida Grande (Lucida is not redistributable, so it is never bundled). It is
  a humanist sans with wide, open
  letterforms; **Inter, Geist, Roboto, Helvetica and system-ui are not
  acceptable substitutes** — their neutrality is exactly the AI look this
  pack exists to kill.
- **EB Garamond** — the wordmark only (`display-wordmark`, 44px), standing in
  for the Apple Garamond of the "Mac OS X" wordmark in the About box.
  Rendered as gel text (tone gradient clipped to the glyphs). Never for
  headings or body.
- **Monaco** (fallback Menlo, Courier New) — code, at 11px; on a black
  field in the Read Me, inline in documents.

Case: sentence case everywhere. Buttons say `Save`, `Cancel`, `Don't Save`;
titles say `About Patina`, `Read Me`. Never uppercase, never Title Case
Sentences. Body text is black; secondary text is the neutral-variant gray at
11px, never a "muted foreground" mid-gray at body size.

Descenders are never clipped. A box cut to its text gives each line at least
1.35 × the font size; a line height of 1 is for a label centred in a taller
control, never for a box the g and the y fall out of.

## Layout

The layout model is a **desktop, not a page.** The viewport is the wallpaper;
a 22px menu bar is pinned to the top and a Dock to the bottom; content lives
in windows that float, overlap and can be dragged by their title bars. There
is no hero section, no max-width container, no footer.

- **Menu bar:** 22px of menu pinstripe over a #A0A0A0 rule, 13px items 8px
  in, the clock on the right. After the ★ (About, the tones, the pack's
  windows) come 10.1's Finder menus in its order: the front window's app
  in bold (the Finder when nothing else is in front), File, Edit, View, Go,
  Window, Help. On a phone only ★, the app and Help stay. It is the
  `MenuBar` component: menus are data, with the original's shortcuts shown
  and bound.
- **Windows:** a dialog is 300–520px wide and sized to its controls; a
  document, the Finder and the About box take the sizes under Content.
  Title bar 26px;
  toolbar (when present) is a strip falling from #FBFBFB to #DEDEDE over a
  #9A9A9A foot, its items 10px apart (a 32px icon over an 11px label), shown
  and hidden by the white oval at the title bar's right end; body padding
  20px; status bar 24px at 11px, left-aligned 8px in, on the placard stripe.
  New windows open cascaded 24px right and down from the last.
- **Inside a window,** lay out like a 2001 dialog: labels right-aligned in a
  column, fields left-aligned beside them, group boxes with a bold 12px
  caption set into their top border 20px in, and the button row bottom-right
  with **Cancel to the left of the default button** and 12px between them.
- **Spacing unit: 4px — and it is a hard rule, not a suggestion.** *Every*
  non-text value snaps to a multiple of 4: spacing, widths, heights, radii,
  positional offsets. Scale: 4 / 8 / 12 / 16 / 24. Controls are separated by
  8px; groups by 12px. There are exactly three exceptions:
  1. **1px hairlines** — borders and separators.
  2. **2–3px gel highlights** and their small radii — the Aqua gloss detail
     dies if you round it to 4.
  3. **Aqua 10.0 metrics** — menu bar 22px, title bar 26px, traffic light
     13px 5px apart, scroll bar 15px with 17px arrows, push button 20px
     (small 17px), bevel button 18px, pop-up gem 21px, check box cell 15 × 16px
     around a 12px box, radio 14 × 15px around a 12px ball, stepper
     13 × 21px, slider groove 7px under a 15px ball or 15 × 19px pointer, and
     so on. Snapping these distorts chrome Apple measured. Each one is a named
     `spacing:` or `rounded:` token in the front matter, and `/check-y2k`
     allows an off-grid value only when a token names it.
  Font sizes are **not** snapped (see Typography).
- **Dock:** bottom center, 64px icons edge to edge (4px in from each end) on
  a 70px translucent shelf (the Dock pinstripe at 55% under a 1px white
  rim), hover magnifies to 2× with a 140px falloff, a
  black triangle marks running apps, minimized windows park to the right of a
  divider, the Bin at the far right behind another. It is the `Dock`
  component. On a phone the shelf scrolls sideways and an edge with more
  icons past it fades out over 48px — the cue to swipe.
- **Desktop icons** sit top-right, 48px with a 12px white label.
- **Responsive:** the floating desktop needs a screen 768 wide **and** 480
  tall (`desk:` / `max-desk:` in y2k.css); below either — a phone, upright
  or held sideways — windows become full-width and stack, the newest first;
  the menu bar and Dock stay pinned; dragging is off; a window's title bar
  sticks under the menu bar while it is on screen, so its lights stay in
  reach, and a long document's sections become a pop-up under it. A phone
  held sideways (`pair:`, landscape and 640 wide) sets two windows side by
  side, each keeping still while the page scrolls.

## Content

A site becomes a **disk, not a page.** Its map is the disk's folders; every
piece of content is a file, and each file opens in the application that
opened it in 2001. Decide the window before the components: the window
follows from what the content is, the components from what each block is.
A group box groups controls in a dialog; it never divides an article.

**The model.** Content is written once, into the Content model in
`lib/content.ts` (the `content` item): a `Site` — its owner, the `Person`
the About box shows, its entries (document, collection, picture, movie,
alias, about) and at most three `featured` — and, inside each document, its
blocks. A project keeps its own in `content/*.ts`; `content/site.ts` exports
`SITE`. The model is Patina's, not this pack's: another pack renders the
same file its own way. Here the `desktop` item renders it — the Finder,
TextEdit, Preview, QuickTime Player and the About box below. Sort and
transcribe into the model; never hand-build a window, a Finder or a Dock
icon for content.

**Site → desktop.** The site's name is the ★ menu's first row (About
‹name›) and the root volume (‹name› HD); the second row is About Patina OS,
what the desktop is built with (see Licence). Primary navigation becomes the
Go menu, the desktop icons (the volume, then the featured entries,
top-right) and the Dock (Finder · featured documents · top-level
collections · resident apps · Preview and QuickTime Player while they have a
window | minimised windows | Bin). The home page is the desktop's
state at load, never a window of its own. The page's title is the
person's name and role (`Name — Role`) and its description the site's own
sentence, never the pack's name; the name in the About box is the page's
h1. The desktop at load: the About box in front at the
left, the Finder open at the volume beside it, a resident app (the iPod)
under the Finder — laid out from the viewport, clear of the icon column
and the Dock. Footer links and the copyright live in the About box; the
live site is one row of the ★ menu. There is no footer, no scroll-to-top,
no scroll-in animation and no browser window showing the whole site. A
page's old URL opens its window on the desktop: it redirects to
`/?open=‹its Finder path›` (`/?open=Journal/First%20frost.txt`), and the
address follows the front window, so a visitor can copy a link to it.

**Page → window.** Ask in this order; the first yes decides.

| The content is… | Entry | Window |
|:--|:--|:--|
| a set of items that each open (portfolio, archive, blog index) | collection | the Finder (metal), `window-finder` 640 × 400: icon, list and column views; list columns Name · Date Created · Kind · Size; a Kind source list when its items have two categories or more; status `4 of 14 items` |
| one text read start to finish (case study, post, doc page) | document | TextEdit: pinstripe chrome, a white page (`window-document`, 900 × 520; 640 wide without an outline), an outline (TreeView, `window-outline` 192) when it has three sections or more, status `7 sections, 6 pictures` |
| a person, or the product itself | about | the About box, which only closes: a person's is `window-about-person` 448, its panes switched with a pop-up button as Show Info's were, each in a sunken well; a product's is 300 |
| a picture, anywhere | picture | Preview: titled with the file name, status `682 × 1023, 155 KB`; several may be open |
| a movie | movie | QuickTime Player (metal): the poster frame, then the film |
| something to fill in and submit | — | a dialog (Layout › Inside a window) |

**Block → component.** Inside a document each block of the model has one
component, and so one source of colour: the page is white, the controls
are gel, the pictures are the owner's.

- Section heading (`h2`) → 13px bold with an anchor, listed in the outline,
  where the section in view is selected. Subheading (`h3`) → 13px bold,
  close to its paragraph.
- Paragraph, list → 13px black; emphasis bold; links OS blue, underlined,
  no arrows; a link to another entry of the site opens its window. A link
  to another site opens in a new tab; the site's own routes, mail and
  phone open in place.
- Facts (timeline, team, role, client) → right-aligned 11px labels beside
  13px values, as Show Info lists properties.
- Problems → the 32px Warning icon, a bold title, the line.
- A note set apart (`callout`: a tip, an aside, a banner, a warning) → an
  alert's grammar: the 32px Note icon, or the Caution icon for a warning,
  a bold title if the source gives one, the text beside it — never a
  tinted box.
- What was done or delivered (`checklist`) → checked check boxes,
  read-only.
- Steps → a Setup Assistant pane (*Aqua Human Interface Guidelines*, 2002,
  ch. 14): one step to a pane, an Introduction first when the source has
  one, Go Back and Continue at
  the foot, and a progress bar to the left of Go Back — the one honest
  progress bar in a document. A step's command (`code`) sits in Monaco
  under its text, on the pane.
- Quote → a Stickies note in Stickies' own yellow (`note-paper`,
  `note-strip`, `note-rim`), never the tone.
- Questions and answers (`faq`) → disclosure triangles (HIG ch. 7): a
  question to a row, its answer folded beneath it.
- Before / after, variants (`compare`) → folder tabs, the one the site
  shows first in front.
- Results under categories (`metrics`) → a Table, never a Progress bar:
  "56% fewer" is a change, not a fraction. A number the site sets apart
  from its label stays bold, before it, in the one cell.
- Any other table (`table`) → the Table (Components › Lists).
- A true fraction (`progress`: 3 of 5, 72% complete) → Progress.
- A picture (`figure`) → set bare into the page at the page's width,
  scaling with the window, no border and no frame, with an 11px caption;
  it opens Preview. One narrower than the page stands at its own width. Several pictures (`gallery`, a
  carousel, a stack) → a strip in a well that scrolls sideways, the Aqua
  scrollbar along its foot: each picture 240px tall and whole, bare like a
  single picture; one shorter than that (a logo) at its own size, never
  scaled up; a long screenshot shows its top (180 × 240); each opens
  Preview. Never a stack that hides all but the first, never a wrapped wall.
- An embedded board (`embed`: FigJam, Figma, YouTube) → inline, sunk in a
  well, with `Open in ‹app›`; without an embed address, its picture. A
  movie (`video`) → muted and looping at the page's width while it is in
  view, on its poster until then (and always, with reduced motion); it
  opens QuickTime Player. A movie exported with bars baked in keeps them
  out with `crop` (shares of the frame), in the page and in the Player.
- A picture still to come (`placeholder`) → a pinstripe plate of its
  proportions, `Picture to come`.
- Buttons that go somewhere (`links`) → a row of white push buttons; one
  whose address is not known is disabled, `Link not supplied`.
- Code → Monaco at 11px.
- Tags → a fact, or the Finder's Kind — never pills.

A block this list does not name stays a paragraph and is reported as
unmapped; never invent a component for it.

**An item with no page.** An item the site lists but never gave a page of
its own (a card that links nowhere, `href="#"`) is still a file: a
document holding only what its card held — its picture, its line as the
`comment`, its date — never padded, and never a "Read more" to nowhere.

**Names.** A file is named after its entry, with a suffix that says it
opens: `.rtf` for a document with pictures, `.txt` for text only; the owner
may name it otherwise (`fileName`). A picture or a movie keeps its file's
name, short, in sentence case, with its extension
(`Babel revamp timeline.jpg`). An item that is another entry — an
archive's case study — is an alias of it: the same name, the alias arrow,
and it opens the original rather than a copy. Kinds are three to five per
collection; finer labels stay searchable (`keywords`). The one line a
card or a folder carries is the entry's `comment`: the Finder shows it as
Show Info's Comments, and a document under its title.

**Content is transcribed, never invented.** Words, numbers, pictures and
links come from the owner's source first and the live site second. What is
missing is a placeholder or a greyed control, and it is listed; a link
whose address is not known is `href: ""`, never a guess. A picture is the
owner's original file — the same picture, never a crop or a re-shot — and
one wider than 1400px (2400px for a board people must read) is scaled down
to that width, never up, and saved as JPEG at quality 80; a narrower one is
used as it is. On a Mac: `sips --resampleWidth 1400 -s format jpeg -s
formatOptions 80 in.jpg --out out.jpg` (`sips -Z` would cap the longer side
and shrink a tall screenshot); elsewhere ImageMagick's
`magick in.jpg -resize '1400x>' -quality 80 out.jpg`. Its `w`, `h` and
`bytes` are then the new file's.

## Elevation & Depth

Aqua is *all* depth — but it is the depth of glass and candy, not of paper
cards.

- **Windows** cast `0 12px 28px rgba(0,0,0,.34), 0 2px 6px rgba(0,0,0,.2)`,
  focused or not — focus changes only the chrome inside. Nothing else casts
  this shadow.
- **Menus**: `0 8px 20px rgba(0,0,0,.32)` under the menu pinstripe with a
  1px #8A8A8A rim. The Dock: `0 2px 8px rgba(0,0,0,.15)`.
- **Gel** (every colored or white control) is an opaque fill that carries
  its own light, and it is **the original's own rows** — one colour per
  pixel, read off the rendered 10.0 control and drawn back as a px-stop
  gradient (`scripts/tones.mjs` generates every one into `y2k.css`). A push
  button's 20 rows run #7C7C7C, #B4B4B4, #D2D2D2 … #D6D6D6 … white, #F8F8F8:
  a dark rim, a pale cap, a dip, the glow. Other tones keep each row's
  lightness offset and chroma ratio in their own hue. A push button's round
  ends darken toward the rim, and it sits on a short, tight drop,
  `0 2px 3px rgba(0,0,0,.3), 0 1px 2px rgba(0,0,0,.24), 0 1px 0 rgba(255,255,255,.5)`.
  Pressed lays the original's grey press over the fill and pulls the shadow
  in to `0 1px 2px rgba(0,0,0,.28)`.
- **Traffic lights** are 13px gems, 5px apart: the original's 13 rows each —
  a near-black rim, a white glint, the colour, a glow at the foot — on a
  light, 2px drop. Unfocused, they turn graphite at 55%. Glyphs (×, –, +)
  appear only on hover.
- **An unfocused window's title bar** is 75% grey rows with nothing under
  them, so the desktop shows faintly through it (brushed metal stays opaque).
- **Surfaces** — the static textures Aqua is built from, neutral in every
  tone, each a token and a plain class:
  - **Light pinstripe** (`--y2k-pinstripe-light`, `.y2k-pinstripe-light`):
    #FAFAFA / #E9E9E9 / #FAFAFA / #FFFFFF — the menu bar. An open menu wears
    it at 90% (`--y2k-pinstripe-menu`), so the screen shows faintly through.
  - **Dock pinstripe** (`--y2k-pinstripe-dock`): #ECECEC / #E8E8E8 /
    #ECECEC / #F5F5F5 at 55% — the Dock shelf, the desktop showing through;
    solved from 10.1's shelf over two wallpaper blues.
  - **Pinstripe** (`--y2k-pinstripe`, `.y2k-pinstripe`): #DEDEDE / #EBEBEB /
    #DEDEDE / #D7D7D7 — every window body and title bar.
  - **Dark pinstripe** (`--y2k-pinstripe-dark`, `.y2k-pinstripe-dark`):
    #CFCFCF / #D5D5D5 / #E3E3E3 / #D5D5D5 — sheets.
  - **Brushed metal** (`--y2k-metal`, `.y2k-metal`) — textured windows.
  All are 1px rows on a 4px period. The **shaders** (chrome reflection,
  translucent plastic) are a separate, animated layer for hero surfaces.
- **The wallpaper** is the `Wallpaper` component. The pack's own is the
  tone-reactive swoosh: a deep-to-light diagonal of the tone with two
  blurred white ribbons, Aqua's swoosh recoloured. A project can pass its
  own photos per tone — a 16:9 one and a portrait one for phones, picked at
  md; the Patina site uses Olivia's collages.
- **Toolbar buttons and group boxes** sit *on* the pinstripes with a 1px
  hairline and a 1–2px shadow. No card floats above another card.

## Shapes

Controls are candy; windows are sheets.

- `pill` (9999px) — every push button, scroll thumb, radio, stepper, tone
  swatch.
- `window` (8px) / `window-bottom` (6px) — a window's top and bottom corners,
  on pinstripe and metal alike, as in 10.0.
- `search` (10px) — the search field.
- `control` (8px) — toolbar buttons and wells.
- `tab` (7px) — a folder tab's top corners.
- `toggle` (6px) — the title bar's toolbar oval.
- `group` (5px) — group boxes, tab panels, a menu's bottom corners.
- `segment` (4px) — segmented-control and pop-up ends, the slider groove.
- `check` (3px) — the menu-bar highlight, the Dock shelf.
- `field` (2px) — text fields, tree views, bevel buttons.
- `none` — check boxes, progress bars, status bars, menus' top edge.

Never an 8–16px rounded *card*. A rounded rectangle with an 8–12px radius
floating on a flat background is the single strongest tell of a default
component library, and it has no equivalent in Aqua — the 8px `control`
radius belongs to sunken wells and group boxes that sit **on** the pinstripes,
never to a card that floats above them. Icons are 64px glossy objects (a face, a folder, a gel pill, a gear on
a tile, a wire-mesh trash) drawn with gradients and a gloss cap — never a
thin-line icon set.

## Components

**Buttons** — the 10.0 push button: 20px tall (small 17px; there is no large
size), 68px minimum,
14px end caps, 13px Lucida Grande **regular**, black label, no text shadow.
- `button-white` — the regular button: the white fill. `Cancel`, `Show All`,
  `Don't Save`.
- `button-default` — the window's one default action: the tone gel, at rest
  (the throb's mid-phase, which is what every resting screenshot shows). The
  dialog throb is opt-in (`pulsing`: brightness .94 → 1.22, 0.5s). One per
  window. `Enter` triggers it.
- `bevel-button` — `Choose…`: 18px, 11px, the original's light face with a
  dark 1px foot and 2px corners. The face is nine-sliced, as the original's
  is, so an icon bevel can stand taller (a player's 24px foot buttons).
- Icon buttons are the 20px round button: a grey sphere, an 11px glyph. The
  sphere scales with its box: a player's transport is 28px and 32px.
  Disabled buttons fade to 55% with #8D8D8D text — exempt from the contrast
  rule, as disabled controls are. Focus is a 3px ring in the light tone at
  55%.
- A text link is not a button: 13px OS blue (`--y2k-link`), underlined
  (`variant="link"` when it must be a Button).
- shadcn's Button names still compile — `default` is the tone gel;
  `outline`, `secondary`, `ghost` and `destructive` the white button;
  `lg` the one push-button size, `xs` the small one — so an existing page
  builds after install. They are a bridge, not the design: /y2k-ify still
  decides which one button in a window is the default.

**Window** — the Dialog *is* a window; there is no modal card.
1. Title bar (26px): the original's 26 rows ending in a 1px #7F7F7F foot,
   13px traffic lights 8px from the left and 5px apart, a bold 13px #2F2F2F
   title with a white 1px lift, centred with 66px kept clear either side
   (an overlong title ends in an ellipsis). Unfocused: graphite lights,
   #8A8A8A title, translucent grey rows. The title bar is the drag handle; a
   toolbar window carries the white 20 × 12 oval at its right end.
2. Toolbar (optional): the #FBFBFB → #DEDEDE strip, 32px icons over 11px
   labels on one baseline; a dotted rule (1px, 2px on and 2px off in
   #8F8F8F) parts the groups.
3. Body: pinstripes, 20px padding, 13px black text; group boxes and sunken
   white wells inside.
4. Button row: right-aligned, Cancel then the default.
5. Status bar (optional, 24px, 11px #404040 left-aligned 8px in, on the
   placard stripe under a #B4B4B4 rule): `6 items, 56k available`.
6. Corners: 8px top, 6px bottom; a 1px #7F7F7F border.
An **alert** lays out a 64px icon, a bold 13px message, 11px informative text
and the button row, all 20px in.
Modal windows open centered at 94% → 100% scale over a 20% black scrim with
an ease-out overshoot (220ms); close is instant. Sheets are not attached to
the parent yet — they are centered windows.

**Pop-up button** — 20px, the white rows with a 4px round left end and 13px
text 10px in, ending in a 21px gem (the tone control rows behind a darker
1px line, its round right end darkening) with two white 5 × 4 arrows.
**Checkbox** — a 15 × 16px cell holding a square 12px box 3px down, its
label 24px from the left edge; checked = the tone check rows and a black
tick that overshoots the box's top-right corner; mixed = a 6 × 2px black
bar. **Radio** — a 14 × 15px cell holding a 12px ball; on = the tone ball
and a 4px black dot. Both sit on a 1px drop. **Text field** — 24px, white,
13px text 6px in, a #A9A9A9 rim darker (#949494) on top, 2px corners, a short
inner shadow; focused, the rim takes the tone and a 3px ring. **Search
field** — the same with 10px corners, 10px in. **Slider** — a 7px groove
(the original's rows, 4px ends); a 15px tone ball, or a 15 × 19px pointer
with a 45° point over 1 × 5px #8A8A8A ticks. **Stepper** — a 13 × 21px pill
with two little black arrows, 6px after its number field; the pressed half
floods with the tone.
**Segmented control** — 20px of face with 4px ends and a soft shadow 4px
deep beneath; segments 9px either side of 11px text, at least 25px (an icon
segment exactly 25), parted by a 1px divider that fades dark → light; the
selected segment is the tone control rows, its glyph black.

**Menu bar and menus** — the menu pinstripe, at 90% on an open menu so the
screen shows through; an open menu title and a
highlighted item take the tone highlight gradient with its ink (3px corners
on the bar); the menu sheet has a 1px #8A8A8A rim, 5px bottom corners, a 4px
inset and 19px rows 22px from the edge; radio items show a check. A
shortcut sits at the row's right in the same 13px, greyed with the row;
the Window menu lists the open windows, a check on the front one and a
diamond on those in the Dock.

**Dock** — a translucent pinstriped shelf with a 1px white rim (77%) on
the top and ends and no rounded corners; 64px glossy icons edge to edge, 2×
hover magnification; the hovered icon's name floats 4px above it in 14px
bold white with a dark shadow (no pill); black triangle under running apps;
minimized windows parked after a divider — a white hairline (78%) the
shelf's full height — and the Bin at the far right behind another. Finder
sits leftmost, as the Aqua smiley. An app that isn't running bounces its
icon twice (half its height) as it starts; a window being minimised pours
into its tile through the genie's funnel, and out again when it comes back
(`genie`).

**Scroll bar** — 15px: one 17px arrow at each end (the 10.0 default), a
grooved trough curving into cups under them, the tone gel thumb. A vertical
bar when the content is too tall, a horizontal one along the foot when it is
too wide, and the square between them when both.

**Progress** — square-ended: a 16px grooved track (the original's rows, a
4px shadow beneath, the last 2px at each end a shade darker) under an 18px
fill. Determinate = the tone progress rows with their ribs, a 16px
light–dark–light wave sliding right a pixel a frame; at 100% the bar is done
and still. Indeterminate = the barber pole: tone and white stripes at 45°,
32px apart, stepping right under the gel's lighting.

**Selection** — a selected row, a menu highlight and selected text all take
the tone; the browser's own blue never shows.

**Lists** — a **table** has a 17px list-header row (the sorted column in
the tone, a 7×6 triangle 4px from its right edge pointing the way it sorts)
with hairline column rules, 12px text in 2px / 8px cells, every
other row the pale tone (#EDF3FE in aqua, the same lightness in every tone),
the selected row in the tone selection. The Finder's list view is this
table. A **tree view** is a sunken white panel of 18px
rows with black disclosure triangles.

**Brushed-metal controls** (the iPod, after iTunes 2) — white transport
discs, 28px and 32px (`Button variant="metal"`, `--y2k-metal-button`: a
white cap, a dip, white to a dark foot; the glyph #393939, greying to
#9C9C9C when disabled while the disc stays), sunk in one well that is dark
under its top edge and lit along its foot; a 6px volume groove with a 12px
white ball (`Slider thumb="metal"`, `--y2k-metal-groove`, `--y2k-metal-knob`)
between two speakers of one 6×10 body. Its status
display keeps iTunes' #DEE7C6 in every tone, with #323931 ink.

**Toast ("Nudge")** — a small window that slides up from the Dock and shakes
once. **Tabs** — 10.0 folder tabs: 24px with 7px top corners on a
pinstriped panel (1px #9A9A9A rim, 5px corners, 12px padding); the selected
tab is the light tone tab gel with **black** ink — the original's white
label on that light gel fails AA, so the pack departs from it.

**Icons** — 64px glossy objects with a gloss cap and a hairline. An icon
looks the same in every tone: its gel parts are its own fixed colour (OS
blue for most; Mail's seal red, the lock brass, the bolt yellow), and only
Folder, Heart and Star take the tone. The pack ships 24 of them (`icons`:
`IconComputer`, `IconHome`, `IconFolder`, `IconDocument`, `IconMail`,
`IconChart`, `IconLock`…), drawn for it on a 128px grid and legible from
16px; the materials (paper, glass, metal, white plastic) are neutral, and
the status ones keep their own colours — Info's OS blue, Warning's yellow,
Check's green. `lucideToPack` names the one
to use for a lucide-react icon; one with no match is removed, not kept as a
line icon.

**Copy voice** — system voice, short, sentence case: `Save`, `Cancel`,
`Read Me`, `6 items, 56k available`, `Public Beta`. No
"Welcome back 👋", no "Get started", no emoji in controls.

## Do's and Don'ts

**Do**
- Do make every control gel: gloss cap, tone middle, bright bottom, hairline.
- Do keep pinstripes on every window surface, including title and menu bars.
- Do put black text on gel; white text belongs only on the wallpaper.
- Do give each window exactly one default button.
- Do keep the traffic lights red / yellow / green in every tone.
- Do use pills for push buttons, 8px / 6px for window corners, 5px for group
  boxes and menus, 4px for segmented and pop-up ends, 7px for tab tops;
  nothing else.
- Do lay out dialogs with right-aligned labels and Cancel left of the default.
- Do keep WCAG AA, measured on the rendered gel rather than a flat colour:
  black on the default button is 8.6:1 in pink, 8.1:1 in aqua, 13.3:1 in lime,
  11.5:1 in tangerine and 4.9:1 in grape (its darkest tenth, on the measured
  rows); black on the pinstripe about 15:1.
  White ink on a selected row and on the sidebar's selected row is at least
  4.5:1 in every tone: `scripts/tones.mjs` deepens a tone in its own hue
  until it is (pink's selection 4.6:1, its sidebar 4.6:1 at the lightest).
- Do respect `prefers-reduced-motion`: no pulse, no window zoom, no Dock
  magnification, no bounce, no genie.

**Don't** (the anti-rules; `/check-y2k` fails on any of them)
- Don't use Inter, Geist, Roboto, Helvetica or Arial, and don't *name*
  `system-ui` as the face. Lucida Grande is the only UI face; Lato is its
  open-source stand-in, and `system-ui` appears only as the last resort at the
  tail of the stack.
- Don't use grey cards: no `#F4F4F5`, no zinc/slate/stone/gray surfaces, no
  white card on off-white. Surfaces are pinstriped or wallpaper.
- Don't use the purple-to-blue "AI" gradient (`#8B5CF6 → #3B82F6`), aurora
  meshes, or any gradient that isn't a gel or the wallpaper.
- Don't put an 8–16px radius on a floating card or panel. The 8px radius is
  reserved for wells and group boxes that sit on the pinstripes.
- Don't put a shadow on anything that isn't a window, a menu, a tooltip, the
  Dock or a gel control. No `0 4px 12px rgba(0,0,0,.1)` card shadows.
- Don't use thin-line icon sets (Lucide, Heroicons, Feather).
- Don't tint the pinstripes, the traffic lights or the text with the tone.
- Don't mix two tones on one screen.
- Don't build a page: no hero, no centered max-width column, no three-column
  feature grid, no footer with link columns.
- Don't use `text-muted-foreground` mid-grays, helper text under every
  field, or friendly empty-state illustrations.

## Licence

Patina OS is by Olivia Forster (https://oliviaforster.com), at
https://github.com/livisliving/Patina. Every file the pack installs names
her in its first line; the MIT licence below asks that this notice stay in
every copy. A desktop built with the pack also names her in the ★ menu's
About Patina OS, and itself on About The Finder and in the page's
generator tag.

MIT License

Copyright (c) 2026 Olivia Forster

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
