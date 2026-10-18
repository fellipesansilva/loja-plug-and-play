import { describe, expect, it } from "vitest";
import { getPreset } from "@/presets";
import { quoteSalesConflict } from "@/presets/validate";
import { MODULE_DEPENDS_ON, dependentsOf, isModuleOn, toggleModule, validateConfig, withModule } from "./modules";

const trama = getPreset("trama-studio")!;
const forno = getPreset("forno-da-vila")!;
const arca = getPreset("arca-inflaveis")!;

describe("módulos: dependência", () => {
  it("parcelamento depende de cartão; ao ligar parcelamento sem cartão, liga o cartão junto e avisa", () => {
    expect(MODULE_DEPENDS_ON.parcelamento).toEqual(["cartao"]);
    expect(dependentsOf("cartao")).toEqual(["parcelamento"]);
    // Forno: cartão ligado, parcelamento desligado. Tira o cartão e liga o parcelamento de novo.
    const semCartao = toggleModule(forno, forno.config, "cartao", false);
    expect(semCartao.ok).toBe(true);
    if (!semCartao.ok) return;
    expect(isModuleOn(semCartao.modules, "cartao")).toBe(false);
    const cfg = { ...forno.config, modules: semCartao.modules };
    const liga = toggleModule(forno, cfg, "parcelamento", true);
    expect(liga.ok).toBe(true);
    if (!liga.ok) return;
    expect(isModuleOn(liga.modules, "cartao")).toBe(true);
    expect(isModuleOn(liga.modules, "parcelamento")).toBe(true);
    expect(liga.notes).toEqual(["Cartão de crédito foi ligado junto: Parcelamento depende dele."]);
  });

  it("ao desligar o cartão, desliga o parcelamento que depende dele e avisa; as parcelas do preset ficam guardadas", () => {
    const r = toggleModule(trama, trama.config, "cartao", false);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(isModuleOn(r.modules, "cartao")).toBe(false);
    expect(isModuleOn(r.modules, "parcelamento")).toBe(false);
    expect(r.modules.parcelamento?.maxInstallments).toBe(6);
    expect(r.notes).toEqual(["Parcelamento foi desligado junto: depende de Cartão de crédito."]);
  });

  it("ligar e desligar mantém o resto da configuração do módulo (valor mínimo, percentual)", () => {
    const m = withModule(withModule(trama.config.modules, "descontoPix", false), "descontoPix", true);
    expect(m.descontoPix).toEqual({ enabled: true, percent: 5 });
    expect(withModule(trama.config.modules, "freteGratis", false).freteGratis).toEqual({ enabled: false, minValue: 19900 });
    expect(toggleModule(trama, trama.config, "cupom", true)).toMatchObject({ ok: true, notes: [] }); // já ligado: nada muda
  });
});

describe("módulos: exclusão entre venda e orçamento (a regra do build)", () => {
  it("loja em orçamento (Arca) não aceita ligar módulo de venda: bloqueia com a mensagem do build", () => {
    const r = toggleModule(arca, arca.config, "cupom", true);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatch(/modo orçamento, que não pode ter módulos de venda ligados/);
    expect(r.problems[0]).toBe(quoteSalesConflict(withModule(arca.config.modules, "cupom", true)));
    expect(r.problems[0]).toContain("não pode ter módulos de venda ligados; desligue: cupom");
    expect(r.modules).toBe(arca.config.modules); // nada foi alterado
  });

  it("loja de venda (Trama) não liga o modo orçamento enquanto houver módulo de venda ligado", () => {
    const r = toggleModule(trama, trama.config, "orcamento", true);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain("O modo orçamento não pode ficar ligado junto com módulos de venda");
    expect(r.error).toContain("Frete grátis");
    expect(r.error).toContain("Cupom de desconto");
  });

  it("a regra do painel é a mesma do build: validateConfig recusa a combinação que derruba o build", () => {
    const venda = { ...arca.config, modules: withModule(arca.config.modules, "boleto", true) };
    expect(validateConfig(arca, venda).join()).toContain("loja em orçamento (orcamento.enabled) não pode ter módulos de venda ligados");
    expect(validateConfig(arca, arca.config)).toEqual([]);
  });

  it("tirar o modo orçamento da Arca é bloqueado pela validação do build (faltam as políticas de venda)", () => {
    const r = toggleModule(arca, arca.config, "orcamento", false);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain("validação do build");
    expect(r.problems.join()).toContain("config.policies.regretDays");
  });

  it("módulos de venda ligam e desligam livremente numa loja de venda, sem problemas na validação", () => {
    let cfg = trama.config;
    for (const key of ["cupom", "boleto", "descontoPix", "freteGratis"] as const) {
      const r = toggleModule(trama, cfg, key, false);
      expect(r.ok, key).toBe(true);
      if (r.ok) cfg = { ...cfg, modules: r.modules };
    }
    expect(validateConfig(trama, cfg)).toEqual([]);
  });
});

describe("prazo de troca por defeito (CDC art. 26), a mesma validação do build", () => {
  const com = (preset: typeof trama, days: number) => ({ ...preset.config, policies: { ...preset.config.policies, defect: { ...preset.config.policies.defect, days } } });

  it("produto durável: mínimo de 90 dias; 89 reprova e 90 aprova", () => {
    expect(validateConfig(trama, com(trama, 89)).join()).toMatch(/defect\.days[\s\S]*90 dias[\s\S]*durável[\s\S]*art\. 26/);
    expect(validateConfig(trama, com(trama, 90))).toEqual([]);
  });

  it("produto não durável (Forno): mínimo de 30 dias; 29 reprova e 30 aprova", () => {
    expect(validateConfig(forno, com(forno, 29)).join()).toMatch(/defect\.days[\s\S]*30 dias[\s\S]*não durável/);
    expect(validateConfig(forno, com(forno, 30))).toEqual([]);
  });

  it("prazo que não é inteiro reprova", () => {
    expect(validateConfig(trama, com(trama, 90.5)).join()).toContain("defect.days");
  });
});
