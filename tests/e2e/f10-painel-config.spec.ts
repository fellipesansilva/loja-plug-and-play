import { type Page } from "@playwright/test";
import { test, expect, currentPreset, ORIGIN, SHORT, TRAMA } from "./helpers";
import { ready } from "./painel-helpers";

// F5 · Painel: tema, módulos e dados da loja. Roda nos dois projetos (Trama e Forno); os casos da Arca (modo orçamento) rodam uma vez, no projeto
// "trama", com endereço completo. A configuração salva fica em `loja-config-v1-<preset>`.
const slug = () => SHORT[currentPreset()];
const configKey = () => `loja-config-v1-${slug()}`;
/** Põe um produto simples no carrinho (os do helper de compra: ts-014 na Trama, fv-001 com variação no Forno). */
const addToCart = (page: Page) =>
  page.evaluate((forno) => {
    const st = window.__demoStore!.getState();
    if (forno) st.addToCart({ productId: "fv-001", variantId: "fv-mar-gra", qty: 1 });
    else st.addToCart({ productId: "ts-014", qty: 1 });
  }, currentPreset() !== TRAMA);
/** Navega dentro do app (sem recarregar o documento), como o clique num link. */
const pushInApp = (page: Page, path: string) =>
  page.evaluate(([p, s]) => (window as unknown as { next: { router: { push: (u: string) => void } } }).next.router.push(`/${s}${p === "/" ? "" : p}`), [path, slug()]);
const savedConfig = (page: Page) => page.evaluate((k) => localStorage.getItem(k), configKey());

type Choices = { primary: { id: string; label: string; value: string }[]; accent: { id: string; label: string; value: string }[]; fonts: { heading: { id: string; label: string; value: string }[]; body: { id: string }[] } };
const choicesOf = (page: Page) => page.evaluate(() => window.__demoStore!.getState().config.themeChoices as unknown as Choices);
const rootVar = (page: Page, name: string) => page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

test.describe("H1 · tema", () => {
  test("trocar a cor principal: a prévia muda na hora, salvar grava a chave nova e a loja usa a cor depois de recarregar", async ({ page }) => {
    const errors = watchErrors(page);
    await ready(page, "/painel/configuracoes/tema");
    const choices = await choicesOf(page);
    const original = await rootVar(page, "--t-color-primary");
    const next = choices.primary.find((c) => c.value.toLowerCase() !== original.toLowerCase())!;
    await page.getByTestId("tema-principal").getByText(next.label, { exact: true }).click();
    // prévia na hora, loja ainda sem mudar
    await expect.poll(() => page.getByTestId("tema-previa").evaluate((e) => getComputedStyle(e).getPropertyValue("--t-color-primary").trim())).toBe(next.value);
    expect(await rootVar(page, "--t-color-primary")).toBe(original);
    expect(await savedConfig(page)).toBeNull();
    await page.getByTestId("tema-salvar").click();
    await expect(page.getByTestId("tema-status")).toContainText("Tema salvo");
    expect(await rootVar(page, "--t-color-primary")).toBe(next.value); // a loja já usa, sem recarregar
    const saved = JSON.parse((await savedConfig(page))!);
    expect(saved.version).toBe(2);
    expect(saved.theme.primary).toBe(next.id);
    // recarregar: painel e vitrine
    await ready(page, "/painel/configuracoes/tema");
    expect(await rootVar(page, "--t-color-primary")).toBe(next.value);
    await expect(page.getByTestId("tema-principal").locator(`input[value="${next.id}"]`)).toBeChecked();
    await ready(page, "/");
    expect(await rootVar(page, "--t-color-primary")).toBe(next.value);
    expect(await page.evaluate(() => window.__demoStore!.getState().config.theme.colors.announcementBg)).toBeTruthy();
    expect(errors).toEqual([]);
  });

  test("a cor de destaque e a fonte dos títulos só aceitam o que o preset aprovou; a fonte escolhida vale na loja", async ({ page }) => {
    await ready(page, "/painel/configuracoes/tema");
    const choices = await choicesOf(page);
    const options = await page.locator("#tema-fonte-titulo option").evaluateAll((els) => els.map((e) => (e as HTMLOptionElement).value));
    expect(options).toEqual(choices.fonts.heading.map((f) => f.id));
    expect(await page.locator("#tema-fonte-texto option").evaluateAll((els) => els.map((e) => (e as HTMLOptionElement).value))).toEqual(choices.fonts.body.map((f) => f.id));
    await expect(page.locator("#tema-fonte-texto")).toBeDisabled(); // uma só fonte de texto aprovada
    const other = choices.fonts.heading[1];
    const family = other.label.split(" (")[0]; // a variável resolvida traz o nome da família ("Manrope", "Manrope Fallback", ...)
    await page.locator("#tema-fonte-titulo").selectOption(other.id);
    await expect.poll(() => page.getByTestId("tema-previa").evaluate((e) => getComputedStyle(e).getPropertyValue("--t-font-heading").trim())).toContain(family);
    await page.getByTestId("tema-salvar").click();
    expect(await rootVar(page, "--t-font-heading")).toContain(family);
    // nenhuma cor livre: só botões de rádio da paleta (nada de campo de cor)
    await expect(page.getByTestId("tema-config").locator('input[type="color"], input[type="text"]')).toHaveCount(0);
  });

  test("contraste abaixo de 4,5:1 bloqueia salvar e mostra o motivo; trocar a cor libera", async ({ page }) => {
    await ready(page, "/painel/configuracoes/tema");
    const choices = await choicesOf(page);
    const bad = choices.accent[choices.accent.length - 1]; // última opção da paleta: aprovada como cor, mas reprova com o texto sobre o destaque
    await page.getByTestId("tema-destaque").getByText(bad.label, { exact: true }).click();
    const erro = page.getByTestId("tema-contraste-erro");
    await expect(erro).toBeVisible();
    await expect(erro).toContainText("Esta combinação não pode ser salva");
    await expect(erro).toContainText(/Contraste de \d,\d\d:1 entre texto e cor de destaque; o mínimo é 4,5:1\./);
    await expect(page.getByTestId("tema-salvar")).toBeDisabled();
    expect(await savedConfig(page)).toBeNull();
    // outra cor de destaque da paleta: libera
    await page.getByTestId("tema-destaque").getByText(choices.accent[0].label, { exact: true }).click();
    await expect(page.getByTestId("tema-contraste-erro")).toHaveCount(0);
    await expect(page.getByTestId("tema-contraste-ok")).toBeVisible();
  });
});

