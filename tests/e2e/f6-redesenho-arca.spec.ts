import { test, ORIGIN } from "./helpers";
import { arca, expect, setupArca } from "./orcamento-helpers";

setupArca();

const noHorizontalScroll = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe("Arca · redesenho por blocos", () => {
  test("a home entra por necessidade e por setor, com números, cases, processo e chamada final, alternando escuro e claro", async ({ page }) => {
    await arca(page);
    await expect(page.getByRole("link", { name: "Pedir orçamento" }).first()).toHaveAttribute("href", "/arca/orcamento");
    await expect(page.getByTestId("needs").getByRole("link")).toHaveCount(4);
    await expect(page.getByTestId("needs").getByRole("link").first()).toHaveAttribute("href", "/arca/necessidade/armazenar");
    await expect(page.getByTestId("sectors").getByRole("link")).toHaveCount(6);
    await expect(page.getByTestId("sectors").getByRole("link").first()).toHaveAttribute("href", "/arca/setor/agro");
    // números e projetos marcados como demonstração
    await expect(page.getByTestId("stats").locator("dd")).toHaveCount(4);
    await expect(page.getByText("Números fictícios")).toBeVisible();
    await expect(page.getByTestId("case-card")).toHaveCount(3);
    await expect(page.getByText("Projetos de demonstração")).toBeVisible();
    // processo em 4 passos, com a prévia gratuita em destaque
    await expect(page.getByTestId("process").getByRole("listitem")).toHaveCount(4);
    await expect(page.getByTestId("process").getByText("Prévia gratuita")).toBeVisible();
    // alternância: nunca duas faixas escuras (ou claras) seguidas
    const tones = await page.locator("section[data-tone]").evaluateAll((els) => els.map((e) => e.getAttribute("data-tone")));
    expect(tones.length).toBeGreaterThanOrEqual(6);
    for (let i = 1; i < tones.length; i += 1) expect(tones[i], `faixa ${i}`).not.toBe(tones[i - 1]);
  });

  test("cada necessidade e cada setor tem página com os produtos da aplicação; setor tem um case", async ({ page }) => {
    await arca(page, "/necessidade/icar-e-testar");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Içar e testar");
    await expect(page.getByTestId("product-card")).toHaveCount(2);
    await arca(page, "/setor/construcao");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Construção");
    await expect(page.getByTestId("product-card")).toHaveCount(2);
    await expect(page.getByTestId("case-card")).toHaveCount(1);
    await expect(page.getByTestId("case-card")).toContainText("Santos/SP");
    await page.getByTestId("product-card").first().getByRole("link").click();
    await expect(page).toHaveURL(/\/arca\/produto\//);
    // todos os links da home levam a páginas que existem
    await arca(page);
    const hrefs = await page.locator('[data-testid="needs"] a, [data-testid="sectors"] a').evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    expect(hrefs).toHaveLength(10);
    for (const href of hrefs) expect((await page.request.get(`${ORIGIN}${href}`)).status(), href ?? "").toBe(200);
  });

  test("setor e necessidade inexistentes, ou em Trama e Forno, dão 404 de verdade", async ({ request }) => {
    for (const route of ["/arca/setor/nao-existe", "/arca/necessidade/nao-existe", "/trama/setor/agro", "/forno/setor/agro", "/trama/necessidade/armazenar", "/forno/necessidade/armazenar"]) {
      expect((await request.get(`${ORIGIN}${route}`)).status(), route).toBe(404);
    }
  });

  test("Trama e Forno não ganham nenhum bloco novo na home", async ({ request }) => {
    for (const slug of ["trama", "forno"]) {
      const html = await (await request.get(`${ORIGIN}/${slug}`)).text();
      for (const id of ["needs", "sectors", "stats", "cases", "process"]) expect(html, `${slug} ${id}`).not.toContain(`data-testid="${id}"`);
    }
  });

  test("produto: foto em uso, 3 benefícios com número, setores como links, case relacionado e ficha técnica", async ({ page }) => {
    await arca(page, "/produto/saco-para-teste-de-carga");
    await expect(page.getByTestId("benefits").locator("dt")).toHaveCount(3);
    await expect(page.getByTestId("benefits").locator("dd").first()).toContainText("500 kg");
    await expect(page.getByTestId("spec-table")).toBeVisible();
    await expect(page.getByTestId("case-card")).toHaveCount(1);
    const links = page.getByTestId("product-sectors").getByRole("link");
    await expect(links).toHaveCount(2);
    await links.first().click();
    await expect(page).toHaveURL(/\/arca\/setor\/construcao$/);
  });

  test("celular 400 px: 'Adicionar ao orçamento' fica fixo na base da tela e a página não rola de lado; no desktop não fica fixo", async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await arca(page, "/produto/boia-cilindrica");
    const bar = page.getByTestId("quote-bar");
    await expect(bar).toHaveCSS("position", "fixed");
    for (const y of [0, 600, 1800]) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      const box = (await bar.boundingBox())!;
      expect(Math.round(box.y + box.height), `rolagem ${y}`).toBe(800);
    }
    // a barra não cobre o botão de adicionar: ele continua clicável e funciona
    await page.getByTestId("add-to-quote").click();
    await expect(page.getByTestId("quote-added")).toBeVisible();
    expect(await noHorizontalScroll(page)).toBeLessThanOrEqual(0);
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(bar).toHaveCSS("position", "static");
  });

  test("home, setor e produto sem rolagem horizontal em 400 px", async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    for (const route of ["", "/setor/agro", "/necessidade/sinalizar", "/produto/reservatorio-aberto"]) {
      await arca(page, route);
      expect(await noHorizontalScroll(page), route).toBeLessThanOrEqual(0);
    }
  });

  test("o estado salvo da versão anterior é atualizado: loja com catálogo antigo no navegador ganha os blocos novos", async ({ page }) => {
    await arca(page);
    await page.evaluate(() => window.__demoStore!.setState({}));
    await page.evaluate(() => {
      const key = "loja-demo-v1-arca";
      const saved = JSON.parse(localStorage.getItem(key)!);
      saved.version = 7;
      saved.state.products = saved.state.products.slice(0, 5);
      delete saved.state.config.sectors;
      saved.state.config.homeBlocks = saved.state.config.homeBlocks.slice(0, 1);
      localStorage.setItem(key, JSON.stringify(saved));
    });
    await arca(page);
    await expect(page.getByTestId("sectors").getByRole("link")).toHaveCount(6);
    expect((await page.evaluate(() => window.__demoStore!.getState().products.length))).toBe(8);
  });
});
