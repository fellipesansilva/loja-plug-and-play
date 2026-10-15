import type { NextConfig } from "next";
import { fontModulePath } from "./src/fonts/select";

const nextConfig: NextConfig = {
  // Permite um segundo build isolado (E2E de produção sem flags de teste).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: {
    // Só as fontes do preset do build entram no bundle (o build do Forno não baixa a fonte da Trama e vice-versa).
    resolveAlias: { "@active-fonts": fontModulePath(process.env.NEXT_PUBLIC_PRESET) },
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
