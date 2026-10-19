import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { fontsBySlug } from "@/fonts";
import { fallbackFaces } from "@/fonts/fallbacks.generated";
import { STORE_ROUTES } from "@/lib/store-routes";
import { CONTACT_URL, DEMOS, FAQ, FOOTER, FOUNDERS } from "./content";

const root = path.resolve(import.meta.dirname, "../../..");
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");
const files = (dir: string): string[] =>
  fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(`${dir}/${e.name}`) : /\.(tsx?|css)$/.test(e.name) && !/\.test\./.test(e.name) ? [`${dir}/${e.name}`] : []));

describe("landing da Better Studio (/better)", () => {
  const code = [...files("src/app/better"), ...files("src/site/better")];

  it("é componente de servidor: nenhum arquivo é 'use client' e as Dúvidas usam <details> nativo", () => {
    for (const f of code) expect(read(f), f).not.toMatch(/["']use client["']/);
    expect(read("src/app/better/page.tsx")).toContain("<details");
  });

  it("fica fora dos presets: /better não é rota de loja, e a página não usa store, provider nem botão Demo", () => {
    expect(STORE_ROUTES.has("better")).toBe(false);
    const semComentarios = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    for (const f of code) expect(semComentarios(read(f)), f).not.toMatch(/PresetProvider|useDemoStore|DemoControls|ConsentProvider|@\/presets/);
  });

  it("não usa contêineres estreitos (max-w-xl, max-w-md) e o contêiner é de 1200 px", () => {
    for (const f of code) expect(read(f), f).not.toMatch(/max-w-(xl|md)\b/);
    expect(read("src/theme/better.css")).toMatch(/\.better-wrap\s*\{[^}]*max-width:\s*1200px/);
  });

  it("o layout tira a página dos buscadores (noindex, nofollow)", () => {
    expect(read("src/app/better/layout.tsx")).toMatch(/robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
  });

  it("as cinco lojas são links internos diretos, sem host nem ?preset=", () => {
    expect(DEMOS.map((d) => `/${d.slug}`)).toEqual(["/trama", "/forno", "/orbita", "/faisca", "/arca"]);
    expect(CONTACT_URL).toBe("https://instagram.com/betterstudio.br");
    expect(read("src/app/better/page.tsx")).not.toMatch(/\?preset=|vercel\.app/);
  });

  it("os placeholders ficam como estão", () => {
    expect(FOUNDERS.text).toContain("[N] de 3 vagas");
    expect(FAQ.items.at(-1)?.a).toBe("[CONDIÇÕES DE CANCELAMENTO DO CONTRATO]");
    expect(FOOTER.cnpj).toBe("[CNPJ]");
  });

  it("fontes Sora e DM Sans (OFL) em public/fonts/better, com reserva de métricas ajustadas e só para /better", () => {
    const f = fontsBySlug.better;
    expect(f.faces.map((x) => x.family)).toEqual(["Sora", "DM Sans"]);
    for (const face of f.faces) expect(fs.existsSync(path.join(root, "public/fonts/better", face.file)), face.file).toBe(true);
    for (const lic of ["OFL-sora.txt", "OFL-dm-sans.txt"]) expect(read(`public/fonts/better/${lic}`)).toContain("SIL OPEN FONT LICENSE");
    expect((fallbackFaces as Record<string, unknown[]>)["better"].length).toBeGreaterThanOrEqual(4);
  });

  it("o logo existe em PNG (107.976 bytes, da referência) e em WebP", () => {
    expect(fs.statSync(path.join(root, "public/images/better/logo.png")).size).toBe(107976);
    expect(fs.existsSync(path.join(root, "public/images/better/logo-96.webp"))).toBe(true);
    expect(fs.statSync(path.join(root, "docs/referencias/better/better-logo.png")).size).toBe(107976);
  });
});
