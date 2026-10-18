import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { imageOriginals } from "./image-originals.generated";
import { IMAGE_VARIANT_HI_WIDTH, IMAGE_VARIANT_MIN_BYTES, IMAGE_VARIANT_WIDTHS, imageSrcSet, lcpImagePlan, lcpPreloads, PHONE_MEDIA, WIDE_MEDIA } from "./image-variants";

const ARCA = "/images/presets/arca-inflaveis/portico-inflavel.webp";
const FORNO = "/images/presets/forno-da-vila/pizza-margherita-1.webp";
const TRAMA_PESADA = "/images/presets/trama-studio/calca-chino-1.webp";
const TRAMA_LEVE = "/images/presets/trama-studio/vestido-midi-linho-1.webp";
const A = "/images/presets/arca-inflaveis/portico-inflavel";

/** Escolha do navegador: a menor candidata com largura >= espaço exibido × densidade; se nenhuma cobre, a maior. */
function pick(srcSet: string, slotCssPx: number, dpr: number): string {
  const list = srcSet.split(",").map((c) => {
    const [url, w] = c.trim().split(/\s+/);
    return { url, w: Number(w.replace("w", "")) };
  });
  const need = slotCssPx * dpr;
  const sorted = [...list].sort((a, b) => a.w - b.w);
  return (sorted.find((c) => c.w >= need) ?? sorted[sorted.length - 1]).url;
}

describe("plano da foto do LCP da galeria (srcset e sizes)", () => {
  it("Arca no celular: variantes 360, 640 e 960 (nunca o original); sizes = janela menos o recuo da página", () => {
    const plan = lcpImagePlan(ARCA, 2)!;
    expect(plan.phone.media).toBe(PHONE_MEDIA);
    expect(plan.phone.srcSet).toBe(`${A}-360.webp 360w, ${A}-640.webp 640w, ${A}-960.webp 960w`);
    expect(plan.phone.sizes).toBe("calc(100vw - 2rem)");
    expect(plan.phone.srcSet).not.toContain(`${A}.webp`);
    // o src da <img> é a maior variante: nenhum caminho do navegador baixa o original de 187 KB no celular
    expect(plan.fallback).toBe(`${A}-960.webp`);
  });

  it("celular: densidade 1 escolhe 640; densidade 2 e 3 escolhem 960 (a regra é nunca baixar o original no celular)", () => {
    const plan = lcpImagePlan(ARCA, 2)!;
    // Pixel 5 / celular de 412 px: espaço de 380 px
    expect(pick(plan.phone.srcSet, 380, 1)).toBe(`${A}-640.webp`);
    expect(pick(plan.phone.srcSet, 380, 1.75)).toBe(`${A}-960.webp`); // 665 px: a de 640 não cobre
    expect(pick(plan.phone.srcSet, 380, 2)).toBe(`${A}-960.webp`); // 760 px
    expect(pick(plan.phone.srcSet, 380, 2.625)).toBe(`${A}-960.webp`);
    expect(pick(plan.phone.srcSet, 380, 3)).toBe(`${A}-960.webp`); // 1.140 px: o maior do celular, sem passar para o original
    expect(pick(plan.phone.srcSet, 280, 1)).toBe(`${A}-360.webp`); // celular pequeno de densidade 1
  });

  it("telas largas: sem mudança. Variantes 360 e 640 e o original com a largura real; sizes = coluna esquerda da grade de 2 colunas", () => {
    const plan = lcpImagePlan(ARCA, 2)!;
    expect(plan.wide.media).toBe(WIDE_MEDIA);
    expect(plan.wide.srcSet).toBe(`${A}-360.webp 360w, ${A}-640.webp 640w, ${A}.webp 1200w`);
    expect(plan.wide.srcSet).not.toContain("-960");
    expect(plan.wide.sizes).toBe("calc((min(100vw, 75rem) - 3.5rem) / 2)");
    // desktop de 1280 px: coluna de 572 px
    expect(pick(plan.wide.srcSet, 572, 1)).toBe(`${A}-640.webp`);
    expect(pick(plan.wide.srcSet, 572, 1.5)).toBe(`${A}.webp`);
    expect(pick(plan.wide.srcSet, 572, 2)).toBe(`${A}.webp`);
    expect(pick(plan.wide.srcSet, 356, 1)).toBe(`${A}-360.webp`); // 768 px
  });

  it("Forno e Trama: sizes do celular de ponta a ponta; a de alta densidade é a de 960 px (Forno) e a de 900 px, largura do original (Trama)", () => {
    const forno = lcpImagePlan(FORNO)!;
    expect(forno.phone.sizes).toBe("100vw");
    expect(forno.phone.srcSet).toContain("pizza-margherita-1-960.webp 960w");
    expect(forno.wide.srcSet).toContain("pizza-margherita-1.webp 1000w");
    const trama = lcpImagePlan(TRAMA_PESADA)!;
    expect(imageOriginals[TRAMA_PESADA].width).toBe(900);
    expect(imageOriginals[TRAMA_PESADA].w960).toBe(900);
    expect(trama.phone.srcSet).toContain("calca-chino-1-960.webp 900w");
    // celular de 412 px em densidade 2 = 824 px físicos: a de 900 px cobre
    expect(pick(trama.phone.srcSet, 412, 2)).toBe("/images/presets/trama-studio/calca-chino-1-960.webp");
    expect(pick(trama.phone.srcSet, 412, 1)).toBe("/images/presets/trama-studio/calca-chino-1-640.webp");
  });

  it("foto leve (Trama, 25 KB) e o que não é foto de preset seguem sem plano: a imagem continua a original", () => {
    expect(imageOriginals[TRAMA_LEVE].bytes).toBeLessThan(IMAGE_VARIANT_MIN_BYTES);
    expect(imageOriginals[TRAMA_LEVE].w960).toBeUndefined();
    expect(lcpImagePlan(TRAMA_LEVE)).toBeNull();
    for (const src of ["data:image/png;base64,AAAA", "/placeholder?l=x", "/images/presets/arca-inflaveis/banner.webp", `${A}-640.webp`, `${A}-960.webp`, "/images/presets/arca-inflaveis/nao-existe.webp"]) {
      expect(lcpImagePlan(src), src).toBeNull();
    }
  });

  it("preload e <picture> usam o mesmo srcset, sizes e media (um download só), com a variante de 960 nos dois", () => {
    const plan = lcpImagePlan(ARCA, 2)!;
    const [phone, wide] = lcpPreloads(plan);
    expect(phone).toEqual({ imageSrcSet: plan.phone.srcSet, imageSizes: plan.phone.sizes, media: plan.phone.media });
    expect(wide).toEqual({ imageSrcSet: plan.wide.srcSet, imageSizes: plan.wide.sizes, media: plan.wide.media });
    expect(phone.imageSrcSet).toContain("-960.webp 960w");
    expect(phone.media).not.toBe(wide.media);
  });

  it("os cards não mudam: o srcset deles segue só com 360 e 640 (a variante de 960 é da foto principal do produto)", () => {
    expect(imageSrcSet(ARCA)).toBe(`${A}-360.webp 360w, ${A}-640.webp 640w`);
    expect(imageSrcSet(`${A}-960.webp`)).toBeUndefined();
    expect(IMAGE_VARIANT_WIDTHS).toEqual([360, 640]);
    expect(IMAGE_VARIANT_HI_WIDTH).toBe(960);
  });
});

