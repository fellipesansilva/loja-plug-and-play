// Roda a suíte unitária uma vez por preset (o preset do build vem de NEXT_PUBLIC_PRESET).
// Uso: npm test  (todos os presets)  |  npm test -- --preset=forno  (só um)
import { spawnSync } from "node:child_process";

const only = process.argv.slice(2).find((a) => a.startsWith("--preset="))?.slice("--preset=".length);
const rest = process.argv.slice(2).filter((a) => !a.startsWith("--preset="));
const presets = only ? [only] : ["trama", "forno"];

let failed = false;
for (const preset of presets) {
  console.log(`\n[loja] testes unitários com o preset do build: ${preset}\n`);
  const run = spawnSync("npx", ["vitest", "run", ...rest], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, NEXT_PUBLIC_PRESET: preset },
  });
  if (run.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
