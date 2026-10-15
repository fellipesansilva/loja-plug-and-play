import { expect, test, type Page } from "@playwright/test";
import { FORNO, TRAMA, openAs, storageKey } from "./helpers";

const VALID_CPF = "529.982.247-25";

type Seed = { productId: string; variantId?: string; addonIds?: string[]; qty?: number };
async function seedCart(page: Page, ...items: Seed[]) {
  await page.evaluate((list) => {
    const state = window.__demoStore!.getState();
    for (const i of list) state.addToCart({ productId: i.productId, variantId: i.variantId, addonIds: i.addonIds, qty: i.qty ?? 1 });
  }, items);
}
const state = (page: Page) =>
  page.evaluate(() => {
    const s = window.__demoStore!.getState();
    return { cart: s.cart, orders: s.orders, checkout: s.checkout };
  });
const overflowOf = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

async function fillIdentification(page: Page, over: Partial<Record<"name" | "email" | "phone" | "cpf", string>> = {}) {
  const v = { name: "Ana Souza", email: "ana@example.com", phone: "11912345678", cpf: VALID_CPF, ...over };
  await page.locator("#chk-name").fill(v.name);
  await page.locator("#chk-email").fill(v.email);
  await page.locator("#chk-phone").fill(v.phone);
  await page.locator("#chk-cpf").fill(v.cpf);
}
async function fillAddress(page: Page) {
  await page.locator("#chk-street").fill("Av. Paulista");
  await page.locator("#chk-number").fill("1000");
  await page.locator("#chk-district").fill("Bela Vista");
}
const next = (page: Page) => page.getByRole("button", { name: "Continuar" }).click();
const finish = (page: Page) => page.getByTestId("finish").click();

/** Carrinho com um item físico e a entrega escolhida (Econômico no CEP 01310-100). */
async function readyToCheckout(page: Page, preset: string, seed: Seed) {
  await openAs(page, preset, "/carrinho");
  await seedCart(page, seed);
  await page.evaluate(() => window.__demoStore!.getState().setShipping("01310100", "economico"));
  await page.goto("/checkout");
  await page.waitForLoadState("networkidle");
}

