import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite um segundo build isolado (E2E de produção sem flags de teste).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
      "*.csv": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
