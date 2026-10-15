import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC = path.resolve(__dirname);
/** Cores, fontes e raios só podem existir em src/theme, src/presets e src/fonts (arquivos das fontes de cada preset). */
const ALLOWED = [path.join(SRC, "theme"), path.join(SRC, "presets"), path.join(SRC, "fonts")];

const PATTERNS: [string, RegExp][] = [
  ["cor hexadecimal", /#[0-9a-fA-F]{3,8}\b/],
  ["cor rgb()/rgba()", /\brgba?\s*\(/i],
  ["cor hsl()/hsla()", /\bhsla?\s*\(/i],
  ["cor oklch()/oklab()/lab()/lch()", /\b(oklch|oklab|lab|lch)\s*\(/i],
  ["font-family literal", /font-?family/i],
  [
    "cor da paleta do Tailwind",
    /\b(?:bg|text|border|ring|fill|stroke|from|to|via|divide|outline|shadow|accent|caret|decoration)-(?:white|black|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3})\b/,
  ],
  ["valor arbitrário de raio", /\brounded(?:-[a-z]+)?-\[/],
];

function listFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return listFiles(full);
    return /\.(tsx?|css)$/.test(e.name) ? [full] : [];
  });
}

describe("sem hardcode de tema fora de src/theme e src/presets", () => {
  const files = listFiles(SRC).filter(
    (f) => !ALLOWED.some((a) => f.startsWith(a + path.sep)) && !/\.test\.tsx?$/.test(f),
  );

  it("varre src/components e src/app (e demais pastas)", () => {
    const rel = files.map((f) => path.relative(SRC, f).replaceAll("\\", "/"));
    expect(rel.some((f) => f.startsWith("components/"))).toBe(true);
    expect(rel.some((f) => f.startsWith("app/"))).toBe(true);
  });

  it("não encontra cor, font-family ou raio literal", () => {
    const violations: string[] = [];
    for (const file of files) {
      const lines = fs.readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        for (const [label, re] of PATTERNS) {
          if (re.test(line)) {
            violations.push(`${path.relative(SRC, file)}:${i + 1} (${label}): ${line.trim()}`);
          }
        }
      });
    }
    expect(violations).toEqual([]);
  });
});
