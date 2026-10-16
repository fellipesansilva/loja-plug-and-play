// Gera as versões menores (360 e 640 px de largura) de cada foto de produto/categoria/bloco dos presets, ao lado do original:
//   public/images/presets/<preset>/<nome>.webp  ->  <nome>-360.webp e <nome>-640.webp
// O StoreImage monta o srcset com elas (um miniatura de 100 px não precisa baixar o arquivo de 150 KB). Banners ficam de fora: têm seus recortes próprios.
// Uso: node scripts/image-variants.mjs
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = "public/images/presets";
const WIDTHS = [360, 640];
let made = 0;
let bytes = 0;
for (const preset of fs.readdirSync(ROOT)) {
  const dir = path.join(ROOT, preset);
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".webp") || file.startsWith("banner") || /-(360|640)\.webp$/.test(file)) continue;
    const base = file.replace(/\.webp$/, "");
    for (const w of WIDTHS) {
      const out = path.join(dir, `${base}-${w}.webp`);
      const buf = await sharp(path.join(dir, file)).resize({ width: w, withoutEnlargement: true }).webp({ quality: 74, effort: 5 }).toBuffer();
      fs.writeFileSync(out, buf);
      made += 1;
      bytes += buf.length;
    }
  }
}
console.log(`${made} arquivos, ${(bytes / 1024).toFixed(0)} KB`);
