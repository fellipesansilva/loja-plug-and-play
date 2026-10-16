import { type Page } from "@playwright/test";
import { expect, test, currentPreset, FORNO } from "./helpers";
import { VALID_CPF, ready } from "./painel-helpers";

type Plain = { id: string; slug: string; name: string; stock: number };

/** Dois produtos simples (sem variação nem adicionais) com estoque, para pôr no carrinho. */
async function plainProducts(page: Page): Promise<[Plain, Plain]> {
  return page.evaluate(() => {
    const list = window.__demoStore!.getState().products.filter((p) => p.stock >= 3 && p.variants.length === 0 && !p.type && !(p.addons ?? []).length);
    const pick = (p: (typeof list)[number]) => ({ id: p.id, slug: p.slug, name: p.name, stock: p.stock });
    return [pick(list[0]), pick(list[1])] as [Plain, Plain];
  });
}

async function seed(page: Page, items: { id: string; qty: number }[]) {
  await page.evaluate((list) => {
    const st = window.__demoStore!.getState();
    for (const i of list) st.addToCart({ productId: i.id, qty: i.qty });
    st.setShipping("01310100", "economico");
  }, items);
}

async function inactivateInPanel(page: Page, id: string) {
  await page.goto("/painel/produtos");
  await page.locator(`[data-product-id="${id}"]`).getByTestId("toggle-active").click();
  await expect(page.locator(`[data-product-id="${id}"] [data-testid="product-status"]`)).toHaveText("Inativo");
}

async function setStockInPanel(page: Page, id: string, stock: number) {
  await page.goto(`/painel/produtos/${id}`);
  await page.locator("#chk-stock").fill(String(stock));
  await page.getByTestId("save-product").click();
  await expect(page.getByTestId("saved-ok")).toBeVisible();
}

/** Identificação, entrega e cartão de teste, parando antes de "Finalizar" (ou finalizando). */
async function checkoutUntilPayment(page: Page) {
  await page.goto("/checkout");
  await page.waitForLoadState("networkidle");
  await page.locator("#chk-name").fill("Ana Souza");
  await page.locator("#chk-email").fill("ana@example.com");
  await page.locator("#chk-phone").fill("11912345678");
  await page.locator("#chk-cpf").fill(VALID_CPF);
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
}

const cartWord = () => (currentPreset() === FORNO ? "sacola" : "carrinho");
const lineOf = (page: Page, name: string) => page.getByTestId("cart-line").filter({ hasText: name });

