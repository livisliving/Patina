import type { NextConfig } from "next";

// GITHUB_PAGES=true builds the static site for GitHub Pages: plain files, no
// server. The workflow (.github/workflows/pages.yml) asks GitHub where the
// site lives and passes it in: PAGES_BASE_PATH ("/Patina", or "" on a custom
// domain) and PAGES_BASE_URL (the address the registry is served from).
const pages = process.env.GITHUB_PAGES === "true";
const basePath = pages ? (process.env.PAGES_BASE_PATH ?? "") : "";
// Where this copy of the site serves the component registry (public/r).
// Elsewhere (Vercel, localhost) Help names the canonical one, on GitHub Pages.
const registry = pages ? `${process.env.PAGES_BASE_URL ?? ""}/r` : "https://livisliving.github.io/Patina/r";

const nextConfig: NextConfig = {
  transpilePackages: ["@patina/ui", "@patina/shaders"],
  env: { NEXT_PUBLIC_BASE_PATH: basePath, NEXT_PUBLIC_REGISTRY: registry },
  ...(pages && { output: "export", basePath, trailingSlash: true, images: { unoptimized: true } }),
};

export default nextConfig;
