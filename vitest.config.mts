import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  plugins: [
    {
      // Permite `import csv from "./sample.csv"` (texto cru), como no build do Next.
      name: "csv-raw",
      transform(code, id) {
        if (id.endsWith(".csv")) return { code: `export default ${JSON.stringify(code)};`, map: null };
      },
    },
  ],
});
