#!/usr/bin/env node
/**
 * patina — the taste-pack installer.
 *
 * Two subcommands: `init`, which drops the pack into an existing project,
 * and `update`, which brings that copy up to a Patina release.
 * Keep this file thin: argument shape here, the work in src/.
 */

import { init } from "../src/init.mjs"
import { update } from "../src/update.mjs"

/** The pack's registry on GitHub Pages; registry.json names the same base. */
const DEFAULT_REGISTRY = "https://livisliving.github.io/Patina/r"

const USAGE = `patina — taste packs for AI coding agents

Usage
  npx @pat1na/cli init [options]
  npx @pat1na/cli update [options]

Options for init
  --tone <name>      pink, aqua, lime, tangerine or grape (asked when not given)
  --registry <url>   Component registry base URL (default: ${DEFAULT_REGISTRY})
  --no-components    Write DESIGN.md and the skills, skip the shadcn components
  --desktop          Also install the desktop: the Content model (content), the
                     OS layer that renders it (desktop, ipod), an example
                     content/site.ts, and the page — over create-next-app's
                     starter only
  --force            Overwrite the pack's files that already exist (never
                     content/site.ts or a page of yours)
  --dry-run          Print what would happen, write nothing
  --yes              Don't ask anything (then --tone is required)
  --help             This

What init does
  0. Asks which of the five tones you want.
  1. Writes DESIGN.md to the project root — the spec your coding agent reads.
  2. Installs the Y2K theme + components from the registry (via shadcn).
  3. Installs the agent skills into .claude/skills/ and the /check-y2k scanner.
  4. Sets data-tone on your <html>, and leaves a note in CLAUDE.md so your
     agent reads DESIGN.md (and keeps the tone) before building UI.
  With --desktop, step 2 adds the content, desktop and ipod items, then
  writes content/site.ts if you have none and app/page.tsx if it is still
  create-next-app's; a page of your own is kept, and init prints the lines
  that render the desktop in it.
  5. Writes patina.json: the items installed and each file as written.

Options for update
  --to <tag>         The Patina release to update to (default: the latest
                     release on GitHub; main while there is none)
  --source <dir|url> Read the pack from a checkout of the Patina repository
                     or a URL of its root instead (then --to only names it)
  --add <items>      Also install these items, comma-separated (desktop,
                     content, ipod are never assumed)
  --force            Replace files changed here since they were installed
  --dry-run          Print what would change, write nothing

What update does
  Copies again, from that release, every file of the items patina.json
  lists (with no patina.json: the theme and the components found under your
  ui folder) and DESIGN.md, the /check-y2k scanner and the skills. A file
  you changed since it was installed is kept and named. New npm packages
  the files need are installed. Then patina.json records the version.
`

const argv = process.argv.slice(2)
const cmd = argv[0]

// `patina init --help` asks for help too; it must never start an install.
if (!cmd || cmd === "help" || argv.includes("--help") || argv.includes("-h")) {
  console.log(USAGE)
  process.exit(cmd ? 0 : 1)
}

const flag = (name) => argv.includes(`--${name}`)
const value = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback
}

if (cmd !== "init" && cmd !== "update") {
  console.error(`patina: unknown command "${cmd}".\n\n${USAGE}`)
  process.exit(1)
}

try {
  const code =
    cmd === "update"
      ? await update({
          cwd: process.cwd(),
          to: value("to", undefined),
          source: value("source", undefined),
          add: (value("add", "") || "").split(",").map((s) => s.trim()).filter(Boolean),
          force: flag("force"),
          dryRun: flag("dry-run"),
        })
      : await init({
          cwd: process.cwd(),
          registry: value("registry", DEFAULT_REGISTRY),
          components: !flag("no-components"),
          desktop: flag("desktop"),
          force: flag("force"),
          dryRun: flag("dry-run"),
          yes: flag("yes"),
          tone: value("tone", undefined),
        })
  process.exit(code)
} catch (err) {
  console.error(`patina: ${err.message}`)
  process.exit(2)
}
