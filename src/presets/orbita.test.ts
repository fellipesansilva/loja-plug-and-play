import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MIN_DEFECT_DAYS } from "@/domain/types";
import { fontCssFor, fontUrlsFor, fontsBySlug } from "@/fonts";
import { fallbackFaces } from "@/fonts/fallbacks.generated";
import { imageOriginals } from "@/lib/image-originals.generated";
import { themeWithChoice } from "@/lib/store-config";
import { contrastIssues } from "@/theme/contrast";
import { quoteSalesConflict, assertValidPreset, validatePreset } from "./validate";
import { getPreset, presetBySlug } from "./index";

const orbita = getPreset("orbita")!;
const root = path.resolve(import.meta.dirname, "../..");
const pub = (src: string) => path.join(root, "public", src);

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

  it("é bem durável: troca por defeito de 90 dias (CDC, art. 26), pelo mínimo da lei", () => {
    const d = orbita.config.policies.defect;
    expect(d.durability).toBe("durable");
    expect(d.days).toBe(MIN_DEFECT_DAYS.durable);
    expect(d.days).toBe(90);
    expect(d.conditions).toMatch(/90 dias/);
  });

  it("loja de venda com frete por CEP, Pix e cartão parcelado; os módulos do diferencial (F6) ficam desligados", () => {
    const m = orbita.config.modules;
    expect([m.bot, m.whatsapp, m.depoimentos, m.newsletter]).toEqual([false, false, false, false]);
    expect(m.orcamento?.enabled).not.toBe(true);
    expect(m.cartao?.enabled).toBe(true);
    expect(m.parcelamento?.enabled).toBe(true);
    expect(m.parcelamento?.maxInstallments).toBeGreaterThan(1);
    expect(orbita.config.shipping.options.length).toBeGreaterThanOrEqual(2);
    expect(orbita.config.bot).toBeUndefined();
    expect(orbita.config.whatsapp).toBeUndefined();
    expect(orbita.config.newsletter).toBeUndefined();
    expect(orbita.config.homeBlocks.some((b) => b.type === "testimonials")).toBe(false);
  });

  it("16 produtos com especificações como atributos (conexão, bateria, voltagem, garantia, modelo e cor)", () => {
    expect(orbita.products).toHaveLength(16);
    const keys = new Set(orbita.config.attributeDefs.map((d) => d.key));
    for (const k of ["tamanho", "cor", "conexao", "bateria", "voltagem", "garantia"]) expect(keys.has(k), k).toBe(true);
    for (const p of orbita.products) for (const a of p.attributes) expect(keys.has(a.key), `${p.id}.${a.key}`).toBe(true);
    expect(orbita.products.filter((p) => p.attributes.some((a) => a.key === "voltagem")).length).toBeGreaterThanOrEqual(3);
  });

  it("tema escuro próprio, e toda combinação de cor principal e de destaque do painel passa no contraste de 4,5:1", () => {
    const t = orbita.config.theme;
    expect(t.colors.background).toBe("#0e1116");
    expect(t.colors.primary).not.toBe(getPreset("trama-studio")!.config.theme.colors.primary);
    const choices = orbita.config.themeChoices!;
    for (const primary of choices.primary) {
      for (const accent of choices.accent) {
        const theme = themeWithChoice(orbita.config, { primary: primary.id, accent: accent.id, headingFont: choices.fonts.heading[0].id, bodyFont: choices.fonts.body[0].id });
        expect(contrastIssues(theme.colors, choices.contrastPairs), `${primary.id} + ${accent.id}`).toEqual([]);
      }
    }
  });

  it("fontes próprias, hospedadas em public/fonts/orbita com licença OFL, só depois do LCP, com reserva de métricas ajustadas", () => {
    for (const face of fontsBySlug.orbita.faces) expect(fs.existsSync(path.join(root, "public/fonts/orbita", face.file)), face.file).toBe(true);
    for (const lic of ["OFL-manrope.txt", "OFL-barlow.txt"]) expect(fs.readFileSync(path.join(root, "public/fonts/orbita", lic), "utf8")).toContain("SIL OPEN FONT LICENSE");
    expect(fontsBySlug.orbita.afterLcp).toBe(true);
    expect(fontUrlsFor("orbita")).toEqual([]); // sem preload: as fontes não dividem a banda com a foto do LCP
    expect(fontCssFor("orbita")).not.toMatch(/\/fonts\/(trama|forno|arca|faisca)\//);
    expect((fallbackFaces as Record<string, unknown[]>)["orbita"].length).toBeGreaterThanOrEqual(4);
  });
});

