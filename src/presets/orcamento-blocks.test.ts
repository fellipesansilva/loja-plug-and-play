import { describe, expect, it } from "vitest";
import type { Preset } from "@/domain/types";
import { presets } from "./index";
import { validatePreset } from "./validate";

const arca = presets.find((p) => p.id === "arca-inflaveis")!;
const clone = (p: Preset): Preset => structuredClone(p);

describe("ferramentas do orçamento (config.orcamentoBlocks)", () => {
  it("ligadas só na Arca; Trama e Forno sem o bloco", () => {
    expect(arca.config.orcamentoBlocks?.ativos).toBe(true);
    for (const p of presets.filter((x) => x.id !== arca.id)) {
      expect(p.config.orcamentoBlocks?.ativos, p.id).not.toBe(true);
      expect(p.config.orcamentoBlocks, p.id).toBeUndefined();
    }
  });

  it("a Arca valida: produtos-alvo existem, paleta e capacidades coerentes", () => {
    expect(validatePreset(arca)).toEqual([]);
    const o = arca.config.orcamentoBlocks!;
    const ids = new Set(arca.products.map((p) => p.id));
    expect(ids.has(o.porticoConfigurador!.alvoProduto)).toBe(true);
    expect(ids.has(o.dimensionador!.fechado.produto)).toBe(true);
    expect(ids.has(o.dimensionador!.aberto.produto)).toBe(true);
    expect(arca.products.find((p) => p.id === o.porticoConfigurador!.alvoProduto)!.name).toBe("Pórtico Inflável");
  });

  it("dados inválidos derrubam a validação com o campo no aviso", () => {
    const p = clone(arca);
    p.config.orcamentoBlocks!.porticoConfigurador!.alvoProduto = "nao-existe";
    expect(validatePreset(p).join()).toContain("porticoConfigurador.alvoProduto");
    const q = clone(arca);
    q.config.orcamentoBlocks!.porticoConfigurador!.paleta[0].valor = "azul";
    expect(validatePreset(q).join()).toContain("porticoConfigurador.paleta");
    const r = clone(arca);
    r.config.orcamentoBlocks!.dimensionador!.fechado.capacidades = [5000, 1000];
    expect(validatePreset(r).join()).toContain("fechado.capacidades");
    const s = clone(arca);
    s.config.orcamentoBlocks!.dimensionador!.diasMax = 1;
    expect(validatePreset(s).join()).toContain("dimensionador.dias");
    const t = clone(arca);
    t.config.orcamentoBlocks!.porticoConfigurador!.textoMax = 0;
    expect(validatePreset(t).join()).toContain("textoMax");
  });

  it("loja de venda não pode ligar as ferramentas", () => {
    const forno = clone(presets.find((p) => p.id === "forno-da-vila")!);
    forno.config.orcamentoBlocks = structuredClone(arca.config.orcamentoBlocks);
    expect(validatePreset(forno).join()).toContain("config.orcamentoBlocks");
  });
});
