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
