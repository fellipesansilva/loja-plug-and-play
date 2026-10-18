import { describe, expect, it } from "vitest";
import { presetBySlug } from "@/presets";
import { deferredFontCssFor, fontCssFor, fontUrlsFor, fontsBySlug } from "./index";

describe("fontes da Arca depois da foto principal (a foto do LCP não divide a banda com as fontes)", () => {
  it("o HTML inicial da Arca não declara as @font-face da loja nem faz preload de fontes; a fonte reserva e as variáveis seguem", () => {
    const css = fontCssFor("arca");
    expect(css).not.toContain('font-family:"Barlow";');
    expect(css).not.toContain("/fonts/arca/");
    expect(css).toContain('"Barlow Fallback"');
    expect(css).toContain("size-adjust");
    expect(css).toContain("--font-barlow-condensed");
    expect(fontUrlsFor("arca")).toEqual([]);
  });

  it("as quatro @font-face (com font-display: swap) vêm no CSS adiado, apontando para os arquivos de public/fonts/arca", () => {
    const css = deferredFontCssFor("arca");
    for (const file of ["barlow-condensed-700.woff2", "barlow-400.woff2", "barlow-500.woff2", "barlow-700.woff2"]) expect(css).toContain(`/fonts/arca/${file}`);
    expect(css.match(/@font-face/g)).toHaveLength(4);
    expect(css).toContain("font-display:swap");
  });

  it("Trama e Forno não mudam: @font-face e preload no HTML inicial, nada adiado", () => {
    for (const slug of ["trama", "forno"]) {
      expect(deferredFontCssFor(slug), slug).toBe("");
      expect(fontCssFor(slug), slug).toContain("@font-face");
      expect(fontUrlsFor(slug).length, slug).toBeGreaterThan(0);
      expect(fontsBySlug[slug].afterLcp, slug).toBeUndefined();
    }
  });
});

describe("fotos dos blocos da home da Trama depois da foto principal", () => {
  it("as categorias e os destaques da Trama esperam o banner; o banner não", () => {
    const blocks = presetBySlug("trama")!.config.homeBlocks;
    for (const type of ["categories", "featured"] as const) {
      const b = blocks.find((x) => x.type === type);
      expect(b && "deferImages" in b && b.deferImages, type).toBe(true);
    }
    expect(blocks.find((x) => x.type === "banner")).not.toHaveProperty("deferImages");
  });
});
