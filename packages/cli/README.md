# @pat1na/cli

Installs Patina's Y2K taste pack into a project, so your coding agent (Claude Code, Cursor, Codex) builds UI in the pack's style: Mac OS X 10.0 Aqua in a millennium tone.

```bash
npx @pat1na/cli init
```

No terminal? Send your AI agent https://github.com/livisliving/Patina and ask it to put Patina on your site. It runs `npx @pat1na/cli@latest init --setup`, which opens the Setup Assistant in your browser without a terminal and waits for your answers there.

Run it in a React project that uses Tailwind (a new create-next-app is fine). It opens the Setup Assistant (below) and asks six questions about your site and which tone you want (Y2K pink, Aqua, Lime, Tangerine or Grape), then:

- writes `DESIGN.md` at the project root, the spec your agent reads;
- installs the theme and the components into `components/ui` with shadcn;
- adds the `/y2k-ify` and `/check-y2k` skills to `.claude/skills`, and the scanner to `scripts/check-y2k.mjs`;
- sets `data-tone` on your `<html>` and leaves a note in `CLAUDE.md` (and `AGENTS.md`) so the agent reads `DESIGN.md` before it builds anything.

Files you already have are kept unless you pass `--force`.

## The Setup Assistant

At a terminal, `init` scans the project (the framework, every page and what it seems to be for, which pages carry a form, the title and description), starts a small server on `127.0.0.1` and opens a Mac OS X 10.0 Setup Assistant in your browser — the page itself comes from the Patina site, proxied through that server, so the browser only ever talks to your own machine. It asks six questions, one pane each: who the site is about, what a visitor should do first, how much of the site becomes a desktop, where the real content is, the tone, and the small extras from 2001 (an iPod, your own wallpaper, a visitor counter, a marquee), plus whether your old addresses should keep working. Then it installs, with a true progress bar. The answers are saved as `patina.json › brief`: `init` acts on the tone, the scope and the extras, and `/y2k-ify` reads the rest — the About box's kind, what to feature, which routes keep their pages, where to transcribe from.

`--setup` opens the Setup Assistant even when there is no terminal — what an AI agent runs for you: it prints the page's address, waits for the answers in the browser (thirty minutes at most) and then installs. `--terminal` asks the same questions at the terminal (over SSH, say). `--no-browser` starts the assistant and only prints its address. Without a terminal and without `--setup` — a script, `--yes` — nothing is asked: the flags below answer what they can, the scan fills in what it safely can, and every question left open is listed in `brief.unanswered`, which `/y2k-ify` asks in chat before it starts.

```
--about <kind>        person, team, product, event, show or other=<words>
--name <text>         Their name         --role <text>   What they do
--first <goal>        work, read, details, act, listen or other=<words>
--featured <routes>   Pages to keep at hand, comma-separated, at most three
--scope <how much>    whole, content (tools keep their pages), components
                      or other=<words>
--keep <routes>       The routes that keep their pages, comma-separated
--source <where>      project, live=<url>, export=<folder>, folder=<folder>
                      or other=<words>
--volume <text>       The volume's name ("Your Name HD")
--description <text>  One line about the site
--extras <list>       ipod, wallpaper=<folder>, visitor-counter, marquee
--old-urls <what>     redirect (old addresses open their windows) or drop
```

## A site as a desktop

```bash
npx @pat1na/cli init --tone aqua --scope whole      # or --desktop, which is the same
```

`--scope whole` (or `content`, when tools such as a sign-up keep their pages) turns a site that is read (a portfolio, a blog, a product's pages) into a Mac OS X desktop: the Finder, TextEdit documents, Preview, the About box, the Dock. On top of the above it:

- installs two more registry items, `content` (the Content model, `lib/content.ts`) and `desktop` (`components/desktop/`), and `ipod` when the extras ask for it;
- writes an example `content/site.ts` if you have none, with the name, role and description from your answers already in it: one person, a case study with an outline, a Work folder with two projects and an alias. Replace every word of it;
- replaces `app/page.tsx` with the desktop only if it is still create-next-app's starter (the volume's name from your answers, and no iPod when you did not want one). A page of your own is kept, and init prints the lines that render the desktop.

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
--desktop          The whole site becomes a desktop (the same as --scope whole)
--force            Overwrite the pack's files that already exist (never
                   content/site.ts or a page of yours)
--dry-run          Print what would happen and the brief, write nothing
--yes              Don't ask anything (then --tone is required)
--setup            Open the Setup Assistant even without a terminal (what an
                   AI agent runs): it waits for the answers in the browser
--terminal         Ask the Setup Assistant's questions here, not in a browser
--no-browser       Start the assistant but only print its address
```

From a script or an agent, pass the tone: `npx @pat1na/cli init --tone aqua --yes`. Without one it stops before writing anything and lists the five, so whoever is running it can ask. The brief's flags (above) answer the rest; what they leave out goes in `patina.json › brief.unanswered`.

## Updating

The pack is copied into your project, so a new Patina reaches it only when its files are copied again:

```bash
npx @pat1na/cli update            # to the latest Patina release (main while there is none)
npx @pat1na/cli update --to v0.2.0
npx @pat1na/cli update --dry-run  # say what would change, write nothing
```

`init` writes `patina.json`: the brief, the items it installed and a fingerprint of each file as written (`update` keeps the brief as it is). `update` copies every file of those items again from the release (and `DESIGN.md`, the `/check-y2k` scanner and the skills), installs any npm package the new files need, and records the version. It never touches what is not listed — the `content`, `desktop` and `ipod` items are updated only when `patina.json` names them (or `--add desktop,content,ipod`), since a site often keeps its own desktop in that folder. A file you changed since it was installed is kept and named; `--force` replaces it. A project installed before `patina.json` existed gets one on its first update, from the theme and the components found under its ui folder.

`--source <folder|url>` reads the pack from a checkout of the Patina repository instead of GitHub (with `--to` naming the version it is), which is how a CI job updates from a tag it has checked out.

## Fonts

Lucida Grande belongs to Apple, so it isn't included. Macs already have it; everywhere else the pack falls back to Lato, which is open source. Add it from Google Fonts.

The demo desktop, built with the pack: https://livisliving.github.io/Patina/
Source: https://github.com/livisliving/Patina