test.describe("H2 · módulos", () => {
  test("desligar o cupom salva, tira o campo do carrinho e continua desligado depois de recarregar, sem erro", async ({ page }) => {
    const errors = watchErrors(page);
    await ready(page, "/carrinho");
    await addToCart(page);
    await expect(page.locator("#cupom")).toBeVisible();
    await ready(page, "/painel/configuracoes/modulos");
    const sw = page.getByTestId("modulo-cupom").getByRole("switch");
    await expect(sw).toHaveAttribute("aria-checked", "true");
    await sw.click();
    await expect(sw).toHaveAttribute("aria-checked", "false");
    await page.getByTestId("modulos-salvar").click();
    await expect(page.getByTestId("modulos-status")).toContainText("Módulos salvos");
    expect(JSON.parse((await savedConfig(page))!).modules.cupom).toBe(false);
    await ready(page, "/painel/configuracoes/modulos");
    await expect(page.getByTestId("modulo-cupom").getByRole("switch")).toHaveAttribute("aria-checked", "false");
    await ready(page, "/carrinho");
    await expect(page.locator("#cupom")).toHaveCount(0);
    await ready(page, "/checkout");
    await ready(page, "/");
    expect(errors).toEqual([]);
  });

  test("módulo com dependência: desligar o cartão desliga o parcelamento e avisa; ligar o parcelamento liga o cartão junto", async ({ page }) => {
    await ready(page, "/painel/configuracoes/modulos");
    const sw = (k: string) => page.getByTestId(`modulo-${k}`).getByRole("switch");
    if ((await sw("parcelamento").getAttribute("aria-checked")) === "false") {
      await sw("parcelamento").click(); // Forno: nasce desligado; o cartão já está ligado
    }
    await expect(sw("parcelamento")).toHaveAttribute("aria-checked", "true");
    await sw("cartao").click();
    await expect(sw("cartao")).toHaveAttribute("aria-checked", "false");
    await expect(sw("parcelamento")).toHaveAttribute("aria-checked", "false");
    await expect(page.getByTestId("modulos-avisos")).toContainText("Parcelamento foi desligado junto: depende de Cartão de crédito.");
    await sw("parcelamento").click();
    await expect(sw("parcelamento")).toHaveAttribute("aria-checked", "true");
    await expect(sw("cartao")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("modulos-avisos")).toContainText("Cartão de crédito foi ligado junto: Parcelamento depende dele.");
    await expect(page.getByTestId("modulo-parcelamento")).toContainText("Depende de: Cartão de crédito.");
  });

  test("loja de venda: o modo orçamento não liga com módulo de venda ligado (mensagem do build) e nada muda", async ({ page }) => {
    await ready(page, "/painel/configuracoes/modulos");
    const sw = page.getByTestId("modulo-orcamento").getByRole("switch");
    await sw.click();
    await expect(sw).toHaveAttribute("aria-checked", "false");
    await expect(page.getByTestId("modulos-erro")).toContainText("O modo orçamento não pode ficar ligado junto com módulos de venda");
    await expect(page.getByTestId("modulos-salvar")).toBeDisabled();
    expect(await savedConfig(page)).toBeNull();
  });

  test("com todos os módulos de venda desligados, carrinho, checkout e home abrem sem erro", async ({ page }) => {
    const errors = watchErrors(page);
    await ready(page, "/painel/configuracoes/modulos");
    for (const k of ["cupom", "boleto", "descontoPix", "freteGratis", "retiradaLocal", "parcelamento", "cartao"]) {
      const sw = page.getByTestId(`modulo-${k}`).getByRole("switch");
      if ((await sw.getAttribute("aria-checked")) === "true") await sw.click();
    }
    await page.getByTestId("modulos-salvar").click();
    await expect(page.getByTestId("modulos-status")).toContainText("Módulos salvos");
    for (const route of ["/", "/carrinho", "/checkout", "/painel/pedidos", "/painel/configuracoes/loja"]) {
      await ready(page, route);
      await expect(page.locator("main")).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
});

test.describe("H2 · modo orçamento (Arca)", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.metadata.preset !== TRAMA, "Roda uma vez (projeto trama)");
    await page.addInitScript(() => localStorage.setItem("loja-consent-v1-arca", JSON.stringify({ choice: "rejected", at: "2026-01-01T00:00:00.000Z", version: "1" })));
  });

  test("ligar módulo de venda na loja em orçamento é bloqueado com a mensagem da regra do build", async ({ page }) => {
    await page.goto(`${ORIGIN}/arca/painel/configuracoes/modulos`);
    await page.waitForFunction(() => !!window.__demoStore);
    const sw = page.getByTestId("modulo-cupom").getByRole("switch");
    await expect(sw).toHaveAttribute("aria-checked", "false");
    await sw.click();
    await expect(sw).toHaveAttribute("aria-checked", "false");
    await expect(page.getByTestId("modulos-erro")).toContainText("a loja está em modo orçamento, que não pode ter módulos de venda ligados");
    await expect(page.getByTestId("modulos-salvar")).toBeDisabled();
    // tirar o modo orçamento também é recusado: a validação do build exigiria as políticas de venda
    const orc = page.getByTestId("modulo-orcamento").getByRole("switch");
    await orc.click();
    await expect(orc).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("modulos-erro")).toContainText("validação do build");
  });
});

