import { type Page } from "@playwright/test";
import { expect, test, inStore, FORNO, TRAMA, openAs } from "./helpers";

const overflowOf = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

const cards = (page: Page) => page.getByTestId("product-card");

test.describe("F1-01 · home", () => {
  test("Trama: blocos na ordem do preset (banner, categorias, destaques com 8 produtos)", async ({ page }) => {
    await openAs(page, TRAMA);
    await expect(page.locator("main h1, main h2")).toHaveCount(3);
    await expect(page.locator("main h1")).toHaveCount(1);
    await expect(cards(page)).toHaveCount(8);
    const order = await page.evaluate(() =>
      [...document.querySelectorAll("main section")].map((s) => s.getAttribute("aria-label") ?? s.getAttribute("aria-labelledby")),
    );
    expect(order[0]).not.toMatch(/^bloco-/);
    expect(order.slice(1)).toEqual(["bloco-categorias", "bloco-destaques"]);
  });

  test("Trama: faixa de frete grátis, parcelamento visível e selo Esgotado", async ({ page }) => {
    await openAs(page, TRAMA);
    await expect(page.getByTestId("announcement-bar")).toHaveText(/Frete grátis acima de R\$\s199$/);
    await expect(page.getByTestId("installments").first()).toContainText(/^ou \d+x de R\$/);
    await expect(page.getByTestId("installments").first()).toContainText("sem juros");
    await expect(cards(page).filter({ hasText: "Esgotado" })).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Destaques" })).toBeVisible();
  });

  test("Forno: faixa com retirada, sem parcelamento e selo de restrição", async ({ page }) => {
    await openAs(page, FORNO);
    await expect(page.getByTestId("announcement-bar")).toHaveText(/Frete grátis acima de R\$\s80 · Retire na loja em 20 min/);
    await expect(page.getByTestId("installments")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Mais pedidos" })).toBeVisible();
    await expect(cards(page).filter({ hasText: "Vegano" }).first()).toBeVisible();
  });

  test("desligar um bloco ou mudar a ordem no store reflete na home", async ({ page }) => {
    await openAs(page, TRAMA);
    await expect(page.getByRole("heading", { name: "Destaques" })).toBeVisible();
    await page.evaluate(() => {
      const store = window.__demoStore!;
      store.setState((s) => ({
        config: {
          ...s.config,
          homeBlocks: s.config.homeBlocks.map((b) => (b.id === "destaques" ? { ...b, enabled: false } : b)),
        },
      }));
    });
    await expect(page.getByRole("heading", { name: "Destaques" })).toHaveCount(0);
    await expect(cards(page)).toHaveCount(0);

    // inverte a ordem dos blocos que sobraram
    await page.evaluate(() => {
      window.__demoStore!.setState((s) => ({
        config: { ...s.config, homeBlocks: [...s.config.homeBlocks].reverse() },
      }));
    });
    const first = await page.locator("main section").first().getAttribute("aria-labelledby");
    expect(first).toBe("bloco-categorias");
  });

  test("clicar numa categoria e num card leva à página correspondente", async ({ page }) => {
    await openAs(page, TRAMA);
    await page.locator("main").getByRole("link", { name: "Feminino" }).first().click();
    await expect(page).toHaveURL(/\/categoria\/feminino$/);
    await page.goto("/");
    await cards(page).first().getByRole("link").click();
    await expect(page).toHaveURL(/\/produto\/vestido-midi-linho$/);
  });
});

test.describe("F1-00 · título e descrição", () => {
  test("Trama: título e descrição do preset, sem 'mockup/demonstração'", async ({ page }) => {
    await openAs(page, TRAMA);
    await expect(page).toHaveTitle("Início · Trama Studio");
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description).toContain("Moda atemporal");
    for (const text of [await page.title(), description ?? ""]) expect(text.toLowerCase()).not.toMatch(/mockup|demonstra/);
  });

  test("Forno: título e descrição do preset, sem 'mockup/demonstração'", async ({ page }) => {
    await openAs(page, FORNO);
    await expect(page).toHaveTitle("Início · Forno da Vila");
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description).toContain("Pizzas, pães e doces");
    for (const text of [await page.title(), description ?? ""]) expect(text.toLowerCase()).not.toMatch(/mockup|demonstra/);
  });

  test("navegação pelo cliente atualiza o título para a página aberta", async ({ page }) => {
    await openAs(page, TRAMA);
    await page.locator("main").getByRole("link", { name: "Feminino" }).first().click();
    await expect(page).toHaveTitle("Feminino · Trama Studio");
    await cards(page).first().getByRole("link").click();
    await expect(page).toHaveTitle("Vestido Midi Linho · Trama Studio");
  });

  test("páginas fora do catálogo também seguem o modelo", async ({ page }) => {
    await openAs(page, FORNO, "/sobre");
    await expect(page).toHaveTitle("Sobre · Forno da Vila");
  });
});

