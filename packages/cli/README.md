# @pat1na/cli

Installs Patina's Y2K taste pack into a project, so your coding agent (Claude Code, Cursor, Codex) builds UI in the pack's style: Mac OS X 10.0 Aqua in a millennium tone.

```bash
npx @pat1na/cli init
```

Run it in a React project that uses Tailwind (a new create-next-app is fine). It asks which tone you want (Y2K pink, Aqua, Lime, Tangerine or Grape), then:

- writes `DESIGN.md` at the project root, the spec your agent reads;
- installs the theme and the components into `components/ui` with shadcn;
- adds the `/y2k-ify` and `/check-y2k` skills to `.claude/skills`, and the scanner to `scripts/check-y2k.mjs`;
- sets `data-tone` on your `<html>` and leaves a note in `CLAUDE.md` (and `AGENTS.md`) so the agent reads `DESIGN.md` before it builds anything.

Files you already have are kept unless you pass `--force`.

## A site as a desktop

```bash
npx @pat1na/cli init --tone aqua --desktop
```

`--desktop` turns a site that is read (a portfolio, a blog, a product's pages) into a Mac OS X desktop: the Finder, TextEdit documents, Preview, the About box, the Dock. On top of the above it:

- installs three more registry items: `content` (the Content model, `lib/content.ts`), `desktop` (`components/desktop/`) and `ipod`;
- writes an example `content/site.ts` if you have none: one person, a case study with an outline, a Work folder with two projects and an alias. Replace every word of it;
- replaces `app/page.tsx` with the desktop only if it is still create-next-app's starter. A page of your own is kept, and init prints the lines that render the desktop.

Then ask your agent to `/y2k-ify` your site: it sorts each page and each block into `content/*.ts` by `DESIGN.md` › Content, and the desktop draws the rest. Neither `content/site.ts` nor your page is ever overwritten, `--force` or not.

Installed without `--desktop`? Add the three items with shadcn:

```bash
npx shadcn@latest add https://livisliving.github.io/Patina/r/content.json https://livisliving.github.io/Patina/r/desktop.json https://livisliving.github.io/Patina/r/ipod.json
```

## Options

```
--tone <name>      pink, aqua, lime, tangerine or grape (asked when not given)
--registry <url>   Component registry base URL (default: https://livisliving.github.io/Patina/r)
--no-components    Write DESIGN.md and the skills, skip the shadcn components
--desktop          Also install the desktop: the Content model, the OS layer,
                   an example content/site.ts, and the page (over
                   create-next-app's starter only)
--force            Overwrite the pack's files that already exist (never
                   content/site.ts or a page of yours)
--dry-run          Print what would happen, write nothing
--yes              Don't ask anything (then --tone is required)
```

From a script or an agent, pass the tone: `npx @pat1na/cli init --tone aqua --yes`. Without one it stops before writing anything and lists the five, so whoever is running it can ask.

## Updating

The pack is copied into your project, so a new Patina reaches it only when its files are copied again:

```bash
npx @pat1na/cli update            # to the latest Patina release (main while there is none)
npx @pat1na/cli update --to v0.2.0
npx @pat1na/cli update --dry-run  # say what would change, write nothing
```

`init` writes `patina.json`: the items it installed and a fingerprint of each file as written. `update` copies every file of those items again from the release (and `DESIGN.md`, the `/check-y2k` scanner and the skills), installs any npm package the new files need, and records the version. It never touches what is not listed — the `content`, `desktop` and `ipod` items are updated only when `patina.json` names them (or `--add desktop,content,ipod`), since a site often keeps its own desktop in that folder. A file you changed since it was installed is kept and named; `--force` replaces it. A project installed before `patina.json` existed gets one on its first update, from the theme and the components found under its ui folder.

`--source <folder|url>` reads the pack from a checkout of the Patina repository instead of GitHub (with `--to` naming the version it is), which is how a CI job updates from a tag it has checked out.

## Fonts

Lucida Grande belongs to Apple, so it isn't included. Macs already have it; everywhere else the pack falls back to Lato, which is open source. Add it from Google Fonts.

The demo desktop, built with the pack: https://livisliving.github.io/Patina/
Source: https://github.com/livisliving/Patina
