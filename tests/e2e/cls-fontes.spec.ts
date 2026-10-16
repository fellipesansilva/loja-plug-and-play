import { type Page } from "@playwright/test";
import { test, expect, ORIGIN, TRAMA } from "./helpers";

// A troca da fonte reserva pela fonte da loja não pode deslocar o layout. Para forçar a troca DEPOIS da primeira pintura, o teste atrasa
// os arquivos de fonte; as três lojas rodam uma vez só, pelo projeto "trama" (endereços completos).
const FONT_DELAY_MS = 1200;
const PAGES = [
  ["home da Trama", "trama", "/trama"],
  ["home do Forno", "forno", "/forno"],
  ["home da Arca", "arca", "/arca"],
  ["lista de produtos do Forno", "forno", "/forno/categoria/pizzas"],
] as const;

async function measureCls(page: Page, url: string): Promise<number> {
  await page.addInitScript(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as (PerformanceEntry & { hadRecentInput: boolean; value: number })[]) {
        if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.route("**/fonts/**", async (route) => {
    await new Promise((r) => setTimeout(r, FONT_DELAY_MS));
    await route.continue();
  });
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(FONT_DELAY_MS + 1500);
  // a fonte da loja já foi aplicada?
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(() => (window as unknown as { __cls: number }).__cls);
}

test.describe("CLS na troca de fonte", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.preset !== TRAMA, "Roda uma vez (projeto trama)");
  });

  for (const [name, slug, path] of PAGES) {
    for (const mobile of [true, false]) {
      test(`${name} (${mobile ? "celular 400 px" : "desktop 1280 px"}): CLS abaixo de 0,01 com a troca de fonte depois da pintura`, async ({ page }) => {
        await page.setViewportSize(mobile ? { width: 400, height: 800 } : { width: 1280, height: 900 });
        await page.addInitScript((s) => localStorage.setItem(`loja-consent-v1-${s}`, JSON.stringify({ choice: "rejected", at: "2026-01-01T00:00:00.000Z", version: "1" })), slug);
        const cls = await measureCls(page, `${ORIGIN}${path}`);
        expect(cls, `${name}: CLS ${cls}`).toBeLessThan(0.01);
        // a fonte da loja chegou de fato (a troca aconteceu dentro da medição)
        const loaded = await page.evaluate(() => [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family));
        expect(loaded.length, `${name}: fontes carregadas`).toBeGreaterThan(0);
      });
    }
  }

  test("a fonte reserva está declarada com as métricas ajustadas (size-adjust e overrides) nas três lojas", async ({ request }) => {
    for (const slug of ["trama", "forno", "arca"]) {
      const html = await (await request.get(`${ORIGIN}/${slug}`)).text();
      const fallbacks = html.match(/@font-face\{font-family:"[^"]+ Fallback"[^}]*\}/g) ?? [];
      expect(fallbacks.length, slug).toBeGreaterThanOrEqual(3);
      for (const f of fallbacks) {
        for (const prop of ["size-adjust", "ascent-override", "descent-override", "line-gap-override"]) expect(f, `${slug} ${prop}`).toContain(`${prop}:`);
      }
      // swap e preload continuam
      expect(html).toContain("font-display:swap");
      expect(html).toContain('rel="preload"');
    }
  });
});
