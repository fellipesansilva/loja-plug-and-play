import { type Page } from "@playwright/test";
import { test, expect, ORIGIN, TRAMA } from "./helpers";

// Fatia de desempenho do LCP: a foto principal baixa antes das fontes (Arca) e das fotos dos cards
// (Trama). Para ordenar de forma determinística, o teste atrasa a foto principal e confere o que foi pedido enquanto ela não chega.
// Roda uma vez (projeto trama), com endereços completos.
test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.metadata.preset !== TRAMA, "Roda uma vez (projeto trama)");
  await page.addInitScript(() => {
    for (const s of ["arca", "trama", "forno"]) localStorage.setItem(`loja-consent-v1-${s}`, JSON.stringify({ choice: "rejected", at: "2026-01-01T00:00:00.000Z", version: "1" }));
  });
});

const PHOTO_DELAY_MS = 1800;

type Marks = { requests: { path: string; at: number }[]; photoDoneAt: number; t0: number };

/** Atrasa a foto principal e anota quando cada requisição saiu e quando a foto foi liberada. */
async function trackWithDelayedPhoto(page: Page, photo: RegExp): Promise<Marks> {
  const marks: Marks = { requests: [], photoDoneAt: Infinity, t0: Date.now() };
  page.on("request", (r) => marks.requests.push({ path: new URL(r.url()).pathname, at: Date.now() - marks.t0 }));
  await page.route(photo, async (route) => {
    await new Promise((r) => setTimeout(r, PHOTO_DELAY_MS));
    marks.photoDoneAt = Date.now() - marks.t0;
    await route.continue();
  });
  return marks;
}

async function clsOf(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __cls: number }).__cls);
}

async function observeCls(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as (PerformanceEntry & { hadRecentInput: boolean; value: number })[]) if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
}

const ARCA_PRODUCTS = ["portico-inflavel", "reservatorio-flexivel-fechado", "reservatorio-aberto"];

test.describe("H1 · fontes da Arca depois da foto principal", () => {
  test("o HTML da Arca não faz preload de fonte; a foto sai antes, as fontes só depois dela, e a troca não desloca o layout", async ({ page, request }) => {
    const html = await (await request.get(`${ORIGIN}/arca/produto/portico-inflavel`)).text();
    expect(html).not.toMatch(/<link[^>]+rel="preload"[^>]+as="font"/);
    expect(html).toContain("Barlow Fallback"); // fonte reserva com métricas ajustadas
    await observeCls(page);
    const marks = await trackWithDelayedPhoto(page, /portico-inflavel-(640|960)\.webp/);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${ORIGIN}/arca/produto/portico-inflavel`, { waitUntil: "load" });
    await expect.poll(() => marks.photoDoneAt, { timeout: 10_000 }).toBeLessThan(Infinity);
    await page.waitForTimeout(1800);
    const fonts = marks.requests.filter((r) => r.path.endsWith(".woff2"));
    expect(fonts.length, "as fontes foram pedidas depois da foto").toBeGreaterThanOrEqual(2);
    for (const f of fonts) expect(f.at, f.path).toBeGreaterThanOrEqual(marks.photoDoneAt - 20);
    const loaded = await page.evaluate(() => [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family));
    expect(loaded).toContain("Barlow Condensed");
    expect(await clsOf(page)).toBeLessThan(0.001);
  });

  for (const slug of ARCA_PRODUCTS) {
    for (const [label, size] of [["celular 400 px", { width: 400, height: 800 }], ["desktop 1280 px", { width: 1280, height: 900 }]] as const) {
      test(`${slug} (${label}): CLS zero com foto e fontes atrasadas`, async ({ page }) => {
        await observeCls(page);
        await page.route("**/fonts/**", async (route) => {
          await new Promise((r) => setTimeout(r, 900));
          await route.continue();
        });
        const marks = await trackWithDelayedPhoto(page, new RegExp(`${slug}-(360|640|960)\\.webp`));
        await page.setViewportSize(size);
        await page.goto(`${ORIGIN}/arca/produto/${slug}`, { waitUntil: "load" });
        await expect.poll(() => marks.photoDoneAt, { timeout: 10_000 }).toBeLessThan(Infinity);
        await page.waitForTimeout(3000);
        expect(await clsOf(page), `CLS de ${slug}`).toBeLessThan(0.001);
      });
    }
  }
});

test.describe("H3 · fotos dos cards da Trama depois do banner", () => {
  test("home da Trama: nenhuma foto de card antes do banner; o espaço dos cards não muda; CLS zero", async ({ page }) => {
    await observeCls(page);
    const marks = await trackWithDelayedPhoto(page, /banner-[md]-\d+\.(avif|webp)$/);
    await page.setViewportSize({ width: 400, height: 800 });
    await page.goto(`${ORIGIN}/trama`, { waitUntil: "commit" });
    await page.getByTestId("product-card").first().waitFor({ state: "attached" });
    const cardBoxes = () => page.getByTestId("product-card").evaluateAll((els) => els.map((e) => { const r = e.querySelector(".aspect-product")!.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
    const before = await cardBoxes();
    expect(before.length).toBeGreaterThanOrEqual(8);
    expect(marks.photoDoneAt, "o banner ainda está sendo baixado").toBe(Infinity);
    expect(marks.requests.filter((r) => /trama-studio\/(?!banner).*(-360|-640)?\.webp$/.test(r.path)), "nenhuma foto de card antes do banner").toEqual([]);
    await expect.poll(() => marks.photoDoneAt, { timeout: 10_000 }).toBeLessThan(Infinity);
    for (let y = 0; y < 5000; y += 400) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(80);
    }
    await page.waitForLoadState("networkidle");
    const cards = marks.requests.filter((r) => /trama-studio\/(?!banner)[^/]+\.webp$/.test(r.path));
    expect(cards.length, "as fotos dos cards chegaram").toBeGreaterThanOrEqual(8);
    for (const c of cards) expect(c.at, c.path).toBeGreaterThanOrEqual(marks.photoDoneAt - 20);
    expect(await cardBoxes()).toEqual(before); // mesma caixa antes e depois: sem salto
    expect(await clsOf(page)).toBeLessThan(0.001);
  });

  test("Forno e Arca: as fotos dos cards seguem aparecendo (sem imagem quebrada) depois do carregamento", async ({ page }) => {
    for (const path of ["/forno", "/arca"]) {
      await page.goto(`${ORIGIN}${path}`, { waitUntil: "networkidle" });
      for (let y = 0; y < 6000; y += 400) {
        await page.evaluate((v) => window.scrollTo(0, v), y);
        await page.waitForTimeout(60);
      }
      await page.waitForLoadState("networkidle");
      const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc));
      expect(broken, path).toEqual([]);
      await expect(page.locator("[data-deferred-image]")).toHaveCount(0);
    }
  });
});
