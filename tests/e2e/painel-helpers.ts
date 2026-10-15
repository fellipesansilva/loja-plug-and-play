import { devices, type Page } from "@playwright/test";
import { expect, currentPreset, FORNO } from "./helpers";

/** Abre uma rota da loja (ou do painel) e espera a hidratação e o store de teste. */
export const ready = async (page: Page, route = "/") => {
  await page.goto(route);
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => !!window.__demoStore);
};

export const MOBILE = {
  userAgent: devices["Pixel 5"].userAgent,
  isMobile: true,
  hasTouch: true,
  viewport: { width: 400, height: 800 },
  screen: { width: 400, height: 800 },
  deviceScaleFactor: 2,
};

export const overflowOf = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

export type Seed = { id: string; name?: string; email?: string; status?: string; delivery?: "entrega" | "retirada" | "digital"; createdAt?: string };

/** Pedido gravado direto no store (a partir de um pedido de exemplo do preset), com id, cliente e data conhecidos. */
export async function placeOrder(page: Page, seed: Seed) {
  await page.evaluate((s) => {
    const st = window.__demoStore!.getState();
    const base = structuredClone(st.orders[0]);
    const delivery =
      s.delivery === "retirada"
        ? { type: "retirada" as const }
        : s.delivery === "digital"
          ? { type: "digital" as const }
          : { type: "entrega" as const, address: "Av. Paulista, 1000 — Bela Vista, São Paulo/SP — CEP 01310-100", shipping: 1490 };
    const createdAt = s.createdAt ?? new Date().toISOString();
    st.placeOrder({
      ...base,
      id: s.id,
      status: (s.status ?? "pago") as typeof base.status,
      regret: undefined,
      history: undefined,
      createdAt,
      delivery,
      customer: { ...base.customer, name: s.name ?? "Ana Souza", email: s.email ?? "ana@example.com" },
    });
  }, seed);
}

export const VALID_CPF = "529.982.247-25";

/** Compra de verdade pela loja (carrinho → checkout → cartão de teste), com adicionais no Forno. Devolve o número do pedido. */
export async function buyThroughStore(page: Page, opts: { marketing?: boolean } = {}) {
  await ready(page, "/carrinho");
  const forno = currentPreset() === FORNO;
  await page.evaluate((isForno) => {
    const st = window.__demoStore!.getState();
    if (isForno) st.addToCart({ productId: "fv-001", variantId: "fv-mar-gra", addonIds: ["azeitonas", "borda-catupiry"], qty: 2 });
    else st.addToCart({ productId: "ts-014", qty: 1 });
    st.setShipping("01310100", "economico");
  }, forno);
  await page.goto("/checkout");
  await page.waitForLoadState("networkidle");
  await page.locator("#chk-name").fill("Ana Souza");
  await page.locator("#chk-email").fill("ana@example.com");
  await page.locator("#chk-phone").fill("11912345678");
  await page.locator("#chk-cpf").fill(VALID_CPF);
  if (opts.marketing) await page.getByLabel("Quero receber ofertas").check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.locator("#chk-street").fill("Av. Paulista");
  await page.locator("#chk-number").fill("1000");
  await page.locator("#chk-district").fill("Bela Vista");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("radio", { name: "Cartão de crédito" }).check();
  await page.locator("#chk-cardNumber").fill("4111111111111111");
  await page.locator("#chk-cardName").fill("ANA SOUZA");
  await page.locator("#chk-cardExpiry").fill("1230");
  await page.locator("#chk-cardCvv").fill("7381");
  await page.getByTestId("finish").click();
  await expect(page.getByTestId("order-status")).toBeVisible();
  return page.evaluate(() => window.__demoStore!.getState().orders[0].id);
}
