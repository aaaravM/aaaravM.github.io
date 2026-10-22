import type { NextConfig } from "next";

// Static export: `npm run build` writes a plain HTML/CSS/JS site to `out/`,
// which GitHub Pages (aaaravm.github.io) serves as-is.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
