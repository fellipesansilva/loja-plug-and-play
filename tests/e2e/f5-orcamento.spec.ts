import { test, ORIGIN } from "./helpers";
import { ARCA, arca, expect, setupArca } from "./orcamento-helpers";

setupArca();

const PAGES = ["", "/categoria/industria-e-agro", "/categoria/eventos-e-marketing", "/produto/reservatorio-flexivel-fechado", "/produto/blimp-inflavel", "/busca?q=boia", "/sobre", "/condicoes-comerciais", "/privacidade"];

test.describe("H1 · módulo orçamento: loja sem preço", () => {
  test("nenhum 'R$' na loja inteira (HTML do servidor e tela depois de carregar)", async ({ page, request }) => {
    for (const route of PAGES) {
      const html = await (await request.get(`${ARCA}${route}`)).text();
      // o HTML do servidor não tem valor em reais (os dados do preset no JavaScript não têm preço: todos valem 0)
      expect(html.includes("R$"), `HTML ${route}`).toBe(false);
      expect(html, `ld+json ${route}`).not.toContain("application/ld+json");
      expect(html, `offers ${route}`).not.toMatch(/"offers"\s*:/);
      await arca(page, route);
      const text = await page.locator("body").innerText();
      expect(text.includes("R$"), `tela ${route}`).toBe(false);
      expect(text, `grátis ${route}`).not.toMatch(/frete grátis|Pix|parcel|cupom|boleto/i);
    }
  });

  test("cards, produto e busca não têm preço, parcelas nem 'esgotado'; a ordenação por preço não existe", async ({ page }) => {
    await arca(page, "/categoria/industria-e-agro");
    await expect(page.getByTestId("product-card")).toHaveCount(6);
    await expect(page.getByTestId("product-card").first()).not.toContainText(/R\$|\d+x|Pix|Esgotado/);
    await expect(page.getByTestId("product-price")).toHaveCount(0);
    const options = await page.locator("select").first().locator("option").allTextContents();
    expect(options.join(" | ")).not.toMatch(/preço/i);
    await arca(page, "/busca?q=boia");
    await expect(page.getByTestId("product-card")).toHaveCount(2);
    await expect(page.getByTestId("product-card").first()).not.toContainText("R$");
    await arca(page, "/produto/boia-de-demarcacao");
    await expect(page.getByTestId("product-price")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Adicionar ao carrinho" })).toHaveCount(0);
    await expect(page.getByTestId("add-total")).toHaveCount(0);
    await expect(page.getByText(/calcular frete/i)).toHaveCount(0);
  });

  test("o produto tem 'Adicionar ao orçamento' (texto do preset), ficha técnica em tabela e aplicações em etiquetas", async ({ page }) => {
    await arca(page, "/produto/reservatorio-flexivel-fechado");
    const addLabel = await page.evaluate(() => window.__demoStore!.getState().config.quote!.addLabel);
    expect(addLabel).toBe("Adicionar ao orçamento");
    await expect(page.getByRole("button", { name: addLabel })).toBeVisible();
    await expect(page.getByRole("button", { name: "Adicionar", exact: true })).toHaveCount(0);
    const table = page.getByTestId("spec-table");
    await expect(table).toBeVisible();
    await expect(table.getByRole("rowheader")).toHaveText(["Material", "Medidas", "Capacidade", "Válvulas"]);
    await expect(table).toContainText("Lona de PVC");
    await expect(page.getByTestId("applications").getByRole("listitem")).toHaveText(["Agro e irrigação", "Indústria e saneamento"]);
  });

  test("carrinho, checkout, pedido, arrependimento e trocas não existem na Arca: 404 de verdade", async ({ request }) => {
    for (const route of ["/carrinho", "/checkout", "/pedido/ARC-1001", "/arrependimento", "/trocas-e-devolucoes", "/painel/pedidos", "/painel/pedidos/ARC-1001"]) {
      expect((await request.get(`${ARCA}${route}`)).status(), route).toBe(404);
    }
    for (const route of ["", "/condicoes-comerciais", "/privacidade", "/sobre", "/produto/blimp-inflavel", "/painel/produtos"]) {
      expect((await request.get(`${ARCA}${route}`)).status(), route).toBe(200);
    }
  });

  test("Trama e Forno seguem com preço e checkout; as páginas de orçamento não existem nelas", async ({ request }) => {
    for (const slug of ["trama", "forno"]) {
      for (const route of ["/carrinho", "/checkout", "/trocas-e-devolucoes", "/arrependimento", "/painel/pedidos"]) {
        expect((await request.get(`${ORIGIN}/${slug}${route}`)).status(), `${slug}${route}`).toBe(200);
      }
      for (const route of ["/condicoes-comerciais", "/orcamento", "/painel/orcamentos"]) {
        expect((await request.get(`${ORIGIN}/${slug}${route}`)).status(), `${slug}${route}`).toBe(404);
      }
      expect(await (await request.get(`${ORIGIN}/${slug}`)).text()).toContain("R$");
    }
  });

  test("rodapé da Arca: identificação, Condições comerciais, privacidade e cookies; sem 'Trocas' nem 'Desistir da compra'", async ({ page }) => {
    await arca(page, "");
    const footer = page.getByTestId("store-footer");
    await expect(footer.getByTestId("footer-name")).toHaveText("Arca Infláveis Indústria Ltda. (fictícia)");
    await expect(footer.getByTestId("footer-document")).toContainText("00.000.000/0001-00");
    await expect(footer.getByRole("link", { name: "Condições comerciais" })).toHaveAttribute("href", "/arca/condicoes-comerciais");
    await expect(footer.getByRole("link", { name: "Política de Privacidade" })).toBeVisible();
    await expect(footer.getByRole("button", { name: "Preferências de cookies" })).toBeVisible();
    await expect(footer).not.toContainText(/Trocas e devoluções|Desistir da compra/);
    await expect(page.getByRole("navigation", { name: "Menu principal" }).getByRole("link", { name: "Condições comerciais" })).toHaveCount(1);
  });

  test("Condições comerciais: produção sob consulta, frete FOB e garantia de 90 dias, vindos do preset", async ({ page }) => {
    await arca(page, "/condicoes-comerciais");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Condições comerciais");
    await expect(page.getByTestId("cond-producao")).toContainText("Prazo de produção sob consulta");
    await expect(page.getByTestId("cond-frete")).toContainText("Frete FOB");
    await expect(page.getByTestId("defect-days")).toHaveText("90 dias");
    await expect(page.getByTestId("cond-garantia")).toContainText(/defeito de fabricação/);
    await expect(page.locator("body")).toContainText("demonstração");
  });

  test("a Arca é a terceira loja do painel Demo e o tema dela é o do preset", async ({ page }) => {
    await arca(page, "");
    await page.getByRole("button", { name: "Demo", exact: true }).click();
    const list = page.getByRole("list", { name: "Lojas da demonstração" });
    await expect(list.getByRole("listitem")).toHaveText(["Trama Studio", "Forno da Vila", "Arca Infláveis"]);
    await expect(list.locator('[aria-current="true"]')).toHaveText("Arca Infláveis");
    await expect(list.getByRole("link", { name: "Trama Studio" })).toHaveAttribute("href", "/trama");
    const primary = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--t-color-primary").trim());
    expect(primary).toBe("#0f4c5c");
    const fonts = await page.evaluate(() => [...document.fonts].map((f) => f.family));
    expect(fonts).toContain("Barlow Condensed");
  });

  test("rede: a Arca não baixa nada de Trama nem Forno (fonte, imagem, tema)", async ({ page }) => {
    const requested: string[] = [];
    page.on("request", (r) => requested.push(new URL(r.url()).pathname));
    await arca(page, "");
    expect(requested.filter((p) => /\/fonts\/(trama|forno)\/|presets\/(trama-studio|forno-da-vila)\//.test(p))).toEqual([]);
    expect(requested.filter((p) => p.includes("/fonts/arca/")).length).toBeGreaterThanOrEqual(2);
    expect(requested.some((p) => p.includes("/images/presets/arca-inflaveis/"))).toBe(true);
  });
});

const addFromProduct = async (page: import("@playwright/test").Page, slug: string, qty = 1) => {
  await arca(page, `/produto/${slug}`);
  for (let i = 1; i < qty; i++) await page.getByRole("button", { name: "Aumentar quantidade" }).click();
  await page.getByTestId("add-to-quote").click();
  await expect(page.getByTestId("quote-added")).toBeVisible();
};

test.describe("H2 · lista de orçamento", () => {
  test("adiciona 3 itens, edita quantidade e observação, recarrega e mantém", async ({ page }) => {
    await addFromProduct(page, "reservatorio-flexivel-fechado");
    await addFromProduct(page, "boia-de-demarcacao", 3);
    await addFromProduct(page, "blimp-inflavel");
    // o contador do cabeçalho conta os itens diferentes
    await expect(page.getByTestId("quote-count")).toHaveText("3");
    await expect(page.getByRole("link", { name: "Lista de orçamento, 3 itens" })).toHaveAttribute("href", "/arca/orcamento");

    await page.getByRole("link", { name: "Lista de orçamento, 3 itens" }).click();
    await page.waitForFunction(() => !!window.__demoStore);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lista de orçamento");
    const lines = page.getByTestId("quote-line");
    await expect(lines).toHaveCount(3);
    await expect(lines.nth(1).getByTestId("quote-line-qty")).toHaveValue("3");

    // quantidade: botões e campo numérico
    await lines.nth(0).getByRole("button", { name: "Aumentar quantidade de Reservatório Flexível Fechado" }).click();
    await expect(lines.nth(0).getByTestId("quote-line-qty")).toHaveValue("2");
    await lines.nth(1).getByTestId("quote-line-qty").fill("12");
    await expect(lines.nth(1).getByTestId("quote-line-qty")).toHaveValue("12");
    await lines.nth(2).getByRole("button", { name: "Diminuir quantidade de Blimp Inflável" }).waitFor();
    await expect(lines.nth(2).getByRole("button", { name: "Diminuir quantidade de Blimp Inflável" })).toBeDisabled();

    // observação por item
    await lines.nth(0).getByLabel("Observações de Reservatório Flexível Fechado").fill("20.000 litros, água de irrigação, terreno plano");
    await lines.nth(1).getByLabel("Observações de Boia de Demarcação").fill("Laranja, 60 cm, com olhal");
    await expect(lines.nth(0).getByTestId("quote-note-count")).toHaveText("47/500");

    await page.reload();
    await page.waitForFunction(() => !!window.__demoStore);
    await expect(lines).toHaveCount(3);
    await expect(lines.nth(0).getByTestId("quote-line-qty")).toHaveValue("2");
    await expect(lines.nth(1).getByTestId("quote-line-qty")).toHaveValue("12");
    await expect(lines.nth(0).getByLabel("Observações de Reservatório Flexível Fechado")).toHaveValue("20.000 litros, água de irrigação, terreno plano");
    await expect(lines.nth(1).getByLabel("Observações de Boia de Demarcação")).toHaveValue("Laranja, 60 cm, com olhal");
    await expect(page.getByTestId("quote-count")).toHaveText("3");
    // guardada no localStorage do preset (outra chave que a das outras lojas)
    const keys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("loja-demo")));
    expect(keys).toEqual(["loja-demo-v1-arca"]);
  });

  test("a observação aceita até 500 caracteres", async ({ page }) => {
    await addFromProduct(page, "portico-inflavel");
    await page.goto(`${ARCA}/orcamento`);
    const note = page.getByTestId("quote-line-note");
    await note.fill("x".repeat(650));
    await expect(note).toHaveValue("x".repeat(500));
    await expect(page.getByTestId("quote-note-count")).toHaveText("500/500");
    const stored = await page.evaluate(() => window.__demoStore!.getState().quoteList[0].note.length);
    expect(stored).toBe(500);
  });

  test("somar o mesmo produto aumenta a quantidade; remover tira o item e esvazia o contador", async ({ page }) => {
    await addFromProduct(page, "blimp-inflavel", 2);
    await addFromProduct(page, "blimp-inflavel", 1);
    await page.goto(`${ARCA}/orcamento`);
    await expect(page.getByTestId("quote-line")).toHaveCount(1);
    await expect(page.getByTestId("quote-line-qty")).toHaveValue("3");
    await page.getByRole("button", { name: "Remover Blimp Inflável" }).click();
    await expect(page.getByTestId("quote-empty")).toContainText("Sua lista de orçamento está vazia");
    await expect(page.getByTestId("quote-count")).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId("quote-empty")).toBeVisible();
  });

  test("os textos usam o rótulo do preset (lista de orçamento, feminino)", async ({ page }) => {
    await addFromProduct(page, "blimp-inflavel");
    await expect(page.getByTestId("quote-added")).toContainText("Adicionado à lista de orçamento");
    await expect(page.getByTestId("quote-added").getByRole("link")).toHaveText("Ver lista de orçamento");
  });

  test("produto inativo no painel some da lista de orçamento", async ({ page }) => {
    await addFromProduct(page, "boia-cilindrica");
    await arca(page, "/painel/produtos");
    await page.getByLabel("Buscar por nome ou SKU").fill("Boia Cilíndrica");
    await page.getByTestId("product-row").first().getByTestId("toggle-active").click();
    await page.goto(`${ARCA}/orcamento`);
    await expect(page.getByTestId("quote-empty")).toBeVisible();
  });
});
