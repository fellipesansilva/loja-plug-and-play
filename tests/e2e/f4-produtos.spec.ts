import { type Page } from "@playwright/test";
import { expect, test } from "./helpers";
import { MOBILE, overflowOf, ready } from "./painel-helpers";

const PNG_1PX = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

const productsInStore = (page: Page) => page.evaluate(() => window.__demoStore!.getState().products.length);

type Defs = { key: string; label: string; variant?: boolean }[];
const defsOf = (page: Page): Promise<Defs> =>
  page.evaluate(() => window.__demoStore!.getState().config.attributeDefs.map((d) => ({ key: d.key, label: d.label, variant: d.variant })));

async function fillBase(page: Page, v: { name: string; price: string; sku: string; stock?: string; description?: string }) {
  await page.locator("#chk-name").fill(v.name);
  await page.locator("#chk-price").fill(v.price);
  await page.locator("#chk-sku").fill(v.sku);
  if (v.stock !== undefined && (await page.locator("#chk-stock").count())) await page.locator("#chk-stock").fill(v.stock);
  if (v.description) await page.getByLabel("Descrição", { exact: true }).fill(v.description);
}
async function pickPresetImage(page: Page) {
  await page.getByText(/Escolher entre as imagens do preset/).click();
  await page.getByTestId("image-pool").getByRole("button").first().click();
  await expect(page.getByTestId("image-item")).toHaveCount(1);
}
const save = (page: Page) => page.getByTestId("save-product").click();

