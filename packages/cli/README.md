# @patina/cli

Installs Patina's Y2K taste pack into a project, so your coding agent (Claude Code, Cursor, Codex) builds UI in the pack's style: Mac OS X 10.0 Aqua in a millennium tone.

```bash
npx @patina/cli init
```

Run it in a React project that uses Tailwind (a new create-next-app is fine). It asks which tone you want (Y2K pink, Aqua, Lime, Tangerine or Grape), then:

- writes `DESIGN.md` at the project root, the spec your agent reads;
- installs the theme and the components into `components/ui` with shadcn;
- adds the `/y2k-ify` and `/check-y2k` skills to `.claude/skills`, and the scanner to `scripts/check-y2k.mjs`;
- sets `data-tone` on your `<html>` and leaves a note in `CLAUDE.md` (and `AGENTS.md`) so the agent reads `DESIGN.md` before it builds anything.

Files you already have are kept unless you pass `--force`.

## Options

```
--tone <name>      pink, aqua, lime, tangerine or grape (asked when not given)
--registry <url>   Component registry base URL (default: https://livisliving.github.io/Patina/r)
--no-components    Write DESIGN.md and the skills, skip the shadcn components
--force            Overwrite files that already exist
--dry-run          Print what would happen, write nothing
--yes              Don't ask anything (then --tone is required)
```

From a script or an agent, pass the tone: `npx @patina/cli init --tone aqua --yes`. Without one it stops before writing anything and lists the five, so whoever is running it can ask.

## Fonts

Lucida Grande belongs to Apple, so it isn't included. Macs already have it; everywhere else the pack falls back to Lato, which is open source. Add it from Google Fonts.

The demo desktop, built with the pack: https://livisliving.github.io/Patina/
Source: https://github.com/livisliving/Patina