test.describe("F2-01 · carrinho", () => {
  test("Trama: carrinho vazio com mensagem e botão para a home", async ({ page }) => {
    await openAs(page, TRAMA, "/carrinho");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Carrinho");
    await expect(page.getByTestId("cart-empty")).toHaveText("Seu carrinho está vazio");
    await page.getByRole("link", { name: "Ir para a home" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("Forno: o carrinho se chama Sacola", async ({ page }) => {
    await openAs(page, FORNO, "/carrinho");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sacola");
    await expect(page.getByTestId("cart-empty")).toHaveText("Sua sacola está vazia");
    await expect(page).toHaveTitle("Sacola · Forno da Vila");
    await seedCart(page, { productId: "fv-013" });
    await expect(page.getByRole("link", { name: /^Sacola, 1 item/ })).toBeVisible();
  });

  test("linha com variante e adicionais; quantidade respeita o estoque; remover", async ({ page }) => {
    await openAs(page, FORNO, "/carrinho");
    await seedCart(page, { productId: "fv-012", variantId: "fv-vul-int", addonIds: ["morangos", "sorvete"] }); // inteiro: estoque 4
    const line = page.getByTestId("cart-line");
    await expect(line).toContainText("Bolo Vulcão de Chocolate");
    await expect(line).toContainText("Inteiro");
    await expect(line).toContainText("+ Bola de sorvete de creme, Morangos frescos");
    await expect(line).toContainText("R$ 121,90 cada"); // 109,90 + 7,00 + 5,00
    await expect(page.getByTestId("line-total")).toContainText("121,90");

    const plus = page.getByRole("button", { name: "Aumentar quantidade de Bolo Vulcão de Chocolate" });
    const minus = page.getByRole("button", { name: "Diminuir quantidade de Bolo Vulcão de Chocolate" });
    await expect(minus).toBeDisabled(); // mínimo 1
    for (let i = 0; i < 6; i++) if (await plus.isEnabled()) await plus.click();
    await expect(page.getByTestId("line-qty")).toHaveText("4");
    await expect(plus).toBeDisabled(); // estoque da variante
    await expect(page.getByTestId("line-total")).toContainText("487,60");
    await minus.click();
    await expect(page.getByTestId("line-qty")).toHaveText("3");

    await page.getByRole("button", { name: "Remover Bolo Vulcão de Chocolate" }).click();
    await expect(page.getByTestId("cart-empty")).toBeVisible();
    expect((await state(page)).cart).toEqual([]);
  });

  test("combinações diferentes do mesmo produto são linhas diferentes", async ({ page }) => {
    await openAs(page, FORNO, "/carrinho");
    await seedCart(page, { productId: "fv-013", addonIds: ["sorvete"] }, { productId: "fv-013" });
    await expect(page.getByTestId("cart-line")).toHaveCount(2);
  });

  test("cupom: aplicado, vencido, inválido e abaixo do mínimo (sem diferenciar maiúsculas)", async ({ page }) => {
    await openAs(page, TRAMA, "/carrinho");
    await seedCart(page, { productId: "ts-008", variantId: "ts-cbp-p-pt" }); // R$ 99,90 (mínimo do cupom é R$ 100)
    const field = page.getByLabel("Código do cupom");
    const message = page.getByTestId("coupon-message");

    await field.fill("bemvinda10");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await expect(message).toContainText("abaixo do mínimo de R$ 100,00");

    await seedCart(page, { productId: "ts-008", variantId: "ts-cbp-p-pt" }); // R$ 199,80
    await expect(message).toContainText("Cupom BEMVINDA10 aplicado");
    await expect(page.getByTestId("sum-coupon")).toContainText("19,98");

    await field.fill("VERAO2024");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await expect(message).toHaveText("Cupom vencido");
    await expect(page.getByTestId("sum-coupon")).toHaveCount(0);

    await field.fill("naoexiste");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await expect(message).toHaveText("Cupom inválido");

    await field.fill("BemVinda10");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await expect(message).toContainText("aplicado");
    await page.getByRole("button", { name: "Remover cupom" }).click();
    await expect(page.getByTestId("sum-coupon")).toHaveCount(0);
  });

  test("frete grátis compara o subtotal do carrinho, não o preço de um item", async ({ page }) => {
    await openAs(page, TRAMA, "/carrinho");
    await seedCart(page, { productId: "ts-008", variantId: "ts-cbp-p-pt" }); // R$ 99,90: abaixo de R$ 199
    await page.getByLabel("CEP").fill("01310100");
    await page.getByRole("button", { name: "Calcular" }).click();
    const options = page.getByTestId("shipping-options");
    await expect(options).toContainText("Faltam R$ 99,10 para frete grátis");
    await expect(options).toContainText("R$ 14,90");
    await expect(page.getByTestId("sum-shipping")).toHaveText("A calcular");

    await seedCart(page, { productId: "ts-008", variantId: "ts-cbp-p-pt" }); // subtotal R$ 199,80
    await expect(options).not.toContainText("Faltam");
    await options.getByLabel(/Econômico/).check();
    await expect(page.getByTestId("sum-shipping")).toHaveText("Grátis");
    await expect(page.getByTestId("sum-total")).toContainText("199,80");
  });

  test("Continuar fica bloqueado sem entrega; CEP inválido mostra erro; fora da cobertura só retirada (Forno)", async ({ page }) => {
    await openAs(page, FORNO, "/carrinho");
    await seedCart(page, { productId: "fv-013" });
    const cont = page.getByRole("button", { name: "Continuar" });
    await expect(cont).toBeDisabled();

    await page.getByLabel("CEP").fill("123");
    await page.getByRole("button", { name: "Calcular" }).click();
    await expect(page.locator("p[role=alert]").first()).toHaveText("CEP inválido");

    await page.getByLabel("CEP").fill("80010000");
    await page.getByRole("button", { name: "Calcular" }).click();
    await expect(page.getByText("Não entregamos neste CEP")).toBeVisible();
    await expect(page.getByLabel(/Econômico/)).toHaveCount(0);

    await page.getByLabel(/Retirar na loja/).check();
    await expect(page.getByRole("link", { name: "Continuar" })).toHaveAttribute("href", "/checkout");
    await expect(page.getByTestId("sum-shipping-row")).toContainText("Retirada no local");
    await expect(page.getByTestId("sum-shipping")).toHaveText(/^R\$\s0,00$/);
    await expect(page.getByTestId("sum-shipping-row")).not.toContainText("Grátis");
  });

  test("o checkout sem entrega escolhida volta para o carrinho", async ({ page }) => {
    await openAs(page, TRAMA, "/carrinho");
    await seedCart(page, { productId: "ts-014" });
    await page.goto("/checkout");
    await expect(page.getByTestId("checkout-blocked")).toHaveText("Escolha a forma de entrega antes de continuar");
    await page.getByRole("link", { name: "Voltar para o carrinho" }).click();
    await expect(page).toHaveURL(/\/carrinho$/);
  });
});

test.describe("F2-04 · desconto no Pix", () => {
  test("Trama mostra 'No Pix' no card, no produto, no carrinho e no pagamento", async ({ page }) => {
    await openAs(page, TRAMA);
    await expect(page.getByTestId("pix-price").first()).toHaveText(/No Pix: R\$\s370,40/); // 389,90 − 5%

    await page.goto("/produto/bolsa-tote-couro");
    await expect(page.getByTestId("pix-price")).toHaveText(/No Pix: R\$\s436,90/); // 459,90 − 5%

    await openAs(page, TRAMA, "/carrinho");
    await seedCart(page, { productId: "ts-014" });
    await expect(page.getByTestId("pix-price")).toHaveText(/No Pix: R\$\s436,90/);

    await page.evaluate(() => window.__demoStore!.getState().setShipping("01310100", "economico"));
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");
    await fillIdentification(page);
    await next(page);
    await fillAddress(page);
    await next(page);
    await expect(page.getByTestId("pix-price")).toHaveText(/No Pix: R\$\s436,90/);
    await expect(page.getByTestId("summary-pix-discount")).toHaveText(/−R\$\s23,00/);
  });

  test("Forno não mostra nenhuma linha de Pix", async ({ page }) => {
    await openAs(page, FORNO);
    await expect(page.getByTestId("pix-price")).toHaveCount(0);
    await page.goto("/produto/pizza-margherita");
    await expect(page.getByTestId("pix-price")).toHaveCount(0);
    await seedCart(page, { productId: "fv-013" });
    await page.goto("/carrinho");
    await expect(page.getByTestId("pix-price")).toHaveCount(0);
    await expect(page.getByTestId("sum-pix")).toHaveCount(0);
  });
});

test.describe("F2-02/03 · checkout e confirmação", () => {
  test("Trama: produto → carrinho → cupom → frete → identificação → entrega → Pix → confirmação → simular pagamento", async ({ page }) => {
    await openAs(page, TRAMA, "/produto/bolsa-tote-couro");
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await page.getByRole("status").getByRole("link", { name: "Ver carrinho" }).click();
    await expect(page).toHaveURL(/\/carrinho$/);

    await page.getByLabel("Código do cupom").fill("bemvinda10");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await page.getByLabel("CEP").fill("01310-100");
    await page.getByRole("button", { name: "Calcular" }).click();
    await page.getByTestId("shipping-options").getByLabel(/Econômico/).check();

    await expect(page.getByTestId("sum-subtotal")).toContainText("459,90");
    await expect(page.getByTestId("sum-coupon")).toContainText("45,99");
    await expect(page.getByTestId("sum-shipping")).toHaveText("Grátis");
    await expect(page.getByTestId("sum-total")).toContainText("413,91");
    await expect(page.getByTestId("pix-price")).toHaveText(/No Pix: R\$\s393,21/);
    await page.getByRole("link", { name: "Continuar" }).click();

    // 1 · identificação
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByTestId("steps").getByRole("listitem")).toHaveText([/Identificação/, /Entrega/, /Pagamento/]);
    await expect(page.getByTestId("steps").locator('[aria-current="step"]')).toContainText("Identificação");
    await expect(page.getByText("Usado para a nota fiscal")).toBeVisible();
    await expect(page.getByLabel(/Quero receber novidades/)).not.toBeChecked();
    await expect(page.getByRole("link", { name: "Política de Privacidade" })).toHaveAttribute("href", "/privacidade");
    await fillIdentification(page);
    await expect(page.locator("#chk-phone")).toHaveValue("(11) 91234-5678");
    await next(page);

    // 2 · entrega (CEP do carrinho; cidade e UF vêm da busca simulada)
    await expect(page.locator("#chk-cep")).toHaveValue("01310-100");
    await expect(page.locator("#chk-city")).toHaveValue("São Paulo");
    await expect(page.locator("#chk-state")).toHaveValue("SP");
    await fillAddress(page);
    await next(page);

    // 3 · pagamento: Pix já selecionado, com o valor com desconto
    await expect(page.getByRole("radio", { name: /^Pix/ })).toBeChecked();
    await expect(page.getByTestId("finish")).toHaveText(/Finalizar pedido · R\$\s393,21/);
    await finish(page);

    // confirmação
    await expect(page).toHaveURL(/\/pedido\/TS-1009$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pedido TS-1009");
    await expect(page.getByTestId("order-status")).toHaveText("Aguardando pagamento");
    await expect(page.getByTestId("fake-qr")).toBeVisible();
    await expect(page.getByTestId("fake-qr")).toContainText("DEMONSTRAÇÃO");
    await expect(page.getByTestId("pix-code")).toContainText("DEMO");
    await expect(page.getByRole("button", { name: "Copiar" })).toBeVisible();
    await expect(page.getByTestId("pix-countdown")).toHaveText(/^(29|30):\d\d$/);
    await expect(page.getByTestId("order-items")).toContainText("1× Bolsa Tote Couro");
    await expect(page.getByTestId("order-delivery")).toContainText("Av. Paulista, 1000");
    await expect(page.getByTestId("order-payment")).toHaveText("Pix");
    await expect(page.getByTestId("order-total")).toHaveText(/393,21/);
    await page.getByRole("button", { name: "Copiar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();

    // pedido gravado, carrinho zerado, e a confirmação sobrevive ao recarregar
    const s = await state(page);
    expect(s.orders[0]).toMatchObject({ id: "TS-1009", status: "aguardando_pagamento", total: 39321, couponCode: "BEMVINDA10", couponDiscount: 4599, pixDiscount: 2070 });
    expect(s.orders[0].items[0]).toMatchObject({ lineId: "ts-014|", quantity: 1, unitPrice: 45990 });
    expect(s.orders[0].customer).toMatchObject({ name: "Ana Souza", cpf: "***.***.***-25", marketingOptIn: false });
    const stored = await page.evaluate((key) => localStorage.getItem(key) ?? "", storageKey());
    expect(stored).not.toContain("52998224725");
    expect(stored).not.toContain("529.982.247-25");
    expect(stored).not.toContain("529.982");
    expect(s.cart).toEqual([]);
    expect(s.checkout).toEqual({ couponCode: null, cep: "", shippingId: null });
    await expect(page.getByTestId("cart-count")).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pedido TS-1009");
    await expect(page.getByTestId("order-total")).toHaveText(/393,21/);

    // Demo: simular pagamento aprovado
    await page.getByRole("button", { name: "Demo", exact: true }).click();
    await page.getByRole("button", { name: "Simular pagamento aprovado" }).click();
    await expect(page.getByTestId("order-status")).toHaveText("Pago");
    await expect(page.getByTestId("payment-confirmed")).toBeVisible();
    await expect(page.getByTestId("fake-qr")).toHaveCount(0);
  });

  test("Forno: entrega com cupom e Pix (sem desconto Pix), confirmação e pagamento simulado", async ({ page }) => {
    await openAs(page, FORNO, "/carrinho");
    await seedCart(page, { productId: "fv-001", variantId: "fv-mar-med" }); // R$ 54,90
    await page.getByLabel("Código do cupom").fill("vila15");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await page.getByLabel("CEP").fill("01310100");
    await page.getByRole("button", { name: "Calcular" }).click();
    await page.getByTestId("shipping-options").getByLabel(/Econômico/).check();
    await expect(page.getByTestId("sum-coupon")).toContainText("8,24"); // 15% de 54,90 = 8,235 → 8,24
    await expect(page.getByTestId("sum-total")).toContainText("56,56"); // 54,90 − 8,24 + 9,90
    await page.getByRole("link", { name: "Continuar" }).click();

    await fillIdentification(page);
    await next(page);
    await fillAddress(page);
    await next(page);
    await expect(page.getByRole("radio", { name: /^Pix/ })).toBeChecked();
    await expect(page.getByRole("radio", { name: "Cartão de crédito" })).toBeVisible(); // cartão à vista
    await expect(page.getByRole("radio", { name: /Boleto/ })).toHaveCount(0);
    await expect(page.getByTestId("finish")).toHaveText(/56,56/);
    await finish(page);

    await expect(page).toHaveURL(/\/pedido\/FV-2009$/);
    await expect(page.getByTestId("order-status")).toHaveText("Aguardando pagamento");
    await expect(page.getByTestId("fake-qr")).toBeVisible();
    await page.getByRole("button", { name: "Demo", exact: true }).click();
    await page.getByRole("button", { name: "Simular pagamento aprovado" }).click();
    await expect(page.getByTestId("order-status")).toHaveText("Pago");
  });

  test("Retirada (Forno): pula o endereço e mostra a loja e o prazo", async ({ page }) => {
    await openAs(page, FORNO, "/carrinho");
    await seedCart(page, { productId: "fv-013", qty: 3 });
    await page.getByLabel(/Retirar na loja/).check();
    await page.getByRole("link", { name: "Continuar" }).click();
    await fillIdentification(page);
    await next(page);

    const step = page.getByTestId("step-delivery");
    await expect(step).toContainText("Retirar na loja");
    await expect(step).toContainText("Praça Exemplo, 45");
    await expect(step).toContainText("Pronto em 20 min");
    await expect(page.locator("#chk-street")).toHaveCount(0);
    await next(page);
    await finish(page);

    await expect(page).toHaveURL(/\/pedido\/FV-2009$/);
    await expect(page.getByTestId("order-delivery")).toHaveText("Retirada na loja");
    await expect(page.getByTestId("order-total")).toHaveText(/44,70/); // 3 × 14,90, sem frete
    expect((await state(page)).orders[0].delivery).toEqual({ type: "retirada" });
  });

  test("Boleto (Trama): vencimento em 3 dias úteis e linha digitável com Copiar", async ({ page }) => {
    await readyToCheckout(page, TRAMA, { productId: "ts-014" });
    await fillIdentification(page);
    await next(page);
    await fillAddress(page);
    await next(page);
    await page.getByRole("radio", { name: "Boleto" }).check();
    await expect(page.getByTestId("finish")).toHaveText(/459,90/); // sem desconto Pix
    await finish(page);

    await expect(page.getByTestId("order-status")).toHaveText("Aguardando pagamento");
    await expect(page.getByTestId("boleto-panel")).toBeVisible();
    await expect(page.getByTestId("boleto-line")).toContainText("00000.00000");
    await expect(page.getByTestId("boleto-due")).toHaveText(/^\d{2}\/\d{2}\/\d{4}$/);
    await expect(page.getByRole("button", { name: "Copiar" })).toBeVisible();
    await expect(page.getByTestId("order-payment")).toHaveText("Boleto");
    await expect(page.getByTestId("fake-qr")).toHaveCount(0);

    const due = (await state(page)).orders[0].payment.dueDate!;
    const [y, m, d] = due.split("-").map(Number);
    const weekday = new Date(y, m - 1, d).getDay();
    expect([0, 6]).not.toContain(weekday); // nunca cai em fim de semana
  });

  test("Cartão de teste aprovado; outro número recusado; nada sensível é gravado", async ({ page }) => {
    await readyToCheckout(page, TRAMA, { productId: "ts-014" });
    await fillIdentification(page);
    await next(page);
    await fillAddress(page);
    await next(page);
    await page.getByRole("radio", { name: "Cartão de crédito" }).check();
    await expect(page.getByTestId("card-warning")).toHaveText("Ambiente de demonstração: não use um cartão real");
    await expect(page.locator("#chk-installments option")).toHaveCount(6);

    await page.locator("#chk-cardNumber").fill("5555555555554444");
    await expect(page.locator("#chk-cardNumber")).toHaveValue("5555 5555 5555 4444");
    await page.locator("#chk-cardName").fill("ANA SOUZA");
    await page.locator("#chk-cardExpiry").fill("1230");
    await page.locator("#chk-cardCvv").fill("7381");
    await finish(page);
    await expect(page.getByText("Cartão recusado (demonstração)")).toBeVisible();
    await expect(page.locator("#chk-cardNumber")).toBeFocused();
    await expect(page).toHaveURL(/\/checkout$/);
    expect((await state(page)).orders).toHaveLength(8);

    await page.locator("#chk-cardNumber").fill("4111111111111111");
    await page.locator("#chk-installments").selectOption("3");
    await finish(page);

    await expect(page).toHaveURL(/\/pedido\/TS-1009$/);
    await expect(page.getByTestId("order-status")).toHaveText("Pago");
    await expect(page.getByTestId("order-payment")).toHaveText("Cartão de crédito · Visa final 1111");
    await expect(page.getByTestId("payment-confirmed")).toContainText("3x");

    const stored = await page.evaluate((key) => localStorage.getItem(key) ?? "", storageKey());
    expect(stored).not.toContain("4111111111111111");
    expect(stored).not.toContain("4111 1111 1111 1111");
    expect(stored).not.toContain("5555");
    expect(stored).not.toContain("7381");
    expect(stored.toLowerCase()).not.toContain("cvv");
    expect((await state(page)).orders[0].payment).toEqual({ method: "cartao", installments: 3, brand: "Visa", last4: "1111" });
  });

  test("CPF inválido bloqueia a etapa 1 com mensagem e foco no campo", async ({ page }) => {
    await readyToCheckout(page, TRAMA, { productId: "ts-014" });
    await fillIdentification(page, { cpf: "111.111.111-11" });
    await next(page);
    await expect(page.getByText("CPF inválido")).toBeVisible();
    await expect(page.locator("#chk-cpf")).toBeFocused();
    await expect(page.locator("#chk-cpf")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByTestId("step-id")).toBeVisible();

    await page.locator("#chk-cpf").fill("529.982.247-26"); // dígito verificador errado
    await next(page);
    await expect(page.getByText("CPF inválido")).toBeVisible();

    await page.locator("#chk-cpf").fill(VALID_CPF);
    await next(page);
    await expect(page.getByTestId("step-delivery")).toBeVisible();
  });

  test("campos vazios: erros inline e foco no primeiro; endereço e cartão também", async ({ page }) => {
    await readyToCheckout(page, TRAMA, { productId: "ts-014" });
    await next(page);
    await expect(page.locator("#chk-name")).toBeFocused();
    for (const msg of ["Informe nome e sobrenome", "E-mail inválido", "Celular inválido", "CPF inválido"]) {
      await expect(page.getByText(msg)).toBeVisible();
    }
    await fillIdentification(page);
    await next(page);
    await page.locator("#chk-street").fill("");
    await next(page);
    await expect(page.locator("#chk-street")).toBeFocused();
    await expect(page.getByText("Informe a rua")).toBeVisible();
    await expect(page.getByText("Informe o número")).toBeVisible();
    await fillAddress(page);
    await next(page);
    await page.getByRole("radio", { name: "Cartão de crédito" }).check();
    await finish(page);
    await expect(page.locator("#chk-cardNumber")).toBeFocused();
    await expect(page.getByText("Número do cartão inválido")).toBeVisible();
  });

  test("CEP sem busca simulada pede cidade e UF à mão (prefixo fora de 01–05)", async ({ page }) => {
    await openAs(page, TRAMA, "/carrinho");
    await seedCart(page, { productId: "ts-014" });
    await page.evaluate(() => window.__demoStore!.getState().setShipping("40000000", "economico"));
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");
    await fillIdentification(page);
    await next(page);
    await expect(page.locator("#chk-cep")).toHaveValue("40000-000");
    await expect(page.locator("#chk-city")).toHaveValue("");
    await expect(page.locator("#chk-state")).toHaveValue("");
  });

  test("a marca de marketing desmarcada por padrão é gravada como escolhida", async ({ page }) => {
    await readyToCheckout(page, TRAMA, { productId: "ts-014" });
    await fillIdentification(page);
    await page.getByLabel(/Quero receber novidades/).check();
    await next(page);
    await fillAddress(page);
    await next(page);
    await finish(page);
    await expect(page.getByTestId("order-status")).toBeVisible();
    expect((await state(page)).orders[0].customer.marketingOptIn).toBe(true);
  });

  test("o resumo do pedido acompanha a forma de pagamento (Pix com desconto, cartão sem)", async ({ page }) => {
    await readyToCheckout(page, TRAMA, { productId: "ts-014" });
    await fillIdentification(page);
    await next(page);
    await fillAddress(page);
    await next(page);
    const summary = page.getByTestId("order-summary");
    await expect(summary).toContainText("Desconto no Pix");
    await page.getByRole("radio", { name: "Cartão de crédito" }).check();
    await expect(summary).not.toContainText("Desconto no Pix");
    await expect(page.getByTestId("summary-total")).toContainText("459,90");
  });
});

test.describe("F2 · ajustes de revisão", () => {
  test("Forno paga com o cartão de teste à vista (sem parcelas)", async ({ page }) => {
    await readyToCheckout(page, FORNO, { productId: "fv-001", variantId: "fv-mar-med" }); // R$ 54,90 + frete R$ 9,90
    await fillIdentification(page);
    await next(page);
    await fillAddress(page);
    await next(page);
    await page.getByRole("radio", { name: "Cartão de crédito" }).check();
    await expect(page.getByTestId("card-warning")).toBeVisible();
    await expect(page.locator("#chk-installments")).toHaveCount(0); // sem o módulo de parcelamento
    await expect(page.getByTestId("card-cash")).toContainText("à vista");
    await expect(page.getByTestId("card-cash")).toContainText("64,80");
    await page.locator("#chk-cardNumber").fill("4111111111111111");
    await page.locator("#chk-cardName").fill("ANA SOUZA");
    await page.locator("#chk-cardExpiry").fill("1230");
    await page.locator("#chk-cardCvv").fill("4417");
    await expect(page.getByTestId("finish")).toHaveText(/64,80/);
    await finish(page);

    await expect(page).toHaveURL(/\/pedido\/FV-2009$/);
    await expect(page.getByTestId("order-status")).toHaveText("Pago");
    await expect(page.getByTestId("order-payment")).toHaveText("Cartão de crédito · Visa final 1111");
    await expect(page.getByTestId("payment-confirmed")).toContainText("à vista");
    expect((await state(page)).orders[0].payment).toEqual({ method: "cartao", installments: 1, brand: "Visa", last4: "1111" });
    const stored = await page.evaluate((key) => localStorage.getItem(key) ?? "", storageKey());
    expect(stored).not.toContain("4111111111111111");
    expect(stored).not.toContain("4417");
  });

  test("Forno recusa outro número de cartão à vista", async ({ page }) => {
    await readyToCheckout(page, FORNO, { productId: "fv-013" });
    await fillIdentification(page);
    await next(page);
    await fillAddress(page);
    await next(page);
    await page.getByRole("radio", { name: "Cartão de crédito" }).check();
    await page.locator("#chk-cardNumber").fill("5555555555554444");
    await page.locator("#chk-cardName").fill("ANA SOUZA");
    await page.locator("#chk-cardExpiry").fill("1230");
    await page.locator("#chk-cardCvv").fill("123");
    await finish(page);
    await expect(page.getByText("Cartão recusado (demonstração)")).toBeVisible();
    await expect(page).toHaveURL(/\/checkout$/);
  });

  test("Trama continua com parcelas no cartão", async ({ page }) => {
    await readyToCheckout(page, TRAMA, { productId: "ts-014" });
    await fillIdentification(page);
    await next(page);
    await fillAddress(page);
    await next(page);
    await page.getByRole("radio", { name: "Cartão de crédito" }).check();
    await expect(page.locator("#chk-installments option")).toHaveCount(6);
    await expect(page.getByTestId("card-cash")).toHaveCount(0);
  });

  test("CPF: nenhum CPF completo em store.orders nem no localStorage, em qualquer forma de pagamento", async ({ page }) => {
    await readyToCheckout(page, FORNO, { productId: "fv-013" });
    await fillIdentification(page, { cpf: "111.444.777-35" });
    await next(page);
    await fillAddress(page);
    await next(page);
    await finish(page);
    await expect(page.getByTestId("order-status")).toBeVisible();
    const s = await state(page);
    expect(s.orders[0].customer.cpf).toBe("***.***.***-35");
    const everything = JSON.stringify(s.orders) + (await page.evaluate((key) => localStorage.getItem(key) ?? "", storageKey()));
    expect(everything).not.toContain("11144477735");
    expect(everything).not.toContain("111.444.777");
    expect(everything).not.toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/); // nenhum CPF completo, formatado
    expect(everything).not.toMatch(/"cpf":"\d{11}"/);
  });

  /** Todo texto que a pessoa vê ou ouve: texto da página + aria-label, alt, title e placeholder. */
  const visibleWords = (page: Page) =>
    page.evaluate(() => {
      const attrs = [...document.querySelectorAll("[aria-label],[alt],[title],[placeholder]")].flatMap((el) =>
        ["aria-label", "alt", "title", "placeholder"].map((a) => el.getAttribute(a) ?? ""),
      );
      return [document.title, document.body.innerText, ...attrs].join("\n");
    });

  test("Forno: a palavra 'carrinho' não aparece em nenhuma tela; sempre 'sacola'", async ({ page }) => {
    test.setTimeout(90_000); // percorre muitas telas; com a máquina carregada pode passar de 30 s
    await openAs(page, FORNO);
    const screens: string[] = [];
    const expected = (await page.getByTestId("store-name").getAttribute("aria-label")) ?? "";
    const collect = async () => {
      // depois de um goto o HTML inicial é do preset padrão: espera hidratar no preset da loja
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId("store-name")).toHaveAccessibleName(expected);
      screens.push(await visibleWords(page));
    };

    await collect(); // home
    await page.goto("/categoria/pizzas");
    await collect();
    await page.goto("/busca?q=pizza");
    await collect();
    await page.goto("/carrinho"); // vazio
    await collect();
    await page.goto("/checkout"); // vazio
    await collect();
    for (const route of ["/sobre", "/trocas-e-devolucoes", "/privacidade"]) {
      await page.goto(route);
      await collect();
    }

    // produto: adicionar (aviso e link), estoque máximo e barra de frete
    await page.goto("/produto/pizza-margherita");
    await page.getByRole("button", { name: /Média/ }).click();
    await page.getByRole("button", { name: /^Adicionar R\$/ }).click();
    await expect(page.getByRole("status")).toContainText("Adicionado à sacola");
    await expect(page.getByRole("status").getByRole("link", { name: "Ver sacola" })).toBeVisible();
    await collect();
    await page.goto("/produto/bolo-vulcao-de-chocolate");
    await page.getByRole("button", { name: /Inteiro/ }).click();
    for (let i = 0; i < 4; i++) await page.getByRole("button", { name: /^Adicionar R\$/ }).click();
    await page.getByRole("button", { name: /^Adicionar R\$/ }).click(); // além do estoque: aviso
    await expect(page.locator("p[role=alert]")).toHaveText("Você já adicionou todas as unidades disponíveis à sacola.");
    await collect();

    // home com barra de frete, "+" do cardápio, sacola cheia e checkout
    await page.goto("/");
    await expect(page.getByTestId("shipping-progress")).toContainText("Ver sacola");
    await collect();
    await page.goto("/carrinho");
    await page.getByLabel("CEP").fill("01310100");
    await page.getByRole("button", { name: "Calcular" }).click();
    await page.getByTestId("shipping-options").getByLabel(/Econômico/).check();
    await collect();
    await page.getByRole("link", { name: "Continuar" }).click();
    await collect();
    await fillIdentification(page);
    await next(page);
    await collect();
    await fillAddress(page);
    await next(page);
    await collect();
    await finish(page);
    await expect(page.getByTestId("order-status")).toBeVisible();
    await collect();

    screens.forEach((text, i) => expect(text, `tela ${i + 1}`).not.toMatch(/carrinho/i));
    expect(screens.join("\n")).toMatch(/sacola/i);
  });

  test("Trama: a palavra 'sacola' não aparece em nenhuma tela; sempre 'carrinho'", async ({ page }) => {
    test.setTimeout(90_000); // percorre muitas telas; com a máquina carregada pode passar de 30 s
    await openAs(page, TRAMA);
    const screens: string[] = [];
    const expected = (await page.getByTestId("store-name").getAttribute("aria-label")) ?? "";
    const collect = async () => {
      // depois de um goto o HTML inicial é do preset padrão: espera hidratar no preset da loja
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId("store-name")).toHaveAccessibleName(expected);
      screens.push(await visibleWords(page));
    };

    await collect();
    for (const route of ["/categoria/feminino", "/busca?q=linho", "/carrinho", "/checkout", "/sobre", "/trocas-e-devolucoes", "/privacidade"]) {
      await page.goto(route);
      await collect();
    }
    await page.goto("/produto/bolsa-tote-couro");
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await expect(page.getByRole("status")).toContainText("Adicionado ao carrinho");
    await collect();
    for (let i = 0; i < 6; i++) await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await expect(page.locator("p[role=alert]")).toHaveText("Você já adicionou todas as unidades disponíveis ao carrinho.");
    await collect();
    await page.goto("/");
    await expect(page.getByTestId("shipping-progress")).toContainText("Ver carrinho");
    await collect();
    await page.goto("/carrinho");
    await collect();
    await page.getByLabel("CEP").fill("01310100");
    await page.getByRole("button", { name: "Calcular" }).click();
    await page.getByTestId("shipping-options").getByLabel(/Econômico/).check();
    await page.getByRole("link", { name: "Continuar" }).click();
    await collect();

    screens.forEach((text, i) => expect(text, `tela ${i + 1}`).not.toMatch(/sacola/i));
    expect(screens.join("\n")).toMatch(/carrinho/i);
  });
});

test.describe("F2 · copy de frete e nomes de item", () => {
  test("Forno, retirada: o resumo diz 'Retirada no local · R$ 0,00' no carrinho, no checkout e no pedido", async ({ page }) => {
    await openAs(page, FORNO, "/carrinho");
    await seedCart(page, { productId: "fv-013", qty: 6 }); // R$ 89,40: acima de R$ 80, mas é retirada
    await page.getByLabel(/Retirar na loja/).check();
    await expect(page.getByTestId("sum-shipping-row")).toHaveText(/Retirada no local\s*R\$\s0,00/);

    await page.getByRole("link", { name: "Continuar" }).click();
    await expect(page.getByTestId("summary-shipping-row")).toHaveText(/Retirada no local\s*R\$\s0,00/);
    await fillIdentification(page);
    await next(page);
    await next(page);
    await expect(page.getByTestId("summary-shipping-row")).not.toContainText("Grátis");
    await finish(page);

    await expect(page.getByTestId("order-shipping-row")).toHaveText(/Retirada no local\s*R\$\s0,00/);
    await expect(page.getByTestId("order-shipping-row")).not.toContainText("Frete");
  });

  test("Forno, entrega com subtotal acima de R$ 80: a linha continua 'Frete · Grátis'", async ({ page }) => {
    await openAs(page, FORNO, "/carrinho");
    await seedCart(page, { productId: "fv-013", qty: 6 }); // R$ 89,40
    await page.getByLabel("CEP").fill("01310100");
    await page.getByRole("button", { name: "Calcular" }).click();
    await page.getByTestId("shipping-options").getByLabel(/Econômico/).check();
    await expect(page.getByTestId("sum-shipping-row")).toHaveText(/Frete\s*Grátis/);

    // o Expresso (previsto no Forno) segue com o valor calculado
    await page.getByTestId("shipping-options").getByLabel(/Expresso/).check();
    await expect(page.getByTestId("sum-shipping-row")).toHaveText(/Frete\s*R\$\s16,90/);
    await page.getByTestId("shipping-options").getByLabel(/Econômico/).check();

    await page.getByRole("link", { name: "Continuar" }).click();
    await expect(page.getByTestId("summary-shipping-row")).toHaveText(/Frete\s*Grátis/);
    await fillIdentification(page);
    await next(page);
    await fillAddress(page);
    await next(page);
    await finish(page);
    await expect(page.getByTestId("order-shipping-row")).toHaveText(/Frete\s*Grátis/);
  });

  test("Trama: sem opção de retirada no carrinho nem no checkout", async ({ page }) => {
    await openAs(page, TRAMA, "/carrinho");
    await seedCart(page, { productId: "ts-014" });
    await page.getByLabel("CEP").fill("01310100");
    await page.getByRole("button", { name: "Calcular" }).click();
    await expect(page.getByTestId("shipping-options")).toContainText("Econômico");
    await expect(page.getByText(/Retirar na loja|Retirada no local/)).toHaveCount(0);
    await page.getByTestId("shipping-options").getByLabel(/Econômico/).check();
    await page.getByRole("link", { name: "Continuar" }).click();
    await fillIdentification(page);
    await next(page);
    await expect(page.locator("#chk-street")).toBeVisible(); // só endereço de entrega
    await expect(page.getByText(/Retirar na loja|Retirada no local/)).toHaveCount(0);
    await expect(page.getByTestId("summary-shipping-row")).toContainText("Frete");
  });

  test("nome do item sem parênteses aninhados no resumo e no pedido", async ({ page }) => {
    await readyToCheckout(page, FORNO, { productId: "fv-001", variantId: "fv-mar-gra" });
    await expect(page.getByTestId("order-summary")).toContainText("Pizza Margherita · Grande, 8 fatias");
    await fillIdentification(page);
    await next(page);
    await fillAddress(page);
    await next(page);
    await finish(page);

    const items = page.getByTestId("order-items");
    await expect(items).toContainText("1× Pizza Margherita · Grande, 8 fatias");
    expect(await items.innerText()).not.toMatch(/\([^)]*\(/);
    expect((await state(page)).orders[0].items[0].name).toBe("Pizza Margherita · Grande, 8 fatias");
  });

  test("Forno, retirada: nenhuma tela fala em 'carrinho' (rótulos do preset)", async ({ page }) => {
    await openAs(page, FORNO, "/carrinho");
    await seedCart(page, { productId: "fv-013", qty: 2 });
    const texts: string[] = [];
    const collect = async () => {
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId("store-name")).toHaveAccessibleName("Forno da Vila");
      texts.push(
        await page.evaluate(() => {
          const attrs = [...document.querySelectorAll("[aria-label],[alt],[title],[placeholder]")].flatMap((el) =>
            ["aria-label", "alt", "title", "placeholder"].map((a) => el.getAttribute(a) ?? ""),
          );
          return [document.title, document.body.innerText, ...attrs].join("\n");
        }),
      );
    };
    await page.getByLabel(/Retirar na loja/).check();
    await collect();
    await page.getByRole("link", { name: "Continuar" }).click();
    await collect();
    await fillIdentification(page);
    await next(page);
    await collect();
    await next(page);
    await collect();
    await finish(page);
    await expect(page.getByTestId("order-status")).toBeVisible();
    await collect();
    texts.forEach((t, n) => expect(t, `tela ${n + 1}`).not.toMatch(/carrinho/i));
    expect(texts.join("\n")).toContain("Retirada no local");
  });
});

test.describe("F2-05 · produto digital (fixture)", () => {
  async function addCourse(page: Page) {
    await page.evaluate(() => {
      const store = window.__demoStore!;
      const base = store.getState().products.find((p) => p.id === "ts-014")!;
      store.setState((s) => ({
        products: [
          ...s.products,
          { ...base, id: "dg-001", slug: "curso-fixture", name: "Curso (fixture)", sku: "DG-001", type: "digital" as const, price: 19700, stock: 0, variants: [] },
        ],
      }));
      store.getState().addToCart({ productId: "dg-001", qty: 1 });
    });
  }

  test("página do produto: sem frete, sem esgotado; carrinho só digital pula a entrega", async ({ page }) => {
    await openAs(page, TRAMA);
    await addCourse(page);
    await page.goto("/produto/curso-fixture");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: "Adicionar ao carrinho" })).toBeEnabled();
    await expect(page.getByLabel("CEP")).toHaveCount(0);
    await expect(page.getByText("Calcular frete")).toHaveCount(0);
    await expect(page.getByTestId("low-stock")).toHaveCount(0);

    await page.goto("/carrinho");
    await expect(page.getByText(/Produtos digitais não têm entrega/)).toBeVisible();
    await expect(page.getByLabel("CEP")).toHaveCount(0);
    await expect(page.getByTestId("sum-shipping")).toHaveText("Não se aplica");
    await page.getByRole("link", { name: "Continuar" }).click();

    await expect(page.getByTestId("steps").getByRole("listitem")).toHaveText([/Identificação/, /Pagamento/]);
    await fillIdentification(page, { email: "aluna@example.com" });
    await next(page);
    await expect(page.getByTestId("step-payment")).toBeVisible(); // sem etapa de entrega
    await expect(page.getByTestId("finish")).toHaveText(/187,15/); // 197,00 − 5% no Pix
    await finish(page);

    await expect(page.getByTestId("digital-access")).toHaveText("O acesso será enviado para aluna@example.com.");
    await expect(page.getByTestId("order-delivery")).toHaveText("Produto digital: sem entrega física");
    expect((await state(page)).orders[0].delivery).toEqual({ type: "digital" });
  });

  test("carrinho misto: entrega normal e o digital não conta para o frete grátis", async ({ page }) => {
    await openAs(page, TRAMA, "/carrinho");
    await addCourse(page);
    await seedCart(page, { productId: "ts-008", variantId: "ts-cbp-p-pt" }); // físico: R$ 99,90 (< R$ 199)
    await expect(page.getByRole("button", { name: "Continuar" })).toBeDisabled();
    await page.getByLabel("CEP").fill("01310100");
    await page.getByRole("button", { name: "Calcular" }).click();
    await expect(page.getByTestId("shipping-options")).toContainText("Faltam R$ 99,10 para frete grátis"); // 197 do curso não conta
    await page.getByTestId("shipping-options").getByLabel(/Econômico/).check();
    await page.getByRole("link", { name: "Continuar" }).click();
    await fillIdentification(page);
    await next(page);
    await expect(page.getByTestId("step-delivery")).toBeVisible();
  });
});

