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

  it("usa apenas imagens locais de placeholder", () => {
    for (const p of preset.products) for (const img of p.images) expect(img.startsWith("/placeholder?")).toBe(true);
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
