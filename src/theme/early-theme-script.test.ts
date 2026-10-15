import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { getPreset } from "@/presets";
import { STORAGE_KEY, STORAGE_VERSION } from "@/store/storage-key";
import { EARLY_THEME_SCRIPT } from "./early-theme-script";
import { toSrcSet } from "@/lib/image-sources";
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

  describe("preload da foto principal da home", () => {
    type Link = { rel?: string; as?: string; href?: string; type?: string; media?: string; attrs: Record<string, string> };
    function run(opts: { search?: string; pathname?: string; saved?: string }) {
      const links: Link[] = [];
      const store = opts.saved
        ? JSON.stringify({
            state: { presetId: opts.saved, config: { theme: getPreset(opts.saved)!.config.theme } },
            version: STORAGE_VERSION,
          })
        : null;
      vm.runInNewContext(EARLY_THEME_SCRIPT, {
        location: { search: opts.search ?? "", pathname: opts.pathname ?? "/" },
        localStorage: { getItem: (k: string) => (k === STORAGE_KEY ? store : null) },
        setTimeout: () => 0,
        document: {
          getElementById: (id: string) => (id === "theme-tokens" ? { textContent: "" } : null),
          documentElement: { setAttribute: () => undefined, removeAttribute: () => undefined },
          createElement: () => {
            const link: Link = { attrs: {} };
            return Object.assign(link, { setAttribute: (k: string, v: string) => (link.attrs[k] = v) });
          },
          head: { appendChild: (l: Link) => links.push(l) },
        },
      });
      return links;
    }
    const fornoSources = () => {
      const banner = getPreset("forno-da-vila")!.config.homeBlocks.find((b) => b.type === "banner");
      if (banner?.type !== "banner" || !banner.image.sources) throw new Error("sem banner responsivo");
      return banner.image.sources;
    };

    it("?preset=forno na home injeta um preload AVIF por janela, com os mesmos srcset e sizes do <picture>", () => {
      for (const search of ["?preset=forno", "?preset=forno-da-vila", "?x=1&preset=FORNO"]) {
        const links = run({ search });
        const sources = fornoSources();
        expect(links, search).toHaveLength(sources.length);
        sources.forEach((source, i) => {
          expect(links[i]).toMatchObject({ rel: "preload", as: "image", type: "image/avif", media: source.media });
          expect(links[i].attrs.imagesrcset).toBe(toSrcSet(source.avif));
          expect(links[i].attrs.imagesizes).toBe(source.sizes);
          expect(links[i].attrs.fetchpriority).toBe("high");
        });
      }
    });

    it("as janelas dos preloads não se sobrepõem: o celular nunca baixa o preload de desktop", () => {
      const medias = run({ search: "?preset=forno" }).map((l) => l.media);
      expect(medias).toEqual(["(max-width: 767px)", "(min-width: 768px)"]);
    });

    it("preset salvo (Forno) na home, sem parâmetro, também pré-carrega", () => {
      expect(run({ saved: "forno-da-vila" }).map((l) => l.attrs.imagesrcset)).toEqual(fornoSources().map((s) => toSrcSet(s.avif)));
    });

    it("só na home: em rotas de produto, categoria ou carrinho não injeta nada", () => {
      for (const pathname of ["/produto/pizza-margherita", "/categoria/pizzas", "/carrinho", "/busca"]) {
        expect(run({ search: "?preset=forno", pathname }), pathname).toEqual([]);
        expect(run({ saved: "forno-da-vila", pathname }), pathname).toEqual([]);
      }
    });

    it("preset padrão (Trama) ou nenhum preset: nenhum preload extra", () => {
      expect(run({})).toEqual([]);
      expect(run({ saved: "trama-studio" })).toEqual([]);
      expect(run({ search: "?preset=trama" })).toEqual([]);
      expect(run({ search: "?preset=trama-studio" })).toEqual([]);
      expect(run({ search: "?preset=desconhecido" })).toEqual([]);
    });

    it("?preset= tem prioridade sobre o salvo", () => {
      expect(run({ search: "?preset=trama", saved: "forno-da-vila" })).toEqual([]);
      expect(run({ search: "?preset=forno", saved: "trama-studio" })).toHaveLength(2);
    });
  });
});
