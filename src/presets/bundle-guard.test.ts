import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { FICTITIOUS_MARKER, fictitiousPreset } from "./fictitious";

/**
 * Guarda contra regressão: cada loja recebe só os dados do próprio preset, pelo servidor (props do layout da rota), e o registro com
 * todos os presets não entra no JavaScript do cliente. O teste constrói o app duas vezes (sem e com um preset fictício extra, só no
 * teste) e compara o JS que /trama carrega: se o registro voltar ao bundle, o preset extra aumenta o JS das outras lojas e o teste falha.
 */
const ROOT = path.resolve(import.meta.dirname, "../..");
const LIMIT_BYTES = 512; // 0,5 KB

function build(dir: string, extra: boolean) {
  execFileSync("npx", ["next", "build"], {
    cwd: ROOT,
    env: { ...process.env, NEXT_DIST_DIR: dir, FICTITIOUS_PRESET: extra ? "1" : "", NEXT_PUBLIC_EXPOSE_STORE: "" },
    stdio: "pipe",
    shell: true,
    timeout: 900_000,
  });
}

/** JS (arquivos e bytes, bruto e gzip) que a home da Trama carrega, lido do HTML pré-gerado do build. */
function homeJs(dir: string) {
  const html = fs.readFileSync(path.join(ROOT, dir, "server/app/trama.html"), "utf8");
  const files = [...new Set([...html.matchAll(/\/_next\/static\/[^"')\s]+\.js/g)].map((m) => m[0]))];
  let raw = 0;
  let gz = 0;
  const texts: string[] = [];
  for (const f of files) {
    const text = fs.readFileSync(path.join(ROOT, dir, f.replace("/_next", "")), "utf8");
    texts.push(text);
    raw += Buffer.byteLength(text);
    gz += gzipSync(text).length;
  }
  return { files: files.length, raw, gz, text: texts.join("\n") };
}

describe("guarda do bundle: o registro de presets não entra no JavaScript das lojas", () => {
  it(
    "um preset extra no registro não muda o JS de /trama (diferença abaixo de 0,5 KB) e seus dados não aparecem no JS",
    () => {
      const tsconfig = path.join(ROOT, "tsconfig.json");
      const backup = fs.readFileSync(tsconfig);
      const dirs = [".next-prod/guard-sem", ".next-prod/guard-com"];
      try {
        build(dirs[0], false);
        build(dirs[1], true);
        const sem = homeJs(dirs[0]);
        const com = homeJs(dirs[1]);
        // o preset extra existe de verdade no build "com" (senão o teste não prova nada) e é grande o bastante para aparecer se vazar
        expect(fs.existsSync(path.join(ROOT, dirs[1], "server/app/fantasma.html"))).toBe(true);
        expect(fs.existsSync(path.join(ROOT, dirs[0], "server/app/fantasma.html"))).toBe(false);
        expect(Buffer.byteLength(JSON.stringify(fictitiousPreset))).toBeGreaterThan(5 * 1024);
        // nenhum dado de preset no JS (o texto do preset extra e o de outras lojas ficam só no HTML do servidor)
        for (const term of [FICTITIOUS_MARKER, "Pizza Margherita", "Pórtico Inflável", "Vestido Midi Linho"]) expect(com.text.includes(term), `JS de /trama contém "${term}"`).toBe(false);
        // mesmos arquivos, mesmo tamanho
        expect(com.files).toBe(sem.files);
        expect(Math.abs(com.gz - sem.gz), `gzip: ${sem.gz} → ${com.gz}`).toBeLessThan(LIMIT_BYTES);
        expect(Math.abs(com.raw - sem.raw), `bruto: ${sem.raw} → ${com.raw}`).toBeLessThan(LIMIT_BYTES * 3);
      } finally {
        fs.writeFileSync(tsconfig, backup);
        for (const d of dirs) fs.rmSync(path.join(ROOT, d), { recursive: true, force: true });
      }
    },
    1_800_000,
  );
});
