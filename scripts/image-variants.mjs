// Gera as versões menores (360 e 640 px de largura) de cada foto de produto/categoria/bloco dos presets, ao lado do original:
//   public/images/presets/<preset>/<nome>.webp  ->  <nome>-360.webp e <nome>-640.webp
// O StoreImage monta o srcset com elas (um miniatura de 100 px não precisa baixar o arquivo de 150 KB). Banners ficam de fora: têm seus recortes próprios.
// Foto pesada (a partir de 64 KB) ganha também a variante de 960 px, para a foto principal do produto no celular de densidade 2 ou mais
// (380 px de tela × 2 = 760 px: a de 640 ficava suave). Se o original for mais estreito que 960 px (Trama, 900 px) a variante sai na largura do
// original, sem ampliar, e o manifesto guarda essa largura real (w960).
// Também escreve src/lib/image-originals.generated.ts: largura e peso de cada original, que o helper de variantes (src/lib/image-variants.ts)
// usa para montar o srcset da foto do LCP (a largura real do original entra como candidato) e para só adotar variantes em foto pesada.
// Uso: node scripts/image-variants.mjs                    (gera todas as variantes e o manifesto)
//      node scripts/image-variants.mjs --add-960          (só as variantes de 960 px, e o manifesto; não mexe nas de 360 e 640 nem nos originais)
//      node scripts/image-variants.mjs --manifest-only    (só o manifesto; não mexe em nenhuma imagem)
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = "public/images/presets";
const WIDTHS = [360, 640];
const WIDTH_HI = 960;
/** Mesmo valor de IMAGE_VARIANT_MIN_BYTES em src/lib/image-variants.ts (um teste confere os dois). */
const MIN_BYTES_HI = 64 * 1024;
const manifestOnly = process.argv.includes("--manifest-only");
const add960 = process.argv.includes("--add-960");
let made = 0;
let bytes = 0;
const originals = {};
const encode = (file, w) => sharp(file).resize({ width: w, withoutEnlargement: true }).webp({ quality: 74, effort: 5 }).toBuffer();
for (const preset of fs.readdirSync(ROOT).sort()) {
  const dir = path.join(ROOT, preset);
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith(".webp") || file.startsWith("banner") || /-(360|640|960)\.webp$/.test(file)) continue;
    const base = file.replace(/\.webp$/, "");
    const full = path.join(dir, file);
    const meta = await sharp(full).metadata();
    const size = fs.statSync(full).size;
    const entry = { width: meta.width, bytes: size };
    const hi = size >= MIN_BYTES_HI;
    if (!manifestOnly) {
      if (!add960) {
        for (const w of WIDTHS) {
          const buf = await encode(full, w);
          fs.writeFileSync(path.join(dir, `${base}-${w}.webp`), buf);
          made += 1;
          bytes += buf.length;
        }
      }
      if (hi) {
        const buf = await encode(full, WIDTH_HI);
        fs.writeFileSync(path.join(dir, `${base}-${WIDTH_HI}.webp`), buf);
        made += 1;
        bytes += buf.length;
      }
    }
    if (hi && fs.existsSync(path.join(dir, `${base}-${WIDTH_HI}.webp`))) entry.w960 = Math.min(WIDTH_HI, meta.width);
    originals[`/${ROOT.replace(/^public\//, "")}/${preset}/${file}`] = entry;
  }
}
const body = Object.entries(originals)
  .map(([src, v]) => `  "${src}": { width: ${v.width}, bytes: ${v.bytes}${v.w960 ? `, w960: ${v.w960}` : ""} },`)
  .join("\n");
fs.writeFileSync(
  "src/lib/image-originals.generated.ts",
  `// GERADO por scripts/image-variants.mjs. Não edite à mão. Largura (px) e peso (bytes) do arquivo original de cada foto dos presets;
// w960 = largura real do arquivo -960.webp (só em foto pesada; 900 quando o original é mais estreito que 960 px).
export const imageOriginals: Record<string, { width: number; bytes: number; w960?: number }> = {
${body}
};
`,
);
console.log(manifestOnly ? `manifesto com ${Object.keys(originals).length} fotos` : `${made} arquivos, ${(bytes / 1024).toFixed(0)} KB; manifesto com ${Object.keys(originals).length} fotos`);
