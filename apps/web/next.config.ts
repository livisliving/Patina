import fs from "node:fs";
import type { NextConfig } from "next";

// GITHUB_PAGES=true builds the static site for GitHub Pages: plain files, no
// server. The workflow (.github/workflows/pages.yml) asks GitHub where the
// site lives and passes it in: PAGES_BASE_PATH ("/Patina", or "" on a custom
// domain) and PAGES_BASE_URL (the address the registry is served from).
const pages = process.env.GITHUB_PAGES === "true";
const basePath = pages ? (process.env.PAGES_BASE_PATH ?? "") : "";
// Where this copy of the site lives: on Pages, the address GitHub gives it;
// elsewhere (Vercel, localhost) the canonical one, registry.json's homepage.
// Its component registry (public/r) and its share card hang off it.
const homepage = JSON.parse(fs.readFileSync(new URL("../../packages/ui/registry.json", import.meta.url), "utf8")).homepage;
const site = (pages && process.env.PAGES_BASE_URL) || homepage;

const nextConfig: NextConfig = {
  transpilePackages: ["@patina/ui", "@patina/shaders"],
  env: { NEXT_PUBLIC_BASE_PATH: basePath, NEXT_PUBLIC_SITE: site, NEXT_PUBLIC_REGISTRY: `${site}/r` },
  ...(pages && { output: "export", basePath, trailingSlash: true, images: { unoptimized: true } }),
};

export default nextConfig;
