import { describe, expect, it } from "vitest";
import type { CartLine } from "@/domain/types";
import { getPreset } from "@/presets";
import { addLine, cartCount, cartSubtotal, freeShippingProgress, lineTotal, makeLineId, unitPrice } from "./cart";

const forno = getPreset("forno-da-vila")!;
const products = forno.products;
const bolo = products.find((p) => p.id === "fv-012")!; // variações Fatia/Meio/Inteiro, adicionais sorvete e morangos
const pizza = products.find((p) => p.id === "fv-001")!;
const brownie = products.find((p) => p.id === "fv-013")!; // sem variação, adicionais
const cafe = products.find((p) => p.id === "fv-020")!; // sem variação, sem adicionais

describe("lineId", () => {
  it("é produto + variante + adicionais ordenados", () => {
    expect(makeLineId("p", "v", ["b", "a"])).toBe("p|v|a|b");
    expect(makeLineId("p", undefined, [])).toBe("p|");
  });

  it("a ordem dos adicionais não muda o lineId", () => {
    expect(makeLineId("p", "v", ["sorvete", "morangos"])).toBe(makeLineId("p", "v", ["morangos", "sorvete"]));
  });

  it("variante ou adicionais diferentes mudam o lineId", () => {
    expect(makeLineId("p", "v1", [])).not.toBe(makeLineId("p", "v2", []));
    expect(makeLineId("p", "v", [])).not.toBe(makeLineId("p", "v", ["a"]));
    expect(makeLineId("p", undefined, [])).not.toBe(makeLineId("p", "v", []));
  });
});

describe("preço da linha", () => {
  const fatia = bolo.variants.find((v) => v.attributes.porcao === "Fatia")!;
  const meio = bolo.variants.find((v) => v.attributes.porcao === "Meio bolo")!;

  it("unitário = preço da variante (ou do produto) + adicionais", () => {
    expect(unitPrice(bolo, fatia.id, [])).toBe(1690);
    expect(unitPrice(bolo, meio.id, [])).toBe(5990);
    expect(unitPrice(bolo, meio.id, ["sorvete"])).toBe(5990 + 700);
    expect(unitPrice(bolo, meio.id, ["sorvete", "morangos"])).toBe(5990 + 700 + 500);
    expect(unitPrice(brownie, undefined, ["calda-extra"])).toBe(1490 + 300);
  });

  it("variante sem preço próprio usa o preço do produto", () => {
    const broto = pizza.variants[0];
    expect(broto.price).toBeUndefined();
    expect(unitPrice(pizza, broto.id, [])).toBe(pizza.price);
  });

  it("total da linha = unitário × quantidade", () => {
    expect(lineTotal(bolo, { variantId: meio.id, addonIds: ["sorvete", "morangos"], qty: 2 })).toBe((5990 + 700 + 500) * 2);
  });

  it("adicional desconhecido é ignorado no preço", () => {
    expect(unitPrice(bolo, fatia.id, ["inexistente"])).toBe(1690);
  });

  it("subtotal e contagem do carrinho", () => {
    const cart: CartLine[] = [
      { lineId: "a", productId: bolo.id, variantId: meio.id, addonIds: ["sorvete"], qty: 2 },
      { lineId: "b", productId: cafe.id, addonIds: [], qty: 3 },
      { lineId: "c", productId: "sumiu", addonIds: [], qty: 9 },
    ];
    expect(cartSubtotal(cart, products)).toBe((5990 + 700) * 2 + 790 * 3);
    expect(cartCount(cart)).toBe(14);
  });
});

describe("addLine", () => {
  const meio = bolo.variants.find((v) => v.attributes.porcao === "Meio bolo")!;
  const input = { productId: bolo.id, variantId: meio.id };

  it("mesma combinação soma a quantidade, mesmo com adicionais em outra ordem", () => {
    let cart = addLine([], products, { ...input, addonIds: ["sorvete", "morangos"], qty: 1 });
    cart = addLine(cart, products, { ...input, addonIds: ["morangos", "sorvete"], qty: 2 });
    expect(cart).toHaveLength(1);
    expect(cart[0]).toMatchObject({ qty: 3, addonIds: ["morangos", "sorvete"] });
  });

  it("combinação diferente vira linha nova", () => {
    let cart = addLine([], products, { ...input, addonIds: ["sorvete"], qty: 1 });
    cart = addLine(cart, products, { ...input, addonIds: [], qty: 1 });
    cart = addLine(cart, products, { ...input, addonIds: ["sorvete", "morangos"], qty: 1 });
    expect(cart.map((l) => l.lineId)).toEqual([
      makeLineId(bolo.id, meio.id, ["sorvete"]),
      makeLineId(bolo.id, meio.id, []),
      makeLineId(bolo.id, meio.id, ["morangos", "sorvete"]),
    ]);
  });

  it("o estoque da variante é compartilhado entre as linhas e nunca é ultrapassado", () => {
    // Meio bolo tem 8 unidades
    let cart = addLine([], products, { ...input, addonIds: ["sorvete"], qty: 6 });
    cart = addLine(cart, products, { ...input, addonIds: [], qty: 5 });
    expect(cartCount(cart)).toBe(8);
    expect(addLine(cart, products, { ...input, addonIds: ["morangos"], qty: 1 })).toBe(cart);
  });

  it("ignora adicionais inexistentes, quantidade inválida e produto desconhecido", () => {
    const cart = addLine([], products, { productId: brownie.id, addonIds: ["fantasma", "sorvete"], qty: 1 });
    expect(cart[0].addonIds).toEqual(["sorvete"]);
    expect(addLine(cart, products, { productId: brownie.id, qty: 0 })).toBe(cart);
    expect(addLine(cart, products, { productId: "nao-existe", qty: 1 })).toBe(cart);
  });

  it("produto sem estoque não entra no carrinho", () => {
    expect(addLine([], products, { productId: "fv-004", qty: 1 })).toEqual([]);
  });
});

describe("barra de frete grátis", () => {
  const frete = { enabled: true, minValue: 8000 };

  it("some com o carrinho vazio ou com o módulo desligado", () => {
    expect(freeShippingProgress(0, 0, frete)).toEqual({ state: "hidden" });
    expect(freeShippingProgress(5000, 2, { enabled: false, minValue: 8000 })).toEqual({ state: "hidden" });
    expect(freeShippingProgress(5000, 2, undefined)).toEqual({ state: "hidden" });
  });

  it("abaixo do mínimo mostra quanto falta", () => {
    expect(freeShippingProgress(5000, 2, frete)).toEqual({ state: "missing", missing: 3000, subtotal: 5000, ratio: 0.625 });
    expect(freeShippingProgress(7999, 1, frete)).toMatchObject({ state: "missing", missing: 1 });
  });

  it("no mínimo (ou acima) vira 'você ganhou frete grátis'", () => {
    expect(freeShippingProgress(8000, 3, frete)).toEqual({ state: "reached", subtotal: 8000, ratio: 1 });
    expect(freeShippingProgress(12000, 3, frete)).toMatchObject({ state: "reached" });
  });
});
