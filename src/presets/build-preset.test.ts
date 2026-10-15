import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseDemoUrls } from "@/lib/demo-urls";
import { storageKeyFor } from "@/store/storage-key";
import { ACTIVE_PRESET_ID, FALLBACK_PRESET_ID, presets, resolveBuildPreset, resolvePresetKey } from "./index";

describe("preset do build (NEXT_PUBLIC_PRESET)", () => {
  it("sem a variável vale a Trama", () => {
    expect(resolveBuildPreset(undefined)).toBe("trama-studio");
    expect(resolveBuildPreset("")).toBe("trama-studio");
    expect(resolveBuildPreset("   ")).toBe("trama-studio");
    expect(FALLBACK_PRESET_ID).toBe("trama-studio");
  });

  it("aceita o apelido ou o id, sem diferenciar maiúsculas", () => {
    expect(resolveBuildPreset("forno")).toBe("forno-da-vila");
    expect(resolveBuildPreset("FORNO")).toBe("forno-da-vila");
    expect(resolveBuildPreset("forno-da-vila")).toBe("forno-da-vila");
    expect(resolveBuildPreset("trama")).toBe("trama-studio");
    expect(resolveBuildPreset(" trama-studio ")).toBe("trama-studio");
  });

  it("valor desconhecido derruba o build (não publica a loja errada)", () => {
    expect(() => resolveBuildPreset("orbita")).toThrow(/NEXT_PUBLIC_PRESET="orbita".*trama.*forno/);
  });

  it("o preset deste build vem da variável de ambiente dos testes", () => {
    expect(ACTIVE_PRESET_ID).toBe(resolveBuildPreset(process.env.NEXT_PUBLIC_PRESET));
  });

  it("resolvePresetKey devolve null para vazio e desconhecido", () => {
    expect(resolvePresetKey(null)).toBeNull();
    expect(resolvePresetKey("")).toBeNull();
    expect(resolvePresetKey("orbita")).toBeNull();
    expect(resolvePresetKey("Forno")).toBe("forno-da-vila");
  });
});

describe("localStorage separado por preset", () => {
  it("cada preset tem a sua chave", () => {
    const keys = presets.map((p) => storageKeyFor(p.shortId ?? p.id));
    expect(new Set(keys).size).toBe(presets.length);
    expect(keys).toContain("loja-demo-v1-trama");
    expect(keys).toContain("loja-demo-v1-forno");
    expect(keys).not.toContain("loja-demo-v1");
  });
});

describe("URLs das lojas (NEXT_PUBLIC_DEMO_URLS)", () => {
  it("lê JSON com chaves por apelido ou id e tira a barra final", () => {
    expect(parseDemoUrls('{"trama":"https://t.example.com/","forno-da-vila":"https://f.example.com"}')).toEqual({
      "trama-studio": "https://t.example.com",
      "forno-da-vila": "https://f.example.com",
    });
  });

  it("ignora o que não vale: vazio, JSON quebrado, preset desconhecido, URL inválida ou de outro protocolo", () => {
    expect(parseDemoUrls(undefined)).toEqual({});
    expect(parseDemoUrls("")).toEqual({});
    expect(parseDemoUrls("{quebrado")).toEqual({});
    expect(parseDemoUrls("[1,2]")).toEqual({});
    expect(parseDemoUrls('{"orbita":"https://o.example.com"}')).toEqual({});
    expect(parseDemoUrls('{"forno":"nao-e-url"}')).toEqual({});
    expect(parseDemoUrls('{"forno":"javascript:alert(1)"}')).toEqual({});
    expect(parseDemoUrls('{"forno":42}')).toEqual({});
    expect(parseDemoUrls('{"forno":"https://f.example.com","trama":"::"}')).toEqual({ "forno-da-vila": "https://f.example.com" });
  });
});

describe("fontes por build (só as do preset)", () => {
  const root = path.resolve(import.meta.dirname, "../..");

  /** Nome da variável CSS de uma fonte nos tokens ("var(--font-bricolage), ..." → "--font-bricolage"). */
  const cssVar = (value: string) => /var\((--[\w-]+)\)/.exec(value)?.[1];

  it.each(presets.map((p) => [p.id, p] as const))("preset %s: o módulo de fontes do build declara as fontes dos tokens e nenhuma de outro preset", async (_id, preset) => {
    const { FONT_MODULE_BY_PRESET, fontModulePath } = await import("@/fonts/select");
    const key = preset.shortId ?? preset.id;
    expect(FONT_MODULE_BY_PRESET[preset.id]).toBe(FONT_MODULE_BY_PRESET[key]);
    const file = path.join(root, fontModulePath(key));
    expect(fs.existsSync(file), file).toBe(true);
    const source = fs.readFileSync(file, "utf8");

    const own = [cssVar(preset.config.theme.fonts.heading), cssVar(preset.config.theme.fonts.body)];
    for (const v of own) expect(source, String(v)).toContain(`variable: "${v}"`);

    for (const other of presets.filter((p) => p.id !== preset.id)) {
      const foreign = cssVar(other.config.theme.fonts.heading)!;
      if (own.includes(foreign)) continue; // fonte compartilhada (ex.: Manrope)
      expect(source, foreign).not.toContain(foreign);
    }
  });

  it("preset desconhecido ou vazio usa o módulo da Trama", async () => {
    const { fontModulePath } = await import("@/fonts/select");
    expect(fontModulePath(undefined)).toBe("./src/fonts/trama.ts");
    expect(fontModulePath("")).toBe("./src/fonts/trama.ts");
    expect(fontModulePath("FORNO")).toBe("./src/fonts/forno.ts");
  });
});
