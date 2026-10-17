import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { imageOriginals } from "./image-originals.generated";
import { IMAGE_VARIANT_MIN_BYTES, IMAGE_VARIANT_WIDTHS, imageSrcSet, lcpImagePlan, lcpPreloads, PHONE_MEDIA, WIDE_MEDIA } from "./image-variants";

const ARCA = "/images/presets/arca-inflaveis/portico-inflavel.webp";
const FORNO = "/images/presets/forno-da-vila/pizza-margherita-1.webp";
const TRAMA_LEVE = "/images/presets/trama-studio/vestido-midi-linho-1.webp";

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
  it("Arca no celular: só as variantes 360 e 640, sizes = janela menos o recuo da página", () => {
    const plan = lcpImagePlan(ARCA, 2)!;
    expect(plan.phone.media).toBe(PHONE_MEDIA);
    expect(plan.phone.srcSet).toBe("/images/presets/arca-inflaveis/portico-inflavel-360.webp 360w, /images/presets/arca-inflaveis/portico-inflavel-640.webp 640w");
    expect(plan.phone.sizes).toBe("calc(100vw - 2rem)");
    expect(plan.phone.srcSet).not.toContain("portico-inflavel.webp");
    // o src da <img> é a maior variante: nenhum caminho do navegador baixa o original de 187 KB no celular
    expect(plan.fallback).toBe("/images/presets/arca-inflaveis/portico-inflavel-640.webp");
  });

  it("telas largas: variantes e o original com a largura real; sizes = coluna esquerda da grade de 2 colunas", () => {
    const plan = lcpImagePlan(ARCA, 2)!;
    expect(plan.wide.media).toBe(WIDE_MEDIA);
    expect(plan.wide.srcSet).toBe(
      "/images/presets/arca-inflaveis/portico-inflavel-360.webp 360w, /images/presets/arca-inflaveis/portico-inflavel-640.webp 640w, /images/presets/arca-inflaveis/portico-inflavel.webp 1200w",
    );
    expect(plan.wide.sizes).toBe("calc((min(100vw, 75rem) - 3.5rem) / 2)");
    const forno = lcpImagePlan(FORNO)!;
    expect(forno.phone.sizes).toBe("100vw"); // Forno e Trama: foto de ponta a ponta no celular
    expect(forno.wide.srcSet).toContain("pizza-margherita-1.webp 1000w");
  });

  it("variante escolhida: celular (DPR 1,75) usa a de 640; desktop 1280 usa a de 640 em DPR 1 e o original em tela de densidade alta", () => {
    const plan = lcpImagePlan(ARCA, 2)!;
    // celular de 412 px: espaço de 380 px; 380 × 1,75 = 665 px, acima de 640, mas o celular nunca baixa o original
    for (const dpr of [1, 1.75, 2.625, 3]) expect(pick(plan.phone.srcSet, 380, dpr), `celular DPR ${dpr}`).toBe("/images/presets/arca-inflaveis/portico-inflavel-640.webp");
    expect(pick(plan.phone.srcSet, 280, 1)).toBe("/images/presets/arca-inflaveis/portico-inflavel-360.webp"); // celular pequeno e DPR 1
    // desktop 1280: coluna de 572 px
    expect(pick(plan.wide.srcSet, 572, 1)).toBe("/images/presets/arca-inflaveis/portico-inflavel-640.webp");
    expect(pick(plan.wide.srcSet, 572, 1.5)).toBe(ARCA);
    expect(pick(plan.wide.srcSet, 572, 2)).toBe(ARCA);
    // 768 px: coluna de 356 px
    expect(pick(plan.wide.srcSet, 356, 1)).toBe("/images/presets/arca-inflaveis/portico-inflavel-360.webp");
  });

  it("foto leve (Trama, 25 KB) e o que não é foto de preset seguem sem plano: a imagem continua a original", () => {
    expect(imageOriginals[TRAMA_LEVE].bytes).toBeLessThan(IMAGE_VARIANT_MIN_BYTES);
    expect(lcpImagePlan(TRAMA_LEVE)).toBeNull();
    for (const src of ["data:image/png;base64,AAAA", "/placeholder?l=x", "/images/presets/arca-inflaveis/banner.webp", `${ARCA.replace(".webp", "-640.webp")}`, "/images/presets/arca-inflaveis/nao-existe.webp"]) {
      expect(lcpImagePlan(src), src).toBeNull();
    }
  });

  it("preload e <picture> usam o mesmo srcset, sizes e media (um download só)", () => {
    const plan = lcpImagePlan(ARCA, 2)!;
    const [phone, wide] = lcpPreloads(plan);
    expect(phone).toEqual({ imageSrcSet: plan.phone.srcSet, imageSizes: plan.phone.sizes, media: plan.phone.media });
    expect(wide).toEqual({ imageSrcSet: plan.wide.srcSet, imageSizes: plan.wide.sizes, media: plan.wide.media });
    expect(phone.media).not.toBe(wide.media);
  });

  it("as variantes do plano são as mesmas do srcset dos cards (uma regra só)", () => {
    const plan = lcpImagePlan(ARCA, 2)!;
    expect(imageSrcSet(ARCA)).toBe(plan.phone.srcSet);
    expect(IMAGE_VARIANT_WIDTHS).toEqual([360, 640]);
  });
});

describe("manifesto dos originais (src/lib/image-originals.generated.ts)", () => {
  it("bate com os arquivos de public/: mesma lista, mesma largura, mesmo peso", async () => {
    const root = path.resolve(import.meta.dirname, "../../public");
    const found: Record<string, { width: number; bytes: number }> = {};
    for (const dir of fs.readdirSync(path.join(root, "images/presets"))) {
      for (const file of fs.readdirSync(path.join(root, "images/presets", dir))) {
        if (!file.endsWith(".webp") || file.startsWith("banner") || /-(360|640)\.webp$/.test(file)) continue;
        const full = path.join(root, "images/presets", dir, file);
        found[`/images/presets/${dir}/${file}`] = { width: (await sharp(full).metadata()).width!, bytes: fs.statSync(full).size };
      }
    }
    expect(imageOriginals).toEqual(found);
  });
});
