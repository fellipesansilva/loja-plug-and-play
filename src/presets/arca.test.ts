import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { QUOTE_STATUSES, type Preset } from "@/domain/types";
import { fontCssFor, fontUrlsFor } from "@/fonts";
import { presets } from "./index";
import { assertValidPreset, validatePreset } from "./validate";

const arca = presets.find((p) => p.id === "arca-inflaveis")!;
const root = path.resolve(import.meta.dirname, "../..");
const clone = (p: Preset): Preset => structuredClone(p);

describe("preset Arca Infláveis (modo orçamento)", () => {
  it("está registrado em /arca com o módulo de orçamento ligado e nenhum módulo de venda", () => {
    expect(arca.shortId).toBe("arca");
    const m = arca.config.modules;
    expect(m.orcamento?.enabled).toBe(true);
    expect(!!m.retiradaLocal || !!m.freteGratis?.enabled || !!m.parcelamento?.enabled || !!m.boleto || !!m.cartao?.enabled || !!m.descontoPix?.enabled || !!m.cupom).toBe(false);
    expect(validatePreset(arca)).toEqual([]);
  });

  it("tem 2 categorias e 8 produtos (só os que têm foto real), sem preço, sem variação e sem pedidos nem cupons", () => {
    expect(arca.categories.map((c) => c.name)).toEqual(["Indústria e agro", "Eventos e marketing"]);
    expect(arca.products).toHaveLength(8);
    const used = new Set(arca.products.map((p) => p.categoryId));
    for (const c of arca.categories) expect(used.has(c.id)).toBe(true);
    for (const p of arca.products) {
      expect(p.price).toBe(0);
      expect(p.variants).toHaveLength(0);
      expect(p.applications?.length).toBeGreaterThan(0);
      expect(p.attributes.length).toBeGreaterThanOrEqual(3);
      expect(p.description.length).toBeGreaterThan(120);
    }
    expect(arca.orders).toEqual([]);
    expect(arca.coupons).toEqual([]);
  });

  it("os nomes cobrem o nicho pedido", () => {
    const names = arca.products.map((p) => p.name.toLowerCase()).join(" | ");
    for (const term of ["reservatório flexível fechado", "reservatório aberto", "bolsa de içamento", "saco para teste de carga", "boia de demarcação", "boia cilíndrica", "pórtico inflável", "blimp"]) {
      expect(names, term).toContain(term);
    }
  });

  it("toda imagem é uma foto WebP que existe em public/, tem texto alternativo, consta em IMAGE_CREDITS.md e nenhuma se repete", () => {
    const credits = fs.readFileSync(path.join(root, "IMAGE_CREDITS.md"), "utf8");
    const banner = arca.config.homeBlocks.flatMap((b) => (b.type === "banner" ? [b.image] : []));
    const catalog = [...banner, ...arca.categories.map((c) => c.image), ...arca.products.flatMap((p) => p.images)];
    // necessidades, setores e projetos podem reaproveitar uma foto em outro recorte; só o catálogo não repete.
    const segment = [...(arca.config.needs ?? []), ...(arca.config.sectors ?? []), ...(arca.config.cases ?? [])].map((x) => x.image);
    for (const img of [...catalog, ...segment]) {
      expect(img.alt.trim().length).toBeGreaterThan(0);
      expect(img.src.endsWith(".webp"), img.src).toBe(true);
      expect(fs.existsSync(path.join(root, "public", img.src)), img.src).toBe(true);
      expect(fs.statSync(path.join(root, "public", img.src)).size, img.src).toBeLessThanOrEqual(200 * 1024);
      expect(credits, img.src).toContain(img.src);
    }
    const srcs = catalog.map((i) => i.src);
    expect(new Set(srcs).size).toBe(srcs.length);
    // nenhuma ilustração SVG sobrou no preset
    const dir = path.join(root, "public/images/presets/arca-inflaveis");
    expect(fs.readdirSync(dir).filter((f) => f.endsWith(".svg"))).toEqual([]);
  });

  it("o banner é responsivo (celular e desktop, AVIF e WebP), com os arquivos existentes e dentro do limite", () => {
    const banner = arca.config.homeBlocks.find((b) => b.type === "banner");
    if (banner?.type !== "banner") throw new Error("sem banner");
    const sources = banner.image.sources ?? [];
    expect(sources.map((s) => s.media)).toEqual(["(max-width: 767px)", "(min-width: 768px)"]);
    for (const source of sources) {
      expect(source.avif.map((c) => c.width)).toEqual(source.webp.map((c) => c.width));
      expect(source.avif.length).toBeGreaterThanOrEqual(2);
      for (const c of [...source.avif, ...source.webp]) {
        const file = path.join(root, "public", c.src);
        expect(fs.existsSync(file), c.src).toBe(true);
        expect(fs.statSync(file).size, c.src).toBeLessThanOrEqual(200 * 1024);
      }
    }
    const mobileAvif = sources[0].avif.map((c) => fs.statSync(path.join(root, "public", c.src)).size);
    expect(Math.min(...mobileAvif)).toBeLessThan(60 * 1024);
  });


  it("tem 3 a 5 solicitações de exemplo, em status variados, com histórico coerente e itens do catálogo", () => {
    const quotes = arca.quotes ?? [];
    expect(quotes.length).toBeGreaterThanOrEqual(3);
    expect(quotes.length).toBeLessThanOrEqual(5);
    expect(new Set(quotes.map((q) => q.status)).size).toBeGreaterThanOrEqual(3);
    for (const q of quotes) {
      expect(q.id).toMatch(/^ORC-\d{8}-[0-9A-Z]{5}$/);
      expect(q.history[0]).toEqual({ status: "nova", at: q.createdAt });
      expect(q.history.at(-1)!.status).toBe(q.status);
      for (const s of q.history) expect(QUOTE_STATUSES).toContain(s.status);
      for (const i of q.items) {
        const p = arca.products.find((x) => x.id === i.productId)!;
        expect(p, i.productId).toBeTruthy();
        expect(i.sku).toBe(p.sku);
        expect(i.note.length).toBeLessThanOrEqual(500);
      }
    }
  });

  it("as fontes (Barlow Condensed e Barlow) existem em public/fonts/arca com o arquivo de licença", () => {
    expect(fontCssFor("arca")).toContain("--font-barlow-condensed");
    for (const url of fontUrlsFor("arca")) expect(fs.existsSync(path.join(root, "public", url)), url).toBe(true);
    for (const file of ["barlow-400.woff2", "barlow-500.woff2", "barlow-700.woff2", "barlow-condensed-700.woff2", "OFL-barlow.txt", "OFL-barlow-condensed.txt"]) {
      expect(fs.existsSync(path.join(root, "public/fonts/arca", file)), file).toBe(true);
    }
    expect(fs.readFileSync(path.join(root, "public/fonts/arca/OFL-barlow.txt"), "utf8")).toContain("SIL OPEN FONT LICENSE");
  });

  it("identificação, privacidade e cookies passam na validação; arrependimento não se aplica, mas o prazo de defeito continua valendo", () => {
    const p = clone(arca);
    expect(arca.config.policies.regretDays).toBeUndefined();
    p.config.policies.defect.days = 60;
    expect(() => assertValidPreset(p)).toThrow(/defect\.days[\s\S]*90 dias/);
    const q = clone(arca);
    q.config.legal.document = "";
    expect(() => assertValidPreset(q)).toThrow(/config\.legal\.document/);
  });
});

