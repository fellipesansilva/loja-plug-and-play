import { defineConfig, devices } from "@playwright/test";

// Cada preset é um build estático próprio (NEXT_PUBLIC_PRESET), servido em sua porta. 3000 é de outro projeto; nunca usar.
const TRAMA_PORT = 3411; // build da Trama (expõe window.__demoStore para os testes)
const FORNO_PORT = 3412; // build do Forno (idem)
const PROD_PORT = 3413; // build de produção "puro" (Trama, sem a flag de teste): confere que o store não é exposto

const URLS = { trama: `http://localhost:${TRAMA_PORT}`, forno: `http://localhost:${FORNO_PORT}` };
// URLs das lojas, como na configuração de cada projeto da Vercel: alimentam o painel Demo e o redirecionamento de ?preset=.
const DEMO_URLS = JSON.stringify(URLS);

const server = (opts: { port: number; preset: string; dist: string; expose: boolean }) => ({
  command: `npm run build && npx next start -p ${opts.port}`,
  url: `http://localhost:${opts.port}`,
  env: {
    NEXT_PUBLIC_PRESET: opts.preset,
    NEXT_PUBLIC_DEMO_URLS: DEMO_URLS,
    NEXT_DIST_DIR: opts.dist,
    ...(opts.expose ? { NEXT_PUBLIC_EXPOSE_STORE: "1" } : {}),
  },
  reuseExistingServer: false,
  timeout: 240_000,
});

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  webServer: [
    server({ port: TRAMA_PORT, preset: "trama", dist: ".next-trama", expose: true }),
    server({ port: FORNO_PORT, preset: "forno", dist: ".next-forno", expose: true }),
    server({ port: PROD_PORT, preset: "trama", dist: ".next-prod", expose: false }),
  ],
  projects: [
    {
      name: "trama",
      metadata: { preset: "trama-studio" },
      use: { ...devices["Desktop Chrome"], baseURL: URLS.trama, channel: process.env.PW_CHANNEL || undefined },
    },
    {
      name: "forno",
      metadata: { preset: "forno-da-vila" },
      use: { ...devices["Desktop Chrome"], baseURL: URLS.forno, channel: process.env.PW_CHANNEL || undefined },
    },
  ],
});
