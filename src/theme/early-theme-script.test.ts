import vm from "node:vm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ACTIVE_PRESET, ACTIVE_PRESET_ID, presets } from "@/presets";
import { STORAGE_KEY, STORAGE_VERSION } from "@/store/storage-key";
import { EARLY_THEME_SCRIPT } from "./early-theme-script";
import { tokensToCss } from "./tokens";

/** Outro preset (o que NÃO é o desta loja), para testar o link antigo e o estado de outra loja. */
const other = presets.find((p) => p.id !== ACTIVE_PRESET_ID)!;

type Ctx = {
  storage?: { getItem: (k: string) => string | null };
  location?: { search: string; pathname: string; hash: string; origin: string };
};

function run(script: string, ctx: Ctx = {}) {
  const el = { textContent: "original" };
  const replaced: string[] = [];
  vm.runInNewContext(script, {
    localStorage: ctx.storage ?? { getItem: () => null },
    ...(ctx.location
      ? { location: { ...ctx.location, replace: (url: string) => replaced.push(url) } }
      : {}),
    URL,
    URLSearchParams,
    document: { getElementById: (id: string) => (id === "theme-tokens" ? el : null) },
  });
  return { css: el.textContent, replaced };
}

const saved = (presetId: string, version = STORAGE_VERSION) => {
  const theme = presets.find((p) => p.id === presetId)!.config.theme;
  return JSON.stringify({ state: { presetId, config: { theme } }, version });
};

describe("script anti-flash (tokens salvos desta loja)", () => {
  it("reaplica os tokens salvos desta loja antes da primeira pintura", () => {
    const edited = structuredClone(ACTIVE_PRESET.config.theme);
    edited.colors.primary = "#112233";
    const raw = JSON.stringify({ state: { presetId: ACTIVE_PRESET_ID, config: { theme: edited } }, version: STORAGE_VERSION });
    const { css } = run(EARLY_THEME_SCRIPT, { storage: { getItem: (k) => (k === STORAGE_KEY ? raw : null) } });
    expect(css).toBe(tokensToCss(edited));
    expect(css).toContain("--t-color-primary:#112233");
  });

  it("gera o mesmo CSS que tokensToCss para o tema salvo", () => {
    const { css } = run(EARLY_THEME_SCRIPT, { storage: { getItem: (k) => (k === STORAGE_KEY ? saved(ACTIVE_PRESET_ID) : null) } });
    expect(css).toBe(tokensToCss(ACTIVE_PRESET.config.theme));
  });

  it("ignora estado salvo de OUTRO preset e de versão antiga do formato", () => {
    expect(run(EARLY_THEME_SCRIPT, { storage: { getItem: () => saved(other.id) } }).css).toBe("original");
    expect(run(EARLY_THEME_SCRIPT, { storage: { getItem: () => saved(ACTIVE_PRESET_ID, STORAGE_VERSION - 1) } }).css).toBe("original");
  });

  it("não altera nada sem estado salvo ou com localStorage lançando exceção", () => {
    expect(run(EARLY_THEME_SCRIPT, { storage: { getItem: () => null } }).css).toBe("original");
    expect(
      run(EARLY_THEME_SCRIPT, {
        storage: {
          getItem: () => {
            throw new Error("bloqueado");
          },
        },
      }).css,
    ).toBe("original");
    expect(run(EARLY_THEME_SCRIPT, { storage: { getItem: () => "{lixo" } }).css).toBe("original");
  });

  it("a chave do estado é separada por preset", () => {
    expect(STORAGE_KEY).toBe(`loja-demo-v1-${ACTIVE_PRESET.shortId ?? ACTIVE_PRESET.id}`);
    expect(STORAGE_KEY).not.toBe("loja-demo-v1");
  });

  it("nunca esconde a página nem injeta preload (o script não toca em documentElement nem em head)", () => {
    expect(EARLY_THEME_SCRIPT).not.toContain("data-preset-pending");
    expect(EARLY_THEME_SCRIPT).not.toContain("preload");
    expect(EARLY_THEME_SCRIPT).not.toContain("documentElement");
  });
});

