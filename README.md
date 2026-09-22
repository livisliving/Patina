# Patina

**Taste packs for AI coding agents.** Y2K is pack #1.

Drop `DESIGN.md` into a project and vibe-coded output stops looking like Inter on a
grey card — it comes out as Mac OS X 10.0 Aqua: pinstripes, traffic lights, gel buttons,
a Dock — in a millennium tone (hot pink by default; Aqua, Lime, Tangerine, Grape
switchable). *"The most anti-AI thing in 2026 is 2000's idea of the future."*

It is not a browser extension that restyles a page you're looking at: it changes what
your coding agent *produces*. `npx @patina/cli init` → your agent reads DESIGN.md →
`/y2k-ify` rewrites an existing page.

## Layout

```
patina/
├── DESIGN.md              # The product. Google DESIGN.md format; Aqua in five tones.
│                          # Lint: npm run design:lint
├── apps/web/              # Y2K OS — the demo desktop + registry output (public/r/*.json)
├── packages/ui/           # Component sources = shadcn registry source (registry.json)
│   └── src/registry/y2k/  #   button.tsx, window.tsx …
│   └── src/styles/y2k.css #   tokens → CSS variables, materials, keyframes, data-tone remaps
├── packages/shaders/      # chrome reflection + translucent plastic, CSS fallbacks
├── packages/cli/          # npx @patina/cli init — installs the pack into a project
├── scripts/check-y2k.mjs  # the /check-y2k scanner: reads its rules out of DESIGN.md
└── .claude/skills/        #   check-y2k · y2k-ify
```

npm workspaces; Node ≥ 20.

## Commands

```bash
npm install
npm run dev              # Y2K OS at http://localhost:3000
npm run design:lint      # npx @google/design.md lint DESIGN.md
npm run registry:build   # shadcn build → apps/web/public/r/*.json
npm run check:y2k        # /check-y2k against DESIGN.md (exit 1 on any violation)
npm pack -w @patina/cli  # build the installer tarball (assets are synced on prepack)

# point the built registry somewhere else (preview, localhost) — canonical when unset
PATINA_REGISTRY=http://localhost:3000/r npm run registry:build
```

## Consuming the registry

```bash
npx shadcn@latest add https://patina-one.vercel.app/r/window.json
```

The built registry points at the Vercel deployment (`PATINA_REGISTRY` at build time);
`registry.json` itself stays canonical at `https://patina.md/r` for when that domain is live.

`window` pulls `button` and `theme` (the CSS variables) automatically.

## Rules of the house

`DESIGN.md › Do's and Don'ts` is the source of truth. The short version: no Inter/Geist
(Lucida Grande only), no grey cards (pinstripes), no purple→blue gradients (gel or
wallpaper only), no 8–16px radius (pills and 6px window tops), shadows only on windows /
menus / Dock / gel, no thin-line icons, traffic lights stay red-yellow-green in every tone.
