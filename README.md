# Patina

**Taste packs for AI coding agents.** Y2K is pack #1.

Drop `DESIGN.md` into a project and vibe-coded output stops looking like Inter on a
grey card — it comes out as Mac OS X 10.0 Aqua: pinstripes, traffic lights, gel buttons,
a Dock — in a millennium tone (hot pink by default; Aqua, Lime, Tangerine, Grape
switchable). *"The most anti-AI thing in 2026 is 2000's idea of the future."*

It is not a browser extension that restyles a page you're looking at: it changes what
your coding agent *produces*. `npx patina init` → your agent reads DESIGN.md →
`/y2k-ify` rewrites an existing page (both Day 2).

## Layout

```
patina/
├── DESIGN.md              # The product. Google DESIGN.md format; Chrome theme complete,
│                          # Bubblegum / Aero tokens. Lint: npm run design:lint
├── apps/web/              # Y2K OS — the demo desktop + registry output (public/r/*.json)
├── packages/ui/           # Component sources = shadcn registry source (registry.json)
│   └── src/registry/y2k/  #   button.tsx, window.tsx …
│   └── src/styles/y2k.css #   tokens → CSS variables, materials, keyframes, data-theme remaps
├── packages/shaders/      # (Day 1, todo) chrome reflection + translucent plastic, CSS fallbacks
├── packages/cli/          # (Day 2, todo) npx patina init
├── examples/before-after/ # (Day 2, todo)
└── .claude/skills/        # (Day 2, todo) y2k-ify / make-window / chrome-text / check-y2k
```

npm workspaces; Node ≥ 20.

## Commands

```bash
npm install
npm run dev              # Y2K OS at http://localhost:3000
npm run design:lint      # npx @google/design.md lint DESIGN.md
npm run registry:build   # shadcn build → apps/web/public/r/*.json
```

## Consuming the registry (once deployed)

```bash
npx shadcn@latest add https://patina.md/r/window.json
```

`window` pulls `button` and `theme` (the CSS variables) automatically.

## Rules of the house

`DESIGN.md › Do's and Don'ts` is the source of truth. The short version: no Inter/Geist
(Lucida Grande only), no grey cards (pinstripes), no purple→blue gradients (gel or
wallpaper only), no 8–16px radius (pills and 6px window tops), shadows only on windows /
menus / Dock / gel, no thin-line icons, traffic lights stay red-yellow-green in every tone.
