import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ORDER_STATUSES } from "@/domain/types";
import { isCouponValid } from "./helpers";
import { presets } from "./index";

const expectedFreeShipping: Record<string, number> = {
  "trama-studio": 19900,
  "forno-da-vila": 8000,
};

describe.each(presets.map((p) => [p.id, p] as const))("preset %s", (id, preset) => {
  it("tem 16–20 produtos em ≥ 3 categorias", () => {
    expect(preset.products.length).toBeGreaterThanOrEqual(16);
    expect(preset.products.length).toBeLessThanOrEqual(20);
    expect(preset.categories.length).toBeGreaterThanOrEqual(3);
    const used = new Set(preset.products.map((p) => p.categoryId));
    for (const c of preset.categories) expect(used.has(c.id)).toBe(true);
    for (const p of preset.products) {
      expect(preset.categories.some((c) => c.id === p.categoryId)).toBe(true);
    }
  });

  it("tem ≥ 4 produtos com variações", () => {
    expect(preset.products.filter((p) => p.variants.length > 0).length).toBeGreaterThanOrEqual(4);
  });

  it("tem exatamente 1 produto sem estoque", () => {
    expect(preset.products.filter((p) => p.stock === 0)).toHaveLength(1);
  });

  it("tem 8 pedidos cobrindo os 6 status", () => {
    expect(preset.orders).toHaveLength(8);
    const statuses = new Set(preset.orders.map((o) => o.status));
    for (const s of ORDER_STATUSES) expect(statuses.has(s)).toBe(true);
  });

  it("tem exatamente 1 cupom válido", () => {
    expect(preset.coupons.filter((c) => isCouponValid(c))).toHaveLength(1);
  });

  it("tem CSV de exemplo com cabeçalho e linhas", () => {
    const lines = preset.sampleCsv.trim().split("\n");
    expect(lines.length).toBeGreaterThan(1);
    expect(lines[0]).toContain("sku");
  });

  it("frete grátis com o valor mínimo esperado", () => {
    expect(preset.config.modules.freteGratis?.enabled).toBe(true);
    expect(preset.config.modules.freteGratis?.minValue).toBe(expectedFreeShipping[id]);
  });

  it("pedidos referenciam produtos existentes", () => {
    const ids = new Set(preset.products.map((p) => p.id));
    for (const o of preset.orders) for (const i of o.items) expect(ids.has(i.productId)).toBe(true);
  });

  it("todo atributo usado por produto ou variante tem definição no preset", () => {
    const defined = new Set(preset.config.attributeDefs.map((d) => d.key));
    for (const p of preset.products) {
      for (const a of p.attributes) expect(defined, `${p.id}: ${a.key}`).toContain(a.key);
      for (const v of p.variants) for (const k of Object.keys(v.attributes)) expect(defined, `${v.sku}: ${k}`).toContain(k);
    }
  });

  it("swatches cobrem todos os valores de atributos do tipo swatch nas variantes", () => {
    for (const def of preset.config.attributeDefs.filter((d) => d.selector === "swatch")) {
      for (const p of preset.products) {
        for (const v of p.variants) {
          const value = v.attributes[def.key];
          if (value) expect(def.swatches?.[value], `${v.sku}: ${value}`).toBeTruthy();
        }
      }
    }
  });

  it("homeBlocks referenciam categorias e produtos existentes, com ids únicos", () => {
    const blocks = preset.config.homeBlocks;
    expect(new Set(blocks.map((b) => b.id)).size).toBe(blocks.length);
    const categoryIds = new Set(preset.categories.map((c) => c.id));
    const productIds = new Set(preset.products.map((p) => p.id));
    for (const b of blocks) {
      if (b.type === "categories") for (const id of b.categoryIds) expect(categoryIds).toContain(id);
      if (b.type === "featured") {
        expect(b.productIds).toHaveLength(8);
        for (const id of b.productIds) expect(productIds).toContain(id);
      }
    }
  });

  it("policies.regret afirma o direito de arrependimento de 7 dias (CDC, art. 49)", () => {
    const { regret, exchange } = preset.config.policies;
    expect(regret).toMatch(/7 dias/);
    expect(regret.toLowerCase()).toContain("arrependimento");
    expect(exchange).toMatch(/7 dias/);
    expect(regret.toLowerCase()).not.toMatch(/não (há|tem) (troca|direito)/);
  });

  it("tem título/descrição de SEO sem \"mockup\" nem \"demonstração\"", () => {
    const { seo } = preset.config;
    expect(seo.titleTemplate).toContain("%s");
    for (const text of [seo.titleTemplate, seo.description]) {
      expect(text.toLowerCase()).not.toMatch(/mockup|demonstra/);
    }
  });

  it("tem pelo menos 1 produto com variações de 3 fotos e demais com 1 foto", () => {
    for (const p of preset.products) {
      expect(p.images.length).toBeGreaterThanOrEqual(p.variants.length > 0 ? 3 : 1);
    }
  });

  it("toda imagem tem texto alternativo; imagem de arquivo existe em public/ e consta em IMAGE_CREDITS.md", () => {
    const root = path.resolve(import.meta.dirname, "../..");
    const credits = fs.readFileSync(path.join(root, "IMAGE_CREDITS.md"), "utf8");
    const banners = preset.config.homeBlocks.flatMap((b) => (b.type === "banner" ? [b.image] : []));
    const images = [...banners, ...preset.categories.map((c) => c.image), ...preset.products.flatMap((p) => p.images)];
    expect(images.length).toBeGreaterThan(0);
    for (const img of images) {
      expect(img.alt.trim().length).toBeGreaterThan(0);
      if (img.src.startsWith("/placeholder?")) continue; // placeholder SVG local, sem terceiros
      expect(img.src.startsWith("/images/presets/"), img.src).toBe(true);
      expect(fs.existsSync(path.join(root, "public", img.src)), img.src).toBe(true);
      expect(credits, img.src).toContain(img.src);
    }
  });
});

