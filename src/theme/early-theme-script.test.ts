import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { presets } from "@/presets";
import { STORAGE_VERSION, storageKeyFor } from "@/store/storage-key";
import { earlyThemeScript } from "./early-theme-script";
import { tokensToCss } from "./tokens";

const [trama, forno] = presets;
const KEY = storageKeyFor(trama.shortId);
const SCRIPT = earlyThemeScript(trama.id);

function run(script: string, storage: { getItem: (k: string) => string | null }) {
  const el = { textContent: "original" };
  vm.runInNewContext(script, {
    localStorage: storage,
    document: { getElementById: (id: string) => (id === "theme-tokens" ? el : null) },
  });
  return el.textContent;
}

const saved = (presetId: string, version = STORAGE_VERSION) => {
  const theme = presets.find((p) => p.id === presetId)!.config.theme;
  return JSON.stringify({ state: { presetId, config: { theme } }, version });
};
const only = (raw: string) => ({ getItem: (k: string) => (k === KEY ? raw : null) });

describe("script anti-flash (tokens salvos desta loja)", () => {
  it("reaplica os tokens salvos desta loja antes da primeira pintura", () => {
    const edited = structuredClone(trama.config.theme);
    edited.colors.primary = "#112233";
    const raw = JSON.stringify({ state: { presetId: trama.id, config: { theme: edited } }, version: STORAGE_VERSION });
    const css = run(SCRIPT, only(raw));
    expect(css).toBe(tokensToCss(edited));
    expect(css).toContain("--t-color-primary:#112233");
  });

  it("gera o mesmo CSS que tokensToCss para o tema salvo", () => {
    expect(run(SCRIPT, only(saved(trama.id)))).toBe(tokensToCss(trama.config.theme));
  });

  it("ignora estado salvo de OUTRO preset e de versão antiga do formato", () => {
    expect(run(SCRIPT, { getItem: () => saved(forno.id) })).toBe("original");
    expect(run(SCRIPT, { getItem: () => saved(trama.id, STORAGE_VERSION - 1) })).toBe("original");
  });

  it("não altera nada sem estado salvo ou com localStorage lançando exceção", () => {
    expect(run(SCRIPT, { getItem: () => null })).toBe("original");
    expect(
      run(SCRIPT, {
        getItem: () => {
          throw new Error("bloqueado");
        },
      }),
    ).toBe("original");
    expect(run(SCRIPT, { getItem: () => "{lixo" })).toBe("original");
  });

  it("lê a chave da própria loja, nunca a de outra", () => {
    expect(KEY).toBe("loja-demo-v1-trama");
    expect(SCRIPT).toContain(JSON.stringify(KEY));
    expect(earlyThemeScript(forno.id)).toContain('"loja-demo-v1-forno"');
  });

  it("nunca esconde a página, redireciona nem injeta preload", () => {
    for (const s of [SCRIPT, earlyThemeScript(forno.id)]) {
      expect(s).not.toContain("data-preset-pending");
      expect(s).not.toContain("preload");
      expect(s).not.toContain("documentElement");
      expect(s).not.toContain("location");
    }
  });
});