describe("validação do modo orçamento", () => {
  it.each([
    ["cupom", (p: Preset) => (p.config.modules.cupom = true)],
    ["cartao", (p: Preset) => (p.config.modules.cartao = { enabled: true })],
    ["boleto", (p: Preset) => (p.config.modules.boleto = true)],
    ["parcelamento", (p: Preset) => (p.config.modules.parcelamento = { enabled: true, maxInstallments: 3 })],
    ["descontoPix", (p: Preset) => (p.config.modules.descontoPix = { enabled: true, percent: 5 })],
    ["freteGratis", (p: Preset) => (p.config.modules.freteGratis = { enabled: true, minValue: 10000 })],
    ["retiradaLocal", (p: Preset) => (p.config.modules.retiradaLocal = true)],
  ])("com o módulo %s ligado o build falha, dizendo qual", (name, turnOn) => {
    const p = clone(arca);
    turnOn(p);
    expect(() => assertValidPreset(p)).toThrow(new RegExp(`config\\.modules[\\s\\S]*${name}`));
  });

  it("exige os dados do orçamento (lista, aplicações, WhatsApp) e as condições comerciais", () => {
    const noQuote = clone(arca);
    delete noQuote.config.quote;
    expect(validatePreset(noQuote).join()).toContain("config.quote");
    const noApps = clone(arca);
    noApps.config.quote!.applications = [];
    expect(validatePreset(noApps).join()).toContain("config.quote.applications");
    const badWpp = clone(arca);
    badWpp.config.quote!.whatsapp.number = "abc";
    expect(validatePreset(badWpp).join()).toContain("config.quote.whatsapp");
    const noCommercial = clone(arca);
    delete noCommercial.config.policies.commercial;
    expect(validatePreset(noCommercial).join()).toContain("config.policies.commercial");
  });

  it("loja de venda não é afetada: Trama e Forno seguem exigindo arrependimento de 7 dias", () => {
    for (const p of presets.filter((x) => x.id !== arca.id)) {
      expect(p.config.modules.orcamento).toBeUndefined();
      const bad = clone(p);
      bad.config.policies.regretDays = 5;
      expect(() => assertValidPreset(bad)).toThrow(/regretDays/);
    }
  });
});
