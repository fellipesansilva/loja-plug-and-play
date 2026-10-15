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
});