test.describe("F1-02 · categoria", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("filtros dinâmicos, OU/E, URL reaplicada, limpar e ordenar", async ({ page }) => {
    await openAs(page, TRAMA, "/categoria/feminino");
    const total = page.getByTestId("result-count");
    await expect(total).toHaveText("7 produtos");

    const side = page.getByRole("complementary", { name: "Filtros" });
    await expect(side.getByRole("group", { name: "Tamanho" })).toBeVisible();
    await expect(side.getByRole("group", { name: "Cor" })).toBeVisible();
    await expect(side.getByRole("group", { name: "Material" })).toHaveCount(0);

    // Preto → produtos que têm Preto
    await side.getByLabel("Preto").check();
    await expect(total).toHaveText("2 produtos");
    // OU no mesmo atributo: Preto ou Areia
    await side.getByLabel("Areia").check();
    await expect(total).toHaveText("4 produtos");
    // E entre atributos: ... e tamanho G
    await side.getByLabel("G", { exact: true }).check();
    await expect(total).toHaveText("3 produtos");
    await expect(page).toHaveURL(/tamanho=G/);
    await expect(page).toHaveURL(/cor=Areia%2CPreto|cor=Preto%2CAreia/);

    // abrir a mesma URL em outra aba reaplica tudo
    const url = page.url();
    const other = await page.context().newPage();
    await other.goto(url);
    await expect(other.getByTestId("result-count")).toHaveText("3 produtos");
    await expect(other.getByRole("complementary", { name: "Filtros" }).getByLabel("G", { exact: true })).toBeChecked();
    await other.close();

    // recarregar mantém
    await page.reload();
    await expect(total).toHaveText("3 produtos");

    // ordenar por menor preço
    await side.getByLabel("Ordenar por").selectOption("menor-preco");
    await expect(page).toHaveURL(/ordem=menor-preco/);
    const prices = await cards(page).evaluateAll((els) =>
      els.map((el) => Number((el.textContent ?? "").match(/R\$\s([\d.]+),(\d{2})/)!.slice(1).join("").replace(".", ""))),
    );
    expect(prices).toEqual([...prices].sort((a, b) => a - b));

    // limpar filtros (mantém a ordem)
    await side.getByRole("button", { name: "Limpar filtros" }).click();
    await expect(total).toHaveText("7 produtos");
    await expect(page).not.toHaveURL(/tamanho=|cor=/);

    // maior preço
    await side.getByLabel("Ordenar por").selectOption("maior-preco");
    const desc = await cards(page).evaluateAll((els) =>
      els.map((el) => Number((el.textContent ?? "").match(/R\$\s([\d.]+),(\d{2})/)!.slice(1).join("").replace(".", ""))),
    );
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
  });

  test("URL com filtro em minúsculas (?cor=preto) é aceita", async ({ page }) => {
    await openAs(page, TRAMA, "/categoria/feminino?cor=preto&tamanho=M");
    await expect(page.getByTestId("result-count")).toHaveText("2 produtos");
  });

  test("sem resultados: mensagem e Limpar filtros", async ({ page }) => {
    await openAs(page, TRAMA, "/categoria/feminino?cor=Marinho&tamanho=G&ordem=maior-preco");
    // Marinho + G: só a calça tem marinho em G → 1; combine com Areia no mesmo grupo não zera, então use dois eixos exclusivos
    await openAs(page, TRAMA, "/categoria/feminino");
    const side = page.getByRole("complementary", { name: "Filtros" });
    await side.getByLabel("Verde oliva").check(); // macacão (tamanho M)
    await side.getByLabel("P", { exact: true }).check(); // nenhum verde-oliva em P
    await expect(page.getByTestId("result-count")).toHaveText("0 produtos");
    await expect(page.getByText("Nenhum produto encontrado com esses filtros.")).toBeVisible();
    await page.locator("main").getByRole("button", { name: "Limpar filtros" }).last().click();
    await expect(page.getByTestId("result-count")).toHaveText("7 produtos");
  });

  test("Forno: filtro de restrição alimentar vem do preset", async ({ page }) => {
    await openAs(page, FORNO, "/categoria/bebidas");
    const side = page.getByRole("complementary", { name: "Filtros" });
    await expect(side.getByRole("group", { name: "Restrição alimentar" })).toBeVisible();
    await expect(page.getByTestId("result-count")).toHaveText("4 produtos");
    await side.getByLabel("Vegano").check();
    await expect(page.getByTestId("result-count")).toHaveText("2 produtos");
  });
});

