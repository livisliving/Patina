# Patina

**Patina OS — Aqua × millennium for coding agents.**

Put the pack's `DESIGN.md` in a project and what your agent builds there stops looking
like Inter on a grey card. It comes out as Mac OS X 10.0 Aqua, with pinstripes, traffic
lights, gel buttons and a Dock, in a millennium tone: hot pink by default, or Aqua, Lime,
Tangerine or Grape. *"The most anti-AI thing in 2026 is 2000's idea of the future."*

Patina isn't a browser extension and doesn't restyle pages you visit. It changes what
your coding agent writes. After `npx @pat1na/cli init` your agent reads DESIGN.md before
it builds any UI, and `/y2k-ify` rebuilds a page you already have.

The demo desktop, built with the pack: https://livisliving.github.io/Patina/

## Put Patina on your site

Send your AI agent — Claude Code, Cursor, Codex — the link to this page and ask for it:
*"Put Patina on my site."* It runs the installer in your project, and a page opens in your
browser: the Patina Setup Assistant, a few questions about your site and the tone. Answer
them there; your agent does the rest. You never need a terminal.

Rather do it yourself? In your project, run `npx @pat1na/cli@latest init`.

### For AI agents

You were given this repository to put Patina on the user's project. Do it with the
installer, in their project. Do not clone this repository, and do not copy files out of
it: the installer fetches everything and records what it wrote, so the project can update
later.

1. In the root of the user's project (the folder with its `package.json`), run

   ```bash
   npx @pat1na/cli@latest init --setup
   ```

   Run it in the background: it opens the Patina Setup Assistant in the user's browser,
   prints the page's address, and waits until they have answered and the install is done
   (thirty minutes at most). Tell the user a page has opened in their browser for them to
   answer, and give them the address it printed in case it did not open.
2. When it exits, read its output: it says what it installed and what to do next.
3. Run `/y2k-ify`. The installer put it in `.claude/skills/y2k-ify/`; in an agent without
   skills, read `.claude/skills/y2k-ify/SKILL.md` and follow it. It reads the user's answers
   from `patina.json` and asks, in one message, anything they left open.

No browser where you run (a cloud sandbox)? Ask the user the Setup Assistant's questions
in chat instead — who the site is about, what a visitor should do first, how much becomes
a desktop, where the real content is, the tone, the extras — and pass the answers as flags:
`npx @pat1na/cli@latest init --tone <pink|aqua|lime|tangerine|grape> --scope whole …`
(`npx @pat1na/cli --help` lists them). Whatever you leave out, `/y2k-ify` asks.

No project yet — a site that lives somewhere else, or an export from Figma Sites, Framer
or Webflow? Make one first with `npx create-next-app@latest` (TypeScript, Tailwind, the
App Router), then run the installer in it; the Setup Assistant asks where the content is.

Patina needs a React project with Tailwind (Next.js 15 or 16 is what it is built on) and
Node 20 or later.

### Keeping it up to date

Patina is copied into your project, so a new release reaches it only when you update.
Your agent checks when it runs `/y2k-ify` or `/check-y2k` and tells you when there is a
newer one. To check yourself, run `npx @pat1na/cli@latest outdated` in the project; to
update, `npx @pat1na/cli@latest update` (files you have changed are kept). To hear of
every release by email, **Watch** this repository on GitHub → Custom → Releases.

## Working on Patina

The rest of this page is for working on Patina itself.

### Layout

```
patina/
├── DESIGN.md              # The product. Google DESIGN.md format; Aqua in five tones.
│                          # Lint: npm run design:lint
├── apps/web/              # Patina OS — the demo desktop + registry output (public/r/*.json)
├── packages/ui/           # Component sources = shadcn registry source (registry.json)
│   └── src/registry/y2k/  #   button.tsx, window.tsx …
│   └── src/styles/y2k.css #   tokens → CSS variables, materials, keyframes, data-tone remaps
├── packages/shaders/      # chrome reflection + translucent plastic, CSS fallbacks
├── packages/cli/          # npx @pat1na/cli init — installs the pack into a project
├── scripts/check-y2k.mjs  # the /check-y2k scanner: reads its rules out of DESIGN.md
└── .claude/skills/        #   check-y2k · y2k-ify
```

npm workspaces; Node ≥ 20.

### Commands

```bash
npm install
npm run dev              # Patina OS at http://localhost:3000
npm run design:lint      # npx @google/design.md lint DESIGN.md
npm run registry:build   # shadcn build → apps/web/public/r/*.json
npm run check:y2k        # /check-y2k against DESIGN.md (exit 1 on any violation)
npm pack -w @pat1na/cli  # build the installer tarball (assets are synced on prepack)

# point the built registry somewhere else (preview, localhost) — canonical when unset
PATINA_REGISTRY=http://localhost:3000/r npm run registry:build

# the static copy for GitHub Pages (apps/web/out); the workflow in
# .github/workflows/pages.yml does this on every push to main, with the path
# and address GitHub gives it
GITHUB_PAGES=true PAGES_BASE_PATH=/Patina PAGES_BASE_URL=https://example.com/Patina npm run build
```

### Consuming the registry

```bash
npx shadcn@latest add https://livisliving.github.io/Patina/r/window.json
```

The registry lives on GitHub Pages, at `https://livisliving.github.io/Patina/r` — the base `registry.json`
names and `npx @pat1na/cli init` installs from; `PATINA_REGISTRY` at build time points a copy
elsewhere.

Adding `window` also brings in `button` and `theme` (the CSS variables).

### Rules of the house

The rules live in `DESIGN.md › Do's and Don'ts`. In short: Lucida Grande, never Inter
or Geist. Pinstripes instead of grey cards. Gel or wallpaper instead of purple-to-blue
gradients. Capsule buttons and Aqua's window corners instead of 8 to 16px card radii. Shadows only on
windows, menus, the Dock and gel. No thin-line icons. The traffic lights stay red, yellow
and green in every tone.

## Licence

MIT, see [LICENSE](LICENSE). Lucida Grande is Apple's and is not included.