test.describe("F2 · 360 px sem rolagem horizontal", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  for (const preset of [TRAMA, FORNO]) {
    test(`${preset}: carrinho vazio e com itens`, async ({ page }) => {
      await openAs(page, preset, "/carrinho");
      expect(await overflowOf(page)).toBeLessThanOrEqual(0);
      await seedCart(page, preset === TRAMA ? { productId: "ts-014" } : { productId: "fv-012", variantId: "fv-vul-mei", addonIds: ["sorvete", "morangos"], qty: 2 });
      await page.getByLabel("CEP").fill("01310100");
      await page.getByRole("button", { name: "Calcular" }).click();
      await expect(page.getByTestId("shipping-options")).toBeVisible();
      await page.waitForTimeout(150);
      expect(await overflowOf(page)).toBeLessThanOrEqual(0);
    });

    test(`${preset}: checkout (as 3 etapas) e confirmação`, async ({ page }) => {
      await readyToCheckout(page, preset, preset === TRAMA ? { productId: "ts-014" } : { productId: "fv-012", variantId: "fv-vul-mei", addonIds: ["sorvete"] });
      await expect(page.getByTestId("step-id")).toBeVisible();
      expect(await overflowOf(page)).toBeLessThanOrEqual(0);
      await page.getByTestId("order-summary").locator("summary").click(); // abre o resumo recolhível
      expect(await overflowOf(page)).toBeLessThanOrEqual(0);

      await fillIdentification(page);
      await next(page);
      await expect(page.getByTestId("step-delivery")).toBeVisible();
      await fillAddress(page);
      expect(await overflowOf(page)).toBeLessThanOrEqual(0);
      await next(page);
      await expect(page.getByTestId("step-payment")).toBeVisible();
      if (preset === TRAMA) {
        await page.getByRole("radio", { name: "Cartão de crédito" }).check();
        await expect(page.getByTestId("card-form")).toBeVisible();
      }
      expect(await overflowOf(page)).toBeLessThanOrEqual(0);
      if (preset === TRAMA) await page.getByRole("radio", { name: /^Pix/ }).check();
      await finish(page);

      await expect(page.getByTestId("fake-qr")).toBeVisible();
      await page.waitForTimeout(150);
      expect(await overflowOf(page)).toBeLessThanOrEqual(0);
    });
  }

  test("confirmação de pedido com cartão e de pedido antigo", async ({ page }) => {
    await openAs(page, TRAMA, "/pedido/TS-1003");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pedido TS-1003");
    expect(await overflowOf(page)).toBeLessThanOrEqual(0);
  });
});