describe("manifesto dos originais (src/lib/image-originals.generated.ts) e variantes de 960 px", () => {
  const root = path.resolve(import.meta.dirname, "../../public");

  it("bate com os arquivos de public/: mesma lista, largura e peso; w960 só em foto pesada, com o arquivo -960 presente e na largura real", async () => {
    const found: Record<string, { width: number; bytes: number; w960?: number }> = {};
    for (const dir of fs.readdirSync(path.join(root, "images/presets"))) {
      for (const file of fs.readdirSync(path.join(root, "images/presets", dir))) {
        if (!file.endsWith(".webp") || file.startsWith("banner") || /-(360|640|960)\.webp$/.test(file)) continue;
        const full = path.join(root, "images/presets", dir, file);
        const width = (await sharp(full).metadata()).width!;
        const bytes = fs.statSync(full).size;
        const entry: { width: number; bytes: number; w960?: number } = { width, bytes };
        const hi = full.replace(/\.webp$/, "-960.webp");
        if (fs.existsSync(hi)) {
          entry.w960 = (await sharp(hi).metadata()).width!;
          expect(bytes, `${file} tem -960 mas é leve`).toBeGreaterThanOrEqual(IMAGE_VARIANT_MIN_BYTES);
        } else {
          expect(bytes, `${file} é pesada e não tem -960`).toBeLessThan(IMAGE_VARIANT_MIN_BYTES);
        }
        found[`/images/presets/${dir}/${file}`] = entry;
      }
    }
    expect(imageOriginals).toEqual(found);
    for (const [src, e] of Object.entries(imageOriginals)) if (e.w960) expect(e.w960, src).toBe(Math.min(960, e.width));
  });

  it("o limite de 64 KB e a largura de 960 px do script de geração são os mesmos do helper", () => {
    const script = fs.readFileSync(path.resolve(import.meta.dirname, "../../scripts/image-variants.mjs"), "utf8");
    expect(script).toMatch(/MIN_BYTES_HI = 64 \* 1024/);
    expect(script).toMatch(/WIDTH_HI = 960/);
    expect(IMAGE_VARIANT_MIN_BYTES).toBe(64 * 1024);
    expect(IMAGE_VARIANT_HI_WIDTH).toBe(960);
  });
});
