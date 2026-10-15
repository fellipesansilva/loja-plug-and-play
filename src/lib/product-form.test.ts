import { describe, expect, it } from "vitest";
import type { Product } from "@/domain/types";
import { presets } from "@/presets";
import { imageFileProblem, presetImagePool } from "./image-upload";
import { formatPriceInput, parsePriceBR, parsePriceCsv } from "./price-input";
import { emptyForm, formFromProduct, productFromForm, splitDefs, validateProductForm, type FormContext, type ProductFormValues } from "./product-form";

describe("preço em formato brasileiro", () => {
  it("aceita 19,90, 1.299,90, R$ 19,90, 19 e 0,5; grava em centavos inteiros", () => {
    expect(parsePriceBR("19,90")).toBe(1990);
    expect(parsePriceBR("1.299,90")).toBe(129990);
    expect(parsePriceBR("R$ 19,90")).toBe(1990);
    expect(parsePriceBR("19")).toBe(1900);
    expect(parsePriceBR("0,5")).toBe(50);
    expect(parsePriceBR("0,05")).toBe(5);
    expect(parsePriceBR(" 1.000 ")).toBe(100000);
  });
  it("recusa vazio, zero, negativo, letras, 3 casas, ponto decimal e milhar fora do lugar", () => {
    for (const bad of ["", " ", "0", "0,00", "-5", "abc", "19,999", "19.90", "1.29,90", "1,299,90", "R$", "19,", ",90", "1e3"]) expect(parsePriceBR(bad), bad).toBeNull();
  });
  it("formata para editar e volta igual", () => {
    for (const c of [5, 50, 1990, 100000, 129990]) expect(parsePriceBR(formatPriceInput(c))).toBe(c);
    expect(formatPriceInput(1990)).toBe("19,90");
    expect(formatPriceInput(5)).toBe("0,05");
  });
  it("CSV também aceita ponto decimal (319.90) e milhar (1.299)", () => {
    expect(parsePriceCsv("319.90")).toBe(31990);
    expect(parsePriceCsv("319,90")).toBe(31990);
    expect(parsePriceCsv("1.299")).toBe(129900);
    expect(parsePriceCsv("1.299,90")).toBe(129990);
    expect(parsePriceCsv("abc")).toBeNull();
  });
});

describe("arquivo de imagem", () => {
  const f = (type: string, size: number) => ({ name: "foto", type, size });
  it("aceita JPG, PNG e WebP até 1 MB", () => {
    for (const t of ["image/jpeg", "image/png", "image/webp"]) expect(imageFileProblem(f(t, 1024 * 1024))).toBeNull();
  });
  it("recusa outro tipo e acima de 1 MB", () => {
    expect(imageFileProblem(f("image/gif", 10))).toMatch(/JPG, PNG ou WebP/);
    expect(imageFileProblem(f("application/pdf", 10))).not.toBeNull();
    expect(imageFileProblem(f("image/png", 1024 * 1024 + 1))).toMatch(/1 MB/);
  });
  it("o conjunto de imagens do preset não repete arquivo", () => {
    for (const p of presets) {
      const pool = presetImagePool(p);
      expect(pool.length).toBeGreaterThan(0);
      expect(new Set(pool.map((i) => i.src)).size).toBe(pool.length);
    }
  });
});

