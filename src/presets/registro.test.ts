import { describe, expect, it } from "vitest";
import { resolveDefaultPresetSlug } from "@/config";
import { shouldExposeStore } from "@/lib/expose-store";
import { prefixHref, stripPresetPrefix } from "@/lib/preset-href";
import fs from "node:fs";
import path from "node:path";
import { fontCssFor, fontUrlsFor, fontsBySlug } from "@/fonts";
import { IMAGE_VARIANT_WIDTHS, imageSrcSet } from "@/components/store/StoreImage";
import { storageKeyFor } from "@/store/storage-key";
import { getPreset, presetBySlug, presets, resolvePresetKey } from "./index";

describe("registro de presets", () => {
  it("resolvePresetKey aceita apelido ou id sem diferenciar maiúsculas; null para vazio e desconhecido", () => {
    expect(resolvePresetKey("forno")).toBe("forno-da-vila");
    expect(resolvePresetKey("FORNO")).toBe("forno-da-vila");
    expect(resolvePresetKey("trama-studio")).toBe("trama-studio");
    expect(resolvePresetKey(null)).toBeNull();
    expect(resolvePresetKey("")).toBeNull();
    expect(resolvePresetKey("orbita")).toBeNull();
  });

  it("cada preset tem apelido de URL único e conhecido", () => {
    expect(new Set(presets.map((p) => p.shortId)).size).toBe(presets.length);
    expect(presetBySlug("forno")?.id).toBe("forno-da-vila");
    expect(presetBySlug("orbita")).toBeUndefined();
    expect(getPreset("trama-studio")?.shortId).toBe("trama");
  });
});

describe("preset padrão (DEFAULT_PRESET)", () => {
  it("sem valor vale o primeiro preset; aceita apelido em qualquer caixa", () => {
    expect(resolveDefaultPresetSlug(undefined)).toBe("trama");
    expect(resolveDefaultPresetSlug("  ")).toBe("trama");
    expect(resolveDefaultPresetSlug("FORNO")).toBe("forno");
  });
  it("valor desconhecido derruba o build", () => {
    expect(() => resolveDefaultPresetSlug("orbita")).toThrow(/DEFAULT_PRESET="orbita".*trama.*forno/);
  });
});

describe("localStorage separado por preset", () => {
  it("cada preset tem a sua chave", () => {
    const keys = presets.map((p) => storageKeyFor(p.shortId));
    expect(new Set(keys).size).toBe(presets.length);
    expect(keys).toContain("loja-demo-v1-trama");
    expect(keys).toContain("loja-demo-v1-forno");
  });
});

describe("prefixo do preset nos links", () => {
  it("prefixa caminhos internos e preserva query e âncora", () => {
    expect(prefixHref("forno", "/")).toBe("/forno");
    expect(prefixHref("forno", "/carrinho")).toBe("/forno/carrinho");
    expect(prefixHref("forno", "/busca?q=pizza#x")).toBe("/forno/busca?q=pizza#x");
    expect(prefixHref("forno", "/?a=1")).toBe("/forno?a=1");
  });
  it("não mexe em âncora, externo, relativo nem caminho já prefixado", () => {
    for (const h of ["#topo", "https://x.com/a", "//cdn.x.com", "carrinho", "/forno", "/forno/carrinho"]) {
      expect(prefixHref("forno", h)).toBe(h);
    }
  });
  it("stripPresetPrefix é o inverso", () => {
    expect(stripPresetPrefix("forno", "/forno")).toBe("/");
    expect(stripPresetPrefix("forno", "/forno/painel/produtos")).toBe("/painel/produtos");
    expect(stripPresetPrefix("forno", "/fornos")).toBe("/fornos");
  });
});

describe("exposição do store nos testes", () => {
  it("só fora de produção ou com a flag", () => {
    expect(shouldExposeStore({ NODE_ENV: "development" })).toBe(true);
    expect(shouldExposeStore({ NODE_ENV: "production" })).toBe(false);
    expect(shouldExposeStore({ NODE_ENV: "production", NEXT_PUBLIC_EXPOSE_STORE: "1" })).toBe(true);
  });
});

