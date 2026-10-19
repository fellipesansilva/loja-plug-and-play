import { describe, expect, it } from "vitest";
import { presets } from "@/presets";
import { assertValidPreset, validatePreset } from "@/presets/validate";
import { contrastRatio, demoButtonIssues, demoButtonTextKey, MIN_TEXT_CONTRAST } from "./contrast";

const get = (id: string) => presets.find((p) => p.id === id)!;
const orbita = get("orbita");

describe("botão Demo: cor do texto sobre a cor de destaque", () => {
  it("escolhe `text` ou `background`, o de maior contraste sobre `secondary`", () => {
    const base = get("trama-studio").config.theme.colors;
    expect(demoButtonTextKey({ ...base, secondary: "#a68a64" })).toBe("text"); // tema claro: texto escuro sobre o destaque
    expect(demoButtonTextKey({ ...orbita.config.theme.colors })).toBe("background"); // tema escuro com destaque claro: texto escuro
    // empate e cores que não são hexadecimais: `text`
    expect(demoButtonTextKey({ ...base, text: "#000000", background: "#000000" })).toBe("text");
    expect(demoButtonTextKey({ ...base, secondary: "var(--x)" })).toBe("text");
  });

  it("as lojas de tema claro seguem com `text` (a mesma cor de antes: nenhum pixel muda)", () => {
    for (const id of ["trama-studio", "forno-da-vila", "arca-inflaveis", "faisca"]) expect(demoButtonTextKey(get(id).config.theme.colors), id).toBe("text");
  });

  it("o botão antigo (sempre `text`) reprovaria a Órbita; a escolha nova passa em todas as opções de destaque de todas as lojas", () => {
    const antigo = demoButtonIssues(orbita.config.theme.colors, "text");
    expect(antigo).toHaveLength(1);
    expect(antigo[0].ratio).toBeCloseTo(1.56, 1);
    for (const p of presets) {
      const colors = p.config.theme.colors;
      const accents = [{ id: "tema", value: colors.secondary }, ...(p.config.themeChoices?.accent ?? [])];
      for (const a of accents) {
        const c = { ...colors, secondary: a.value };
        const key = demoButtonTextKey(c);
        expect(contrastRatio(c[key], a.value), `${p.id} · ${a.id}`).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
        expect(demoButtonIssues(c), `${p.id} · ${a.id}`).toEqual([]);
      }
    }
  });

  it("a Órbita escolhe o texto escuro (10,7:1 no âmbar) e as opções limão, rosa e céu passam", () => {
    const c = orbita.config.theme.colors;
    expect(contrastRatio(c.background, c.secondary)).toBeGreaterThan(10);
    for (const id of ["limao", "rosa", "ceu"]) {
      const a = orbita.config.themeChoices!.accent.find((x) => x.id === id)!;
      const cc = { ...c, secondary: a.value };
      expect(demoButtonTextKey(cc)).toBe("background");
      expect(contrastRatio(cc.background, a.value), id).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    }
  });
});

describe("a validação do build confere o par do botão Demo em todos os presets", () => {
  it("todos os presets do registro passam", () => {
    for (const p of presets) expect(validatePreset(p), p.id).toEqual([]);
  });

  it("recusa um destaque aprovado em que nem `text` nem `background` chegam a 4,5:1", () => {
    // cinza médio: o contraste com o texto claro e com o fundo escuro fica abaixo de 4,5:1
    const ruim = { ...orbita, config: { ...orbita.config, themeChoices: { ...orbita.config.themeChoices!, accent: [...orbita.config.themeChoices!.accent, { id: "cinza", label: "Cinza", value: "#6b7280" }] } } };
    expect(() => assertValidPreset(ruim)).toThrow(/config\.themeChoices\.accent\.cinza[\s\S]*botão Demo[\s\S]*abaixo de 4\.5:1/);
  });

  it("recusa o tema do próprio preset com destaque que reprova o botão", () => {
    const ruim = { ...orbita, config: { ...orbita.config, theme: { ...orbita.config.theme, colors: { ...orbita.config.theme.colors, secondary: "#6b7280" } } } };
    expect(validatePreset(ruim).some((p) => /accent\.tema.*botão Demo/.test(p))).toBe(true);
  });

  it("a guarda funciona: com o botão antigo (sempre `text`) a Órbita teria reprovado o build", () => {
    const antigo = orbita.config.themeChoices!.accent.flatMap((a) => demoButtonIssues({ ...orbita.config.theme.colors, secondary: a.value }, "text"));
    expect(antigo.length).toBe(orbita.config.themeChoices!.accent.length); // as quatro opções da Órbita reprovavam
  });
});
