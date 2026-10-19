import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrastIssues } from "@/theme/contrast";
import { themeWithChoice } from "@/lib/store-config";
import { isCourse, totalMinutes } from "@/lib/courses";
import { imageOriginals } from "@/lib/image-originals.generated";
import facesJson from "@/fonts/faces.json";
import { fallbackFaces } from "@/fonts/fallbacks.generated";
import { getPreset } from "./index";

const faisca = getPreset("faisca")!;
const root = path.resolve(import.meta.dirname, "../..");
const pub = (src: string) => path.join(root, "public", src);

describe("preset Faísca (loja de cursos)", () => {
  it("tem de 6 a 8 cursos, todos produto digital com curso, em 3 ou mais categorias usadas", () => {
    expect(faisca.products.length).toBeGreaterThanOrEqual(6);
    expect(faisca.products.length).toBeLessThanOrEqual(8);
    for (const p of faisca.products) {
      expect(p.type, p.id).toBe("digital");
      expect(isCourse(p), p.id).toBe(true);
      expect(p.variants, p.id).toEqual([]);
    }
    expect(faisca.categories.length).toBeGreaterThanOrEqual(3);
    const used = new Set(faisca.products.map((p) => p.categoryId));
    for (const c of faisca.categories) expect(used.has(c.id), c.id).toBe(true);
    for (const p of faisca.products) expect(faisca.categories.some((c) => c.id === p.categoryId), p.id).toBe(true);
  });

  it("cada curso tem instrutor fictício, aulas com texto e carga horária somada das aulas", () => {
    for (const p of faisca.products) {
      const c = p.course!;
      expect(c.instructorNote, p.id).toMatch(/fictíci/i);
      expect(c.lessons.length, p.id).toBeGreaterThanOrEqual(5);
      expect(c.lessons.length, p.id).toBeLessThanOrEqual(8);
      expect(totalMinutes(c), p.id).toBeGreaterThan(60);
      for (const l of c.lessons) {
        expect(l.text.length, `${p.id}/${l.id}`).toBeGreaterThanOrEqual(2);
        expect(l.minutes, `${p.id}/${l.id}`).toBeGreaterThanOrEqual(10);
        expect(l.minutes, `${p.id}/${l.id}`).toBeLessThanOrEqual(35);
      }
    }
  });

  it("não tem pedidos de exemplo: Meus cursos só lista o que foi comprado neste navegador", () => {
    expect(faisca.orders).toEqual([]);
  });

  it("não tem frete nem retirada: a loja é toda de produto digital", () => {
    const m = faisca.config.modules;
    expect(m.freteGratis).toBeUndefined();
    expect(m.retiradaLocal).toBeFalsy();
    expect(faisca.config.shipping.options).toEqual([]);
  });

  it("a política de produto digital existe e está marcada para revisão jurídica; marca e identificação são fictícias", () => {
    expect(faisca.config.policies.digital).toMatch(/revisão jurídica/);
    expect(faisca.config.policies.regretConditions).toMatch(/revisão jurídica/);
    expect(faisca.config.legal.name).toMatch(/fictíci/i);
    expect(faisca.config.legal.document).toMatch(/fictíci/i);
    expect(faisca.config.policies.about).toMatch(/fictícia/i);
  });

  it("SEO sem 'mockup' nem 'demonstração'", () => {
    const text = `${faisca.config.seo.titleTemplate} ${faisca.config.seo.description}`;
    expect(text).not.toMatch(/mockup|demonstra/i);
  });

  it("toda combinação de cor principal e de destaque do painel passa no contraste de 4,5:1", () => {
    const base = faisca.config;
    const choices = base.themeChoices!;
    for (const primary of choices.primary) {
      for (const accent of choices.accent) {
        const theme = themeWithChoice(base, { primary: primary.id, accent: accent.id, headingFont: choices.fonts.heading[0].id, bodyFont: choices.fonts.body[0].id });
        expect(contrastIssues(theme.colors, choices.contrastPairs), `${primary.id} + ${accent.id}`).toEqual([]);
      }
    }
  });

  it("fontes: os arquivos existem, são do preset e há reserva com métricas ajustadas", () => {
    const fonts = (facesJson as Record<string, { faces: { file: string }[] }>)["faisca"];
    expect(fonts.faces.length).toBeGreaterThanOrEqual(2);
    for (const f of fonts.faces) expect(fs.existsSync(path.join(root, "public/fonts/faisca", f.file)), f.file).toBe(true);
    expect(fs.existsSync(path.join(root, "public/fonts/faisca/OFL-sora.txt"))).toBe(true);
    expect((fallbackFaces as Record<string, unknown[]>)["faisca"].length).toBeGreaterThan(0);
  });
});

