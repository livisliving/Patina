#!/usr/bin/env node
/**
 * Point the built registry at a base URL.
 *
 * registry.json names its cross-references absolutely (a shadcn item's
 * `registryDependencies` must be a full URL), so the built files carry the
 * canonical base, https://livisliving.github.io/Patina/r (GitHub Pages) — which nobody can use to test
 * against a preview deployment or a local server. This rewrites that base in
 * the BUILT output, leaving registry.json itself canonical:
 *
 *   PATINA_REGISTRY=http://localhost:3000/r npm run registry:build
 *
 * With PATINA_REGISTRY unset it does nothing, so the normal build is
 * unchanged.
 */

import fs from "node:fs"
import path from "node:path"

const CANONICAL = "https://livisliving.github.io/Patina/r"
const base = (process.env.PATINA_REGISTRY ?? "").replace(/\/+$/, "")
const dir = process.argv[2] ?? "apps/web/public/r"

if (!base) process.exit(0)

if (!fs.existsSync(dir)) {
  console.error(`registry-base: no built registry at ${dir} — run the build first.`)
  process.exit(1)
}

let touched = 0
for (const name of fs.readdirSync(dir)) {
  if (!name.endsWith(".json")) continue
  const file = path.join(dir, name)
  const before = fs.readFileSync(file, "utf8")
  const after = before.split(CANONICAL).join(base)
  if (after !== before) {
    fs.writeFileSync(file, after)
    touched++
  }
}

console.log(`registry-base: ${CANONICAL} → ${base} in ${touched} file(s) under ${dir}`)
