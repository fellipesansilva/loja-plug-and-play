import { test, expect, ORIGIN, TRAMA } from "./helpers";

// Landing da Better Studio (/better): prévia de validação, rota própria fora dos presets. Roda uma vez (projeto trama).
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.metadata.preset !== TRAMA, "Roda uma vez (projeto trama)");
});

// A landing não tem aviso de cookies: sem a escolha de cookies de loja gravada de antemão (o padrão dos testes de loja).
test.use({ seedConsent: false });

const BETTER = `${ORIGIN}/better`;
const INSTAGRAM = "https://instagram.com/betterstudio.br";
const LOJAS = ["trama", "forno", "orbita", "faisca", "arca"];

test.describe("H1 · a landing", () => {
  test("/better responde 200, com a faixa amarela de prévia e o título da página", async ({ page, request }) => {
    expect((await request.get(BETTER)).status()).toBe(200);
    await page.goto(BETTER);
    await expect(page).toHaveTitle("Better Studio · Lojas virtuais");
    await expect(page.getByText("Prévia para validação interna · preços, prazos e condições em definição · não publicar")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sua loja virtual em até 7 dias úteis. Sem comissão sobre as suas vendas.");
    // o logo é decorativo (alt vazio): o nome "Better Studio" já está no texto do link do cabeçalho
    const marca = page.getByRole("link", { name: "Better Studio" }).first();
    await expect(marca.locator("img")).toHaveAttribute("alt", "");
    await expect(marca).toContainText("Better Studio");
  });

  test("planos e preços como na referência, com o selo Recomendado e o produto adicional", async ({ page }) => {
    await page.goto(BETTER);
    const planos = page.locator("#planos");
    await expect(planos).toContainText("Loja Pronta");
    await expect(planos).toContainText("R$ 1.790");
    await expect(planos).toContainText("+ hospedagem e domínio por R$ 390/ano");
    await expect(planos).toContainText("Até 50 produtos cadastrados (R$ 4 por produto adicional)");
    await expect(planos).toContainText("Loja Completa");
    await expect(planos).toContainText("setup de R$ 890 +");
    await expect(planos).toContainText("R$ 149/mês");
    await expect(planos).toContainText("hospedagem e domínio inclusos · contrato de 12 meses");
    await expect(planos.getByText("Recomendado", { exact: true })).toBeVisible();
    await expect(planos).toContainText("R$ 690 de setup + R$ 79/mês");
    await expect(planos).toContainText("A partir de R$ 490");
  });

  test("os placeholders ficam como estão: [N] de 3 vagas, [CONDIÇÕES DE CANCELAMENTO DO CONTRATO] e [CNPJ]", async ({ page }) => {
    await page.goto(BETTER);
    await expect(page.getByText("[N] de 3 vagas restantes.")).toBeVisible();
    await expect(page.getByText("[CONDIÇÕES DE CANCELAMENTO DO CONTRATO]")).toBeAttached();
    await expect(page.locator("footer")).toContainText("[CNPJ]");
  });

  test("os cinco cards de demonstração levam às lojas por links internos diretos, e as lojas respondem 200", async ({ page, request }) => {
    await page.goto(BETTER);
    const hrefs = await page.locator("#demos a").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    expect(hrefs).toEqual(LOJAS.map((l) => `/${l}`)); // sem host e sem ?preset=
    for (const loja of LOJAS) expect((await request.get(`${ORIGIN}/${loja}`)).status(), loja).toBe(200);
    await page.locator('#demos a[href="/orbita"]').click();
    await expect(page).toHaveURL(`${ORIGIN}/orbita`);
  });

  test("os contatos abrem o Instagram da Better em outra aba; a Privacidade do rodapé é só texto; as âncoras internas continuam", async ({ page }) => {
    await page.goto(BETTER);
    const externos = page.locator(`a[href="${INSTAGRAM}"]`);
    expect(await externos.count()).toBeGreaterThanOrEqual(6);
    for (const a of await externos.all()) {
      await expect(a).toHaveAttribute("target", "_blank");
      await expect(a).toHaveAttribute("rel", "noopener");
    }
    for (const nome of ["Falar no WhatsApp", "Quero a Loja Pronta", "Quero a Loja Completa", "Garantir minha vaga"]) {
      for (const a of await page.getByRole("link", { name: nome, exact: true }).all()) await expect(a).toHaveAttribute("href", INSTAGRAM);
    }
    await expect(page.locator("footer a", { hasText: "Privacidade" })).toHaveCount(0);
    await expect(page.locator("footer")).toContainText("Privacidade");
    const ancoras = await page.locator('header nav a[href^="#"]').evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    expect(ancoras).toEqual(["#demos", "#como", "#planos", "#duvidas"]);
    for (const id of ["demos", "como", "planos", "duvidas"]) await expect(page.locator(`#${id}`)).toBeAttached();
  });

  test("as Dúvidas usam <details> nativo: a primeira vem aberta e as outras abrem ao clicar", async ({ page }) => {
    await page.goto(BETTER);
    const itens = page.locator("#duvidas details");
    await expect(itens).toHaveCount(5);
    await expect(itens.first()).toHaveAttribute("open", "");
    await expect(itens.nth(1)).not.toHaveAttribute("open", "");
    await itens.nth(1).locator("summary").click();
    await expect(itens.nth(1)).toHaveAttribute("open", "");
    await expect(page.getByText("Você. Os pagamentos caem direto na sua conta")).toBeVisible();
  });
});

test.describe("H2 · fora dos buscadores e fora das lojas", () => {
  test("o HTML tem meta robots noindex, nofollow", async ({ request }) => {
    const html = await (await request.get(BETTER)).text();
    expect(html).toContain('<meta name="robots" content="noindex, nofollow"');
  });

  test("não é loja: sem botão Demo, sem aviso de cookies, sem carrinho nem orçamento, sem estado salvo de loja", async ({ page }) => {
    await page.goto(BETTER);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);
    await expect(page.getByRole("button", { name: "Demo", exact: true })).toHaveCount(0);
    await expect(page.getByText(/cookies essenciais/)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /recusar|rejeitar|aceitar/i })).toHaveCount(0);
    await expect(page.locator('a[href*="carrinho"], a[href*="orcamento"], a[href*="checkout"]')).toHaveCount(0);
    expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("loja-")))).toEqual([]);
  });

  test("a raiz continua redirecionando para /trama", async ({ request }) => {
    const r = await request.get(`${ORIGIN}/`, { maxRedirects: 0 });
    expect([307, 308]).toContain(r.status());
    expect(new URL(r.headers()["location"], ORIGIN).pathname).toBe("/trama");
  });

  test("o tema e as fontes da Better só existem em /better (as lojas não carregam)", async ({ request }) => {
    const loja = await (await request.get(`${ORIGIN}/trama`)).text();
    expect(loja).not.toContain("better-site");
    expect(loja).not.toContain("/fonts/better/");
    const better = await (await request.get(BETTER)).text();
    expect(better).toContain("/fonts/better/");
    expect(better).toContain("better-site");
  });
});

test.describe("celular de 390 px", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("sem rolagem horizontal; os planos empilham; o menu quebra linha; alvos de toque de 44 px", async ({ page }) => {
    await page.goto(BETTER);
    await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    const caixas = await page.locator("#planos .better-plan").evaluateAll((els) => els.map((e) => e.getBoundingClientRect()));
    expect(caixas).toHaveLength(2);
    expect(caixas[1].top).toBeGreaterThan(caixas[0].bottom - 1); // um embaixo do outro
    // alvos de toque: todo link e resumo visível com pelo menos 44 px de altura
    const baixos = await page.evaluate(() =>
      [...document.querySelectorAll("a, summary")]
        .map((e) => ({ t: (e.textContent ?? "").trim().slice(0, 30), h: e.getBoundingClientRect().height, v: e.getClientRects().length > 0 }))
        .filter((x) => x.v && x.h < 44),
    );
    expect(baixos).toEqual([]);
  });
});
