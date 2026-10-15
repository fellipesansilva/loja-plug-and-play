import { type Page } from "@playwright/test";
import { expect, test, FORNO, NAME, SHORT, TRAMA, URL_OF, currentPreset, storageKey, storeName } from "./helpers";

/** Rotas da vitrine; {produto} e {pedido} variam por loja (cada preset tem o seu catálogo e os seus pedidos). */
const LOJA_ROUTES = [
  "/",
  "/categoria/{categoria}",
  "/busca",
  "/produto/{produto}",
  "/carrinho",
  "/checkout",
  "/pedido/{pedido}",
  "/sobre",
  "/trocas-e-devolucoes",
  "/privacidade",
];

const PAINEL_ROUTES = [
  "/painel/login",
  "/painel/produtos",
  "/painel/produtos/{idProduto}",
  "/painel/importacao",
  "/painel/pedidos",
  "/painel/pedidos/{pedido}",
  "/painel/configuracoes/loja",
  "/painel/configuracoes/tema",
  "/painel/configuracoes/modulos",
  "/painel/configuracoes/preset",
];

const FIXTURE = {
  [TRAMA]: { categoria: "feminino", produto: "vestido-midi-linho", pedido: "TS-1001", idProduto: "ts-001" },
  [FORNO]: { categoria: "pizzas", produto: "pizza-margherita", pedido: "FV-2001", idProduto: "fv-001" },
} as const;

const resolve = (template: string) => {
  const f = FIXTURE[currentPreset() as keyof typeof FIXTURE];
  return template.replace(/\{(\w+)\}/g, (_, k: keyof typeof f) => f[k]);
};

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
      const response = await page.goto(resolve(route));
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});

test("F0 · cada loja é o seu preset: nome, cor primária e título vêm do build", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("store-name")).toHaveAccessibleName(storeName());
  const expected = currentPreset() === TRAMA ? "#4b5340" : "#cf3512";
  expect(await primary(page)).toBe(expected);
  await expect(page).toHaveTitle(new RegExp(`${storeName()}$`));
});

test("F0 · painel Demo: a loja atual vem marcada e a outra é um link para a URL dela", async ({ page }) => {
  await page.goto("/");
  await openDemo(page);
  const list = page.getByRole("list", { name: "Lojas da demonstração" });
  const current = list.locator('[aria-current="true"]');
  await expect(current).toHaveText(storeName());

  const otherPreset = currentPreset() === TRAMA ? FORNO : TRAMA;
  const link = list.getByRole("link", { name: NAME[otherPreset] });
  await expect(link).toHaveAttribute("href", "/" + SHORT[otherPreset]);
  // a loja atual não é link (já está nela)
  await expect(list.getByRole("link", { name: storeName() })).toHaveCount(0);
});

test("F0 · clicar na outra loja do painel Demo leva à URL dela", async ({ page }) => {
  await page.goto("/");
  await openDemo(page);
  const otherPreset = currentPreset() === TRAMA ? FORNO : TRAMA;
  await page.getByRole("link", { name: NAME[otherPreset] }).click();
  await expect(page).toHaveURL(new RegExp(`^${URL_OF[otherPreset]}/?$`));
  await expect(page.getByTestId("store-name")).toHaveAccessibleName(NAME[otherPreset]);
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
  await expect(page.getByTestId("store-name")).toHaveAccessibleName("Minha Loja Editada");

  await page.reload();
  await expect(page.getByTestId("store-name")).toHaveAccessibleName("Minha Loja Editada");

  await openDemo(page);
  await page.getByRole("button", { name: "Resetar dados" }).click();
  await expect(page.getByTestId("store-name")).toHaveAccessibleName(storeName());

  await page.reload();
  await expect(page.getByTestId("store-name")).toHaveAccessibleName(storeName());
});

test("F0 · o estado salvo fica na chave da própria loja", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => !!window.__demoStore);
  await page.evaluate(() => window.__demoStore!.getState().setStoreName("Salvo aqui"));
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).toContain(storageKey());
  expect(keys).toEqual([storageKey()]);
  expect(keys).not.toContain("loja-demo-v1");
  const other = currentPreset() === TRAMA ? FORNO : TRAMA;
  expect(keys).not.toContain(storageKey(other));
  expect(SHORT[currentPreset()]).toBeTruthy();
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
  await expect(page.getByTestId("store-name")).toHaveAccessibleName(storeName());
  await openDemo(page);
  await expect(page.getByRole("button", { name: "Resetar dados" })).toBeVisible();
  expect(errors).toEqual([]);
});

test.describe("F0 · vitrine em 360 px", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  for (const route of LOJA_ROUTES) {
    test(`sem rolagem horizontal: ${route}`, async ({ page }) => {
      await page.goto(resolve(route));
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
    await expect(page).toHaveURL(/\/(trama|forno)$/);
    await openDemo(page);
    await expect(page.getByRole("button", { name: "Resetar dados" })).toBeVisible();
    await page.getByRole("link", { name: "Ir para o painel" }).click();
    await expect(page).toHaveURL(/\/painel\/produtos$/);
  });
});

test("F0 · tema do build no primeiro carregamento com localStorage indisponível", async ({ page }) => {
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