describe("link antigo ?preset= (redireciona para a loja do outro preset)", () => {
  const OTHER_URL = "https://loja-outra.example.com";
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  /** Carrega o script com NEXT_PUBLIC_DEMO_URLS definido (a tabela de redirecionamento é montada no import). */
  async function scriptWith(demoUrls: string | undefined) {
    vi.resetModules();
    if (demoUrls === undefined) vi.stubEnv("NEXT_PUBLIC_DEMO_URLS", "");
    else vi.stubEnv("NEXT_PUBLIC_DEMO_URLS", demoUrls);
    return import("./early-theme-script");
  }
  const location = (search: string, extra: Partial<NonNullable<Ctx["location"]>> = {}) => ({
    search,
    pathname: "/",
    hash: "",
    origin: "https://loja-atual.example.com",
    ...extra,
  });
  const urls = () => JSON.stringify({ [other.shortId ?? other.id]: OTHER_URL });

  it("com a URL configurada, ?preset=<outro> (apelido ou id, sem diferenciar maiúsculas) redireciona", async () => {
    const mod = await scriptWith(urls());
    for (const key of [other.shortId, other.id, (other.shortId ?? other.id).toUpperCase()]) {
      const { replaced } = run(mod.EARLY_THEME_SCRIPT, { location: location(`?preset=${key}`) });
      expect(replaced, String(key)).toEqual([`${OTHER_URL}/`]);
    }
  });

  it("mantém o caminho, os demais parâmetros e a âncora; só tira o preset", async () => {
    const mod = await scriptWith(urls());
    const { replaced } = run(mod.EARLY_THEME_SCRIPT, {
      location: location(`?q=pizza&preset=${other.shortId ?? other.id}&ordem=menor-preco`, { pathname: "/busca", hash: "#topo" }),
    });
    expect(replaced).toEqual([`${OTHER_URL}/busca?q=pizza&ordem=menor-preco#topo`]);
  });

  it("sem URL configurada o parâmetro é ignorado (e o resto do script segue)", async () => {
    const mod = await scriptWith(undefined);
    expect(mod.REDIRECT_BY_PRESET).toEqual({});
    const { replaced, css } = run(mod.EARLY_THEME_SCRIPT, {
      location: location(`?preset=${other.shortId ?? other.id}`),
      storage: { getItem: (k) => (k === STORAGE_KEY ? saved(ACTIVE_PRESET_ID) : null) },
    });
    expect(replaced).toEqual([]);
    expect(css).toBe(tokensToCss(ACTIVE_PRESET.config.theme));
  });

  it("?preset= do próprio preset, desconhecido ou vazio não redireciona", async () => {
    const mod = await scriptWith(
      JSON.stringify({ [other.shortId ?? other.id]: OTHER_URL, [ACTIVE_PRESET.shortId ?? ACTIVE_PRESET.id]: "https://esta-loja.example.com" }),
    );
    for (const search of [`?preset=${ACTIVE_PRESET.shortId ?? ACTIVE_PRESET.id}`, "?preset=orbita", "?preset=", "", "?outro=1"]) {
      expect(run(mod.EARLY_THEME_SCRIPT, { location: location(search) }).replaced, search).toEqual([]);
    }
  });

  it("nunca redireciona para a própria origem (evita laço)", async () => {
    const mod = await scriptWith(JSON.stringify({ [other.shortId ?? other.id]: "https://loja-atual.example.com" }));
    expect(run(mod.EARLY_THEME_SCRIPT, { location: location(`?preset=${other.shortId ?? other.id}`) }).replaced).toEqual([]);
  });

  it("a tabela só tem presets que não são o desta loja", async () => {
    const mod = await scriptWith(
      JSON.stringify({ [other.shortId ?? other.id]: OTHER_URL, [ACTIVE_PRESET.shortId ?? ACTIVE_PRESET.id]: "https://esta-loja.example.com" }),
    );
    expect(Object.keys(mod.REDIRECT_BY_PRESET).sort()).toEqual([other.id, ...(other.shortId ? [other.shortId] : [])].sort());
  });
});