describe("fotos da Faísca", () => {
  const banner = faisca.config.homeBlocks.find((b) => b.type === "banner");
  const credits = fs.readFileSync(path.join(root, "IMAGE_CREDITS.md"), "utf8");
  const images = [...(banner?.type === "banner" ? [banner.image] : []), ...faisca.categories.flatMap((c) => c.image ?? []), ...faisca.products.flatMap((p) => p.images)];

  it("todas as imagens têm texto alternativo, arquivo em public/ e crédito (autor, licença e endereço) em IMAGE_CREDITS.md", () => {
    expect(images.length).toBe(1 + faisca.categories.length + faisca.products.length);
    for (const img of images) {
      expect(img.alt.trim().length, img.src).toBeGreaterThan(10);
      expect(img.src.startsWith("/images/presets/faisca/"), img.src).toBe(true);
      expect(fs.existsSync(pub(img.src)), img.src).toBe(true);
      const row = credits.split(/\r?\n/).find((l) => l.includes(`\`public${img.src}\``));
      expect(row, `crédito de ${img.src}`).toBeTruthy();
      expect(row).toMatch(/https:\/\/unsplash\.com\/photos\/[\w-]+ \| .+ \| \[Unsplash License\]/);
      expect(fs.statSync(pub(img.src)).size, img.src).toBeLessThanOrEqual(200 * 1024);
    }
  });

  it("nenhuma foto se repete no preset", () => {
    const srcs = images.map((i) => i.src);
    expect(new Set(srcs).size).toBe(srcs.length);
    const rows = credits.split(/\r?\n/).filter((l) => l.includes("presets/faisca/"));
    const urls = rows.map((l) => /https:\/\/unsplash\.com\/photos\/[\w-]+/.exec(l)![0]);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("o banner tem preload e recortes de celular (3:4) e desktop (16:9) em AVIF e WebP", () => {
    if (banner?.type !== "banner") throw new Error("sem banner");
    expect(banner.image.preload).toBe(true);
    const sources = banner.image.sources ?? [];
    expect(sources.map((s) => s.media)).toEqual(["(max-width: 767px)", "(min-width: 768px)"]);
    for (const source of sources) {
      expect(source.avif.map((c) => c.width)).toEqual(source.webp.map((c) => c.width));
      for (const c of [...source.avif, ...source.webp]) {
        expect(fs.existsSync(pub(c.src)), c.src).toBe(true);
        expect(fs.statSync(pub(c.src)).size, c.src).toBeLessThanOrEqual(200 * 1024);
      }
    }
    const [mobile, desktop] = sources;
    expect(mobile.avif.map((c) => c.width)).toEqual([480, 640, 768, 960]);
    expect(desktop.avif.map((c) => c.width)).toEqual([1280, 1920]);
  });

  it("variantes de 360 e 640 px em todas as fotos; a de 960 só quando pesa menos de 85% do original", () => {
    const files = images.filter((i) => !i.src.includes("/banner")).map((i) => i.src);
    for (const src of files) {
      const base = src.replace(/\.webp$/, "");
      expect(fs.existsSync(pub(`${base}-360.webp`)), `${base}-360`).toBe(true);
      expect(fs.existsSync(pub(`${base}-640.webp`)), `${base}-640`).toBe(true);
      const original = imageOriginals[src];
      expect(original, `manifesto de ${src}`).toBeTruthy();
      const hi = pub(`${base}-960.webp`);
      if (original.w960) {
        expect(fs.existsSync(hi), `${base}-960`).toBe(true);
        expect(fs.statSync(hi).size, `${base}-960`).toBeLessThan(0.85 * original.bytes);
      } else {
        expect(fs.existsSync(hi), `${base}-960 não deveria existir`).toBe(false);
      }
    }
  });
});
