import { expect, test, type Page } from "@playwright/test";

const TRAMA = "trama-studio";
const FORNO = "forno-da-vila";

/** Abre a vitrine já no preset pedido (o preset escolhido persiste no localStorage). */
async function openAs(page: Page, preset: string, route = "/") {
  await page.goto("/");
  await page.waitForFunction(() => !!window.__demoStore);
  await page.evaluate((id) => window.__demoStore!.getState().applyPreset(id), preset);
  await page.goto(route);
  await page.waitForFunction(() => !!window.__demoStore);
  const name = preset === TRAMA ? "Trama Studio" : "Forno da Vila";
  await expect(page.getByTestId("store-name")).toHaveAccessibleName(name);
}

const cards = (page: Page) => page.getByTestId("product-card");
const cart = (page: Page) => page.evaluate(() => window.__demoStore!.getState().cart);
const overflowOf = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe("F11-01/03 · visual e home do Forno", () => {
  test("logo 'forno.da vila' com o ponto na cor primary e nome acessível", async ({ page }) => {
    await openAs(page, FORNO);
    const logo = page.getByTestId("store-name");
    await expect(logo).toHaveText("forno.da vila");
    const colors = await page.evaluate(() => {
      const accent = document.querySelector('[data-testid="store-name"] .logo-accent')!;
      const logoEl = document.querySelector('[data-testid="store-name"]')!;
      return { accent: getComputedStyle(accent).color, logo: getComputedStyle(logoEl).color };
    });
    expect(colors.accent).toBe("rgb(207, 53, 18)"); // primary do preset
    expect(colors.logo).not.toBe(colors.accent);
  });

  test("tokens do Forno aplicados (fundo, faixa, destaque, rodapé)", async ({ page }) => {
    await openAs(page, FORNO);
    const vars = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return ["background", "announcementBg", "highlightBg", "footerBg"].map((k) => s.getPropertyValue(`--t-color-${k}`).trim());
    });
    expect(vars).toEqual(["#fff8ee", "#ffc531", "#ffc531", "#fbebd6"]);
    await expect(page.getByTestId("announcement-bar")).toHaveText(/Retire na loja em 20 min/);
  });

  test("home em cardápio: banner em card, chips, spotlight, destaques e barra, nessa ordem", async ({ page }) => {
    await openAs(page, FORNO);
    await expect(page.locator("main h1")).toHaveText("Pizza quente, direto do forno");
    await expect(page.getByText("Saindo do forno agora")).toBeVisible();
    await expect(page.getByRole("link", { name: "Pedir agora" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver cardápio" })).toBeVisible();

    const chips = page.getByRole("navigation", { name: "Categorias" });
    for (const label of ["Mais pedidos", "Pizzas", "Pães", "Doces", "Bebidas"]) {
      await expect(chips.getByRole("link", { name: label })).toBeVisible();
    }

    const order = await page.evaluate(() =>
      [...document.querySelectorAll("main section")].map((s) => s.getAttribute("aria-labelledby") ?? s.id),
    );
    expect(order).toEqual(["banner", "categorias-chips", "bloco-campeoes", "bloco-destaques"]);

    await expect(page.getByRole("heading", { name: "Os campeões da casa" })).toBeVisible();
    const spotlight = page.getByTestId("spotlight");
    await expect(spotlight).toContainText("Bolo Vulcão de Chocolate");
    await expect(spotlight).toContainText("Nº 1 da casa");
    await expect(spotlight).toContainText("R$ 16,90");

    await expect(cards(page)).toHaveCount(4); // itens do cardápio (o spotlight não conta)
    await expect(page.getByRole("heading", { name: "Mais pedidos" })).toBeVisible();
  });

  test("chip 'Mais pedidos' rola até os destaques", async ({ page }) => {
    await openAs(page, FORNO);
    await page.getByRole("navigation", { name: "Categorias" }).getByRole("link", { name: "Mais pedidos" }).click();
    await expect(page).toHaveURL(/#destaques$/);
    await expect(page.getByRole("heading", { name: "Mais pedidos" })).toBeInViewport();
  });

  test("desligar o spotlight no store tira o bloco da home", async ({ page }) => {
    await openAs(page, FORNO);
    await expect(page.getByTestId("spotlight")).toBeVisible();
    await page.evaluate(() =>
      window.__demoStore!.setState((s) => ({
        config: { ...s.config, homeBlocks: s.config.homeBlocks.map((b) => (b.id === "campeoes" ? { ...b, enabled: false } : b)) },
      })),
    );
    await expect(page.getByTestId("spotlight")).toHaveCount(0);
  });
});

test.describe("F11-02 · listagem em cardápio", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("categoria: chips no topo com o ativo marcado, itens em cardápio e esgotado", async ({ page }) => {
    await openAs(page, FORNO, "/categoria/pizzas");
    const chips = page.getByRole("navigation", { name: "Categorias" });
    await expect(chips.getByRole("link", { name: "Pizzas" })).toHaveAttribute("aria-current", "page");
    await expect(chips.getByRole("link", { name: "Pães" })).not.toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("result-count")).toHaveText("5 produtos");

    const mista = cards(page).filter({ hasText: "Pizza Mista" });
    await expect(mista).toContainText("Esgotado");
    await expect(mista.getByRole("button", { name: /Pizza Mista esgotado/ })).toBeDisabled();

    // navegar pelo chip troca de categoria
    await chips.getByRole("link", { name: "Pães" }).click();
    await expect(page).toHaveURL(/\/categoria\/paes$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pães");
  });

  test("item do cardápio mostra descrição, preço e selo de dieta; a busca usa o mesmo formato", async ({ page }) => {
    await openAs(page, FORNO, "/busca?q=croissant");
    const item = cards(page).first();
    await expect(item).toContainText("Croissant de Manteiga");
    await expect(item).toContainText("Massa folhada de manteiga");
    await expect(item).toContainText("R$ 12,90");
    await expect(item).toContainText("Vegetariano");
    await expect(item.getByRole("button", { name: "Adicionar Croissant de Manteiga ao carrinho" })).toBeVisible();
  });
});

test.describe("F11-02/06 · adicionar pelo '+' e barra de frete grátis", () => {
  test("'+' de item sem variação adiciona; com variação leva ao produto", async ({ page }) => {
    await openAs(page, FORNO);
    await expect(page.getByTestId("shipping-progress")).toHaveCount(0); // carrinho vazio

    await page.getByRole("button", { name: "Adicionar Brownie com Calda de Chocolate ao carrinho" }).click();
    await expect(page.getByTestId("cart-count")).toHaveText("1");
    const bar = page.getByTestId("shipping-progress");
    await expect(bar).toContainText("Faltam R$ 65,10 para o frete grátis");
    await expect(bar.getByRole("link", { name: /Ver sacola · R\$\s14,90/ })).toHaveAttribute("href", "/carrinho");

    await page.getByRole("link", { name: "Escolher opções de Pizza Margherita" }).click();
    await expect(page).toHaveURL(/\/produto\/pizza-margherita$/);
  });

  test("a barra chega a 'Você ganhou frete grátis' ao passar de R$ 80", async ({ page }) => {
    await openAs(page, FORNO);
    const brownie = page.getByRole("button", { name: "Adicionar Brownie com Calda de Chocolate ao carrinho" });
    for (let i = 0; i < 5; i++) await brownie.click(); // 5 × R$ 14,90 = R$ 74,50
    await expect(page.getByTestId("shipping-progress")).toContainText("Faltam R$ 5,50 para o frete grátis");
    await brownie.click(); // R$ 89,40
    await expect(page.getByTestId("shipping-progress")).toContainText("Você ganhou frete grátis");
    await expect(page.getByTestId("shipping-progress").getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  test("a Trama também ganha a barra, no visual dela", async ({ page }) => {
    await openAs(page, TRAMA, "/produto/camiseta-basica-pima");
    await page.getByRole("button", { name: "P", exact: true }).click();
    await page.getByRole("button", { name: "Preto", exact: true }).click();
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await page.goto("/");
    await expect(page.getByTestId("shipping-progress")).toContainText("Faltam R$ 99,10 para o frete grátis");
  });
});

test.describe("F11-04/05 · produto em folha, adicionais e carrinho", () => {
  test("estrutura: voltar, favoritar, selos, adicionais e barra fixa", async ({ page }) => {
    await openAs(page, FORNO, "/produto/pizza-margherita");
    await expect(page.locator('article[data-layout="sheet"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Voltar" })).toBeVisible();
    const fav = page.getByRole("button", { name: "Favoritar" });
    await expect(fav).toHaveAttribute("aria-pressed", "false");
    await fav.click();
    await expect(fav).toHaveAttribute("aria-pressed", "true");

    await expect(page.getByRole("list", { name: "Destaques do produto" })).toContainText("Nº 1 da semana");
    await expect(page.getByRole("list", { name: "Destaques do produto" })).toContainText("Pronto em 20 min");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pizza Margherita");
    await expect(page.getByText("Restrições: Contém glúten e lactose")).toBeVisible();

    const addons = page.getByTestId("addons");
    await expect(addons.getByText("Turbine seu pedido")).toBeVisible();
    await expect(addons).toContainText("Borda recheada de catupiry");
    await expect(addons).toContainText("+ R$ 8,00");
    await expect(page.getByRole("group", { name: "Quantidade" })).toBeVisible();
    await expect(page.getByText("7 dias após o recebimento")).toBeVisible();
  });

  test("tamanho + dois adicionais + quantidade 2 → total correto → adicionar", async ({ page }) => {
    await openAs(page, FORNO, "/produto/pizza-margherita");
    const addButton = page.getByRole("button", { name: /^Adicionar R\$/ });
    await expect(page.getByTestId("add-total")).toHaveText(/39,90/);

    await page.getByRole("button", { name: /Grande/ }).click(); // R$ 69,90
    await page.getByLabel(/Borda recheada/).check(); // + R$ 8,00
    await page.getByLabel(/Azeitonas/).check(); // + R$ 4,00
    await page.getByRole("button", { name: "Aumentar quantidade" }).click();
    await expect(page.getByTestId("qty")).toHaveText("2");
    await expect(page.getByTestId("add-total")).toHaveText(/163,80/); // (69,90 + 8 + 4) × 2

    await addButton.click();
    await expect(page.getByTestId("cart-count")).toHaveText("2");
    await expect(page.getByRole("status")).toContainText("Adicionado ao carrinho");
    await expect(page.getByTestId("qty")).toHaveText("1"); // volta a 1 depois de adicionar

    const lines = await cart(page);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ productId: "fv-001", variantId: "fv-mar-gra", addonIds: ["azeitonas", "borda-catupiry"], qty: 2 });
    expect(lines[0].lineId).toBe("fv-001|fv-mar-gra|azeitonas|borda-catupiry");
  });

  test("mesma combinação soma; combinação diferente cria linha nova", async ({ page }) => {
    await openAs(page, FORNO, "/produto/pizza-margherita");
    const addButton = page.getByRole("button", { name: /^Adicionar R\$/ });
    await page.getByRole("button", { name: /Média/ }).click();
    await page.getByLabel(/Borda recheada/).check();
    await page.getByLabel(/Azeitonas/).check();
    await addButton.click();
    await expect(page.getByTestId("cart-count")).toHaveText("1");

    // desmarca e marca na ordem inversa: é a mesma combinação
    await page.getByLabel(/Azeitonas/).uncheck();
    await page.getByLabel(/Borda recheada/).uncheck();
    await page.getByLabel(/Azeitonas/).check();
    await page.getByLabel(/Borda recheada/).check();
    await addButton.click();
    await expect(page.getByTestId("cart-count")).toHaveText("2");
    let lines = await cart(page);
    expect(lines).toHaveLength(1);
    expect(lines[0].qty).toBe(2);

    // sem a borda: combinação diferente
    await page.getByLabel(/Borda recheada/).uncheck();
    await addButton.click();
    await expect(page.getByTestId("cart-count")).toHaveText("3");
    lines = await cart(page);
    expect(lines).toHaveLength(2);
    expect(lines.map((l) => l.lineId).sort()).toEqual(["fv-001|fv-mar-med|azeitonas", "fv-001|fv-mar-med|azeitonas|borda-catupiry"]);

    // outro tamanho com os mesmos adicionais: outra linha
    await page.getByRole("button", { name: /Broto/ }).click();
    await addButton.click();
    expect(await cart(page)).toHaveLength(3);
  });

  test("sem escolher o tamanho avisa o que falta; esgotado desabilita compra e quantidade", async ({ page }) => {
    await openAs(page, FORNO, "/produto/pizza-margherita");
    await page.getByRole("button", { name: /^Adicionar R\$/ }).click();
    await expect(page.locator("p[role=alert]")).toHaveText("Escolha: Porção");
    await expect(page.getByTestId("cart-count")).toHaveCount(0);

    await page.goto("/produto/pizza-mista");
    await expect(page.getByRole("button", { name: "Esgotado" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Aumentar quantidade" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Diminuir quantidade" })).toBeDisabled();
  });

  test("a quantidade respeita o estoque (Bolo inteiro tem 4)", async ({ page }) => {
    await openAs(page, FORNO, "/produto/bolo-vulcao-de-chocolate");
    await page.getByRole("button", { name: /Inteiro/ }).click();
    const plus = page.getByRole("button", { name: "Aumentar quantidade" });
    for (let i = 0; i < 6; i++) if (await plus.isEnabled()) await plus.click();
    await expect(page.getByTestId("qty")).toHaveText("4");
    await expect(plus).toBeDisabled();
  });

  test("o botão Demo não cobre a barra de compra", async ({ page }) => {
    await openAs(page, FORNO, "/produto/pizza-margherita");
    const demo = await page.getByRole("button", { name: "Demo", exact: true }).boundingBox();
    const add = await page.getByRole("button", { name: /^Adicionar R\$/ }).boundingBox();
    expect(demo && add).toBeTruthy();
    const overlap = !(demo!.x + demo!.width <= add!.x || add!.x + add!.width <= demo!.x || demo!.y + demo!.height <= add!.y || add!.y + add!.height <= demo!.y);
    expect(overlap).toBe(false);
  });
});

test.describe("F11 · a Trama não muda", () => {
  test("segue em grade e com a página de produto clássica", async ({ page }) => {
    await openAs(page, TRAMA);
    await expect(cards(page)).toHaveCount(8);
    await expect(page.getByRole("button", { name: /^Adicionar .* ao carrinho$/ })).toHaveCount(0);
    await expect(page.getByTestId("spotlight")).toHaveCount(0);
    await page.goto("/produto/vestido-midi-linho");
    await expect(page.locator('article[data-layout="sheet"]')).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Adicionar ao carrinho" })).toBeVisible();
    await expect(page.getByTestId("addons")).toHaveCount(0);
  });
});

test.describe("F11 · Forno em 360 px sem rolagem horizontal", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  for (const route of [
    "/",
    "/categoria/pizzas",
    "/categoria/doces",
    "/busca?q=pizza",
    "/busca?q=xyz",
    "/produto/pizza-margherita",
    "/produto/bolo-vulcao-de-chocolate",
    "/produto/pizza-mista",
  ]) {
    test(route, async ({ page }) => {
      await openAs(page, FORNO, route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.waitForTimeout(200);
      expect(await overflowOf(page)).toBeLessThanOrEqual(0);
    });
  }

  test("com itens no carrinho a home (barra de frete) também cabe", async ({ page }) => {
    await openAs(page, FORNO);
    await page.getByRole("button", { name: "Adicionar Brownie com Calda de Chocolate ao carrinho" }).click();
    await expect(page.getByTestId("shipping-progress")).toBeVisible();
    expect(await overflowOf(page)).toBeLessThanOrEqual(0);
  });

  test("a barra fixa fica dentro da tela e o '+' do cardápio tem 40 px", async ({ page }) => {
    await openAs(page, FORNO, "/produto/pizza-margherita");
    const add = await page.getByRole("button", { name: /^Adicionar R\$/ }).boundingBox();
    expect(add!.x + add!.width).toBeLessThanOrEqual(360);
    expect(add!.height).toBeGreaterThanOrEqual(44);

    await page.goto("/categoria/pizzas");
    const plus = await page.getByRole("button", { name: "Adicionar Pizza de Pepperoni ao carrinho" }).boundingBox();
    expect(plus!.width).toBeGreaterThanOrEqual(40);
    expect(plus!.height).toBeGreaterThanOrEqual(40);
  });
});