test.describe("H3 · dados e regras da loja", () => {
  test("publicar sem CNPJ/CPF é bloqueado e aponta o campo; com o dado preenchido publica", async ({ page }) => {
    await ready(page, "/painel/configuracoes/loja");
    await expect(page.getByTestId("demo-document")).toBeVisible(); // dado fictício do preset marcado como demonstração
    await page.locator("#loja-document").fill("");
    await expect(page.getByTestId("demo-document")).toHaveCount(0);
    await page.getByTestId("loja-publicar").click();
    await expect(page.getByTestId("loja-publicar-erro")).toContainText("informe o CNPJ ou CPF");
    await expect(page.getByTestId("erro-document")).toContainText("informe o CNPJ ou CPF");
    await expect(page.locator("#loja-document")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByTestId("loja-publicada")).toHaveCount(0);
    expect(await savedConfig(page)).toBeNull();
    await page.locator("#loja-document").fill("12.345.678/0001-90");
    await page.getByTestId("loja-publicar").click();
    await expect(page.getByTestId("loja-status")).toContainText("Loja publicada");
    await expect(page.getByTestId("loja-publicada")).toBeVisible();
    expect(JSON.parse((await savedConfig(page))!).publicada.at).toMatch(/^\d{4}-\d\d-\d\dT/);
    // endereço e contato também são obrigatórios
    await page.locator("#loja-address").fill("");
    await page.locator("#loja-phone").fill("");
    await page.getByTestId("loja-publicar").click();
    await expect(page.getByTestId("erro-address")).toBeVisible();
    await expect(page.getByTestId("erro-phone")).toBeVisible();
  });

  test("salvar com campo obrigatório vazio não deixa a vitrine sem identificação; o rodapé mantém o dado anterior", async ({ page }) => {
    await ready(page, "/painel/configuracoes/loja");
    const before = await page.evaluate(() => window.__demoStore!.getState().config.legal.document);
    await page.locator("#loja-document").fill("");
    await page.getByTestId("loja-salvar").click();
    await expect(page.getByTestId("loja-status")).toContainText("Alterações salvas");
    expect(await page.evaluate(() => window.__demoStore!.getState().config.legal.document)).toBe(before);
  });

  test("prazo de troca abaixo do mínimo do CDC (art. 26) é recusado com o motivo; no mínimo, salva e a página de trocas usa o prazo", async ({ page }) => {
    await ready(page, "/painel/configuracoes/loja");
    const durability = await page.evaluate(() => window.__demoStore!.getState().config.policies.defect.durability);
    const min = durability === "durable" ? 90 : 30;
    await page.locator("#loja-defectDays").fill(String(min - 1));
    await expect(page.getByTestId("erro-defectDays")).toContainText(`${min} dias`);
    await expect(page.getByTestId("erro-defectDays")).toContainText("art. 26");
    await expect(page.getByTestId("loja-salvar")).toBeDisabled();
    expect(await savedConfig(page)).toBeNull();
    await page.locator("#loja-defectDays").fill(String(min + 15));
    await expect(page.getByTestId("erro-defectDays")).toHaveCount(0);
    await page.getByTestId("loja-salvar").click();
    expect(await page.evaluate(() => window.__demoStore!.getState().config.policies.defect.days)).toBe(min + 15);
    await ready(page, "/trocas-e-devolucoes");
    await expect(page.locator("main")).toContainText(`${min + 15} dias`);
  });

  test("frete grátis alterado vale na loja na mesma sessão (sem recarregar)", async ({ page }) => {
    await ready(page, "/carrinho");
    await addToCart(page);
    await ready(page, "/carrinho");
    const cents = (t: string) => Number(t.replace(/\D/g, ""));
    const subtotal = cents(await page.getByTestId("sum-subtotal").innerText());
    expect(subtotal).toBeGreaterThan(0);
    await ready(page, "/painel/configuracoes/loja");
    await page.locator("#loja-freeMin").fill("9.999,00");
    await page.getByTestId("loja-salvar").click();
    await expect(page.getByTestId("loja-status")).toContainText("Alterações salvas");
    expect(await page.evaluate(() => window.__demoStore!.getState().config.modules.freteGratis!.minValue)).toBe(999900);
    await pushInApp(page, "/");
    const bar = page.getByTestId("shipping-progress");
    await expect(bar).toContainText("Faltam");
    expect(cents((await bar.innerText()).match(/R\$\s*[\d.]+,\d\d/)![0])).toBe(999900 - subtotal);
  });
});

