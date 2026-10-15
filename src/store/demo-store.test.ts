import { beforeEach, describe, expect, it } from "vitest";
import { presets } from "@/presets";
import { createDemoStore } from "./demo-store";

const [trama, forno] = presets;
let store: ReturnType<typeof createDemoStore>;

beforeEach(() => {
  store = createDemoStore(trama.id);
  store.getState().reset();
});

describe("demo-store (um store por preset)", () => {
  it("nasce no preset recebido: config, catálogo, pedidos e cupons", () => {
    const s = store.getState();
    expect(s.presetId).toBe(trama.id);
    expect(s.config).toEqual(trama.config);
    expect(s.products).toEqual(trama.products);
    expect(s.orders).toEqual(trama.orders);
    expect(s.categories).toEqual(trama.categories);
    expect(s.coupons).toEqual(trama.coupons);
    expect(s.cart).toEqual([]);
  });

  it("o store do Forno não carrega nada da Trama", () => {
    const s = createDemoStore(forno.id).getState();
    expect(s.presetId).toBe(forno.id);
    expect(s.config.name).toBe(forno.config.name);
    expect(s.products.map((p) => p.id)).toEqual(forno.products.map((p) => p.id));
  });

  it("não existe troca de preset em tempo de execução", () => {
    expect("applyPreset" in store.getState()).toBe(false);
  });

  it("reset restaura o original do preset desta loja", () => {
    store.getState().setStoreName("Outro nome");
    store.getState().setThemeColor("primary", "#123456");
    expect(store.getState().config.name).toBe("Outro nome");
    store.getState().reset();
    expect(store.getState().config).toEqual(trama.config);
    expect(store.getState().products).toEqual(trama.products);
  });

  it("alterar o token no store não muta os dados-fonte do preset", () => {
    store.getState().setThemeColor("primary", "#123456");
    expect(store.getState().config.theme.colors.primary).toBe("#123456");
    expect(trama.config.theme.colors.primary).not.toBe("#123456");
  });

  it("reset zera o carrinho e as escolhas do checkout", () => {
    const product = trama.products.find((p) => p.stock > 0 && p.variants.length === 0)!;
    store.getState().addToCart({ productId: product.id, qty: 1 });
    store.getState().setCoupon("QUALQUER");
    expect(store.getState().cart).toHaveLength(1);
    store.getState().reset();
    expect(store.getState().cart).toEqual([]);
    expect(store.getState().checkout.couponCode).toBeNull();
  });
});
