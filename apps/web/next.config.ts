import type { NextConfig } from "next";

// GITHUB_PAGES=true builds the static site for https://livisliving.github.io/patina/
// (see .github/workflows/pages.yml): plain files under /patina, no server.
const pages = process.env.GITHUB_PAGES === "true";
const basePath = pages ? "/patina" : "";
// Where this copy of the site serves the component registry (public/r).
const registry = pages ? "https://livisliving.github.io/patina/r" : "https://patina-one.vercel.app/r";

const nextConfig: NextConfig = {
  transpilePackages: ["@patina/ui", "@patina/shaders"],
  env: { NEXT_PUBLIC_BASE_PATH: basePath, NEXT_PUBLIC_REGISTRY: registry },
  ...(pages && { output: "export", basePath, trailingSlash: true, images: { unoptimized: true } }),
};

export default nextConfig;
