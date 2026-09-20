# ryOS ↔ Y2K.md Window Fidelity — Ground Truth Brief

> **Rename note (2026-09-20): the product is now Patina; "Y2K" is retained as the name of taste pack #1. The repo moved from `~/Desktop/y2k-md` to `~/Desktop/patina`. Below is the 2026-09-18 record, kept as-is.**

Captured 2026-09-18 from the LIVE ryOS Finder window (https://os.ryo.lu, `class="dark"`,
tone currently amber ≈#DF943F) and from the Y2K.md source at `~/Desktop/y2k-md`.

## SCOPE / RULES for the diff (from Olivia)
- Compare **structure, geometry, material technique, and layering** ONLY.
- **IGNORE hue.** ryOS is dark-theme amber; Y2K.md is light-theme pink. Do NOT report
  "colour differs" / "your text is black, theirs is white" — that is a theme/tone choice,
  not a fidelity gap. Report the *technique* (e.g. "ryOS adds an inset top rim-light the
  Y2K light lacks"), converted to Y2K's light+pink context.
- The target is Mac OS X 10.x Aqua fidelity. ryOS is the reference implementation.

## REFERENCE — ryOS measured values (the target)

### Window shell (`.window`)
- border-radius: **17.66px** (≈1.1rem)
- box-shadow: `rgba(0,0,0,0.7) 0 12px 35px`
- border: **0.5px** `rgba(0,0,0,0.85)`
- **backdrop-filter: `blur(26px) saturate(1.85)`**  ← frosted glass behind the whole window
- uses CSS var `--os-metrics-border-width: .5px`
- size in capture: 680×400

### Title bar (`.title-bar`)
- height: **24px** (`h-6`), radius `8px 8px 0 0`, padding `0.1rem`
- title text: LucidaGrande stack, **12px**, weight 400, near-white (dark theme), no text-shadow in dark

### Traffic lights (3 × `.rounded-full`)
- size **13×13px**, positions x=24/45/66 → **21px pitch** (8px gap edge-to-edge)
- **each light has 3 child gloss layers** (not 2)
- box-shadow (5–6 layers):
  `0 2px 3px rgba(0,0,0,0.2), 0 1px 1px rgba(0,0,0,0.3), inset 0 0 0 0.5px rgba(0,0,0,0.45),
   inset 0 1px 1px rgba(255,255,255,0.45), <tone> 0 2px 3px …`
  ← note the **`inset 0 1px 1px rgba(255,255,255,0.45)` top rim-light**
- fill: single vertical gradient of the light colour at .8→.58 alpha

### Toolbar (row under title bar)
- height: **38px**, transparent bg (NO separate pinstripe fill; sits on window glass)
- padding `6px 4px`
- nav controls are **segmented pill buttons**: pairs of `27×22` + `26×22` joined,
  radius `11.04px` on the OUTER corners only (`11.04 0 0 11.04` / `0 11.04 11.04 0`);
  single pills radius `11.04px` all corners
- each pill has a layered gel overlay: `linear-gradient(rgba(255,255,255,0.12), rgba(255,255,255,0.03))`
  over a base — classic Aqua button gloss
- toolbar ITEMS (Macintosh HD, AirDrop…) are `173×36` icon rows (list style here, not big-icon grid)

### Sidebar (`.os-sidebar`)
- width **175px**, inset shadow `inset 0 1px 2px rgba(0,0,0,0.3)`, top rim `0 1px 0 rgba(255,255,255,0.06)`
- selected row: vertical 3-stop **tone gradient** (amber here), radius 0 (full-bleed row)

### Status bar (`.os-status-bar`)
- height **18px**, text **10px**, centered

## SUBJECT — Y2K.md current values (what we have)
Source: `packages/ui/src/registry/y2k/window.tsx` + `packages/ui/src/styles/y2k.css`

### Window shell (`WindowFrame`, `--y2k-window-*`)
- radius: `--y2k-window-radius: **0.45rem** (≈7.2px)`  ← MUCH tighter than ryOS 17.66px
- border: `[0.5px]` `--y2k-window-border: rgba(0,0,0,0.4)`
- shadow: `--y2k-shadow-window: 0 12px 35px rgba(0,0,0,0.6)`  ← matches ryOS blur/spread, alpha .6 vs .7
- **NO backdrop-filter** — window is opaque pinstripe (`bg-(image:--y2k-pinstripe)`), not frosted glass
- pinstripe fill: 1.5px transparent + 2.5px white, 4px period, over #ececec

### Title bar (`WindowTitleBar`, `--y2k-titlebar-h`)
- height: `--y2k-titlebar-h: **22px**` (ryOS 24px)
- title CENTERED (`absolute left-1/2 -translate-x-1/2`), 13px, weight medium (ryOS 12px/400, also centered)
- text-shadow (light active): `0 2px 3px rgba(0,0,0,0.25)`
- border-bottom hairline `--y2k-titlebar-border: rgba(0,0,0,0.3)`
- fill: `--y2k-pinstripe-titlebar` gradient + pinstripe

### Traffic lights (`TrafficLight`, `--y2k-light-*`)
- size **13×13px** ✓ matches
- gap: `gap-2` (8px) → pitch 21px ✓ matches ryOS
- gloss: **2 layers** (top shine 28% + bottom glow 33%) — ryOS has **3 child layers**
- shadow (`--y2k-light-red-shadow` etc): 6 layers incl `inset 0 0 0 0.5px rgba(0,0,0,0.3)` and
  inset tone glows — BUT alpha on outer dark ring is 0.3 (ryOS 0.45), and check the
  **top rim-light** `inset 0 1px 1px rgba(255,255,255,0.45)` — Y2K relies on the shine div instead
- fill: 2-stop gradient (e.g. red rgb(193,58,45)→rgb(205,73,52))
- glyphs (×/−/+) only show on group hover ✓ (Aqua behaviour)

### Toolbar (`WindowToolbar` + `WindowToolbarItem`)
- `WindowToolbar`: flat row, `gap-2`, border-bottom `--y2k-separator`, padding `px-2 py-1.5` (~30px tall)
- `WindowToolbarItem`: **big-icon-over-label** buttons (`w-14`, 32px icon, 11px label) — the
  10.0/10.1 "large icon" toolbar. ryOS uses the **segmented-pill nav** style (10.3+ brushed).
  → NOTE: these are two DIFFERENT valid Aqua eras. Flag as a choice, not a bug.
- NO segmented back/forward pill component exists in Y2K yet

### Sidebar
- **Y2K has NO sidebar component.** The demo Finder window uses an ad-hoc layout.
  ryOS has a real 175px source-list sidebar with tone-gradient selection.

### Status bar (`WindowStatusBar`)
- height `h-5` (**20px**) — ryOS 18px
- text 11px — ryOS 10px
- centered ✓, border-top separator ✓

### Other Y2K window parts (no ryOS equivalent captured): WindowGroup (fieldset), WindowWell,
  WindowFooter (button row, gap-3=12px), WindowBody (p-4).