describe("fontes por preset (só as do preset entram na página)", () => {
  const root = path.resolve(import.meta.dirname, "../..");
  const cssVar = (value: string) => /var\((--[\w-]+)\)/.exec(value)?.[1];

  it.each(presets.map((p) => [p.id, p] as const))("preset %s: define as variáveis dos tokens, os arquivos existem e nenhuma fonte é de outro preset", (_id, preset) => {
    const own = [cssVar(preset.config.theme.fonts.heading), cssVar(preset.config.theme.fonts.body)];
    for (const v of own) expect(Object.keys(fontsBySlug[preset.shortId].vars), String(v)).toContain(v);
    const css = fontCssFor(preset.shortId);
    for (const v of own) expect(css, String(v)).toContain(`${v}:`);
    for (const url of fontUrlsFor(preset.shortId)) {
      expect(url.startsWith(`/fonts/${preset.shortId}/`), url).toBe(true);
      expect(fs.existsSync(path.join(root, "public", url)), url).toBe(true);
    }
    for (const other of presets.filter((p) => p.id !== preset.id)) {
      const foreign = cssVar(other.config.theme.fonts.heading)!;
      if (own.includes(foreign)) continue; // fonte compartilhada (ex.: Manrope)
      expect(css, foreign).not.toContain(foreign);
      expect(css).not.toContain(`/fonts/${other.shortId}/`);
    }
  });

  it("slug desconhecido não gera CSS nem preload", () => {
    expect(fontCssFor("orbita")).toBe("");
    expect(fontUrlsFor("orbita")).toEqual([]);
  });
});

describe("versões menores das fotos (srcset)", () => {
  it("toda foto de produto, categoria, setor e projeto dos presets tem as versões -360 e -640 em public/, bem menores que o original", () => {
    const root = path.resolve(import.meta.dirname, "../..");
    for (const preset of presets) {
      const images = [
        ...preset.products.flatMap((p) => p.images),
        ...preset.categories.flatMap((c) => c.image ?? []),
        ...(preset.config.sectors ?? []).map((s) => s.image),
        ...(preset.config.cases ?? []).map((c) => c.image),
      ];
      for (const img of images) {
        const srcSet = imageSrcSet(img.src);
        if (!srcSet) {
          expect(img.src.startsWith("/images/presets/"), `${preset.id}: ${img.src} sem srcset`).toBe(false);
          continue;
        }
        const original = fs.statSync(path.join(root, "public", img.src)).size;
        for (const w of IMAGE_VARIANT_WIDTHS) {
          const file = path.join(root, "public", img.src.replace(/\.webp$/, `-${w}.webp`));
          expect(fs.existsSync(file), file).toBe(true);
          expect(fs.statSync(file).size, file).toBeLessThan(original);
        }
        expect(fs.statSync(path.join(root, "public", img.src.replace(/\.webp$/, "-360.webp"))).size).toBeLessThan(60 * 1024);
      }
    }
  });

  it("imageSrcSet: só fotos dos presets (fora banners, versões e arquivos enviados)", () => {
    expect(imageSrcSet("/images/presets/forno-da-vila/pizza-margherita-1.webp")).toBe(
      "/images/presets/forno-da-vila/pizza-margherita-1-360.webp 360w, /images/presets/forno-da-vila/pizza-margherita-1-640.webp 640w",
    );
    expect(imageSrcSet("/images/presets/forno-da-vila/banner.webp")).toBeUndefined();
    expect(imageSrcSet("/images/presets/forno-da-vila/pizza-margherita-1-360.webp")).toBeUndefined();
    expect(imageSrcSet("data:image/png;base64,AAAA")).toBeUndefined();
    expect(imageSrcSet("/placeholder?l=x")).toBeUndefined();
  });
});