test.describe("F4 · item indisponível no carrinho", () => {
  test("produto inativado depois de entrar no carrinho: aviso na linha, checkout não finaliza; remover libera", async ({ page }) => {
    await ready(page, "/");
    const [a, b] = await plainProducts(page);
    const ordersBefore = await page.evaluate(() => window.__demoStore!.getState().orders.length);
    await seed(page, [{ id: a.id, qty: 1 }, { id: b.id, qty: 1 }]);
    await page.goto("/carrinho");
    await expect(page.getByTestId("cart-line")).toHaveCount(2);
    await expect(page.getByTestId("line-unavailable")).toHaveCount(0);

    await inactivateInPanel(page, a.id);

    // volta à loja: aviso "Indisponível" na linha e "Continuar" desabilitado, com a mensagem do item
    await page.goto("/carrinho");
    await expect(lineOf(page, a.name).getByTestId("line-unavailable")).toHaveText("Indisponível");
    await expect(lineOf(page, b.name).getByTestId("line-unavailable")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Continuar" })).toBeDisabled();
    await expect(page.getByRole("link", { name: "Continuar" })).toHaveCount(0);
    await expect(page.getByTestId("cart-blocked-note")).toContainText(`Para finalizar, resolva n${cartWord() === "sacola" ? "a" : "o"} ${cartWord()}`);
    await expect(page.getByTestId("cart-blocked-note")).toContainText(`${a.name} (Indisponível)`);

    // o checkout aberto pelo endereço também não finaliza
    await checkoutUntilPayment(page);
    await expect(page.getByTestId("finish")).toBeDisabled();
    await expect(page.getByTestId("checkout-unavailable")).toContainText(`${a.name} (Indisponível)`);
    await expect(page.getByTestId("checkout-unavailable")).toContainText(cartWord());
    expect(await page.evaluate(() => window.__demoStore!.getState().orders.length)).toBe(ordersBefore);

    // remove o item e finaliza
    await page.goto("/carrinho");
    await lineOf(page, a.name).getByRole("button", { name: `Remover ${a.name}` }).click();
    await expect(page.getByTestId("cart-line")).toHaveCount(1);
    await expect(page.getByTestId("line-unavailable")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Continuar" })).toBeVisible();
    await checkoutUntilPayment(page);
    await expect(page.getByTestId("finish")).toBeEnabled();
    await page.getByTestId("finish").click();
    await expect(page.getByTestId("order-status")).toBeVisible();
    const order = await page.evaluate(() => window.__demoStore!.getState().orders[0]);
    expect(order.items.map((i) => i.productId)).toEqual([b.id]);
  });

  test("estoque zerado depois de adicionar: 'Indisponível'; estoque menor que a quantidade: 'Só restam N' e ajustar", async ({ page }) => {
    await ready(page, "/");
    const [a, b] = await plainProducts(page);
    await seed(page, [{ id: a.id, qty: 2 }, { id: b.id, qty: 1 }]);

    await setStockInPanel(page, a.id, 0);
    await page.goto("/carrinho");
    await expect(lineOf(page, a.name).getByTestId("line-unavailable")).toHaveText("Indisponível");
    await expect(page.getByRole("button", { name: "Continuar" })).toBeDisabled();
    await expect(page.getByTestId("cart-blocked-note")).toContainText(`${a.name} (Indisponível)`);
    await checkoutUntilPayment(page);
    await expect(page.getByTestId("finish")).toBeDisabled();
    await expect(page.getByTestId("checkout-unavailable")).toContainText(a.name);

    // estoque menor que a quantidade: "Só resta 1", com opção de ajustar a quantidade
    await setStockInPanel(page, a.id, 1);
    await page.goto("/carrinho");
    await expect(lineOf(page, a.name).getByTestId("line-unavailable")).toHaveText("Só resta 1");
    await expect(page.getByRole("button", { name: "Continuar" })).toBeDisabled();
    await expect(page.getByTestId("cart-blocked-note")).toContainText(`${a.name} (Só resta 1)`);
    await lineOf(page, a.name).getByTestId("line-adjust").click();
    await expect(lineOf(page, a.name).getByTestId("line-qty")).toHaveText("1");
    await expect(page.getByTestId("line-unavailable")).toHaveCount(0);

    // resolvido: finaliza
    await expect(page.getByRole("link", { name: "Continuar" })).toBeVisible();
    await checkoutUntilPayment(page);
    await expect(page.getByTestId("finish")).toBeEnabled();
    await page.getByTestId("finish").click();
    await expect(page.getByTestId("order-status")).toBeVisible();
  });

  test("estoque menor (2 de 3): 'Só restam 2'; remover também resolve", async ({ page }) => {
    await ready(page, "/");
    const [a, b] = await plainProducts(page);
    await seed(page, [{ id: a.id, qty: 3 }, { id: b.id, qty: 1 }]);
    await setStockInPanel(page, a.id, 2);
    await page.goto("/carrinho");
    await expect(lineOf(page, a.name).getByTestId("line-unavailable")).toHaveText("Só restam 2");
    await lineOf(page, a.name).getByRole("button", { name: `Remover ${a.name}` }).click();
    await expect(page.getByRole("link", { name: "Continuar" })).toBeVisible();
  });

  test("os textos usam o rótulo do preset (Sacola no Forno, Carrinho na Trama)", async ({ page }) => {
    await ready(page, "/");
    const [a] = await plainProducts(page);
    await seed(page, [{ id: a.id, qty: 1 }]);
    await inactivateInPanel(page, a.id);
    await page.goto("/carrinho");
    const note = (await page.getByTestId("cart-blocked-note").textContent())!.toLowerCase();
    expect(note).toContain(cartWord());
    expect(note).not.toContain(cartWord() === "sacola" ? "carrinho" : "sacola");
  });
});

test.describe("F4 · item indisponível fora dos totais", () => {
  const skus = () => (currentPreset() === FORNO ? { a: "FV-SAL", b: "FV-PEP" } : { a: "TS-COV", b: "TS-SPL" });

  test("subtotal, frete (inclusive frete grátis) e total ignoram o item indisponível", async ({ page }) => {
    await ready(page, "/");
    const { a, b } = skus();
    const items = await page.evaluate(([skuA, skuB]) => {
      const st = window.__demoStore!.getState();
      const pa = st.products.find((p) => p.sku === skuA)!;
      const pb = st.products.find((p) => p.sku === skuB)!;
      st.addToCart({ productId: pa.id, qty: 1 });
      st.addToCart({ productId: pb.id, qty: 1 });
      st.setShipping("01310100", "economico");
      return { a: { id: pa.id, name: pa.name, price: pa.price }, b: { id: pb.id, name: pb.name, price: pb.price } };
    }, [a, b]);
    const brl = (c: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(c / 100).replace(/\s/g, " ");
    const text = async (id: string) => ((await page.getByTestId(id).textContent()) ?? "").replace(/\s/g, " ");

    // os dois disponíveis: passa do mínimo do frete grátis
    await page.goto("/carrinho");
    expect(await text("sum-subtotal")).toBe(brl(items.a.price + items.b.price));
    expect(await text("sum-shipping")).toBe("Grátis");

    // o primeiro some do catálogo: fora do subtotal, do frete grátis e do total
    await inactivateInPanel(page, items.a.id);
    await page.goto("/carrinho");
    await expect(lineOf(page, items.a.name).getByTestId("line-excluded")).toHaveText("não incluído no total");
    await expect(lineOf(page, items.a.name).locator('[data-testid="line-total"]')).toHaveClass(/line-through/);
    expect(await text("sum-subtotal")).toBe(brl(items.b.price));
    expect(await text("sum-shipping")).not.toBe("Grátis");
    expect(await text("sum-shipping")).toMatch(/^R\$ \d/);
    const shipping = await page.evaluate(() => window.__demoStore!.getState().config.shipping.options.find((o) => o.id === "economico")!.basePrice);
    expect(shipping).toBeGreaterThan(0);
    const total = (await text("sum-total")).replace(/[^\d,]/g, "").replace(",", ".");
    expect(Math.round(Number(total) * 100)).toBeGreaterThan(items.b.price); // subtotal + frete cobrado
    expect(Math.round(Number(total) * 100)).toBeLessThan(items.a.price + items.b.price + shipping);

    // a barra de frete grátis também ignora o item (na home)
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const bar = page.getByTestId("shipping-progress");
    if (await bar.count()) await expect(bar).not.toContainText(/frete grátis liberado|conquistou/i);

    // o checkout mostra o mesmo: item riscado e total sem ele
    await checkoutUntilPayment(page);
    await expect(page.getByTestId("order-summary")).toContainText("não incluído no total");
    await expect(page.getByTestId("finish")).toBeDisabled();
  });

  test("'Só restam N' também fica fora do total até ajustar", async ({ page }) => {
    await ready(page, "/");
    const [a, b] = await plainProducts(page);
    await seed(page, [{ id: a.id, qty: 3 }, { id: b.id, qty: 1 }]);
    await setStockInPanel(page, a.id, 2);
    await page.goto("/carrinho");
    const before = await page.getByTestId("sum-subtotal").textContent();
    await lineOf(page, a.name).getByTestId("line-adjust").click();
    const after = await page.getByTestId("sum-subtotal").textContent();
    expect(after).not.toBe(before); // com a quantidade ajustada o item entra no subtotal
    await expect(page.getByTestId("line-excluded")).toHaveCount(0);
  });
});
