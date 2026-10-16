import { describe, expect, it } from "vitest";
import type { CartLine } from "@/domain/types";
import { presets } from "@/presets";
import { cartBlockers, makeLineId, resolveLines } from "./cart";
import { cartWords } from "./cart-words";

const preset = presets[0];
const plain = preset.products.find((p) => p.stock >= 3 && p.variants.length === 0 && !p.type)!;
const withVariants = preset.products.find((p) => p.variants.some((v) => v.stock >= 2))!;
const line = (productId: string, qty: number, variantId?: string): CartLine => ({ lineId: makeLineId(productId, variantId, []), productId, variantId, addonIds: [], qty });
const status = (products = preset.products, ...lines: CartLine[]) => resolveLines(lines, products).map((l) => l.availability);

describe("disponibilidade das linhas do carrinho", () => {
  it("dentro do estoque e ativo: ok", () => {
    expect(status(preset.products, line(plain.id, 1))).toEqual([{ status: "ok" }]);
    expect(status(preset.products, line(plain.id, plain.stock))).toEqual([{ status: "ok" }]);
  });
  it("produto inativo ou estoque zerado: indisponível", () => {
    const inactive = preset.products.map((p) => (p.id === plain.id ? { ...p, active: false } : p));
    expect(status(inactive, line(plain.id, 1))).toEqual([{ status: "unavailable" }]);
    const zero = preset.products.map((p) => (p.id === plain.id ? { ...p, stock: 0 } : p));
    expect(status(zero, line(plain.id, 1))).toEqual([{ status: "unavailable" }]);
  });
  it("estoque menor que a quantidade: 'short' com o que resta", () => {
    const less = preset.products.map((p) => (p.id === plain.id ? { ...p, stock: 2 } : p));
    expect(status(less, line(plain.id, 3))).toEqual([{ status: "short", left: 2 }]);
  });
  it("variação: estoque da variação, e variação que sumiu é indisponível", () => {
    const v = withVariants.variants.find((x) => x.stock >= 2)!;
    expect(status(preset.products, line(withVariants.id, 1, v.id))).toEqual([{ status: "ok" }]);
    const less = preset.products.map((p) => (p.id === withVariants.id ? { ...p, variants: p.variants.map((x) => (x.id === v.id ? { ...x, stock: 1 } : x)) } : p));
    expect(status(less, line(withVariants.id, 2, v.id))).toEqual([{ status: "short", left: 1 }]);
    const gone = preset.products.map((p) => (p.id === withVariants.id ? { ...p, variants: p.variants.filter((x) => x.id !== v.id) } : p));
    expect(status(gone, line(withVariants.id, 1, v.id))).toEqual([{ status: "unavailable" }]);
  });
  it("cartBlockers devolve só as linhas com problema", () => {
    const other = preset.products.find((p) => p.id !== plain.id && p.stock >= 1 && p.variants.length === 0 && !p.type)!;
    const products = preset.products.map((p) => (p.id === plain.id ? { ...p, active: false } : p));
    const blockers = cartBlockers(resolveLines([line(plain.id, 1), line(other.id, 1)], products));
    expect(blockers.map((b) => b.product.id)).toEqual([plain.id]);
  });
});

describe("textos do carrinho para item indisponível", () => {
  it("usam o rótulo do preset (carrinho / sacola)", () => {
    const m = cartWords("Carrinho", "m");
    const f = cartWords("Sacola", "f");
    expect(m.unavailable).toBe("Indisponível");
    expect(m.only(2)).toBe("Só restam 2");
    expect(m.only(1)).toBe("Só resta 1");
    expect(m.blocked(["A (Indisponível)"])).toBe("Para finalizar, resolva no carrinho: A (Indisponível).");
    expect(f.blocked(["A (Indisponível)", "B (Só restam 2)"])).toBe("Para finalizar, resolva na sacola: A (Indisponível); B (Só restam 2).");
  });
});