describe("fotos da Órbita", () => {
  const banner = orbita.config.homeBlocks.find((b) => b.type === "banner");
  const credits = fs.readFileSync(path.join(root, "IMAGE_CREDITS.md"), "utf8");
  const images = [...(banner?.type === "banner" ? [banner.image] : []), ...orbita.categories.flatMap((c) => c.image ?? []), ...orbita.products.flatMap((p) => p.images)];

  it("o banner, uma foto por categoria e por produto (duas nos que têm variações); todas com alt, arquivo em public/ e crédito (autor, licença e endereço)", () => {
    expect(images.length).toBe(1 + orbita.categories.length + orbita.products.reduce((n, p) => n + (p.variants.length > 0 ? 2 : 1), 0));
    for (const img of images) {
      expect(img.alt.trim().length, img.src).toBeGreaterThan(10);
      expect(img.src.startsWith("/images/presets/orbita/"), img.src).toBe(true);
      expect(fs.existsSync(pub(img.src)), img.src).toBe(true);
      expect(fs.statSync(pub(img.src)).size, img.src).toBeLessThanOrEqual(200 * 1024);
      const row = credits.split(/\r?\n/).find((l) => l.includes(`\`public${img.src}\``));
      expect(row, `crédito de ${img.src}`).toBeTruthy();
      expect(row).toMatch(/https:\/\/(unsplash\.com\/photos|www\.pexels\.com\/photo)\/[\w-]+\/? \| .+ \| \[(Unsplash|Pexels) License\]/);
    }
  });

  it("nenhuma foto se repete (nem arquivo, nem endereço de origem) e nenhuma é de outra loja", () => {
    const srcs = images.map((i) => i.src);
    expect(new Set(srcs).size).toBe(srcs.length);
    const rows = credits.split(/\r?\n/).filter((l) => l.includes("presets/orbita/"));
    const urls = rows.map((l) => /https:\/\/[^ ]+/.exec(l)![0]);
    expect(new Set(urls).size).toBe(urls.length);
    expect(rows.length).toBeGreaterThanOrEqual(images.length);
  });

  it("o banner tem preload e recortes de celular (3:4) e desktop (16:9) em AVIF e WebP", () => {
    if (banner?.type !== "banner") throw new Error("sem banner");
    expect(banner.image.preload).toBe(true);
    const sources = banner.image.sources ?? [];
    expect(sources.map((s) => s.media)).toEqual(["(max-width: 767px)", "(min-width: 768px)"]);
    for (const source of sources) {
      expect(source.avif.map((c) => c.width)).toEqual(source.webp.map((c) => c.width));
      for (const c of [...source.avif, ...source.webp]) {
        expect(fs.existsSync(pub(c.src)), c.src).toBe(true);
        expect(fs.statSync(pub(c.src)).size, c.src).toBeLessThanOrEqual(200 * 1024);
      }
    }
    expect(sources[0].avif.map((c) => c.width)).toEqual([480, 640, 768, 960]);
    expect(sources[1].avif.map((c) => c.width)).toEqual([1280, 1920]);
  });

  it("variantes de 360 e 640 px em todas as fotos; a de 960 só quando pesa menos de 85% do original", () => {
    for (const src of images.filter((i) => !i.src.includes("/banner")).map((i) => i.src)) {
      const base = src.replace(/\.webp$/, "");
      expect(fs.existsSync(pub(`${base}-360.webp`)), `${base}-360`).toBe(true);
      expect(fs.existsSync(pub(`${base}-640.webp`)), `${base}-640`).toBe(true);
      const original = imageOriginals[src];
      expect(original, `manifesto de ${src}`).toBeTruthy();
      const hi = pub(`${base}-960.webp`);
      if (original.w960) {
        expect(fs.existsSync(hi), `${base}-960`).toBe(true);
        expect(fs.statSync(hi).size, `${base}-960`).toBeLessThan(0.85 * original.bytes);
      } else {
        expect(fs.existsSync(hi), `${base}-960 não deveria existir`).toBe(false);
      }
    }
  });
});
