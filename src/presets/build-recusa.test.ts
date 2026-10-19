import { describe, expect, it } from "vitest";
import type { Preset, Testimonial } from "@/domain/types";
import { getPreset } from "./index";
import { assertValidPreset, validatePreset } from "./validate";

// O build recusa preset inválido: o registro valida todos os presets ao carregar (src/presets/index.ts, no servidor), e um preset
// inválido derruba o build com o nome do preset e do campo. Aqui cada caso exigido, com presets montados só para o teste.
const trama = getPreset("trama-studio")!;
const forno = getPreset("forno-da-vila")!;
const arca = getPreset("arca-inflaveis")!;
const com = (p: Preset, mudar: (c: Preset["config"]) => Preset["config"]): Preset => ({ ...p, config: mudar(structuredClone(p.config)) });

describe("o build recusa preset inválido", () => {
  it("os presets do registro são válidos", () => {
    for (const p of [trama, forno, arca]) expect(validatePreset(p), p.id).toEqual([]);
  });

  it("identificação faltando (CNPJ/CPF, endereço, contato)", () => {
    for (const campo of ["name", "document", "address", "email", "phone"] as const) {
      const p = com(trama, (c) => ({ ...c, legal: { ...c.legal, [campo]: "" } }));
      expect(() => assertValidPreset(p), campo).toThrow(new RegExp(`Preset "trama-studio" inválido[\\s\\S]*config\\.legal\\.${campo}`));
    }
  });

  it("troca por defeito abaixo do CDC, art. 26 (90 dias duráveis, 30 não duráveis)", () => {
    expect(() => assertValidPreset(com(trama, (c) => ({ ...c, policies: { ...c.policies, defect: { ...c.policies.defect, days: 89 } } })))).toThrow(/defect\.days[\s\S]*90 dias[\s\S]*art\. 26/);
    expect(() => assertValidPreset(com(forno, (c) => ({ ...c, policies: { ...c.policies, defect: { ...c.policies.defect, days: 29 } } })))).toThrow(/defect\.days[\s\S]*30 dias[\s\S]*art\. 26/);
  });

  it("venda e orçamento juntos", () => {
    const p = com(trama, (c) => ({ ...c, modules: { ...c.modules, orcamento: { enabled: true } } }));
    expect(() => assertValidPreset(p)).toThrow(/não pode ter módulos de venda ligados; desligue: .*cupom/);
    const q = com(arca, (c) => ({ ...c, modules: { ...c.modules, cupom: true } }));
    expect(() => assertValidPreset(q)).toThrow(/não pode ter módulos de venda ligados; desligue: cupom/);
  });

  it("depoimento de cliente real sem autorização", () => {
    const real: Testimonial = { id: "cliente", name: "Cliente Real", city: "Cidade/UF", text: "Texto.", real: true };
    const p = com(trama, (c) => ({
      ...c,
      homeBlocks: c.homeBlocks.map((b) => (b.type === "testimonials" ? { ...b, items: [...b.items.slice(0, 3), real] } : b)),
    }));
    expect(() => assertValidPreset(p)).toThrow(/cliente: depoimento de cliente real só publica com autorizado: true/);
    const ok = com(trama, (c) => ({
      ...c,
      homeBlocks: c.homeBlocks.map((b) => (b.type === "testimonials" ? { ...b, items: [...b.items.slice(0, 3), { ...real, autorizado: true }] } : b)),
    }));
    expect(validatePreset(ok)).toEqual([]);
  });

  it("dependência de módulos (bot sem WhatsApp) e contraste do tema também derrubam o build", () => {
    expect(() => assertValidPreset(com(trama, (c) => ({ ...c, modules: { ...c.modules, whatsapp: false } })))).toThrow(/o módulo bot depende do módulo whatsapp/);
    const escuro = com(trama, (c) => ({ ...c, theme: { ...c.theme, colors: { ...c.theme.colors, primary: "#9aa58a", announcementBg: "#9aa58a", highlightBg: "#9aa58a" } } }));
    expect(() => assertValidPreset(escuro)).toThrow(/themeChoices/);
  });
});
