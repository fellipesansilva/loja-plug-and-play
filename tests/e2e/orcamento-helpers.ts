import { type Page } from "@playwright/test";
import { expect, test, ORIGIN, TRAMA } from "./helpers";

/** A loja Arca (modo orçamento) é testada uma vez só, pelo projeto "trama": os endereços são sempre completos (/arca/...). */
export const ARCA = `${ORIGIN}/arca`;

/** Preparo comum: roda só no projeto da Trama e já grava a escolha de cookies da Arca (o aviso não atrapalha). */
export function setupArca() {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.metadata.preset !== TRAMA, "A Arca roda uma vez (projeto trama)");
    await page.addInitScript(() => {
      try {
        if (!localStorage.getItem("loja-consent-v1-arca")) {
          localStorage.setItem("loja-consent-v1-arca", JSON.stringify({ choice: "rejected", at: "2026-01-01T00:00:00.000Z", version: "1" }));
        }
      } catch {}
    });
  });
}

/** Abre uma rota da Arca e espera a hidratação e o store de teste. */
export async function arca(page: Page, route = "") {
  await page.goto(`${ARCA}${route}`);
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => !!window.__demoStore);
}

export const arcaState = (page: Page) =>
  page.evaluate(() => {
    const s = window.__demoStore!.getState();
    return { quoteList: s.quoteList, quotes: s.quotes, products: s.products, config: s.config };
  });

export { expect };
