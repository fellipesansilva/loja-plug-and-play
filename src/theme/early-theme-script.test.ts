import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { getPreset } from "@/presets";
import { STORAGE_KEY, STORAGE_VERSION } from "@/store/storage-key";
import { EARLY_THEME_SCRIPT } from "./early-theme-script";
import { tokensToCss } from "./tokens";

function run(storage: { getItem: (k: string) => string | null }) {
  const el = { textContent: "original" };
  vm.runInNewContext(EARLY_THEME_SCRIPT, {
    localStorage: storage,
    document: { getElementById: (id: string) => (id === "theme-tokens" ? el : null) },
  });
  return el.textContent;
}

describe("early theme script", () => {
  it("gera o mesmo CSS que tokensToCss para o tema salvo", () => {
    const theme = getPreset("forno-da-vila")!.config.theme;
    const saved = JSON.stringify({ state: { config: { theme } }, version: STORAGE_VERSION });
    const css = run({ getItem: (k) => (k === STORAGE_KEY ? saved : null) });
    expect(css).toBe(tokensToCss(theme));
  });

  it("não altera nada sem estado salvo ou com localStorage lançando exceção", () => {
    expect(run({ getItem: () => null })).toBe("original");
    expect(run({ getItem: () => { throw new Error("bloqueado"); } })).toBe("original");
    expect(run({ getItem: () => "{lixo" })).toBe("original");
  });

  describe("link direto ?preset=", () => {
    function runWith(search: string, storage: { getItem: (k: string) => string | null } = { getItem: () => null }) {
      const el = { textContent: "original" };
      const attrs: Record<string, string> = {};
      vm.runInNewContext(EARLY_THEME_SCRIPT, {
        location: { search },
        localStorage: storage,
        setTimeout: () => 0,
        document: {
          getElementById: (id: string) => (id === "theme-tokens" ? el : null),
          documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v), removeAttribute: (k: string) => delete attrs[k] },
        },
      });
      return { css: el.textContent, attrs };
    }

    it("aplica os tokens do preset pedido (apelido ou id) e esconde a página até a troca", () => {
      const forno = getPreset("forno-da-vila")!.config.theme;
      for (const q of ["?preset=forno", "?preset=forno-da-vila", "?a=1&preset=FORNO"]) {
        const { css, attrs } = runWith(q);
        expect(css, q).toBe(tokensToCss(forno));
        expect(attrs).toHaveProperty("data-preset-pending");
      }
    });

    it("o parâmetro vale mais do que o preset salvo", () => {
      const trama = getPreset("trama-studio")!.config.theme;
      const saved = JSON.stringify({ state: { config: { theme: trama } }, version: STORAGE_VERSION });
      const { css } = runWith("?preset=forno", { getItem: (k) => (k === STORAGE_KEY ? saved : null) });
      expect(css).toBe(tokensToCss(getPreset("forno-da-vila")!.config.theme));
    });

    it("id desconhecido é ignorado: segue o preset salvo e a página não é escondida", () => {
      const forno = getPreset("forno-da-vila")!.config.theme;
      const saved = JSON.stringify({ state: { config: { theme: forno } }, version: STORAGE_VERSION });
      const { css, attrs } = runWith("?preset=orbita", { getItem: (k) => (k === STORAGE_KEY ? saved : null) });
      expect(css).toBe(tokensToCss(forno));
      expect(attrs).not.toHaveProperty("data-preset-pending");
      expect(runWith("?preset=orbita").css).toBe("original");
    });
  });

  describe("preset salvo diferente do padrão", () => {
    function runSaved(presetId: string, search = "") {
      const theme = getPreset(presetId)!.config.theme;
      const saved = JSON.stringify({ state: { presetId, config: { theme } }, version: STORAGE_VERSION });
      const el = { textContent: "original" };
      const attrs: Record<string, string> = {};
      vm.runInNewContext(EARLY_THEME_SCRIPT, {
        location: { search },
        localStorage: { getItem: (k: string) => (k === STORAGE_KEY ? saved : null) },
        setTimeout: () => 0,
        document: {
          getElementById: (id: string) => (id === "theme-tokens" ? el : null),
          documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v), removeAttribute: (k: string) => delete attrs[k] },
        },
      });
      return { css: el.textContent, attrs };
    }

    it("Forno salvo: tokens do Forno e página escondida até a vitrine aplicar o preset", () => {
      const { css, attrs } = runSaved("forno-da-vila");
      expect(css).toBe(tokensToCss(getPreset("forno-da-vila")!.config.theme));
      expect(attrs).toHaveProperty("data-preset-pending");
    });

    it("preset padrão salvo (ou nada salvo): nada é escondido", () => {
      expect(runSaved("trama-studio").attrs).not.toHaveProperty("data-preset-pending");
    });

    it("?preset= continua mandando mais do que o salvo", () => {
      const { css } = runSaved("trama-studio", "?preset=forno");
      expect(css).toBe(tokensToCss(getPreset("forno-da-vila")!.config.theme));
    });
  });
});
