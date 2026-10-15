import { devices, expect, test, type Page } from "@playwright/test";

const BASE = "/images/presets";

type Probe = {
  /** pedidos de arquivos de banner (caminho) e o content-type da resposta */
  requests: { path: string; contentType: string | null }[];
  currentSrc: string | null;
  fetchPriority: string | null;
  loading: string | null;
  preloads: { media: string | null; type: string | null; srcset: string | null; sizes: string | null }[];
  /** <source> do <picture> do banner */
  sources: { media: string | null; type: string | null; srcset: string | null; sizes: string | null }[];
  naturalWidth: number;
};

/** Abre a home e coleta o que o navegador pediu e escolheu para o banner principal. */
async function probe(page: Page, url: string, prepare?: () => Promise<void>): Promise<Probe> {
  if (prepare) await prepare();
  const requests: Probe["requests"] = [];
  page.on("response", (r) => {
    const path = new URL(r.url()).pathname;
    if (/\/banner[^/]*\.(avif|webp)$/.test(path) || path.startsWith("/_next/image")) {
      requests.push({ path: path.startsWith("/_next/image") ? r.url() : path, contentType: r.headers()["content-type"] ?? null });
    }
  });
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  const dom = await page.evaluate(() => {
    const img = document.querySelector("main picture img") as HTMLImageElement | null;
    const attrs = (el: Element) => ({
      media: el.getAttribute("media"),
      type: el.getAttribute("type"),
      srcset: el.getAttribute("srcset") ?? el.getAttribute("imagesrcset"),
      sizes: el.getAttribute("sizes") ?? el.getAttribute("imagesizes"),
    });
    return {
      currentSrc: img ? new URL(img.currentSrc).pathname : null,
      fetchPriority: img?.getAttribute("fetchpriority") ?? null,
      loading: img?.getAttribute("loading") ?? null,
      naturalWidth: img?.naturalWidth ?? 0,
      preloads: [...document.querySelectorAll('link[rel="preload"][as="image"]')].map(attrs),
      sources: [...document.querySelectorAll("main picture source")].map(attrs),
    };
  });
  return { requests, ...dom };
}

async function openForno(page: Page) {
  await page.goto("/?preset=forno");
  await expect(page.getByTestId("store-name")).toHaveAccessibleName("Forno da Vila");
}
const bannerOf = (p: Probe, preset: string) => p.requests.filter((r) => r.path.includes(preset));

