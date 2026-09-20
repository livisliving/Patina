---
name: check-y2k
description: Check code against the Y2K pack's DESIGN.md — the forbidden fonts, grey cards, AI gradients, card radii and shadows, thin-line icons, page-shaped layout, and the 4px grid. Use after writing or restyling UI in a project that has a Y2K DESIGN.md, and always at the end of /y2k-ify.
---

# /check-y2k

Answers one question: **does this code follow the pack?** It does not restyle
anything — that is `/y2k-ify`.

## Run it

```bash
node scripts/check-y2k.mjs <paths...>
```

- Pass the directories you touched; with no paths it scans the whole project.
- `--json` for machine-readable output, `--design <path>` if DESIGN.md is not
  at the project root, `--strict` to fail on warnings too.
- Exit code 1 means there are errors.

## Read the output

Each line is `file:line:col  rule  message  (DESIGN.md:NNN)`. The citation is
the point: every rule comes from a line in DESIGN.md, and that line — not this
skill, not your taste — is the authority.

- `✗` **error** — DESIGN.md forbids it in so many words. Fix the code.
- `!` **warning** — the rule has exceptions a regex cannot judge (a shadow is
  allowed on a window, menu, tooltip, the Dock or a gel control). Look at the
  call site and decide.

## When the checker and the design disagree

An error on something that is deliberate means one of two things, and you do
not get to pick silently:

1. The code is wrong → fix the code.
2. **DESIGN.md is wrong or incomplete** → say so to the human and propose the
   wording. The grid exceptions and the radius scale are parsed out of
   DESIGN.md at run time, so widening an exception is an edit to the spec,
   which is the human's call. Never loosen the checker to make a run go green.

## What it does not check

Anything that needs judgment about intent: whether a shadow sits on a window,
whether a 20px value is an HIG button or a coincidence, whether the layout
*reads* as a desktop. Those belong in review, not in a regex. The checker is
deliberately biased toward under-reporting — one false positive and people
stop running it.