describe.each(presets.map((p) => [p.id, p] as const))("formulário de produto · %s", (_id, preset) => {
  const ctx = (over: Partial<FormContext> = {}): FormContext => ({ products: preset.products, categories: preset.categories, defs: preset.config.attributeDefs, ...over });
  const { axes, descriptive } = splitDefs(preset.config.attributeDefs);
  const valid = (): ProductFormValues => ({
    ...emptyForm(preset.categories[0].id),
    name: "Produto novo",
    price: "19,90",
    sku: "NOVO-001",
    stock: "5",
    images: [{ src: preset.products[0].images[0].src, alt: "Foto" }],
  });

  it("o preset define eixos de variação e atributos descritivos", () => {
    expect(axes.length).toBeGreaterThan(0);
    expect(descriptive.length).toBeGreaterThan(0);
    expect(axes.every((a) => a.variant)).toBe(true);
  });

  it("formulário válido não tem erro; gera produto com preço em centavos, slug único e ativo", () => {
    expect(validateProductForm(valid(), ctx())).toEqual({});
    const p = productFromForm(valid(), { ...ctx(), newId: () => "np-1" });
    expect(p).toMatchObject({ id: "np-1", slug: "produto-novo", name: "Produto novo", price: 1990, sku: "NOVO-001", stock: 5, active: true, variants: [] });
    const again = productFromForm({ ...valid(), sku: "NOVO-002" }, { ...ctx({ products: [...preset.products, p] }), newId: () => "np-2" });
    expect(again.slug).toBe("produto-novo-2");
  });

  it("nome, preço, estoque, categoria e imagem inválidos geram erro no campo", () => {
    const e = validateProductForm({ ...valid(), name: " ", price: "19.90", stock: "-1", categoryId: "x", images: [] }, ctx());
    expect(Object.keys(e).sort()).toEqual(["categoryId", "images", "name", "price", "stock"]);
    expect(validateProductForm({ ...valid(), stock: "1,5" }, ctx()).stock).toBeTruthy();
    expect(validateProductForm({ ...valid(), price: "0" }, ctx()).price).toBeTruthy();
    expect(validateProductForm({ ...valid(), images: [{ src: "/x.webp", alt: " " }] }, ctx()).images).toBeTruthy();
  });

  it("SKU vazio, com caracteres inválidos ou repetido (do produto ou de variação de outro) é recusado", () => {
    expect(validateProductForm({ ...valid(), sku: "" }, ctx()).sku).toBeTruthy();
    expect(validateProductForm({ ...valid(), sku: "AB CD" }, ctx()).sku).toMatch(/letras/);
    const existing = preset.products[0];
    expect(validateProductForm({ ...valid(), sku: existing.sku }, ctx()).sku).toMatch(/já está em uso/);
    expect(validateProductForm({ ...valid(), sku: existing.sku.toLowerCase() }, ctx()).sku).toMatch(/já está em uso/);
    const withVariant = preset.products.find((p) => p.variants.length > 0)!;
    expect(validateProductForm({ ...valid(), sku: withVariant.variants[0].sku }, ctx()).sku).toMatch(/já está em uso/);
  });

  it("editar mantém o próprio SKU, mas não pode pegar o de outro produto", () => {
    const [a, b] = preset.products;
    const form = formFromProduct(a, preset.config.attributeDefs);
    expect(validateProductForm(form, ctx({ editingId: a.id }))).toEqual({});
    expect(validateProductForm({ ...form, sku: b.sku }, ctx({ editingId: a.id })).sku).toMatch(/já está em uso/);
  });

  it("variações: valor de cada eixo, SKU único, estoque e combinação repetida; estoque do produto vira a soma", () => {
    const empty = { uid: "a", values: Object.fromEntries(axes.map((x) => [x.key, ""])), sku: "", stock: "x", price: "1.5" };
    const e = validateProductForm({ ...valid(), variants: [empty] }, ctx());
    expect(e.variants).toBeTruthy();
    for (const a of axes) expect(e[`variant-0-${a.key}`]).toBeTruthy();
    expect(e["variant-0-sku"]).toBeTruthy();
    expect(e["variant-0-stock"]).toBeTruthy();
    expect(e["variant-0-price"]).toBeTruthy();

    const values = Object.fromEntries(axes.map((x) => [x.key, "Valor"]));
    const v = (uid: string, sku: string, stock = "2") => ({ uid, values, sku, stock, price: "" });
    const dup = validateProductForm({ ...valid(), variants: [v("a", "NV-1"), v("b", "NV-2")] }, ctx());
    expect(dup[`variant-1-${axes[0].key}`]).toMatch(/combinação/);
    const sameSku = validateProductForm({ ...valid(), variants: [v("a", "NV-1"), { ...v("b", "nv-1"), values: Object.fromEntries(axes.map((x) => [x.key, "Outro"])) }] }, ctx());
    expect(sameSku["variant-1-sku"]).toBeTruthy();
    const vsProduct = validateProductForm({ ...valid(), variants: [v("a", "NOVO-001")] }, ctx());
    expect(vsProduct["variant-0-sku"]).toBeTruthy();

    const ok = { ...valid(), variants: [v("a", "NV-1", "3"), { ...v("b", "NV-2", "4"), values: Object.fromEntries(axes.map((x) => [x.key, "Outro"])) }] };
    expect(validateProductForm(ok, ctx())).toEqual({});
    const p = productFromForm(ok, { ...ctx(), newId: () => "np-9" });
    expect(p.stock).toBe(7);
    expect(p.variants.map((x) => x.sku)).toEqual(["NV-1", "NV-2"]);
    expect(p.variants[0].attributes).toEqual(values);
  });

  it("editar preserva slug, tipo, adicionais, selos e atributos fora do preset; troca só o que o formulário mexe", () => {
    const original: Product = { ...structuredClone(preset.products[0]), badges: ["Selo"], attributes: [...preset.products[0].attributes, { key: "extra", label: "Extra", value: "1" }] };
    const form = formFromProduct(original, preset.config.attributeDefs);
    const edited = productFromForm({ ...form, price: "99,90", name: "Outro nome" }, { ...ctx({ products: [original, ...preset.products.slice(1)], editingId: original.id }), newId: () => "x" });
    expect(edited).toMatchObject({ id: original.id, slug: original.slug, price: 9990, name: "Outro nome", badges: ["Selo"] });
    expect(edited.attributes.find((a) => a.key === "extra")?.value).toBe("1");
    expect(edited.variants.map((v) => v.id)).toEqual(original.variants.map((v) => v.id));
  });
});
