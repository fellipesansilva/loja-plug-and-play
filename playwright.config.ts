import { defineConfig, devices } from "@playwright/test";

// Um único servidor serve todos os presets (/trama/..., /forno/...). 3000 é de outro projeto; nunca usar.
// Os projetos "trama" e "forno" rodam os mesmos testes, cada um dentro do prefixo do seu preset (ver tests/e2e/helpers.ts).
const PORT = 3411;
const BASE_URL = `http://localhost:${PORT}`;
const channel = process.env.PW_CHANNEL || undefined;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: BASE_URL,
    // NEXT_PUBLIC_EXPOSE_STORE expõe window.__demoStore para os testes (a exposição desligada em produção é teste unitário).
    env: { NEXT_PUBLIC_EXPOSE_STORE: "1" },
    reuseExistingServer: false,
    timeout: 240_000,
  },
  projects: [
    { name: "trama", metadata: { preset: "trama-studio" }, use: { ...devices["Desktop Chrome"], baseURL: BASE_URL, channel } },
    { name: "forno", metadata: { preset: "forno-da-vila" }, use: { ...devices["Desktop Chrome"], baseURL: BASE_URL, channel } },
  ],
});
