// Executa o Next definindo o preset do build/servidor. Uso:
//   PRESET=forno npm run build          (Linux/macOS)
//   $env:PRESET="forno"; npm run build  (PowerShell)
//   npm run build -- --preset=forno     (qualquer sistema)
// Sem preset vale a Trama. O preset é gravado no build (NEXT_PUBLIC_PRESET): cada preset é uma loja estática própria.
import { spawn } from "node:child_process";

let preset = process.env.PRESET ?? "";
const nextArgs = [];
for (const arg of process.argv.slice(2)) {
  const match = /^--preset=(.+)$/.exec(arg);
  if (match) preset = match[1];
  else nextArgs.push(arg);
}

const env = { ...process.env };
if (preset) env.NEXT_PUBLIC_PRESET = preset;
if (env.NEXT_PUBLIC_PRESET) console.log(`[loja] preset do build: ${env.NEXT_PUBLIC_PRESET}`);

const child = spawn("npx", ["next", ...nextArgs], { stdio: "inherit", env, shell: true });
child.on("exit", (code) => process.exit(code ?? 1));
