import { expect, test, type Page } from "@playwright/test";

const LOJA_ROUTES = [
  "/",
  "/categoria/feminino",
  "/busca",
  "/produto/vestido-midi-linho",
  "/carrinho",
  "/checkout",
  "/pedido/TS-1001",
  "/sobre",
  "/trocas-e-devolucoes",
  "/privacidade",
];

const PAINEL_ROUTES = [
  "/painel/login",
  "/painel/produtos",
  "/painel/produtos/ts-001",
  "/painel/importacao",
  "/painel/pedidos",
  "/painel/pedidos/TS-1001",
  "/painel/configuracoes/loja",
  "/painel/configuracoes/tema",
  "/painel/configuracoes/modulos",
  "/painel/configuracoes/preset",
];

const primary = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--t-color-primary").trim());

async function openDemo(page: Page) {
  await page.getByRole("button", { name: "Demo", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Controles da demo" })).toBeVisible();
}

test.describe("F0 · rotas", () => {
  for (const route of [...LOJA_ROUTES, ...PAINEL_ROUTES]) {
    test(`abre sem erro: ${route}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});

test("F0 · trocar preset pelo DemoControls muda nome e cor primária sem reload", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => !!window.__demoStore);
  await expect(page.getByTestId("store-name")).toHaveText("Trama Studio");
  const before = await primary(page);
  await page.evaluate(() => (window as unknown as { __marker: string }).__marker = "sem-reload");

  await openDemo(page);
  await page.getByRole("button", { name: "Forno da Vila" }).click();

  await expect(page.getByTestId("store-name")).toHaveText("Forno da Vila");
  const after = await primary(page);
  expect(after).not.toBe(before);
  expect(await page.evaluate(() => (window as unknown as { __marker: string }).__marker)).toBe("sem-reload");
});

test("F0 · alterar token no store reflete na vitrine sem recarregar", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => !!window.__demoStore);
  await page.evaluate(() => window.__demoStore!.getState().setThemeColor("primary", "#112233"));
  await expect.poll(() => primary(page)).toBe("#112233");
});

test("F0 · alterar estado → recarregar → persiste → resetar → volta ao original", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => !!window.__demoStore);
  await page.evaluate(() => window.__demoStore!.getState().setStoreName("Minha Loja Editada"));
  await expect(page.getByTestId("store-name")).toHaveText("Minha Loja Editada");

  await page.reload();
  await expect(page.getByTestId("store-name")).toHaveText("Minha Loja Editada");

  await openDemo(page);
  await page.getByRole("button", { name: "Resetar dados" }).click();
  await expect(page.getByTestId("store-name")).toHaveText("Trama Studio");

  await page.reload();
  await expect(page.getByTestId("store-name")).toHaveText("Trama Studio");
});

test("F0 · preset escolhido persiste após recarregar", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => !!window.__demoStore);
  await openDemo(page);
  await page.getByRole("button", { name: "Forno da Vila" }).click();
  await page.reload();
  await expect(page.getByTestId("store-name")).toHaveText("Forno da Vila");
});

test("F0 · funciona com localStorage indisponível", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("bloqueado", "SecurityError");
      },
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByTestId("store-name")).toHaveText("Trama Studio");
  await openDemo(page);
  await page.getByRole("button", { name: "Forno da Vila" }).click();
  await expect(page.getByTestId("store-name")).toHaveText("Forno da Vila");
  expect(errors).toEqual([]);
});

test.describe("F0 · vitrine em 360 px", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  for (const route of LOJA_ROUTES) {
    test(`sem rolagem horizontal: ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("menu é acessível e abre/fecha", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Abrir menu" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("link", { name: "Sobre", exact: true })).toBeHidden();
    await toggle.click();
    await expect(page.getByRole("button", { name: "Fechar menu" })).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("link", { name: "Sobre", exact: true })).toBeVisible();
  });
});

test.describe("F0 · painel", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("menu lateral com Produtos, Pedidos, Importação e Configurações", async ({ page }) => {
    await page.goto("/painel/produtos");
    const nav = page.getByRole("navigation", { name: "Menu do painel" });
    for (const label of ["Produtos", "Pedidos", "Importação", "Configurações"]) {
      await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
  });

  test("controle de demo alterna entre painel e vitrine", async ({ page }) => {
    await page.goto("/painel/produtos");
    await openDemo(page);
    await page.getByRole("link", { name: "Ir para a vitrine" }).click();
    await expect(page).toHaveURL(/\/$/);
    await openDemo(page);
    await expect(page.getByRole("button", { name: "Resetar dados" })).toBeVisible();
    await page.getByRole("link", { name: "Ir para o painel" }).click();
    await expect(page).toHaveURL(/\/painel\/produtos$/);
  });
});

test("F0 · sem flash: com Forno da Vila salvo, a primeira pintura já usa a cor dele", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => !!window.__demoStore);
  const tramaPrimary = await primary(page);
  await openDemo(page);
  await page.getByRole("button", { name: "Forno da Vila" }).click();
  const fornoPrimary = await primary(page);
  expect(fornoPrimary).not.toBe(tramaPrimary);

  // Impede o JS do React de carregar: só o script inline do HTML pode ter aplicado o tema.
  await page.route("**/_next/static/**/*.js", (route) => route.abort());
  await page.reload();
  await expect(page.getByTestId("store-name")).toHaveText("Trama Studio"); // sem hidratação: SSR padrão
  expect(await primary(page)).toBe(fornoPrimary);
});

test("F0 · tema padrão no primeiro carregamento com localStorage indisponível", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("bloqueado", "SecurityError");
      },
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  expect(await primary(page)).toBeTruthy();
  expect(errors).toEqual([]);
});