test.describe("celular (360 px, tela 2x): o banner chega no tamanho de celular, em formato moderno", () => {
  // User-Agent de celular de verdade: com UA de desktop + emulação, o Chrome ignora o <meta viewport> ao escanear o HTML
  // e pede o recorte de desktop antes de corrigir o layout (artefato de teste que não acontece num celular).
  test.use({ userAgent: devices["Pixel 5"].userAgent, isMobile: true, hasTouch: true, viewport: { width: 360, height: 740 }, screen: { width: 360, height: 740 }, deviceScaleFactor: 2 });

  test("Forno (?preset=forno): AVIF de 768 px, sem a versão de desktop, sem WebP e sem arquivo antigo", async ({ page }) => {
    const p = await probe(page, "/?preset=forno");
    const forno = bannerOf(p, "forno-da-vila");
    expect(forno.map((r) => r.path)).toEqual([`${BASE}/forno-da-vila/banner-m-768.avif`]);
    expect(forno[0].contentType).toBe("image/avif");
    expect(p.currentSrc).toBe(`${BASE}/forno-da-vila/banner-m-768.avif`);
    expect(p.requests.some((r) => /banner-d-|banner\.webp|\/_next\/image/.test(r.path))).toBe(false);
    expect(p.fetchPriority).toBe("high");
    expect(p.loading).toBe("eager");
    expect(Math.abs(p.naturalWidth - 336)).toBeLessThanOrEqual(2); // arredondamento do navegador; 768 px de arquivo exibidos em 336 px de CSS (calc(100vw - 24px)): o sizes foi respeitado
  });

  test("Forno salvo (sem parâmetro): o mesmo arquivo", async ({ page }) => {
    await openForno(page);
    const p = await probe(page, "/");
    expect(p.currentSrc).toBe(`${BASE}/forno-da-vila/banner-m-768.avif`);
    expect(bannerOf(p, "forno-da-vila").map((r) => r.path)).toEqual([`${BASE}/forno-da-vila/banner-m-768.avif`]);
  });

  test("Trama (padrão): AVIF de 768 px, direto do <img> do HTML (sem preload no head)", async ({ page }) => {
    const p = await probe(page, "/");
    expect(p.preloads).toEqual([]);
    expect(p.currentSrc).toBe(`${BASE}/trama-studio/banner-m-768.avif`);
    expect(p.requests.map((r) => r.path)).toEqual([`${BASE}/trama-studio/banner-m-768.avif`]);
    expect(p.requests[0].contentType).toBe("image/avif");
    expect(p.fetchPriority).toBe("high");
    expect(p.loading).toBe("eager");
  });

  test("o preload é exatamente o que o <img> usa: mesmos srcset/sizes/media e uma única requisição por arquivo", async ({ page }) => {
    const p = await probe(page, "/?preset=forno");
    // 2 preloads (janela de celular e de desktop), AVIF, iguais aos <source> AVIF do <picture> do Forno
    const fornoSources = p.sources.filter((s) => s.type === "image/avif" && s.srcset?.includes("forno-da-vila"));
    expect(fornoSources).toHaveLength(2);
    const fornoPreloads = p.preloads.filter((l) => l.srcset?.includes("forno-da-vila"));
    expect(fornoPreloads).toHaveLength(2);
    for (const pre of fornoPreloads) {
      const source = fornoSources.find((s) => s.media === pre.media);
      expect(source, pre.media ?? "").toBeTruthy();
      expect(pre.srcset).toBe(source!.srcset);
      expect(pre.sizes).toBe(source!.sizes);
      expect(pre.type).toBe("image/avif");
    }
    // a janela do celular casa com o preload do celular: o arquivo pedido é o mesmo do <img>, pedido uma vez só
    const forno = bannerOf(p, "forno-da-vila");
    expect(new Set(forno.map((r) => r.path)).size).toBe(1);
    expect(forno).toHaveLength(1);
    expect(forno[0].path).toBe(p.currentSrc);
  });
});

test.describe("desktop (1280 px): recorte de desktop em AVIF", () => {
  test.use({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });

  test("Forno: AVIF de 1280 px (card de até 1000 px)", async ({ page }) => {
    const p = await probe(page, "/?preset=forno");
    expect(p.currentSrc).toBe(`${BASE}/forno-da-vila/banner-d-1280.avif`);
    expect(bannerOf(p, "forno-da-vila").map((r) => r.path)).toEqual([`${BASE}/forno-da-vila/banner-d-1280.avif`]);
    expect(p.requests.some((r) => /banner-m-/.test(r.path) && r.path.includes("forno-da-vila"))).toBe(false);
  });

  test("Trama: AVIF de 1280 px", async ({ page }) => {
    const p = await probe(page, "/");
    expect(p.currentSrc).toBe(`${BASE}/trama-studio/banner-d-1280.avif`);
    expect(p.requests.map((r) => r.path)).toEqual([`${BASE}/trama-studio/banner-d-1280.avif`]);
  });

  test("tela larga de 2x (2560 px reais): sobe para o candidato de 1920 px", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    const p = await probe(page, "/");
    expect(p.currentSrc).toBe(`${BASE}/trama-studio/banner-d-1920.avif`);
    await ctx.close();
  });
});

test.describe("formato reserva e acessibilidade", () => {
  test("cada janela tem fonte AVIF e WebP com os mesmos tamanhos; o <img> traz o texto alternativo do preset", async ({ page }) => {
    const p = await probe(page, "/");
    expect(p.sources.map((s) => [s.media, s.type])).toEqual([
      ["(max-width: 767px)", "image/avif"],
      ["(max-width: 767px)", "image/webp"],
      ["(min-width: 768px)", "image/avif"],
      ["(min-width: 768px)", "image/webp"],
    ]);
    expect(p.sources[0].sizes).toBe(p.sources[1].sizes);
    const alt = await page.locator("main picture img").getAttribute("alt");
    expect(alt).toMatch(/vestido|luz natural/i);
    await openForno(page);
    await expect(page.locator("main picture img")).toHaveAttribute("alt", /pizza/i);
  });
});
