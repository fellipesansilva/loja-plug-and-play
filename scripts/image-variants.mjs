// Gera as versões menores (360 e 640 px de largura) de cada foto de produto/categoria/bloco dos presets, ao lado do original:
//   public/images/presets/<preset>/<nome>.webp  ->  <nome>-360.webp e <nome>-640.webp
// O StoreImage monta o srcset com elas (um miniatura de 100 px não precisa baixar o arquivo de 150 KB). Banners ficam de fora: têm seus recortes próprios.
// Também escreve src/lib/image-originals.generated.ts: largura e peso de cada original, que o helper de variantes (src/lib/image-variants.ts)
// usa para montar o srcset da foto do LCP (a largura real do original entra como candidato) e para só adotar variantes em foto pesada.
// Uso: node scripts/image-variants.mjs                    (gera as variantes e o manifesto)
//      node scripts/image-variants.mjs --manifest-only    (só o manifesto; não mexe em nenhuma imagem)
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = "public/images/presets";
const WIDTHS = [360, 640];
const manifestOnly = process.argv.includes("--manifest-only");
let made = 0;
let bytes = 0;
const originals = {};
for (const preset of fs.readdirSync(ROOT).sort()) {
  const dir = path.join(ROOT, preset);
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith(".webp") || file.startsWith("banner") || /-(360|640)\.webp$/.test(file)) continue;
    const base = file.replace(/\.webp$/, "");
    const meta = await sharp(path.join(dir, file)).metadata();
    originals[`/${ROOT.replace(/^public\//, "")}/${preset}/${file}`] = { width: meta.width, bytes: fs.statSync(path.join(dir, file)).size };
    if (manifestOnly) continue;
    for (const w of WIDTHS) {
      const out = path.join(dir, `${base}-${w}.webp`);
      const buf = await sharp(path.join(dir, file)).resize({ width: w, withoutEnlargement: true }).webp({ quality: 74, effort: 5 }).toBuffer();
      fs.writeFileSync(out, buf);
      made += 1;
      bytes += buf.length;
    }
  }
}
const body = Object.entries(originals)
  .map(([src, v]) => `  "${src}": { width: ${v.width}, bytes: ${v.bytes} },`)
  .join("\n");
fs.writeFileSync(
  "src/lib/image-originals.generated.ts",
  `// GERADO por scripts/image-variants.mjs. Não edite à mão. Largura (px) e peso (bytes) do arquivo original de cada foto dos presets.
export const imageOriginals: Record<string, { width: number; bytes: number }> = {
${body}
};
`,
);
console.log(manifestOnly ? `manifesto com ${Object.keys(originals).length} fotos` : `${made} arquivos, ${(bytes / 1024).toFixed(0)} KB; manifesto com ${Object.keys(originals).length} fotos`);
