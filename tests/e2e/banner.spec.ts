import { devices, type Page } from "@playwright/test";
import { expect, test, FORNO, currentPreset } from "./helpers";

const BASE = "/images/presets";
const MOBILE_WIDTHS = [480, 640, 768, 960];
const DESKTOP_WIDTHS = [1280, 1920];

/** Candidato que o navegador escolhe: o menor que cobre largura exibida × densidade; se nenhum cobre, o maior. */
const pick = (widths: number[], needed: number) => widths.find((w) => w >= needed) ?? widths[widths.length - 1];

/** Largura exibida do banner (px CSS) no preset deste build: faixa de ponta a ponta (Trama) ou card com margem (Forno). */
const shownWidth = (viewport: number) => {
  if (currentPreset() === FORNO) return Math.min(viewport, 1200) - 24;
  return viewport;
};
const presetDir = () => (currentPreset() === FORNO ? "forno-da-vila" : "trama-studio");

type Probe = {
  /** Pedidos de arquivos de banner, com o content-type da resposta. */
  requests: { path: string; contentType: string | null }[];
  currentSrc: string | null;
  fetchPriority: string | null;
  loading: string | null;
  preloads: number;
  naturalWidth: number;
  alt: string | null;
  sources: { media: string | null; type: string | null; srcset: string | null; sizes: string | null }[];
};

/** Abre a home e coleta o que o navegador pediu e escolheu para o banner principal. */
async function probe(page: Page): Promise<Probe> {
  const requests: Probe["requests"] = [];
  page.on("response", (r) => {
    const path = new URL(r.url()).pathname;
    if (/\/banner[^/]*\.(avif|webp)$/.test(path) || path.startsWith("/_next/image")) {
      requests.push({ path: path.startsWith("/_next/image") ? r.url() : path, contentType: r.headers()["content-type"] ?? null });
    }
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const dom = await page.evaluate(() => {
    const img = document.querySelector("main picture img") as HTMLImageElement | null;
    return {
      currentSrc: img ? new URL(img.currentSrc).pathname : null,
      fetchPriority: img?.getAttribute("fetchpriority") ?? null,
      loading: img?.getAttribute("loading") ?? null,
      naturalWidth: img?.naturalWidth ?? 0,
      alt: img?.getAttribute("alt") ?? null,
      preloads: document.querySelectorAll('link[rel="preload"][as="image"]').length,
      sources: [...document.querySelectorAll("main picture source")].map((s) => ({
        media: s.getAttribute("media"),
        type: s.getAttribute("type"),
        srcset: s.getAttribute("srcset"),
        sizes: s.getAttribute("sizes"),
      })),
    };
  });
  return { requests, ...dom };
}

test.describe("celular: o banner chega no tamanho de celular, em formato moderno, uma única vez", () => {
  // User-Agent de celular de verdade: com UA de desktop + emulação, o Chrome ignora o <meta viewport> ao escanear o HTML
  // e pede o recorte de desktop antes de corrigir o layout (artefato de teste que não acontece num celular).
  const mobile = (dpr: number) => ({
    userAgent: devices["Pixel 5"].userAgent,
    isMobile: true,
    hasTouch: true,
    viewport: { width: 400, height: 800 },
    screen: { width: 400, height: 800 },
    deviceScaleFactor: dpr,
  });

  for (const dpr of [1.75, 2]) {
    test.describe(`400 px, tela ${dpr}x`, () => {
      test.use(mobile(dpr));

      test("um único download do banner, o recorte de celular em AVIF, igual ao img.currentSrc", async ({ page }) => {
        const p = await probe(page);
        const width = pick(MOBILE_WIDTHS, shownWidth(400) * dpr);
        const file = `${BASE}/${presetDir()}/banner-m-${width}.avif`;

        expect(p.requests.map((r) => r.path)).toEqual([file]); // o único arquivo de banner da rede, uma vez só
        expect(p.requests[0].contentType).toBe("image/avif");
        expect(p.currentSrc).toBe(file);
        // nada de recorte de desktop, WebP, arquivo antigo ou otimizador de imagens
        expect(p.requests.some((r) => /banner-d-|\.webp|banner\.webp|\/_next\/image/.test(r.path))).toBe(false);
      });

      test("a imagem é só o <picture> do HTML: eager, prioridade alta e nenhum preload no head", async ({ page }) => {
        const p = await probe(page);
        expect(p.preloads).toBe(0);
        expect(p.fetchPriority).toBe("high");
        expect(p.loading).toBe("eager");
        // o sizes é respeitado: a imagem ocupa a largura exibida do preset
        expect(Math.abs(p.naturalWidth - shownWidth(400))).toBeLessThanOrEqual(2);
      });
    });
  }
});

test.describe("desktop: recorte de desktop em AVIF", () => {
  test.describe("1280 px, tela 1x", () => {
    test.use({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });

    test("AVIF de 1280 px, um único download", async ({ page }) => {
      const p = await probe(page);
      const file = `${BASE}/${presetDir()}/banner-d-${pick(DESKTOP_WIDTHS, shownWidth(1280))}.avif`;
      expect(p.requests.map((r) => r.path)).toEqual([file]);
      expect(p.currentSrc).toBe(file);
      expect(p.requests.some((r) => /banner-m-/.test(r.path))).toBe(false);
    });
  });

  test.describe("1280 px, tela 2x", () => {
    test.use({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });

    test("sobe para o candidato de 1920 px", async ({ page }) => {
      const p = await probe(page);
      const file = `${BASE}/${presetDir()}/banner-d-${pick(DESKTOP_WIDTHS, shownWidth(1280) * 2)}.avif`;
      expect(file.endsWith("banner-d-1920.avif")).toBe(true);
      expect(p.currentSrc).toBe(file);
      expect(p.requests.map((r) => r.path)).toEqual([file]);
    });
  });
});

test.describe("formato reserva e acessibilidade", () => {
  test("cada janela tem fonte AVIF e WebP com os mesmos tamanhos; o <img> traz o texto alternativo do preset", async ({ page }) => {
    const p = await probe(page);
    expect(p.sources.map((s) => [s.media, s.type])).toEqual([
      ["(max-width: 767px)", "image/avif"],
      ["(max-width: 767px)", "image/webp"],
      ["(min-width: 768px)", "image/avif"],
      ["(min-width: 768px)", "image/webp"],
    ]);
    expect(p.sources[0].sizes).toBe(p.sources[1].sizes);
    expect(p.sources[0].srcset).toContain(`${BASE}/${presetDir()}/banner-m-480.avif 480w`);
    expect(p.alt).toMatch(currentPreset() === FORNO ? /pizza/i : /vestido|luz natural/i);
  });
});
