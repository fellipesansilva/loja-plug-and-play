import { describe, expect, it } from "vitest";
import { getPreset } from "@/presets";
import { validateConfig } from "./modules";
import { CONFIG_VERSION, applyOverrides, configKeyFor, defaultThemeIds, describeContrastIssue, emptyOverrides, migrateOverrides, themeContrastIssues, themeWithChoice } from "./store-config";

const trama = getPreset("trama-studio")!;
const forno = getPreset("forno-da-vila")!;
const arca = getPreset("arca-inflaveis")!;

describe("configuração salva: chave e migração", () => {
  it("a chave é por preset e nova (separada do estado de demonstração)", () => {
    expect(configKeyFor("forno")).toBe("loja-config-v1-forno");
    expect(configKeyFor("arca")).not.toBe(configKeyFor("trama"));
  });

  it("v1 (só cores hexadecimais) → v2: cores viram ids da paleta aprovada, fontes ficam no padrão do preset, publicação vazia", () => {
    const v1 = { version: 1, theme: { primary: "#2F3430", accent: "#b8863b" } };
    const v2 = migrateOverrides(v1, trama.config.themeChoices)!;
    expect(v2.version).toBe(CONFIG_VERSION);
    expect(v2.theme).toEqual({ primary: "grafite", accent: "ocre", headingFont: "bodoni-moda", bodyFont: "manrope" });
    expect(v2.modules).toBeUndefined();
    expect(v2.loja).toBeUndefined();
    expect(v2.publicada).toBeNull();
  });

  it("v1 com cor fora da paleta: a cor é descartada e a outra se mantém; sem nenhuma cor aprovada, não há tema", () => {
    const meio = migrateOverrides({ version: 1, theme: { primary: "#123456", accent: "#a68a64" } }, trama.config.themeChoices)!;
    expect(meio.theme).toMatchObject({ primary: "oliva", accent: "areia" });
    expect(migrateOverrides({ version: 1, theme: { primary: "#123456", accent: "#654321" } }, trama.config.themeChoices)!.theme).toBeUndefined();
    expect(migrateOverrides({ version: 1 }, trama.config.themeChoices)).toEqual(emptyOverrides());
  });

  it("v2 passa como está; versão desconhecida ou formato inválido vira null (a loja usa o preset)", () => {
    const v2 = { version: 2, theme: { primary: "vinho", accent: "ocre", headingFont: "manrope", bodyFont: "manrope" }, publicada: { at: "2026-10-18T12:00:00.000Z" }, policies: { defectDays: 120 } };
    expect(migrateOverrides(v2, trama.config.themeChoices)).toEqual({ version: 2, theme: v2.theme, publicada: v2.publicada, policies: { defectDays: 120 } });
    expect(migrateOverrides({ version: 3 }, trama.config.themeChoices)).toBeNull();
    expect(migrateOverrides("lixo", trama.config.themeChoices)).toBeNull();
    expect(migrateOverrides(null, trama.config.themeChoices)).toBeNull();
    expect(migrateOverrides({ version: 2, theme: { primary: 1 } }, trama.config.themeChoices)!.theme).toBeUndefined();
  });
});

describe("tema por paleta aprovada", () => {
  it("o tema padrão de cada preset está na paleta e passa no contraste (4,5:1)", () => {
    for (const p of [trama, forno, arca]) {
      expect(themeContrastIssues(p.config, defaultThemeIds(p.config)), p.id).toEqual([]);
      expect(themeWithChoice(p.config, defaultThemeIds(p.config)), p.id).toEqual(p.config.theme);
    }
  });

  it("trocar a cor principal acompanha os tokens que repetem a cor no preset (faixa de aviso, selos) e as fontes trocam por id", () => {
    const t = themeWithChoice(trama.config, { primary: "vinho", accent: "ocre", headingFont: "manrope", bodyFont: "manrope" });
    expect(t.colors.primary).toBe("#6e2f3a");
    expect(t.colors.announcementBg).toBe("#6e2f3a");
    expect(t.colors.highlightBg).toBe("#6e2f3a");
    expect(t.colors.secondary).toBe("#b8863b");
    expect(t.colors.background).toBe(trama.config.theme.colors.background);
    expect(t.fonts.heading).toContain("--font-manrope");
    // Forno: a faixa de aviso e os selos repetem a cor de destaque
    const f = themeWithChoice(forno.config, { primary: "castanha", accent: "creme", headingFont: "bricolage", bodyFont: "manrope" });
    expect(f.colors.announcementBg).toBe("#ffd98a");
    expect(f.colors.primary).toBe("#7a2e12");
  });

  it("id fora da paleta é ignorado: nunca entra cor livre nem fonte não aprovada", () => {
    const t = themeWithChoice(trama.config, { primary: "#ff00ff", accent: "x", headingFont: "comic-sans", bodyFont: "y" });
    expect(t).toEqual(trama.config.theme);
  });

  it("combinação reprovada no contraste é detectada, com o motivo legível", () => {
    const issues = themeContrastIssues(arca.config, { ...defaultThemeIds(arca.config), accent: "azul" });
    expect(issues.map((i) => `${i.fg}/${i.bg}`).sort()).toEqual(["highlightText/highlightBg", "secondary/primary", "text/secondary"]);
    expect(describeContrastIssue(issues.find((i) => i.fg === "secondary")!)).toMatch(/Contraste de 1,66:1 entre cor de destaque e cor principal; o mínimo é 4,5:1\./);
    expect(themeContrastIssues(trama.config, { ...defaultThemeIds(trama.config), accent: "cafe" }).map((i) => i.fg)).toEqual(["text"]);
  });
});

describe("aplicar a configuração salva sobre a loja", () => {
  it("sem nada salvo, a configuração é a mesma (a loja não muda)", () => {
    for (const p of [trama, forno, arca]) expect(applyOverrides(p, p.config, emptyOverrides())).toEqual(p.config);
  });

  it("dados da loja: campo vazio não vai para a vitrine; no modo estrito (publicação) continua vazio e a validação do build o aponta", () => {
    const ov = { ...emptyOverrides(), loja: { name: "Trama Nova", legalName: "", document: "", address: "Rua Nova, 1", email: "a@b.com", phone: "(11) 1111-1111" } };
    const vitrine = applyOverrides(trama, trama.config, ov);
    expect(vitrine.name).toBe("Trama Nova");
    expect(vitrine.legal.document).toBe(trama.config.legal.document);
    expect(validateConfig(trama, vitrine)).toEqual([]);
    const estrito = applyOverrides(trama, trama.config, ov, { strict: true });
    const problemas = validateConfig(trama, estrito).join("\n");
    expect(problemas).toContain("config.legal.document: informe o CNPJ ou CPF");
    expect(problemas).toContain("config.legal.name");
    expect(problemas).not.toContain("config.legal.address");
  });

  it("prazo de troca salvo entra na configuração; módulos substituem os do preset", () => {
    const ov = { ...emptyOverrides(), policies: { defectDays: 120 }, modules: { ...trama.config.modules, descontoPix: { enabled: true, percent: 8 } } };
    const cfg = applyOverrides(trama, trama.config, ov);
    expect(cfg.policies.defect.days).toBe(120);
    expect(cfg.modules.descontoPix).toEqual({ enabled: true, percent: 8 });
    expect(trama.config.policies.defect.days).not.toBe(120); // o preset não é alterado
  });
});