test.describe("H3 · desconto do Pix (Trama)", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.preset !== TRAMA, "Só a Trama nasce com o Pix ligado");
  });

  test("Pix alterado aparece no carrinho na mesma sessão (sem recarregar a loja)", async ({ page }) => {
    await ready(page, "/carrinho");
    await addToCart(page);
    await ready(page, "/carrinho");
    const cents = (t: string) => Number(t.replace(/\D/g, ""));
    const total = cents(await page.getByTestId("sum-total").innerText());
    const pix5 = cents(await page.getByTestId("pix-price").innerText());
    expect(Math.abs(pix5 - (total * 95) / 100)).toBeLessThan(1); // arredondamento do módulo (centavos)
    await ready(page, "/painel/configuracoes/loja");
    await page.locator("#loja-pix").fill("12");
    await page.getByTestId("loja-salvar").click();
    await expect(page.getByTestId("loja-status")).toContainText("Alterações salvas");
    // navegação dentro do app (sem recarregar o documento): o carrinho já usa o valor novo
    await pushInApp(page, "/carrinho");
    await expect(page.getByTestId("pix-price")).toBeVisible();
    expect(Math.abs(cents(await page.getByTestId("pix-price").innerText()) - (total * 88) / 100)).toBeLessThan(1);
    // valor inválido: bloqueia
    await ready(page, "/painel/configuracoes/loja");
    await page.locator("#loja-pix").fill("55");
    await expect(page.getByTestId("erro-pix")).toBeVisible();
    await expect(page.getByTestId("loja-salvar")).toBeDisabled();
  });
});
