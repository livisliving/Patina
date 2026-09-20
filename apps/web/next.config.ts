import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@patina/ui", "@patina/shaders"],
};

export default nextConfig;