test.describe("H4 · produtos", () => {
  test("lista com foto, nome, preço, estoque e situação, e busca por nome ou SKU", async ({ page }) => {
    await ready(page, "/painel/produtos");
    const products = await page.evaluate(() => window.__demoStore!.getState().products.map((p) => ({ id: p.id, name: p.name, sku: p.sku })));
    const rows = page.getByTestId("product-row");
    await expect(rows).toHaveCount(products.length);
    const first = rows.first();
    await expect(first.locator("img")).toHaveCount(1);
    await expect(first.getByTestId("product-link")).toHaveText(products[0].name);
    await expect(first.getByTestId("product-price")).toContainText("R$");
    await expect(first.getByTestId("product-stock")).toBeVisible();
    await expect(first.getByTestId("product-status")).toContainText(/Ativo|Inativo/);

    await page.getByLabel("Buscar por nome ou SKU").fill(products[1].sku.toLowerCase());
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toHaveAttribute("data-product-id", products[1].id);
    await page.getByLabel("Buscar por nome ou SKU").fill("zzzz-nada");
    await expect(page.getByTestId("products-empty")).toBeVisible();
  });

  test("cria produto com variação, imagem do preset e atributo; ele aparece na loja (página, categoria e busca)", async ({ page }) => {
    await ready(page, "/painel/produtos/novo");
    const defs = await defsOf(page);
    const axes = defs.filter((d) => d.variant);
    const descriptive = defs.filter((d) => !d.variant);
    const category = await page.evaluate(() => window.__demoStore!.getState().categories[0]);
    const before = await productsInStore(page);

    await fillBase(page, { name: "Produto Teste Painel", price: "1.234,50", sku: "PAINEL-001", description: "Criado no painel." });
    await pickPresetImage(page);
    // o formulário foi gerado a partir do preset: um campo por atributo descritivo e um eixo por variação
    await expect(page.getByLabel(descriptive[0].label, { exact: true })).toBeVisible();
    await page.getByLabel(descriptive[0].label, { exact: true }).fill("Valor descritivo");
    await page.getByTestId("add-variant").click();
    for (const a of axes) await page.locator(`#chk-variant-0-${a.key}`).fill(`${a.label} A`);
    await page.locator("#chk-variant-0-sku").fill("PAINEL-001-A");
    await page.locator("#chk-variant-0-stock").fill("3");
    await page.getByTestId("add-variant").click();
    for (const a of axes) await page.locator(`#chk-variant-1-${a.key}`).fill(`${a.label} B`);
    await page.locator("#chk-variant-1-sku").fill("PAINEL-001-B");
    await page.locator("#chk-variant-1-stock").fill("4");
    await expect(page.getByTestId("stock-derived")).toContainText("(7)");
    await save(page);

    await expect(page).toHaveURL(/\/painel\/produtos\/np-/);
    expect(await productsInStore(page)).toBe(before + 1);
    const created = await page.evaluate(() => window.__demoStore!.getState().products.find((p) => p.sku === "PAINEL-001")!);
    expect(created).toMatchObject({ name: "Produto Teste Painel", price: 123450, stock: 7, active: true, slug: "produto-teste-painel" });
    expect(created.variants).toHaveLength(2);
    expect(created.variants[0].attributes).toEqual(Object.fromEntries(axes.map((a) => [a.key, `${a.label} A`])));
    expect(created.attributes).toEqual([expect.objectContaining({ key: descriptive[0].key, value: "Valor descritivo" })]);

    // na loja
    await page.goto("/produto/produto-teste-painel");
    await expect(page.getByRole("heading", { level: 1, name: "Produto Teste Painel" })).toBeVisible();
    await expect(page.getByText(/R\$\s*1\.234,50/).first()).toBeVisible();
    await page.goto(`/categoria/${category.slug}`);
    await expect(page.getByText("Produto Teste Painel").first()).toBeVisible();
    await page.goto("/busca?q=teste painel");
    await expect(page.getByText("Produto Teste Painel").first()).toBeVisible();

    // sobrevive ao recarregar (localStorage da loja)
    await page.goto("/painel/produtos");
    await page.reload();
    await expect(page.locator(`[data-product-id="${created.id}"]`)).toHaveCount(1);
  });

  test("ao salvar um produto novo, a tela de edição mostra 'Produto criado' (região ao vivo) e o aviso some sozinho", async ({ page }) => {
    await ready(page, "/painel/produtos/novo");
    const notice = page.getByTestId("created-notice");
    await expect(notice).toHaveAttribute("role", "status");
    await expect(notice).toHaveAttribute("aria-live", "polite");
    await expect(notice).toHaveText(""); // a região já existe, vazia, antes de salvar
    await fillBase(page, { name: "Produto Aviso", price: "9,90", sku: "AVISO-001", stock: "2" });
    await pickPresetImage(page);
    await save(page);
    await expect(page).toHaveURL(/\/painel\/produtos\/np-/);
    await expect(notice).toHaveText("Produto criado");
    await expect(notice).toBeVisible();
    await expect(notice).toHaveText("", { timeout: 9000 }); // some sozinho
    // editar e salvar de novo não repete a mensagem de criação
    await save(page);
    await expect(page.getByTestId("saved-ok")).toBeVisible();
    await expect(notice).toHaveText("");
  });

  test("edita o preço e a loja mostra o novo valor; estoque zero aparece como esgotado", async ({ page }) => {
    await ready(page, "/painel/produtos");
    const target = await page.evaluate(() => {
      const p = window.__demoStore!.getState().products.find((x) => x.stock > 0 && x.variants.length === 0 && !x.type)!;
      return { id: p.id, slug: p.slug, name: p.name };
    });
    await page.locator(`[data-product-id="${target.id}"]`).getByTestId("product-link").click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Editar produto");
    await expect(page.locator("#chk-name")).toHaveValue(target.name);
    await page.locator("#chk-price").fill("55,55");
    await save(page);
    await expect(page.getByTestId("saved-ok")).toBeVisible();
    await page.goto(`/produto/${target.slug}`);
    await expect(page.getByText(/R\$\s*55,55/).first()).toBeVisible();

    await page.goto(`/painel/produtos/${target.id}`);
    await page.locator("#chk-stock").fill("0");
    await save(page);
    await page.goto("/painel/produtos");
    await expect(page.locator(`[data-product-id="${target.id}"] [data-testid="product-status"]`)).toContainText("Esgotado");
    await page.goto(`/produto/${target.slug}`);
    await expect(page.getByText("Esgotado").first()).toBeVisible();
  });

  test("inativar tira da loja (página, categoria, busca); ativar volta", async ({ page }) => {
    await ready(page, "/painel/produtos");
    const target = await page.evaluate(() => {
      const st = window.__demoStore!.getState();
      const p = st.products.find((x) => x.stock > 0 && x.variants.length === 0 && !x.type)!;
      return { id: p.id, slug: p.slug, name: p.name, category: st.categories.find((c) => c.id === p.categoryId)!.slug };
    });
    const row = page.locator(`[data-product-id="${target.id}"]`);
    await row.getByTestId("toggle-active").click();
    await expect(row.getByTestId("product-status")).toHaveText("Inativo");

    await page.goto(`/produto/${target.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Produto não encontrado");
    await page.goto(`/categoria/${target.category}`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: target.name, exact: true })).toHaveCount(0);
    await page.goto(`/busca?q=${encodeURIComponent(target.name)}`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: target.name, exact: true })).toHaveCount(0);

    await page.goto("/painel/produtos");
    await page.locator(`[data-product-id="${target.id}"]`).getByTestId("toggle-active").click();
    await expect(page.locator(`[data-product-id="${target.id}"] [data-testid="product-status"]`)).toContainText("Ativo");
    await page.goto(`/produto/${target.slug}`);
    await expect(page.getByRole("heading", { level: 1, name: target.name })).toBeVisible();
  });

  test("SKU repetido é recusado, com erro no campo e nada gravado", async ({ page }) => {
    await ready(page, "/painel/produtos/novo");
    const existing = await page.evaluate(() => window.__demoStore!.getState().products[0].sku);
    const before = await productsInStore(page);
    await fillBase(page, { name: "Produto Repetido", price: "10,00", sku: existing, stock: "1" });
    await pickPresetImage(page);
    await save(page);
    await expect(page.locator("#chk-sku")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#chk-sku-erro")).toHaveText("Este SKU já está em uso");
    await expect(page.locator("#chk-sku")).toBeFocused();
    expect(await productsInStore(page)).toBe(before);
    // o SKU de uma variação de outro produto também conta
    const variantSku = await page.evaluate(() => window.__demoStore!.getState().products.find((p) => p.variants.length)!.variants[0].sku);
    await page.locator("#chk-sku").fill(variantSku);
    await save(page);
    await expect(page.locator("#chk-sku-erro")).toHaveText("Este SKU já está em uso");
    // corrigindo, grava
    await page.locator("#chk-sku").fill("SKU-LIVRE-1");
    await save(page);
    await expect(page).toHaveURL(/\/painel\/produtos\/np-/);
    expect(await productsInStore(page)).toBe(before + 1);
  });

  test("preço, estoque e SKU inválidos: erro em cada campo, nada gravado", async ({ page }) => {
    await ready(page, "/painel/produtos/novo");
    const before = await productsInStore(page);
    await fillBase(page, { name: "Produto Inválido", price: "19.90", sku: "inválido!", stock: "-3" });
    await save(page);
    await expect(page.getByTestId("form-errors")).toBeVisible();
    for (const field of ["price", "sku", "stock"]) await expect(page.locator(`#chk-${field}`)).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#chk-price-erro")).toContainText("19,90");
    await expect(page.getByTestId("images-error")).toBeVisible();
    await expect(page.locator("#chk-price")).toBeFocused();
    expect(await productsInStore(page)).toBe(before);
  });

  test("imagens: envia arquivo válido; recusa tipo errado e arquivo acima de 1 MB", async ({ page }) => {
    await ready(page, "/painel/produtos/novo");
    const input = page.getByTestId("image-file");
    await input.setInputFiles({ name: "grande.png", mimeType: "image/png", buffer: Buffer.alloc(1024 * 1024 + 1, 1) });
    await expect(page.getByTestId("image-note")).toContainText("mais de 1 MB");
    await expect(page.getByTestId("image-item")).toHaveCount(0);
    await input.setInputFiles({ name: "arquivo.gif", mimeType: "image/gif", buffer: PNG_1PX });
    await expect(page.getByTestId("image-note")).toContainText("JPG, PNG ou WebP");
    await expect(page.getByTestId("image-item")).toHaveCount(0);

    await input.setInputFiles({ name: "minha-foto.png", mimeType: "image/png", buffer: PNG_1PX });
    await expect(page.getByTestId("image-item")).toHaveCount(1);
    await expect(page.getByTestId("image-note")).toHaveCount(0);
    await fillBase(page, { name: "Produto Com Foto", price: "9,90", sku: "FOTO-001", stock: "2" });
    await save(page);
    await expect(page).toHaveURL(/\/painel\/produtos\/np-/);
    const src = await page.evaluate(() => window.__demoStore!.getState().products.find((p) => p.sku === "FOTO-001")!.images[0].src);
    expect(src.startsWith("data:image/png;base64,")).toBe(true);
    // aparece na loja
    await page.goto("/produto/produto-com-foto");
    await expect(page.getByRole("heading", { level: 1, name: "Produto Com Foto" })).toBeVisible();
  });

  test("armazenamento do navegador cheio: mensagem clara e a tela continua funcionando", async ({ page }) => {
    await ready(page, "/painel/produtos/novo");
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key.startsWith("loja-demo-v1")) throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
        return original.call(this, key, value);
      };
    });
    await fillBase(page, { name: "Produto Sem Espaço", price: "9,90", sku: "CHEIO-001", stock: "2" });
    await pickPresetImage(page);
    await save(page);
    await expect(page.getByTestId("storage-full")).toBeVisible();
    await expect(page.getByTestId("storage-full")).toContainText("armazenamento do navegador está cheio");
    // a tela não quebrou: a lista abre e mostra o produto (em memória)
    await page.getByRole("link", { name: "Produtos", exact: true }).first().click();
    await expect(page.getByTestId("product-row").filter({ hasText: "CHEIO-001" })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Produtos");
  });

  test("Resetar dados volta o catálogo ao do preset", async ({ page }) => {
    await ready(page, "/painel/produtos");
    const original = await page.evaluate(() => window.__demoStore!.getState().products.length);
    await page.evaluate(() => {
      const st = window.__demoStore!.getState();
      st.saveProduct({ ...structuredClone(st.products[0]), id: "tmp-1", slug: "tmp-1", sku: "TMP-1" });
      st.setProductActive(st.products[1].id, false);
    });
    await expect(page.getByTestId("product-row")).toHaveCount(original + 1);
    await page.getByRole("button", { name: "Demo", exact: true }).click();
    await page.getByRole("button", { name: "Resetar dados" }).click();
    await expect(page.getByTestId("product-row")).toHaveCount(original);
    await expect(page.locator('[data-active="false"]')).toHaveCount(0);
  });

  test.describe("celular 400 px", () => {
    test.use(MOBILE);
    test("lista e formulário sem rolagem horizontal", async ({ page }) => {
      await ready(page, "/painel/produtos");
      await expect(page.getByTestId("product-row").first()).toBeVisible();
      expect(await overflowOf(page)).toBeLessThanOrEqual(0);
      await page.goto("/painel/produtos/novo");
      await page.getByTestId("add-variant").click();
      await expect(page.getByTestId("variant-row")).toBeVisible();
      expect(await overflowOf(page)).toBeLessThanOrEqual(0);
    });
  });

  test("formulário acessível: todo campo tem rótulo e dá para preencher só pelo teclado", async ({ page }) => {
    await ready(page, "/painel/produtos/novo");
    const unlabeled = await page.evaluate(() => {
      const fields = [...document.querySelectorAll("form input:not([type=hidden]), form select, form textarea")];
      return fields.filter((el) => !(el as HTMLInputElement).labels?.length && !el.getAttribute("aria-label")).map((el) => el.id || el.getAttribute("name"));
    });
    expect(unlabeled).toEqual([]);
    await page.locator("#chk-name").focus();
    await page.keyboard.type("Teclado");
    await page.keyboard.press("Tab");
    await expect(page.locator("#chk-price")).toBeFocused();
  });
});
