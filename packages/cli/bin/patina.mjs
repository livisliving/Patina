#!/usr/bin/env node
/**
 * patina — the taste-pack installer.
 *
 * One subcommand today: `init`, which drops the pack into an existing project.
 * Keep this file thin: argument shape here, the work in src/.
 */

import { init } from "../src/init.mjs"

/** The pack's registry on GitHub Pages; registry.json names the same base. */
const DEFAULT_REGISTRY = "https://livisliving.github.io/Patina/r"

const USAGE = `patina — taste packs for AI coding agents

Usage
  npx @pat1na/cli init [options]

Options
  --tone <name>      pink, aqua, lime, tangerine or grape (asked when not given)
  --registry <url>   Component registry base URL (default: ${DEFAULT_REGISTRY})
  --no-components    Write DESIGN.md and the skills, skip the shadcn components
  --force            Overwrite files that already exist
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
`

const argv = process.argv.slice(2)
const cmd = argv[0]

if (!cmd || cmd === "--help" || cmd === "-h" || cmd === "help") {
  console.log(USAGE)
  process.exit(cmd ? 0 : 1)
}

const flag = (name) => argv.includes(`--${name}`)
const value = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback
}

if (cmd !== "init") {
  console.error(`patina: unknown command "${cmd}".\n\n${USAGE}`)
  process.exit(1)
}

try {
  const code = await init({
    cwd: process.cwd(),
    registry: value("registry", DEFAULT_REGISTRY),
    components: !flag("no-components"),
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
