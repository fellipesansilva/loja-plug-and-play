import { defineConfig, devices } from "@playwright/test";

const PORT = 3411; // build de teste: expõe window.__demoStore (3000 é de outro projeto; nunca usar)
const PROD_PORT = 3412; // build de produção "puro": sem a flag de teste

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: [
    {
      command: `npm run build && npx next start -p ${PORT}`,
      url: `http://localhost:${PORT}`,
      env: { NEXT_PUBLIC_EXPOSE_STORE: "1" },
      reuseExistingServer: false,
      timeout: 240_000,
    },
    {
      command: `npm run build && npx next start -p ${PROD_PORT}`,
      url: `http://localhost:${PROD_PORT}`,
      env: { NEXT_DIST_DIR: ".next-prod" },
      reuseExistingServer: false,
      timeout: 240_000,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: process.env.PW_CHANNEL || undefined },
    },
  ],
});
