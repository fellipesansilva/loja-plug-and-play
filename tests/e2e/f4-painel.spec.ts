import { devices, type Page } from "@playwright/test";
import { expect, test, currentPreset, inStore, ORIGIN, FORNO, SHORT, TRAMA } from "./helpers";

const ready = async (page: Page, route = "/") => {
  await page.goto(route);
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => !!window.__demoStore);
};

const MOBILE = {
  userAgent: devices["Pixel 5"].userAgent,
  isMobile: true,
  hasTouch: true,
  viewport: { width: 400, height: 800 },
  screen: { width: 400, height: 800 },
  deviceScaleFactor: 2,
};

const overflowOf = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

type Seed = { id: string; name?: string; email?: string; status?: string; delivery?: "entrega" | "retirada" | "digital"; createdAt?: string };

/** Pedido gravado direto no store (a partir de um pedido de exemplo do preset), com id, cliente e data conhecidos. */
async function placeOrder(page: Page, seed: Seed) {
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

test.describe("painel · faixa e indexação", () => {
  test("todas as telas do painel têm a faixa fixa 'Painel de demonstração'", async ({ page }) => {
    for (const route of ["/painel/pedidos", "/painel/produtos", "/painel/importacao", "/painel/configuracoes/loja", "/painel/login"]) {
      await ready(page, route);
      await expect(page.getByTestId("painel-demo-banner"), route).toHaveText("Painel de demonstração");
      // fixa: continua visível depois de rolar
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expect(page.getByTestId("painel-demo-banner"), route).toBeInViewport();
    }
  });

  test("as páginas do painel têm noindex", async ({ request }) => {
    for (const route of ["/painel/pedidos", "/painel/produtos", "/painel/importacao"]) {
      const html = await (await request.get(route)).text();
      expect(html, route).toMatch(/<meta name="robots" content="noindex/);
    }
    const store = await (await request.get("/")).text();
    expect(store).not.toMatch(/<meta name="robots" content="noindex/);
  });
});

test.describe("H1 · lista de pedidos", () => {
  test("mostra os pedidos do preset, do mais recente ao mais antigo, com as colunas pedidas", async ({ page }) => {
    await ready(page, "/painel/pedidos");
    const orders = await page.evaluate(() => window.__demoStore!.getState().orders.map((o) => ({ id: o.id, at: o.createdAt })));
    const expected = [...orders].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).map((o) => o.id);
    await expect(page.getByTestId("order-row")).toHaveCount(orders.length);
    expect(await page.getByTestId("order-row").evaluateAll((els) => els.map((e) => e.getAttribute("data-order-id")))).toEqual(expected);
    const row = page.getByTestId("order-row").first();
    for (const label of ["Data", "Cliente", "Total", "Pagamento", "Entrega"]) await expect(row.locator("dt", { hasText: new RegExp(`^${label}$`) })).toBeVisible();
    await expect(row.getByTestId("order-row-status")).toBeVisible();
    await expect(row.getByTestId("order-link")).toHaveAttribute("href", inStore(`/painel/pedidos/${expected[0]}`));
  });

  test("pedido feito nesta loja aparece no topo e não aparece na outra loja", async ({ page }) => {
    await ready(page, "/");
    await placeOrder(page, { id: "XX-8001", name: "Zeca Recente" });
    await page.goto("/painel/pedidos");
    await expect(page.getByTestId("order-row").first()).toHaveAttribute("data-order-id", "XX-8001");

    const other = currentPreset() === TRAMA ? FORNO : TRAMA;
    await page.goto(`${ORIGIN}/${SHORT[other]}/painel/pedidos`);
    await page.waitForFunction(() => !!window.__demoStore);
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("order-row").first()).toBeVisible();
    await expect(page.locator('[data-order-id="XX-8001"]')).toHaveCount(0);
  });

  test("filtro por status e busca por número ou nome", async ({ page }) => {
    await ready(page, "/");
    await placeOrder(page, { id: "XX-8002", name: "João Álvares", status: "enviado", createdAt: new Date(Date.now() - 1000).toISOString() });
    await placeOrder(page, { id: "XX-8003", name: "Maria Lima", status: "cancelado" });
    await page.goto("/painel/pedidos");
    const rows = page.getByTestId("order-row");

    await page.getByLabel("Status").selectOption("cancelado");
    await expect(rows.first()).toHaveAttribute("data-order-id", "XX-8003");
    expect(await rows.evaluateAll((els) => els.map((e) => e.querySelector('[data-testid="order-row-status"]')?.textContent))).toEqual(
      Array(await rows.count()).fill("Cancelado"),
    );

    await page.getByLabel("Status").selectOption("todos");
    await page.getByLabel("Buscar por número ou cliente").fill("xx-8002");
    await expect(rows).toHaveCount(1);
    await page.getByLabel("Buscar por número ou cliente").fill("joao alvares");
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toHaveAttribute("data-order-id", "XX-8002");

    await page.getByLabel("Status").selectOption("pago");
    await expect(page.getByTestId("orders-empty")).toBeVisible();
    await page.getByLabel("Status").selectOption("todos");
    await page.getByLabel("Buscar por número ou cliente").fill("");
    await expect(rows.first()).toBeVisible();
  });

  test.describe("celular 400 px", () => {
    test.use(MOBILE);
    test("sem rolagem horizontal", async ({ page }) => {
      await ready(page, "/painel/pedidos");
      await expect(page.getByTestId("order-row").first()).toBeVisible();
      expect(await overflowOf(page)).toBeLessThanOrEqual(0);
    });
  });
});
