import fs from "node:fs";
import path from "node:path";
import { test, ORIGIN } from "./helpers";
import { ARCA, arca, expect, setupArca } from "./orcamento-helpers";

setupArca();

const PAGES = ["", "/categoria/industria-e-agro", "/categoria/eventos-e-marketing", "/produto/saco-para-teste-de-carga", "/produto/blimp-inflavel", "/busca?q=boia", "/sobre", "/condicoes-comerciais", "/privacidade"];

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
    await arca(page, "/produto/saco-para-teste-de-carga");
    const addLabel = await page.evaluate(() => window.__demoStore!.getState().config.quote!.addLabel);
    expect(addLabel).toBe("Adicionar ao orçamento");
    await expect(page.getByRole("button", { name: addLabel })).toBeVisible();
    await expect(page.getByRole("button", { name: "Adicionar", exact: true })).toHaveCount(0);
    const table = page.getByTestId("spec-table");
    await expect(table).toBeVisible();
    await expect(table.getByRole("rowheader")).toHaveText(["Material", "Medidas", "Capacidade", "Válvulas"]);
    await expect(table).toContainText("Poliéster com cobertura de PVC");
    await expect(page.getByTestId("applications").getByRole("listitem")).toHaveText(["Construção e içamento de cargas", "Indústria e saneamento"]);
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

  test("a Arca é a terceira loja do painel Demo (a Faísca, a quarta) e o tema dela é o do preset", async ({ page }) => {
    await arca(page, "");
    await page.getByRole("button", { name: "Demo", exact: true }).click();
    const list = page.getByRole("list", { name: "Lojas da demonstração" });
    await expect(list.getByRole("listitem")).toHaveText(["Trama Studio", "Forno da Vila", "Arca Infláveis", "Faísca"]);
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
    await addFromProduct(page, "saco-para-teste-de-carga");
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
    await lines.nth(0).getByRole("button", { name: "Aumentar quantidade de Saco para Teste de Carga" }).click();
    await expect(lines.nth(0).getByTestId("quote-line-qty")).toHaveValue("2");
    await lines.nth(1).getByTestId("quote-line-qty").fill("12");
    await expect(lines.nth(1).getByTestId("quote-line-qty")).toHaveValue("12");
    await lines.nth(2).getByRole("button", { name: "Diminuir quantidade de Blimp Inflável" }).waitFor();
    await expect(lines.nth(2).getByRole("button", { name: "Diminuir quantidade de Blimp Inflável" })).toBeDisabled();

    // observação por item
    await lines.nth(0).getByLabel("Observações de Saco para Teste de Carga").fill("20.000 litros, água de irrigação, terreno plano");
    await lines.nth(1).getByLabel("Observações de Boia de Demarcação").fill("Laranja, 60 cm, com olhal");
    await expect(lines.nth(0).getByTestId("quote-note-count")).toHaveText("47/500");

    await page.reload();
    await page.waitForFunction(() => !!window.__demoStore);
    await expect(lines).toHaveCount(3);
    await expect(lines.nth(0).getByTestId("quote-line-qty")).toHaveValue("2");
    await expect(lines.nth(1).getByTestId("quote-line-qty")).toHaveValue("12");
    await expect(lines.nth(0).getByLabel("Observações de Saco para Teste de Carga")).toHaveValue("20.000 litros, água de irrigação, terreno plano");
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

const fillQuote = async (page: import("@playwright/test").Page, over: Partial<Record<"name" | "company" | "email" | "whatsapp" | "city" | "state" | "message", string>> = {}, application = "Agro e irrigação") => {
  const v = { name: "Ana Souza", company: "Fazenda Boa Água", email: "ana@example.com", whatsapp: "19912345678", city: "Campinas", state: "sp", message: "Preciso do prazo e do frete.", ...over };
  await page.locator("#chk-quoteName").fill(v.name);
  await page.locator("#chk-quoteCompany").fill(v.company);
  await page.locator("#chk-quoteEmail").fill(v.email);
  await page.locator("#chk-quoteWhatsapp").fill(v.whatsapp);
  await page.locator("#chk-quoteCity").fill(v.city);
  await page.locator("#chk-quoteState").fill(v.state);
  await page.getByLabel("Aplicação").selectOption(application);
  await page.getByLabel("Mensagem (opcional)").fill(v.message);
};

const seedList = async (page: import("@playwright/test").Page) => {
  await addFromProduct(page, "saco-para-teste-de-carga", 2);
  await addFromProduct(page, "boia-de-demarcacao", 6);
  await page.goto(`${ARCA}/orcamento`);
  await page.waitForFunction(() => !!window.__demoStore);
  await page.getByLabel("Observações de Saco para Teste de Carga").fill("20.000 litros, terreno plano");
  await page.getByLabel("Observações de Boia de Demarcação").fill("Laranja, 60 cm, com olhal");
};

const stubOpen = (page: import("@playwright/test").Page) =>
  page.addInitScript(() => {
    (window as unknown as { __opened: string[] }).__opened = [];
    window.open = ((url?: string | URL) => {
      (window as unknown as { __opened: string[] }).__opened.push(String(url));
      return null;
    }) as typeof window.open;
  });

test.describe("H3 · envio do pedido de orçamento", () => {
  test("o formulário tem os campos pedidos, o aviso de dados com link para a privacidade e nenhuma caixa de 'concordo'", async ({ page }) => {
    await seedList(page);
    const form = page.getByTestId("quote-form");
    for (const label of ["Nome", "Empresa (opcional)", "E-mail", "WhatsApp", "Cidade de entrega", "UF", "Aplicação", "Mensagem (opcional)"]) {
      await expect(form.getByLabel(label, { exact: true })).toBeVisible();
    }
    const options = await form.getByLabel("Aplicação").locator("option").allTextContents();
    const fromPreset = await page.evaluate(() => window.__demoStore!.getState().config.quote!.applications);
    expect(options).toEqual(["Escolha a aplicação", ...fromPreset]);
    const notice = page.getByTestId("quote-data-notice");
    await expect(notice).toContainText("só para responder ao seu pedido de orçamento");
    await expect(notice.getByRole("link", { name: "Política de Privacidade" })).toHaveAttribute("href", "/arca/privacidade");
    await expect(form.locator('input[type="checkbox"]')).toHaveCount(0);
    await expect(form).not.toContainText(/concordo|aceito/i);
  });

  test("enviar: protocolo, lista vazia, solicitação gravada com itens, observações e contato", async ({ page }) => {
    await seedList(page);
    const before = await page.evaluate(() => window.__demoStore!.getState().quotes.length);
    await fillQuote(page);
    await page.getByTestId("quote-submit").click();
    const protocol = page.getByTestId("quote-protocol");
    await expect(protocol).toHaveText(/^ORC-\d{8}-[0-9A-Z]{5}$/);
    await expect(page.getByTestId("quote-sent")).toContainText("Esta é uma simulação");
    const id = (await protocol.textContent())!;
    const state = await page.evaluate(() => {
      const s = window.__demoStore!.getState();
      return { list: s.quoteList, quotes: s.quotes };
    });
    expect(state.list).toEqual([]);
    expect(state.quotes).toHaveLength(before + 1);
    const q = state.quotes[0];
    expect(q.id).toBe(id);
    expect(q.status).toBe("nova");
    expect(q.items.map((i) => [i.name, i.qty, i.note])).toEqual([
      ["Saco para Teste de Carga", 2, "20.000 litros, terreno plano"],
      ["Boia de Demarcação", 6, "Laranja, 60 cm, com olhal"],
    ]);
    expect(q.contact).toMatchObject({ name: "Ana Souza", company: "Fazenda Boa Água", email: "ana@example.com", whatsapp: "(19) 91234-5678", city: "Campinas", state: "SP", application: "Agro e irrigação" });
    await expect(page.getByTestId("quote-count")).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId("quote-empty")).toBeVisible();
    await expect(page.getByTestId("quote-protocol")).toHaveCount(0);
  });

  test("campos obrigatórios com erro no campo, foco no primeiro e nada enviado", async ({ page }) => {
    await seedList(page);
    const before = await page.evaluate(() => window.__demoStore!.getState().quotes.length);
    await page.getByTestId("quote-submit").click();
    await expect(page.getByTestId("quote-form-errors")).toBeVisible();
    for (const field of ["quoteName", "quoteEmail", "quoteWhatsapp", "quoteCity", "quoteState"]) await expect(page.locator(`#chk-${field}`)).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Aplicação")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#chk-quoteName")).toBeFocused();
    expect(await page.evaluate(() => window.__demoStore!.getState().quotes.length)).toBe(before);
    expect(await page.evaluate(() => window.__demoStore!.getState().quoteList.length)).toBe(2);
    // empresa e mensagem são opcionais
    await fillQuote(page, { company: "", message: "" });
    await page.getByTestId("quote-submit").click();
    await expect(page.getByTestId("quote-protocol")).toBeVisible();
  });

  test("WhatsApp na demo: janela com a mensagem pronta (itens, quantidades, observações) e Copiar; nenhum link para wa.me", async ({ page }) => {
    await stubOpen(page);
    await seedList(page);
    await page.locator("#chk-quoteName").fill("Ana Souza");
    await page.getByTestId("quote-whatsapp").click();
    const dialog = page.getByTestId("whatsapp-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading")).toHaveText("Mensagem para o WhatsApp");
    const message = await page.getByTestId("whatsapp-message").innerText();
    expect(message).toContain("Arca Infláveis");
    expect(message).toContain("1. Saco para Teste de Carga (ARC-STC-004) — 2 unidades");
    expect(message).toContain("Observações: 20.000 litros, terreno plano");
    expect(message).toContain("2. Boia de Demarcação (ARC-BDM-005) — 6 unidades");
    expect(message).toContain("Observações: Laranja, 60 cm, com olhal");
    expect(message).toContain("Nome: Ana Souza");
    await expect(dialog.getByRole("button", { name: "Copiar" })).toBeVisible();
    await dialog.getByRole("button", { name: "Copiar" }).click();
    await expect(dialog).toContainText("Copiado!");
    await expect(dialog).toContainText("nenhuma conversa foi aberta");
    expect(await page.content()).not.toContain("wa.me");
    expect(await page.evaluate(() => (window as unknown as { __opened: string[] }).__opened)).toEqual([]);
    expect(await page.locator('a[href*="wa.me"], a[href*="whatsapp"]').count()).toBe(0);
    // Esc fecha; a lista continua intacta (o WhatsApp não envia nem esvazia)
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    expect(await page.evaluate(() => window.__demoStore!.getState().quoteList.length)).toBe(2);
  });

  test("com número real (isReal), o botão abre o wa.me com a mensagem", async ({ page }) => {
    await stubOpen(page);
    await seedList(page);
    await page.evaluate(() => {
      window.__demoStore!.setState((st) => ({ config: { ...st.config, quote: { ...st.config.quote!, whatsapp: { number: "5519988887777", isReal: true } } } }));
    });
    await page.getByTestId("quote-whatsapp").click();
    await expect(page.getByTestId("whatsapp-dialog")).toHaveCount(0);
    const opened = await page.evaluate(() => (window as unknown as { __opened: string[] }).__opened);
    expect(opened).toHaveLength(1);
    expect(opened[0].startsWith("https://wa.me/5519988887777?text=")).toBe(true);
    const text = decodeURIComponent(opened[0].split("?text=")[1]);
    expect(text).toContain("Saco para Teste de Carga");
    expect(text).toContain("Laranja, 60 cm, com olhal");
  });

  test("a confirmação mostra o protocolo no celular de 400 px sem rolagem horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await seedList(page);
    await fillQuote(page);
    await page.getByTestId("quote-submit").click();
    await expect(page.getByTestId("quote-protocol")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// H4 · orçamentos no painel
// ---------------------------------------------------------------------------------------------------------------------
const FIXTURES = path.resolve(__dirname, "../fixtures/csv");
const quoteIds = (page: import("@playwright/test").Page) => page.getByTestId("quote-row").evaluateAll((els) => els.map((e) => e.getAttribute("data-quote-id")));

/** Envia um pedido de orçamento pela loja (lista + formulário) e devolve o protocolo. */
const sendQuote = async (page: import("@playwright/test").Page, name = "Ana Souza", company = "Fazenda Boa Água") => {
  await seedList(page);
  await fillQuote(page, { name, company });
  await page.getByTestId("quote-submit").click();
  return (await page.getByTestId("quote-protocol").textContent())!;
};

test.describe("H4 · orçamentos no painel", () => {
  test("o menu mostra 'Orçamentos' no lugar de 'Pedidos' e a lista traz as solicitações de exemplo, da mais recente à mais antiga", async ({ page }) => {
    await arca(page, "/painel/orcamentos");
    const nav = page.getByRole("navigation", { name: "Menu do painel" });
    await expect(nav.getByRole("link", { name: "Orçamentos", exact: true })).toHaveAttribute("href", "/arca/painel/orcamentos");
    await expect(nav.getByRole("link", { name: "Pedidos", exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Orçamentos");
    const samples = await page.evaluate(() => window.__demoStore!.getState().quotes.map((q) => ({ id: q.id, at: q.createdAt, status: q.status })));
    expect(samples.length).toBeGreaterThanOrEqual(3);
    expect(samples.length).toBeLessThanOrEqual(5);
    expect(new Set(samples.map((s) => s.status)).size).toBeGreaterThanOrEqual(3);
    expect(await quoteIds(page)).toEqual([...samples].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).map((s) => s.id));
    await expect(page.getByTestId("quote-row").first().locator("dt")).toHaveText(["Data", "Cliente", "Empresa", "Itens"]);
  });

  test("filtro por status e busca por protocolo, nome ou empresa", async ({ page }) => {
    await arca(page, "/painel/orcamentos");
    const rows = page.getByTestId("quote-row");
    const total = await rows.count();
    await page.getByLabel("Status").selectOption("ganho");
    await expect(rows).toHaveCount(1);
    await expect(rows.first().getByTestId("quote-row-status")).toHaveText("Ganho");
    await page.getByLabel("Status").selectOption("todos");
    await page.getByLabel("Buscar por protocolo, nome ou empresa").fill("orc-20260312-t9c3d");
    await expect(rows).toHaveCount(1);
    await page.getByLabel("Buscar por protocolo, nome ou empresa").fill("helena");
    await expect(rows).toHaveCount(1);
    await page.getByLabel("Buscar por protocolo, nome ou empresa").fill("metalurgica prado");
    await expect(rows).toHaveCount(1);
    await page.getByLabel("Status").selectOption("nova");
    await expect(page.getByTestId("quotes-empty")).toBeVisible();
    await page.getByLabel("Status").selectOption("todos");
    await page.getByLabel("Buscar por protocolo, nome ou empresa").fill("");
    await expect(rows).toHaveCount(total);
  });

  test("o pedido enviado pela loja aparece no topo da lista e o detalhe mostra contato, itens, observações e histórico", async ({ page }) => {
    const protocol = await sendQuote(page);
    await page.goto(`${ARCA}/painel/orcamentos`);
    await expect(page.getByTestId("quote-row").first()).toHaveAttribute("data-quote-id", protocol);
    await page.getByTestId("quote-row").first().click(); // a linha inteira é clicável
    await expect(page).toHaveURL(new RegExp(`/painel/orcamentos/${protocol}$`));
    await expect(page.getByTestId("detail-id")).toHaveText(protocol);
    await expect(page.getByTestId("detail-status")).toHaveText("Nova");
    await expect(page.getByTestId("contact-name")).toHaveText("Ana Souza");
    await expect(page.getByTestId("contact-company")).toHaveText("Fazenda Boa Água");
    await expect(page.getByTestId("quote-contact")).toContainText("ana@example.com");
    await expect(page.getByTestId("quote-contact")).toContainText("(19) 91234-5678");
    await expect(page.getByTestId("quote-contact")).toContainText("Campinas/SP");
    await expect(page.getByTestId("contact-application")).toHaveText("Agro e irrigação");
    await expect(page.getByTestId("contact-message")).toContainText("Preciso do prazo e do frete.");
    await expect(page.getByTestId("quote-item")).toHaveCount(2);
    await expect(page.getByTestId("quote-item").first()).toContainText("2× Saco para Teste de Carga");
    await expect(page.getByTestId("quote-item-note").first()).toHaveText("Observações: 20.000 litros, terreno plano");
    await expect(page.getByTestId("history-entry")).toHaveCount(1);
    await expect(page.getByTestId("history-entry").first()).toContainText("Nova");
    // sem preço em nenhum lugar do painel desta loja
    expect(await page.locator("body").innerText()).not.toContain("R$");
  });

  test("percorre nova → em análise → orçamento enviado → ganho, só com as próximas etapas, e registra o histórico", async ({ page }) => {
    const protocol = await sendQuote(page);
    await page.goto(`${ARCA}/painel/orcamentos/${protocol}`);
    const ids = () => page.locator('[data-testid^="quote-status-to-"]').evaluateAll((els) => els.map((e) => e.getAttribute("data-testid")!.replace("quote-status-to-", "")));
    const status = page.getByTestId("detail-status");

    expect(await ids()).toEqual(["em_analise"]);
    await expect(page.getByTestId("quote-lost")).toBeVisible();
    await page.getByTestId("quote-status-to-em_analise").click();
    await expect(status).toHaveText("Em análise");
    expect(await ids()).toEqual(["orcamento_enviado"]);
    await expect(page.getByTestId("quote-status-to-orcamento_enviado")).toHaveText("Marcar como Orçamento enviado");
    await page.getByTestId("quote-status-to-orcamento_enviado").click();
    await expect(status).toHaveText("Orçamento enviado");
    expect(await ids()).toEqual(["ganho"]);
    await page.getByTestId("quote-status-to-ganho").click();
    await expect(status).toHaveText("Ganho");

    // final: sem ações
    await expect(page.getByTestId("quote-status-actions")).toHaveCount(0);
    await expect(page.getByTestId("quote-status-final")).toBeVisible();
    await expect(page.getByTestId("quote-lost")).toHaveCount(0);
    const entries = page.getByTestId("history-entry");
    await expect(entries).toHaveText([/Nova/, /Em análise/, /Orçamento enviado/, /Ganho/]);
    for (const t of await entries.allTextContents()) expect(t).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
    // a lista reflete o status
    await page.goto(`${ARCA}/painel/orcamentos`);
    await expect(page.locator(`[data-quote-id="${protocol}"] [data-testid="quote-row-status"]`)).toHaveText("Ganho");
  });

  test("perdido: de nova, em análise e orçamento enviado, com confirmação (Esc e Voltar não marcam)", async ({ page }) => {
    const first = await sendQuote(page, "Rui Perdido", "");
    await page.goto(`${ARCA}/painel/orcamentos/${first}`);
    await page.getByTestId("quote-lost").click();
    const confirm = page.getByTestId("lost-confirm");
    await expect(confirm).toBeVisible();
    await expect(page.getByTestId("lost-confirm-yes")).toBeFocused();
    await expect(page.getByTestId("detail-status")).toHaveText("Nova");
    await page.keyboard.press("Escape");
    await expect(confirm).toHaveCount(0);
    await expect(page.getByTestId("detail-status")).toHaveText("Nova");
    await page.getByTestId("quote-lost").click();
    await confirm.getByRole("button", { name: "Voltar" }).click();
    await expect(confirm).toHaveCount(0);
    await expect(page.getByTestId("detail-status")).toHaveText("Nova");
    await page.getByTestId("quote-lost").click();
    await page.getByTestId("lost-confirm-yes").click();
    await expect(page.getByTestId("detail-status")).toHaveText("Perdido");
    await expect(page.getByTestId("quote-status-actions")).toHaveCount(0);
    await expect(page.getByTestId("history-entry").last()).toContainText("Perdido");

    // também de "em análise" e de "orçamento enviado"
    for (const to of ["em_analise", "orcamento_enviado"] as const) {
      const id = await sendQuote(page, `Cliente ${to}`);
      await page.goto(`${ARCA}/painel/orcamentos/${id}`);
      await page.getByTestId("quote-status-to-em_analise").click();
      if (to === "orcamento_enviado") await page.getByTestId("quote-status-to-orcamento_enviado").click();
      await page.getByTestId("quote-lost").click();
      await page.getByTestId("lost-confirm-yes").click();
      await expect(page.getByTestId("detail-status")).toHaveText("Perdido");
    }
    // ganho não pode ser perdido; os exemplos em status final também não
    await page.goto(`${ARCA}/painel/orcamentos`);
    await page.getByLabel("Status").selectOption("ganho");
    await page.getByTestId("quote-row").first().click();
    await expect(page.getByTestId("quote-lost")).toHaveCount(0);
  });

  test("produto criado sem preço e sem estoque: aparece na loja sem preço", async ({ page }) => {
    await arca(page, "/painel/produtos/novo");
    await expect(page.getByLabel("Preço (R$) (opcional)")).toBeVisible();
    await page.locator("#chk-name").fill("Boia de Teste Sem Preço");
    await page.locator("#chk-sku").fill("ARC-TST-001");
    await page.getByText(/Escolher entre as imagens do preset/).click();
    await page.getByTestId("image-pool").getByRole("button").first().click();
    await page.getByTestId("save-product").click();
    await expect(page).toHaveURL(/\/painel\/produtos\/np-/);
    const created = await page.evaluate(() => window.__demoStore!.getState().products.find((p) => p.sku === "ARC-TST-001")!);
    expect(created).toMatchObject({ price: 0, stock: 0, active: true });
    await page.goto(`${ARCA}/produto/boia-de-teste-sem-preco`);
    await expect(page.getByRole("heading", { level: 1, name: "Boia de Teste Sem Preço" })).toBeVisible();
    expect(await page.locator("body").innerText()).not.toContain("R$");
    await expect(page.getByRole("button", { name: "Adicionar ao orçamento" })).toBeVisible();
    await arca(page, "/painel/produtos");
    await expect(page.getByTestId("product-price")).toHaveCount(0);
    await expect(page.getByTestId("product-stock")).toHaveCount(0);
    expect(await page.locator("body").innerText()).not.toContain("R$");
    // um preço digitado inválido ainda é recusado
    await page.goto(`${ARCA}/painel/produtos/novo`);
    await page.locator("#chk-name").fill("Com Preço Ruim");
    await page.locator("#chk-price").fill("19.90");
    await page.locator("#chk-sku").fill("ARC-TST-002");
    await page.getByTestId("save-product").click();
    await expect(page.locator("#chk-price")).toHaveAttribute("aria-invalid", "true");
  });

  test("importação CSV sem preço: cria e atualiza; modelo sem preço; arquivo sem as colunas preco e estoque também vale", async ({ page }) => {
    await arca(page, "/painel/importacao");
    const before = await page.evaluate(() => window.__demoStore!.getState().products.length);
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByTestId("download-template").click()]);
    const tmpl = fs.readFileSync((await download.path())!, "utf8").replace(/^﻿/, "").split(/\r?\n/);
    expect(tmpl[0]).toBe("sku;nome;preco;estoque;categoria;descricao;material;medidas;capacidade;valvula");
    expect(tmpl[1]).toMatch(/^EXEMPLO-001;Nome do produto;;;industria-e-agro;/);

    await page.getByTestId("import-file").setInputFiles(path.join(FIXTURES, "arca-valido.csv"));
    await expect(page.getByTestId("count-created")).toHaveText("2");
    await expect(page.getByTestId("count-updated")).toHaveText("1");
    await expect(page.getByTestId("count-errors")).toHaveText("0");
    await page.getByTestId("import-confirm").click();
    await expect(page.getByTestId("import-done")).toContainText("2 criados, 1 atualizado");
    const state = await page.evaluate(() => {
      const ps = window.__demoStore!.getState().products;
      return { n: ps.length, upd: ps.find((p) => p.sku === "ARC-STC-004")!, created: ps.find((p) => p.sku === "ARC-IMP-001")! };
    });
    expect(state.n).toBe(before + 2);
    expect(state.upd).toMatchObject({ name: "Saco para Teste de Carga Atualizado", price: 0 });
    expect(state.upd.attributes.length).toBeGreaterThan(0); // atributos mantidos quando a planilha não traz valor
    expect(state.created).toMatchObject({ price: 0, stock: 0, name: "Reservatório de Teste" });
    await page.goto(`${ARCA}/produto/reservatorio-de-teste`);
    await expect(page.getByRole("heading", { level: 1, name: "Reservatório de Teste" })).toBeVisible();
    expect(await page.locator("body").innerText()).not.toContain("R$");

    await arca(page, "/painel/importacao");
    await page.getByTestId("import-file").setInputFiles(path.join(FIXTURES, "arca-sem-colunas-de-preco.csv"));
    await expect(page.getByTestId("count-created")).toHaveText("2");
    await expect(page.getByTestId("count-errors")).toHaveText("0");
  });

  test("celular 400 px: lista e detalhe de orçamentos sem rolagem horizontal; primeira solicitação na metade de cima", async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await arca(page, "/painel/orcamentos");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    const top = await page.getByTestId("quote-row").first().evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    expect(top).toBeLessThan(400);
    await page.getByTestId("quote-row").first().click();
    await expect(page.getByTestId("detail-id")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });

  test("o painel Demo reseta as solicitações e a lista da Arca", async ({ page }) => {
    await sendQuote(page);
    await arca(page, "/painel/orcamentos");
    const original = (await page.evaluate(() => window.__demoStore!.getState().quotes.length)) - 1;
    await page.getByRole("button", { name: "Demo", exact: true }).click();
    await page.getByRole("button", { name: "Resetar dados" }).click();
    await expect(page.getByTestId("quote-row")).toHaveCount(original);
  });
});