test.describe("F1-02 · filtros no celular (360 px)", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test("drawer: abre, filtra, fecha com Esc e devolve o foco", async ({ page }) => {
    await openAs(page, TRAMA, "/categoria/feminino");
    const trigger = page.getByRole("button", { name: "Filtrar", exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Filtros" });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Preto").check();
    await expect(page.getByTestId("result-count")).toHaveText("2 produtos");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    const withCount = page.getByRole("button", { name: "Filtrar (1)" });
    await expect(withCount).toBeFocused();
    expect(await overflowOf(page)).toBeLessThanOrEqual(0);

    await withCount.click();
    await dialog.getByRole("button", { name: "Limpar filtros" }).click();
    await expect(page.getByTestId("result-count")).toHaveText("7 produtos");
    await dialog.getByRole("button", { name: /^Ver 7 resultados/ }).click();
    await expect(dialog).toBeHidden();
  });
});

test.describe("F1-03 · busca", () => {
  test("Forno: 'pao' encontra 'Pão de Queijo' pela busca do cabeçalho", async ({ page }) => {
    await openAs(page, FORNO);
    const field = page.getByRole("searchbox", { name: "Buscar produtos" });
    await field.fill("pao");
    await field.press("Enter");
    await expect(page).toHaveURL(/\/busca\?q=pao$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Resultados para “pao”");
    await expect(cards(page).filter({ hasText: "Pão de Queijo" })).toBeVisible();
    await expect(page).toHaveTitle(/^Busca: pao · Forno da Vila$/);
  });

  test("termo vem da URL, com acento e maiúsculas", async ({ page }) => {
    await openAs(page, FORNO, "/busca?q=P%C3%83O");
    await expect(cards(page).filter({ hasText: "Pão de Queijo" })).toBeVisible();
  });

  test("busca por SKU de variante", async ({ page }) => {
    await openAs(page, TRAMA, "/busca?q=TS-CBP-M-PT");
    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page).first()).toContainText("Camiseta Básica Pima");
  });

  test("Trama: o ícone abre o campo de busca", async ({ page }) => {
    await openAs(page, TRAMA);
    await expect(page.getByRole("searchbox")).toHaveCount(0);
    await page.getByRole("button", { name: "Abrir busca" }).click();
    const field = page.getByRole("searchbox", { name: "Buscar produtos" });
    await expect(field).toBeFocused();
    await field.fill("linho");
    await field.press("Enter");
    await expect(page).toHaveURL(/q=linho/);
    await expect(cards(page).first()).toBeVisible();
  });

  test("termo sem resultado: mensagem e categorias do preset", async ({ page }) => {
    await openAs(page, FORNO, "/busca?q=xyzinexistente");
    const empty = page.getByTestId("search-empty");
    await expect(empty).toContainText("Nenhum produto encontrado para “xyzinexistente”");
    for (const name of ["Pizzas", "Pães", "Doces", "Bebidas"]) {
      await expect(empty.getByRole("link", { name })).toBeVisible();
    }
  });
});

