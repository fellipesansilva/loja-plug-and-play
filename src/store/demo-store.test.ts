import { beforeEach, describe, expect, it } from "vitest";
import { getPreset } from "@/presets";
import { useDemoStore } from "./demo-store";

const trama = getPreset("trama-studio")!;
const forno = getPreset("forno-da-vila")!;

beforeEach(() => {
  useDemoStore.getState().applyPreset("trama-studio");
});

describe("demo-store", () => {
  it("começa com o preset padrão (Trama Studio)", () => {
    const s = useDemoStore.getState();
    expect(s.presetId).toBe("trama-studio");
    expect(s.config.name).toBe(trama.config.name);
  });

  it("applyPreset troca config, produtos e pedidos juntos", () => {
    useDemoStore.getState().applyPreset("forno-da-vila");
    const s = useDemoStore.getState();
    expect(s.presetId).toBe("forno-da-vila");
    expect(s.config.name).toBe("Forno da Vila");
    expect(s.config.theme.colors.primary).toBe(forno.config.theme.colors.primary);
    expect(s.config.modules.freteGratis?.minValue).toBe(8000);
    expect(s.products).toEqual(forno.products);
    expect(s.orders).toEqual(forno.orders);
    expect(s.categories).toEqual(forno.categories);
  });

  it("reset restaura o original do preset ativo", () => {
    const st = useDemoStore.getState();
    st.applyPreset("forno-da-vila");
    st.setStoreName("Outro nome");
    st.setThemeColor("primary", "#123456");
    expect(useDemoStore.getState().config.name).toBe("Outro nome");

    useDemoStore.getState().reset();
    const s = useDemoStore.getState();
    expect(s.presetId).toBe("forno-da-vila");
    expect(s.config).toEqual(forno.config);
    expect(s.products).toEqual(forno.products);
  });

  it("alterar o token no store não muta os dados-fonte do preset", () => {
    useDemoStore.getState().setThemeColor("primary", "#123456");
    expect(useDemoStore.getState().config.theme.colors.primary).toBe("#123456");
    expect(trama.config.theme.colors.primary).not.toBe("#123456");
  });
});
