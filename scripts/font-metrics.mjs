// Gera src/fonts/fallbacks.generated.ts: métricas das fontes reserva (size-adjust, ascent/descent/line-gap-override).
// Uso: node scripts/font-metrics.mjs   (precisa do devDependency "fontkit" e das fontes Arial e Times New Roman do Windows)
//
// Como os valores são calculados (README, seção "Fontes"):
//  1. Texto de amostra = todas as frases com 25+ caracteres escritas nos presets (nomes, descrições, avisos): o texto real das lojas.
//  2. Largura média ponderada de uma fonte = soma das larguras de avanço de cada caractere do texto de amostra ÷ nº de caracteres
//     ÷ unitsPerEm. Nas fontes variáveis, mede-se a instância do peso usado (getVariation).
//  3. size-adjust = largura média da fonte da loja ÷ largura média da fonte reserva (mesmo peso: regular ou negrito).
//  4. ascent-override = ascent da fonte da loja ÷ (unitsPerEm × size-adjust); idem descent-override e line-gap-override.
//     Ascent, descent e lineGap são os da tabela hhea de cada arquivo.
//  Fonte reserva: Arial (sem serifa) ou Times New Roman (Bodoni Moda); na Linux/Android entram os equivalentes métricos
//  (Liberation Sans, Liberation Serif), por isso vários local().
import fs from "node:fs";
import path from "node:path";
import * as fontkit from "fontkit";
import wawoff2 from "wawoff2";
const fontsBySlug = JSON.parse(fs.readFileSync("src/fonts/faces.json", "utf8"));

const SYSTEM = "C:/Windows/Fonts";
const FALLBACKS = {
  sans: { regular: "arial.ttf", bold: "arialbd.ttf", family: "Arial", local: { regular: ["Arial", "Liberation Sans", "Helvetica"], bold: ["Arial Bold", "Arial-BoldMT", "Liberation Sans Bold", "Helvetica Bold"] } },
  serif: { regular: "times.ttf", bold: "timesbd.ttf", family: "Times New Roman", local: { regular: ["Times New Roman", "Liberation Serif", "Times"], bold: ["Times New Roman Bold", "TimesNewRomanPS-BoldMT", "Liberation Serif Bold", "Times Bold"] } },
};
const SERIF_FAMILIES = new Set(["Bodoni Moda"]);

// 1. texto de amostra
function strings(dir) {
  const out = [];
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) out.push(...strings(p));
    else if (/\.ts$/.test(f.name) && !/\.test\.ts$/.test(f.name)) {
      for (const m of fs.readFileSync(p, "utf8").matchAll(/"((?:[^"\\\n]|\\.){25,})"|`((?:[^`\\]|\\.){25,})`/g)) out.push((m[1] ?? m[2]).replace(/\\n/g, " ").replace(/\\"/g, '"'));
    }
  }
  return out;
}
const corpusBySlug = {
  trama: strings("src/presets/trama-studio").join(" "),
  forno: strings("src/presets/forno-da-vila").join(" "),
  arca: strings("src/presets/arca-inflaveis").join(" "),
  faisca: strings("src/presets/faisca").join(" "),
};

// woff2 → ttf (o getVariation do fontkit não funciona direto em woff2)
const open = async (file) => (file.endsWith(".woff2") ? fontkit.create(Buffer.from(await wawoff2.decompress(fs.readFileSync(file)))) : fontkit.openSync(file));
const avgWidth = (base, inst, text) => {
  // os glifos vêm do cmap do arquivo base; a largura, da instância (peso) pedida
  let total = 0;
  let n = 0;
  for (const ch of text) {
    const g = base.glyphForCodePoint(ch.codePointAt(0));
    if (!g || g.id === 0) continue;
    total += inst.getGlyph(g.id).advanceWidth;
    n += 1;
  }
  return total / n / base.unitsPerEm;
};
const at = (font, weight) => {
  const axes = font.variationAxes ?? {};
  if (!axes.wght) return font;
  const w = Math.min(Math.max(weight, axes.wght.min), axes.wght.max);
  return font.getVariation({ wght: w });
};

const round = (x, d = 4) => Number(x.toFixed(d));
const out = {};
for (const [slug, preset] of Object.entries(fontsBySlug)) {
  out[slug] = [];
  const text = corpusBySlug[slug];
  for (const face of preset.faces) {
    const font = await open(path.join("public/fonts", slug, face.file));
    const points = [...new Set(face.weight.split(" ").map(Number))];
    for (const weight of points) {
      const kind = SERIF_FAMILIES.has(face.family) ? "serif" : "sans";
      const fb = FALLBACKS[kind];
      const bold = weight >= 600;
      const fbFont = await open(path.join(SYSTEM, bold ? fb.bold : fb.regular));
      const inst = at(font, weight);
      const sizeAdjust = avgWidth(font, inst, text) / avgWidth(fbFont, fbFont, text);
      out[slug].push({
        family: face.family,
        weight,
        local: bold ? fb.local.bold : fb.local.regular,
        sizeAdjust: round(sizeAdjust * 100, 2),
        ascent: round((inst.ascent / inst.unitsPerEm / sizeAdjust) * 100, 2),
        descent: round((Math.abs(inst.descent) / inst.unitsPerEm / sizeAdjust) * 100, 2),
        lineGap: round((inst.lineGap / inst.unitsPerEm / sizeAdjust) * 100, 2),
        fallback: `${fb.family}${bold ? " Bold" : ""}`,
      });
    }
  }
}
const header = `// GERADO por scripts/font-metrics.mjs a partir dos arquivos em public/fonts e das fontes Arial / Times New Roman. Não edite à mão.
// Valores em porcentagem (size-adjust, ascent-override, descent-override, line-gap-override). Método: README, seção "Fontes".
export type FallbackFace = { family: string; weight: number; local: string[]; sizeAdjust: number; ascent: number; descent: number; lineGap: number; fallback: string };

export const fallbackFaces: Record<string, FallbackFace[]> = ${JSON.stringify(out, null, 2)};
`;
fs.writeFileSync("src/fonts/fallbacks.generated.ts", header);
for (const [slug, faces] of Object.entries(out)) for (const f of faces) console.log(slug.padEnd(6), f.family.padEnd(20), String(f.weight).padStart(3), f.fallback.padEnd(22), `size ${f.sizeAdjust}%  asc ${f.ascent}%  desc ${f.descent}%  gap ${f.lineGap}%`);