describe("módulos por preset", () => {
  const get = (id: string) => presets.find((p) => p.id === id)!.config.modules;

  it("Trama Studio: parcelamento, boleto, frete grátis, cupom", () => {
    const m = get("trama-studio");
    expect(m.parcelamento?.enabled).toBe(true);
    expect(m.boleto).toBe(true);
    expect(m.cupom).toBe(true);
    expect(m.retiradaLocal).toBeFalsy();
  });

  it("Forno da Vila: retirada local, frete grátis, cupom", () => {
    const m = get("forno-da-vila");
    expect(m.retiradaLocal).toBe(true);
    expect(m.cupom).toBe(true);
    expect(m.boleto).toBeFalsy();
    expect(m.parcelamento?.enabled).toBeFalsy();
  });
});

describe("SKUs", () => {
  it.each(presets.map((p) => [p.id, p] as const))("preset %s: variantes têm SKU único e todo SKU é único", (_id, preset) => {
    const all: string[] = [];
    for (const p of preset.products) {
      all.push(p.sku);
      const variantSkus = p.variants.map((v) => v.sku);
      expect(new Set(variantSkus).size).toBe(variantSkus.length);
      all.push(...variantSkus);
    }
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("valores monetários em centavos inteiros", () => {
  it.each(presets.map((p) => [p.id, p] as const))("preset %s", (_id, preset) => {
    const values: number[] = [];
    const fg = preset.config.modules.freteGratis;
    if (fg) values.push(fg.minValue);
    for (const p of preset.products) {
      values.push(p.price, ...p.variants.flatMap((v) => (v.price === undefined ? [] : [v.price])));
    }
    for (const o of preset.orders) {
      values.push(o.total, ...o.items.map((i) => i.unitPrice));
      if (o.delivery.type === "entrega") values.push(o.delivery.shipping);
    }
    for (const c of preset.coupons) {
      if (c.minValue !== undefined) values.push(c.minValue);
      if (c.type === "fixed") values.push(c.value);
    }
    expect(values.length).toBeGreaterThan(0);
    for (const v of values) expect(Number.isInteger(v)).toBe(true);
    // preços plausíveis em centavos (nenhum preço de produto abaixo de R$ 1,00)
    for (const p of preset.products) expect(p.price).toBeGreaterThanOrEqual(100);
  });
});
