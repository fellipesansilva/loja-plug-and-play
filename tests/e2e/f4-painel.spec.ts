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

const VALID_CPF = "529.982.247-25";

/** Compra de verdade pela loja (carrinho → checkout → cartão de teste), com adicionais no Forno. Devolve o número do pedido. */
async function buyThroughStore(page: Page, opts: { marketing?: boolean } = {}) {
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

test.describe("H2 · detalhe do pedido", () => {
  test("pedido real com adicionais: itens, valores, endereço, pagamento, cliente, histórico — sem CPF nem cartão completos", async ({ page }) => {
    const id = await buyThroughStore(page, { marketing: true });
    const order = await page.evaluate(() => window.__demoStore!.getState().orders[0]);

    await page.goto("/painel/pedidos");
    await page.getByTestId("order-row").first().getByTestId("order-link").click();
    await expect(page).toHaveURL(new RegExp(`/painel/pedidos/${id}$`));
    await expect(page.getByTestId("detail-id")).toHaveText(`Pedido ${id}`);
    await expect(page.getByTestId("detail-status")).toHaveText("Pago");

    // itens (com variação) e adicionais
    await expect(page.getByTestId("detail-item")).toHaveCount(order.items.length);
    await expect(page.getByTestId("detail-item").first()).toContainText(order.items[0].name);
    if (currentPreset() === FORNO) {
      await expect(page.getByTestId("detail-item").first()).toContainText("2×");
      await expect(page.getByTestId("detail-addons")).toContainText("Azeitonas");
      await expect(page.getByTestId("detail-addons")).toContainText("Borda recheada de catupiry");
    }
    // valores
    const brl = (c: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(c / 100).replace(/\s/g, " ");
    const norm = (t: string | null) => (t ?? "").replace(/\s/g, " ");
    expect(norm(await page.getByTestId("detail-total").textContent())).toBe(brl(order.total));
    expect(norm(await page.getByTestId("detail-subtotal").textContent())).toBe(brl(order.subtotal!));
    await expect(page.getByTestId("detail-shipping-row")).toContainText("Frete");
    // entrega e pagamento
    await expect(page.getByTestId("detail-address")).toContainText("Av. Paulista, 1000");
    await expect(page.getByTestId("detail-payment-text")).toContainText("Cartão de crédito · Visa final 1111");
    // cliente
    await expect(page.getByTestId("detail-customer-name")).toHaveText("Ana Souza");
    await expect(page.getByTestId("detail-cpf")).toHaveText("CPF ***.***.***-25");
    await expect(page.getByTestId("detail-marketing")).toContainText(/Aceitou receber ofertas em \d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
    // histórico
    await expect(page.getByTestId("history-entry")).toHaveCount(1);
    await expect(page.getByTestId("history-entry").first()).toContainText("Pago");

    // nada sensível no DOM
    const html = await page.content();
    for (const secret of [VALID_CPF, "52998224725", "529.982", "4111111111111111", "4111 1111 1111", "7381"]) expect(html, secret).not.toContain(secret);
  });

  test("pedido sem consentimento de marketing diz que não aceitou", async ({ page }) => {
    const id = await buyThroughStore(page);
    await page.goto(`/painel/pedidos/${id}`);
    await expect(page.getByTestId("detail-marketing")).toHaveText("Não aceitou receber ofertas.");
  });

  test("pedido de exemplo abre (histórico com o status inicial) e mostra o arrependimento quando houver", async ({ page }) => {
    await ready(page, "/");
    await placeOrder(page, { id: "XX-8101", email: "ana@example.com", status: "pago" });
    await page.goto("/arrependimento");
    await page.locator("#chk-regretOrder").fill("XX-8101");
    await page.locator("#chk-regretEmail").fill("ana@example.com");
    await page.getByRole("button", { name: "Desistir da compra" }).click();
    const protocol = await page.getByTestId("regret-protocol").textContent();
    await page.goto("/painel/pedidos/XX-8101");
    await expect(page.getByTestId("detail-status")).toHaveText("Cancelado");
    await expect(page.getByTestId("detail-regret-protocol")).toHaveText(protocol!);
    await expect(page.getByTestId("history-entry")).toHaveCount(2);

    await page.goto("/painel/pedidos/nao-existe");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pedido não encontrado");
  });

  test.describe("celular 400 px", () => {
    test.use(MOBILE);
    test("detalhe sem rolagem horizontal", async ({ page }) => {
      await ready(page, "/");
      await placeOrder(page, { id: "XX-8102" });
      await page.goto("/painel/pedidos/XX-8102");
      await expect(page.getByTestId("detail-id")).toBeVisible();
      expect(await overflowOf(page)).toBeLessThanOrEqual(0);
    });
  });
});
