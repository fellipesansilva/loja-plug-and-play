import { describe, expect, it } from "vitest";
import { MIN_REGRET_DAYS, type Preset } from "@/domain/types";
import { presets } from "./index";
import { assertValidPreset, validatePreset } from "./validate";

const clone = (p: Preset): Preset => structuredClone(p);
const LEGAL_KEYS = ["name", "document", "address", "email", "phone"] as const;

describe.each(presets.map((p) => [p.id, p] as const))("conformidade do preset %s", (_id, preset) => {
  it("passa na validação (os presets do registro já são validados ao carregar)", () => {
    expect(validatePreset(preset)).toEqual([]);
  });

  it("H1 · tem os 5 dados de identificação", () => {
    for (const key of LEGAL_KEYS) expect(preset.config.legal[key].trim().length, key).toBeGreaterThan(0);
  });

  it("H1 · sem cada um dos dados de identificação a validação falha, dizendo o campo", () => {
    for (const key of LEGAL_KEYS) {
      const bad = clone(preset);
      bad.config.legal[key] = "";
      expect(validatePreset(bad).join("\n"), key).toContain(`config.legal.${key}`);
      expect(() => assertValidPreset(bad)).toThrow(new RegExp(`${preset.id}[\\s\\S]*config\\.legal\\.${key}`));
    }
  });

  it("H1 · um preset de teste sem CNPJ derruba o build", () => {
    const bad = clone(preset);
    bad.config.legal.document = "   ";
    expect(() => assertValidPreset(bad)).toThrow(/config\.legal\.document/);
  });

  it.skipIf(preset.config.modules.orcamento?.enabled === true)("H2 · arrependimento de 5 dias derruba o build; 7 ou mais passam", () => {
    const bad = clone(preset);
    bad.config.policies.regretDays = 5;
    expect(() => assertValidPreset(bad)).toThrow(/regretDays[\s\S]*7 dias/);
    bad.config.policies.regretDays = 6.5;
    expect(validatePreset(bad).join()).toContain("regretDays");
    bad.config.policies.regretDays = MIN_REGRET_DAYS;
    expect(validatePreset(bad)).toEqual([]);
    bad.config.policies.regretDays = 14;
    expect(validatePreset(bad)).toEqual([]);
  });

  it("defeito · prazo abaixo do CDC (art. 26) derruba o build; no mínimo passa", () => {
    const bad = clone(preset);
    const { defect } = bad.config.policies;
    defect.durability = "nonDurable";
    defect.days = 7;
    expect(() => assertValidPreset(bad)).toThrow(/defect\.days[\s\S]*30 dias[\s\S]*não durável/);
    defect.days = 30;
    expect(validatePreset(bad)).toEqual([]);
    defect.durability = "durable";
    defect.days = 30;
    expect(() => assertValidPreset(bad)).toThrow(/defect\.days[\s\S]*90 dias[\s\S]*durável/);
    defect.days = 89;
    expect(validatePreset(bad).join()).toContain("defect.days");
    defect.days = 90;
    expect(validatePreset(bad)).toEqual([]);
    defect.days = 120;
    expect(validatePreset(bad)).toEqual([]);
  });

  it("defeito · sem declarar durável/não durável o build falha", () => {
    const bad = clone(preset);
    delete (bad.config.policies.defect as { durability?: string }).durability;
    expect(validatePreset(bad).join()).toContain("defect.durability");
  });

  it("H2 · produto digital exige o texto sobre produto digital", () => {
    const bad = clone(preset);
    bad.products[0].type = "digital";
    delete bad.config.policies.digital;
    expect(() => assertValidPreset(bad)).toThrow(/config\.policies\.digital/);
  });

  it("H4 · as 6 seções da privacidade são obrigatórias", () => {
    for (const key of ["dataCollected", "purpose", "retention", "sharing", "rights", "controller"] as const) {
      const bad = clone(preset);
      const privacy = bad.config.policies.privacy as unknown as Record<string, unknown>;
      privacy[key] = Array.isArray(privacy[key]) ? [] : key === "controller" ? { name: "", email: "" } : "";
      expect(validatePreset(bad).join(), key).toContain(`privacy.${key}`);
    }
  });

  it("H5 · o aviso de cookies tem texto e versão", () => {
    const bad = clone(preset);
    bad.config.policies.cookies.version = "";
    expect(validatePreset(bad).join()).toContain("policies.cookies");
  });
});
