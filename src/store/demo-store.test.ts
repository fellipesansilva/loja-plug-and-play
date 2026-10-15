import { beforeEach, describe, expect, it } from "vitest";
import { ACTIVE_PRESET, ACTIVE_PRESET_ID } from "@/presets";
import { useDemoStore } from "./demo-store";

beforeEach(() => {
  useDemoStore.getState().reset();
});

describe("demo-store (cada build é de um preset só)", () => {
  it("nasce no preset do build: config, catálogo, pedidos e cupons", () => {
    const s = useDemoStore.getState();
    expect(s.presetId).toBe(ACTIVE_PRESET_ID);
    expect(s.config).toEqual(ACTIVE_PRESET.config);
    expect(s.products).toEqual(ACTIVE_PRESET.products);
    expect(s.orders).toEqual(ACTIVE_PRESET.orders);
    expect(s.categories).toEqual(ACTIVE_PRESET.categories);
    expect(s.coupons).toEqual(ACTIVE_PRESET.coupons);
    expect(s.cart).toEqual([]);
  });

  it("não existe troca de preset em tempo de execução", () => {
    expect("applyPreset" in useDemoStore.getState()).toBe(false);
  });

  it("reset restaura o original do preset desta loja", () => {
    const st = useDemoStore.getState();
    st.setStoreName("Outro nome");
    st.setThemeColor("primary", "#123456");
    expect(useDemoStore.getState().config.name).toBe("Outro nome");

    useDemoStore.getState().reset();
    const s = useDemoStore.getState();
    expect(s.presetId).toBe(ACTIVE_PRESET_ID);
    expect(s.config).toEqual(ACTIVE_PRESET.config);
    expect(s.products).toEqual(ACTIVE_PRESET.products);
  });

  it("alterar o token no store não muta os dados-fonte do preset", () => {
    useDemoStore.getState().setThemeColor("primary", "#123456");
    expect(useDemoStore.getState().config.theme.colors.primary).toBe("#123456");
    expect(ACTIVE_PRESET.config.theme.colors.primary).not.toBe("#123456");
  });

  it("reset zera o carrinho e as escolhas do checkout", () => {
    const product = ACTIVE_PRESET.products.find((p) => p.stock > 0 && p.variants.length === 0)!;
    const st = useDemoStore.getState();
    st.addToCart({ productId: product.id, qty: 1 });
    st.setCoupon("QUALQUER");
    expect(useDemoStore.getState().cart).toHaveLength(1);
    useDemoStore.getState().reset();
    expect(useDemoStore.getState().cart).toEqual([]);
    expect(useDemoStore.getState().checkout.couponCode).toBeNull();
  });
});
