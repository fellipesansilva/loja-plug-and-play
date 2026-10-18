import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { fontCssFor, fontUrlsFor, fontsBySlug } from "@/fonts";
import { quoteSalesConflict, assertValidPreset, validatePreset } from "./validate";
import { getPreset, presetBySlug } from "./index";

const orbita = getPreset("orbita")!;
const root = path.resolve(import.meta.dirname, "../..");

describe("preset Órbita (eletrônicos premium, marca fictícia)", () => {
  it("está no registro com a rota /orbita e passa na validação do build", () => {
    expect(presetBySlug("orbita")?.id).toBe("orbita");
    expect(orbita.shortId).toBe("orbita");
    expect(validatePreset(orbita)).toEqual([]);
  });

  it("o build falha se faltar identificação, se o prazo de troca for menor que o CDC ou se os módulos conflitarem", () => {
    const semCnpj = { ...orbita, config: { ...orbita.config, legal: { ...orbita.config.legal, document: "" } } };
    expect(() => assertValidPreset(semCnpj)).toThrow(/config\.legal\.document/);
    const defeito = { ...orbita, config: { ...orbita.config, policies: { ...orbita.config.policies, defect: { ...orbita.config.policies.defect, days: 89 } } } };
    expect(() => assertValidPreset(defeito)).toThrow(/defect\.days[\s\S]*90 dias/);
    const conflito = { ...orbita, config: { ...orbita.config, modules: { ...orbita.config.modules, orcamento: { enabled: true } } } };
    expect(() => assertValidPreset(conflito)).toThrow(/não pode ter módulos de venda ligados/);
    expect(quoteSalesConflict(orbita.config.modules)).toBeNull();
  });

  it("é uma loja de venda com os quatro módulos do diferencial ligados", () => {
    const m = orbita.config.modules;
    expect([m.bot, m.whatsapp, m.depoimentos, m.newsletter]).toEqual([true, true, true, true]);
    expect(m.orcamento?.enabled).not.toBe(true);
    expect(m.cartao?.enabled && m.cupom && m.descontoPix?.enabled && m.freteGratis?.enabled).toBeTruthy();
  });

  it("tema próprio (escuro) e fontes próprias, hospedadas em public/fonts/orbita com licença", () => {
    const t = orbita.config.theme;
    expect(t.colors.background).toBe("#0e1116");
    expect(t.colors.primary).not.toBe(getPreset("trama-studio")!.config.theme.colors.primary);
    for (const face of fontsBySlug.orbita.faces) expect(fs.existsSync(path.join(root, "public/fonts/orbita", face.file)), face.file).toBe(true);
    for (const lic of ["OFL-manrope.txt", "OFL-barlow.txt"]) expect(fs.readFileSync(path.join(root, "public/fonts/orbita", lic), "utf8")).toContain("SIL OPEN FONT LICENSE");
    expect(fontCssFor("orbita")).toContain("--font-manrope");
    expect(fontUrlsFor("orbita").every((u) => u.startsWith("/fonts/orbita/"))).toBe(true);
    expect(fontCssFor("orbita")).not.toMatch(/\/fonts\/(trama|forno|arca)\//);
  });

  it("sem foto licenciada: todas as imagens são placeholders locais (nenhum arquivo de imagem foi usado)", () => {
    const srcs = [
      ...orbita.products.flatMap((p) => p.images.map((i) => i.src)),
      ...orbita.categories.flatMap((c) => (c.image ? [c.image.src] : [])),
      ...orbita.config.homeBlocks.flatMap((b) => (b.type === "banner" ? [b.image.src] : [])),
    ];
    expect(srcs.length).toBeGreaterThanOrEqual(20);
    expect(srcs.every((s) => s.startsWith("/placeholder?"))).toBe(true);
    expect(fs.existsSync(path.join(root, "public/images/presets/orbita"))).toBe(false);
  });

  it("os depoimentos são todos fictícios (sem cliente real) e vêm com a marca de demonstração", () => {
    const block = orbita.config.homeBlocks.find((b) => b.type === "testimonials");
    if (block?.type !== "testimonials") throw new Error("sem depoimentos");
    expect(block.items.length).toBeGreaterThanOrEqual(3);
    expect(block.items.length).toBeLessThanOrEqual(6);
    expect(block.items.every((i) => i.real !== true)).toBe(true);
    expect(block.demoLabel).toBe("Depoimento de demonstração");
  });
});
