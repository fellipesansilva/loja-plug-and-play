import { type Page } from "@playwright/test";
import { expect, test, currentPreset, inStore, ORIGIN, FORNO, SHORT, TRAMA } from "./helpers";
import { MOBILE, VALID_CPF, buyThroughStore, overflowOf, placeOrder, ready } from "./painel-helpers";

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

test.describe("H3 · mudança de status", () => {
  const detailStatus = (page: Page) => page.getByTestId("detail-status");
  const onlyActions = async (page: Page, expected: string[]) => {
    const ids = await page.locator('[data-testid^="status-to-"]').evaluateAll((els) => els.map((e) => e.getAttribute("data-testid")!.replace("status-to-", "")));
    expect(ids).toEqual(expected);
  };

  test("pedido de entrega percorre o fluxo completo, e só as próximas etapas aparecem", async ({ page }) => {
    await ready(page, "/");
    await placeOrder(page, { id: "XX-8201", status: "aguardando_pagamento" });
    await page.goto("/painel/pedidos/XX-8201");
    await expect(detailStatus(page)).toHaveText("Aguardando pagamento");

    await onlyActions(page, ["pago"]);
    await page.getByTestId("status-to-pago").click();
    await expect(detailStatus(page)).toHaveText("Pago");

    await onlyActions(page, ["em_separacao"]);
    await page.getByTestId("status-to-em_separacao").click();
    await expect(detailStatus(page)).toHaveText("Em separação");

    await onlyActions(page, ["enviado"]);
    await expect(page.getByTestId("status-to-enviado")).toHaveText("Marcar como Enviado");
    await page.getByTestId("status-to-enviado").click();
    await expect(detailStatus(page)).toHaveText("Enviado");

    await onlyActions(page, ["entregue"]);
    await page.getByTestId("status-to-entregue").click();
    await expect(detailStatus(page)).toHaveText("Entregue");

    // final: sem próximas etapas e sem cancelar
    await expect(page.getByTestId("status-actions")).toHaveCount(0);
    await expect(page.getByTestId("status-final")).toBeVisible();
    await expect(page.getByTestId("status-cancel")).toHaveCount(0);

    // histórico com data e hora, na ordem
    const entries = page.getByTestId("history-entry");
    await expect(entries).toHaveCount(5);
    await expect(entries).toHaveText([/Aguardando pagamento/, /Pago/, /Em separação/, /Enviado/, /Entregue/]);
    for (const text of await entries.allTextContents()) expect(text).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
  });

  test("pedido de retirada: 'enviado' usa o rótulo do preset (Forno: Pronto para retirada)", async ({ page }) => {
    await ready(page, "/");
    await placeOrder(page, { id: "XX-8202", status: "em_separacao", delivery: "retirada" });
    await page.goto("/painel/pedidos/XX-8202");
    const label = currentPreset() === FORNO ? "Pronto para retirada" : "Enviado";
    await expect(page.getByTestId("status-to-enviado")).toHaveText(`Marcar como ${label}`);
    await page.getByTestId("status-to-enviado").click();
    await expect(detailStatus(page)).toHaveText(label);
    await expect(page.getByTestId("history-entry").last()).toContainText(label);

    // a lista e a confirmação na loja usam o mesmo rótulo
    await page.goto("/painel/pedidos");
    await expect(page.locator('[data-order-id="XX-8202"] [data-testid="order-row-status"]')).toHaveText(label);
    await page.goto("/pedido/XX-8202");
    await expect(page.getByTestId("order-status")).toHaveText(label);
  });

  test("pedido só digital vai de pago direto para entregue", async ({ page }) => {
    await ready(page, "/");
    await placeOrder(page, { id: "XX-8203", status: "pago", delivery: "digital" });
    await page.goto("/painel/pedidos/XX-8203");
    await onlyActions(page, ["entregue"]);
    await page.getByTestId("status-to-entregue").click();
    await expect(detailStatus(page)).toHaveText("Entregue");
    await expect(page.getByTestId("history-entry")).toHaveText([/Pago/, /Entregue/]);
  });

  test("cancelar exige confirmação; 'Voltar' e Esc não cancelam", async ({ page }) => {
    await ready(page, "/");
    await placeOrder(page, { id: "XX-8204", status: "em_separacao" });
    await page.goto("/painel/pedidos/XX-8204");
    await page.getByTestId("status-cancel").click();
    const confirm = page.getByTestId("cancel-confirm");
    await expect(confirm).toBeVisible();
    await expect(page.getByTestId("cancel-confirm-yes")).toBeFocused();
    await expect(detailStatus(page)).toHaveText("Em separação"); // ainda não cancelou

    await confirm.getByRole("button", { name: "Voltar" }).click();
    await expect(confirm).toHaveCount(0);
    await expect(detailStatus(page)).toHaveText("Em separação");

    await page.getByTestId("status-cancel").click();
    await page.keyboard.press("Escape");
    await expect(confirm).toHaveCount(0);
    await expect(detailStatus(page)).toHaveText("Em separação");

    await page.getByTestId("status-cancel").click();
    await page.getByTestId("cancel-confirm-yes").click();
    await expect(detailStatus(page)).toHaveText("Cancelado");
    await expect(page.getByTestId("status-actions")).toHaveCount(0);
    await expect(page.getByTestId("history-entry").last()).toContainText("Cancelado");
  });

  test("a confirmação do pedido na loja mostra o status novo", async ({ page }) => {
    const id = await buyThroughStore(page);
    await expect(page.getByTestId("order-status")).toHaveText("Pago");
    await page.goto(`/painel/pedidos/${id}`);
    await page.getByTestId("status-to-em_separacao").click();
    await page.getByTestId("status-to-enviado").click();
    await expect(detailStatus(page)).toHaveText("Enviado");
    await page.goto(`/pedido/${id}`);
    await expect(page.getByTestId("order-status")).toHaveText("Enviado");
    // sobrevive ao recarregar (fica no localStorage da loja)
    await page.reload();
    await expect(page.getByTestId("order-status")).toHaveText("Enviado");
  });

  test("o painel Demo 'Simular pagamento aprovado' também entra no histórico", async ({ page }) => {
    await ready(page, "/");
    await placeOrder(page, { id: "XX-8205", status: "aguardando_pagamento" });
    await page.goto("/pedido/XX-8205");
    await page.getByRole("button", { name: "Demo", exact: true }).click();
    await page.getByRole("button", { name: "Simular pagamento aprovado" }).click();
    await page.goto("/painel/pedidos/XX-8205");
    await expect(detailStatus(page)).toHaveText("Pago");
    await expect(page.getByTestId("history-entry")).toHaveText([/Aguardando pagamento/, /Pago/]);
  });
});
