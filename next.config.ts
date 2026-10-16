import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

// GitHub Pages serves a static snapshot. The app itself stays a Node server
// with Prisma; this branch runs only when `npm run build:pages` sets the env.
if (process.env.GITHUB_PAGES === "true") {
  process.env.NEXT_PUBLIC_TRAILING_SLASH = "true";
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  nextConfig.output = "export";
  nextConfig.trailingSlash = true;
  nextConfig.images = { unoptimized: true };
  if (basePath) nextConfig.basePath = basePath;
}

export default nextConfig;