test.describe("F1-04 · produto", () => {
  test("Forno: variação atualiza preço e SKU", async ({ page }) => {
    await openAs(page, FORNO, "/produto/pizza-margherita");
    await expect(page.getByTestId("product-price")).toContainText("39,90");
    await page.getByRole("button", { name: /Média/ }).click();
    await expect(page.getByTestId("product-price")).toContainText("54,90");
    await expect(page.getByTestId("product-sku")).toHaveText("SKU: FV-MAR-MED");
    await expect(page.getByRole("button", { name: /Média/ })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("installments")).toHaveCount(0);
  });

  test("Trama: combinação sem estoque fica desabilitada", async ({ page }) => {
    await openAs(page, TRAMA, "/produto/vestido-midi-linho");
    await page.getByRole("button", { name: "G", exact: true }).click();
    await expect(page.getByRole("button", { name: "Areia (indisponível)" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Off-white", exact: true })).toBeEnabled();
    await expect(page.getByTestId("installments")).toContainText("em até 6x de");
  });

  test("sem escolher as opções: avisa o que falta e não adiciona", async ({ page }) => {
    await openAs(page, TRAMA, "/produto/vestido-midi-linho");
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await expect(page.locator("p[role=alert]")).toHaveText("Escolha: Tamanho, Cor");
    await expect(page.getByTestId("cart-count")).toHaveCount(0);

    await page.getByRole("button", { name: "M", exact: true }).click();
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await expect(page.locator("p[role=alert]")).toHaveText("Escolha: Cor");
  });

  test("adicionar ao carrinho: contador, confirmação com link e persistência", async ({ page }) => {
    await openAs(page, TRAMA, "/produto/vestido-midi-linho");
    await page.getByRole("button", { name: "M", exact: true }).click();
    await page.getByRole("button", { name: "Areia", exact: true }).click();
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    const toast = page.getByRole("status");
    await expect(toast).toContainText("Adicionado ao carrinho");
    await expect(toast.getByRole("link", { name: "Ver carrinho" })).toHaveAttribute("href", inStore("/carrinho"));
    await expect(page.getByTestId("cart-count")).toHaveText("1");

    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await expect(page.getByTestId("cart-count")).toHaveText("2");

    await page.reload();
    await expect(page.getByTestId("cart-count")).toHaveText("2");

    // reset zera o carrinho
    await page.getByRole("button", { name: "Demo", exact: true }).click();
    await page.getByRole("button", { name: "Resetar dados" }).click();
    await expect(page.getByTestId("cart-count")).toHaveCount(0);
  });

  test("estoque baixo e produto esgotado", async ({ page }) => {
    await openAs(page, TRAMA, "/produto/calca-alfaiataria");
    await page.getByRole("button", { name: "P", exact: true }).click();
    await page.getByRole("button", { name: "Preto", exact: true }).click();
    await expect(page.getByTestId("low-stock")).toHaveText("Restam 3 unidades");

    await page.goto("/produto/cardigan-trico");
    const soldOut = page.getByRole("button", { name: "Esgotado" });
    await expect(soldOut).toBeDisabled();
    await expect(page.getByRole("button", { name: "Adicionar ao carrinho" })).toHaveCount(0);
  });

  test("Trama: frete por CEP (regiões, grátis, faltam, inválido)", async ({ page }) => {
    await openAs(page, TRAMA, "/produto/camiseta-basica-pima"); // R$ 99,90 (abaixo de R$ 199)
    const cep = page.getByLabel("CEP");
    const result = page.getByTestId("shipping-result");

    await cep.fill("01310100");
    await expect(cep).toHaveValue("01310-100");
    await page.getByRole("button", { name: "Calcular" }).click();
    await expect(result).toContainText("Econômico");
    await expect(result).toContainText("R$ 14,90");
    await expect(result).toContainText("5 a 8 dias úteis");
    await expect(result).toContainText("Expresso");
    await expect(result).toContainText("R$ 24,90");
    await expect(result).toContainText("Faltam R$ 99,10 para frete grátis");
    await expect(result).not.toContainText("Retirar na loja");

    await cep.fill("90000000");
    await page.getByRole("button", { name: "Calcular" }).click();
    await expect(result).toContainText("R$ 23,84");
    await expect(result).toContainText("9 a 12 dias úteis");

    await cep.fill("123");
    await page.getByRole("button", { name: "Calcular" }).click();
    await expect(result).toHaveText("CEP inválido");

    // acima do mínimo: Econômico grátis
    await page.goto("/produto/vestido-midi-linho");
    await page.getByLabel("CEP").fill("01310-100");
    await page.getByRole("button", { name: "Calcular" }).click();
    await expect(result).toContainText("Grátis");
    await expect(result).not.toContainText("Faltam");
  });

  test("Forno: cobertura por CEP, retirada e frete grátis", async ({ page }) => {
    await openAs(page, FORNO, "/produto/pao-de-queijo-12-unidades"); // R$ 19,90
    const result = page.getByTestId("shipping-result");

    await page.getByLabel("CEP").fill("01310-100");
    await page.getByRole("button", { name: "Calcular" }).click();
    await expect(result).toContainText("R$ 9,90");
    await expect(result).toContainText("1 a 2 dias úteis");
    await expect(result).toContainText("hoje");
    await expect(result).toContainText("Retirar na loja · grátis");
    await expect(result).toContainText("Praça Exemplo, 45");
    await expect(result).toContainText("Faltam R$ 60,10 para frete grátis");

    await page.getByLabel("CEP").fill("80010-000");
    await page.getByRole("button", { name: "Calcular" }).click();
    await expect(result).toContainText("Não entregamos neste CEP");
    await expect(result).toContainText("Retirar na loja · grátis");
    await expect(result).not.toContainText("Econômico");
  });

  test("galeria mostra a posição e a linha de arrependimento leva a Trocas e devoluções", async ({ page }) => {
    await openAs(page, TRAMA, "/produto/vestido-midi-linho");
    await expect(page.getByTestId("gallery-position")).toHaveText("1 / 3");
    await page.getByRole("button", { name: "Próxima foto" }).click();
    await expect(page.getByTestId("gallery-position")).toHaveText("2 / 3");
    await expect(page.getByText("7 dias após o recebimento")).toBeVisible();
    await page.getByRole("article").getByRole("link", { name: "Trocas e devoluções" }).click();
    await expect(page).toHaveURL(/\/trocas-e-devolucoes$/);
  });

  test("produto inexistente mostra aviso depois de carregar", async ({ page }) => {
    await openAs(page, TRAMA, "/produto/nao-existe");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Produto não encontrado");
  });
});

test.describe("F1 · 360 px sem rolagem horizontal", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  for (const preset of [TRAMA, FORNO]) {
    const routes = [
      "/",
      "/categoria/feminino",
      "/categoria/pizzas",
      "/busca?q=pao",
      "/busca?q=xyz",
      "/produto/vestido-midi-linho",
      "/produto/pizza-margherita",
    ];
    for (const route of routes) {
      test(`${preset} ${route}`, async ({ page }) => {
        await openAs(page, preset, route);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await page.waitForTimeout(150);
        expect(await overflowOf(page)).toBeLessThanOrEqual(0);
      });
    }
  }

  test("alvos de toque do cabeçalho têm ao menos 44 px", async ({ page }) => {
    await openAs(page, TRAMA);
    for (const name of ["Abrir menu", "Abrir busca", /^Carrinho/]) {
      const box = await page.getByRole(name === "Abrir menu" || name === "Abrir busca" ? "button" : "link", { name }).boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
});
