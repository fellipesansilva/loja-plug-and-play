import { expect, test, type Page } from "@playwright/test";

type Frame = { visibility: string; name: string | null; mentionsTrama: boolean };

/**
 * Grava, a cada quadro de animação desde o início do documento, se a página está visível, o nome acessível da loja
 * e se algum texto visível cita a Trama. É a forma de "olhar o DOM logo após o carregamento", antes da hidratação.
 */
async function watchFrames(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __frames: Frame[] };
    w.__frames = [];
    const loop = () => {
      const el = document.querySelector('[data-testid="store-name"]');
      w.__frames.push({
        visibility: getComputedStyle(document.documentElement).visibility,
        name: el?.getAttribute("aria-label") ?? null,
        mentionsTrama: /trama/i.test(document.body?.innerText ?? ""),
      });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
}
const frames = (page: Page) => page.evaluate(() => (window as unknown as { __frames: Frame[] }).__frames);

/** Quadros em que a Trama estava à vista (página visível e nome ou texto da Trama). */
const tramaVisible = (all: Frame[]) => all.filter((f) => f.visibility !== "hidden" && (f.name === "Trama Studio" || f.mentionsTrama));

async function savePreset(page: Page, id: string) {
  await page.goto("/");
  await page.waitForFunction(() => !!window.__demoStore);
  await page.evaluate((preset) => window.__demoStore!.getState().applyPreset(preset), id);
}

test.describe("preset salvo no carregamento direto (sem ?preset=)", () => {
  for (const route of ["/", "/categoria/pizzas", "/produto/pizza-margherita", "/carrinho"]) {
    test(`Forno salvo: ${route} abre direto no Forno, sem nenhum elemento da Trama à vista`, async ({ page }) => {
      await watchFrames(page);
      await savePreset(page, "forno-da-vila");
      await page.goto(route);
      await expect(page.getByTestId("store-name")).toHaveAccessibleName("Forno da Vila");
      await page.waitForTimeout(400);

      const all = await frames(page);
      expect(tramaVisible(all)).toEqual([]);
      expect(all.some((f) => f.visibility === "visible" && f.name === "Forno da Vila")).toBe(true);
      await expect(page.locator("html")).not.toHaveAttribute("data-preset-pending", "");
    });
  }

  test("recarregar várias vezes continua sem piscar", async ({ page }) => {
    await watchFrames(page);
    await savePreset(page, "forno-da-vila");
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await expect(page.getByTestId("store-name")).toHaveAccessibleName("Forno da Vila");
      await page.waitForTimeout(300);
      expect(tramaVisible(await frames(page)), `recarga ${i + 1}`).toEqual([]);
    }
  });

  test("nenhum preset salvo: a Trama carrega como antes (visível desde o início)", async ({ page }) => {
    await watchFrames(page);
    await page.goto("/");
    await expect(page.getByTestId("store-name")).toHaveAccessibleName("Trama Studio");
    await page.waitForTimeout(300);
    const all = await frames(page);
    const named = all.filter((f) => f.name !== null);
    expect(named.length).toBeGreaterThan(0);
    expect(named.every((f) => f.visibility === "visible" && f.name === "Trama Studio")).toBe(true);
    await expect(page.locator("html")).not.toHaveAttribute("data-preset-pending", "");
  });

  test("Trama salva (o padrão): também carrega visível, sem esconder a página", async ({ page }) => {
    await watchFrames(page);
    await savePreset(page, "trama-studio");
    await page.reload();
    await expect(page.getByTestId("store-name")).toHaveAccessibleName("Trama Studio");
    const named = (await frames(page)).filter((f) => f.name !== null);
    expect(named.every((f) => f.visibility === "visible")).toBe(true);
  });
});

test.describe("?preset= continua tendo prioridade sobre o salvo", () => {
  test("?preset=forno com a Trama salva abre o Forno, sem piscar a Trama", async ({ page }) => {
    await watchFrames(page);
    await savePreset(page, "trama-studio");
    await page.goto("/?preset=forno");
    await expect(page.getByTestId("store-name")).toHaveAccessibleName("Forno da Vila");
    await expect(page).not.toHaveURL(/preset=/);
    await page.waitForTimeout(300);
    expect(tramaVisible(await frames(page))).toEqual([]);
    // e o Forno passou a ser o salvo
    await page.goto("/");
    await expect(page.getByTestId("store-name")).toHaveAccessibleName("Forno da Vila");
  });

  test("?preset=trama com o Forno salvo abre a Trama", async ({ page }) => {
    await savePreset(page, "forno-da-vila");
    await page.goto("/?preset=trama");
    await expect(page.getByTestId("store-name")).toHaveAccessibleName("Trama Studio");
  });
});

test.describe("a primeira pintura e o plano B", () => {
  test("com o Forno salvo, o tema do Forno já vale antes do JS do React e a página está escondida", async ({ page }) => {
    await savePreset(page, "forno-da-vila");
    await page.route("**/_next/static/**/*.js", (route) => route.abort());
    await page.goto("/");
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--t-color-primary").trim())).toBe("#cf3512");
    await expect(page.locator("html")).toHaveAttribute("data-preset-pending", "");
  });

  test("se o JS não carregar, a página não fica escondida para sempre (volta em 4 s)", async ({ page }) => {
    await savePreset(page, "forno-da-vila");
    await page.route("**/_next/static/**/*.js", (route) => route.abort());
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-preset-pending", "");
    await expect(page.locator("html")).not.toHaveAttribute("data-preset-pending", "", { timeout: 7000 });
  });
});

test.describe("pré-carregamento da foto principal da home", () => {
  type Preload = { media: string | null; type: string | null; srcset: string | null; sizes: string | null };

  /** Pedidos das fotos do banner e os <link rel=preload as=image> do head, sem deixar o JS do React carregar. */
  async function loadWithoutReact(page: Page, url: string) {
    const requested: string[] = [];
    page.on("request", (r) => {
      const path = new URL(r.url()).pathname;
      if (/\/banner[^/]*\.(avif|webp)$/.test(path)) requested.push(path);
    });
    await page.route("**/_next/static/**/*.js", (route) => route.abort());
    await page.goto(url);
    await page.waitForTimeout(800);
    const preloads = await page.evaluate(() =>
      [...document.querySelectorAll('link[rel="preload"][as="image"]')].map((l) => ({
        media: l.getAttribute("media"),
        type: l.getAttribute("type"),
        srcset: l.getAttribute("imagesrcset"),
        sizes: l.getAttribute("imagesizes"),
      })),
    );
    return { requested, preloads: preloads as Preload[] };
  }

  test("?preset=forno: a foto do Forno é pedida antes de qualquer hidratação (o JS do React nem carregou)", async ({ page }) => {
    const { requested, preloads } = await loadWithoutReact(page, "/?preset=forno");
    // um preload AVIF por janela, só do Forno
    expect(preloads.map((p) => p.media)).toEqual(["(max-width: 767px)", "(min-width: 768px)"]);
    for (const p of preloads) {
      expect(p.type).toBe("image/avif");
      expect(p.srcset).toContain("/images/presets/forno-da-vila/banner-");
      expect(p.sizes).toBeTruthy();
    }
    // a janela do teste é de desktop: pede só o recorte de desktop, em AVIF, e nenhum de celular
    expect(requested.filter((r) => r.includes("forno-da-vila"))).toEqual(["/images/presets/forno-da-vila/banner-d-1280.avif"]);
    const hi = await page.locator('link[rel="preload"][as="image"][media="(min-width: 768px)"]').getAttribute("fetchpriority");
    expect(hi).toBe("high");
  });

  test("Forno salvo, sem parâmetro: também pede a foto do Forno antes da hidratação", async ({ page }) => {
    await savePreset(page, "forno-da-vila");
    const { requested, preloads } = await loadWithoutReact(page, "/");
    expect(preloads).toHaveLength(2);
    expect(requested).toContain("/images/presets/forno-da-vila/banner-d-1280.avif");
  });

  test("preset padrão (nenhum ou ?preset=trama): nenhum preload no head; a foto vem do <img> do HTML", async ({ page }) => {
    for (const url of ["/", "/?preset=trama"]) {
      const { preloads, requested } = await loadWithoutReact(page, url);
      expect(preloads, url).toEqual([]);
      expect(requested.every((r) => r.includes("trama-studio")), url).toBe(true);
      expect(requested.length, url).toBeGreaterThan(0);
    }
  });

  test("Trama salva: nenhum preload no head", async ({ page }) => {
    await savePreset(page, "trama-studio");
    const { preloads } = await loadWithoutReact(page, "/");
    expect(preloads).toEqual([]);
  });

  test("rotas de produto não ganham preload do Forno nesta fatia", async ({ page }) => {
    const { preloads, requested } = await loadWithoutReact(page, "/produto/pizza-margherita?preset=forno");
    expect(preloads).toEqual([]);
    expect(requested.filter((r) => r.includes("forno-da-vila"))).toEqual([]);
  });

  test("?preset=trama com o Forno salvo não baixa a foto do Forno", async ({ page }) => {
    await savePreset(page, "forno-da-vila");
    const { requested, preloads } = await loadWithoutReact(page, "/?preset=trama");
    expect(preloads).toEqual([]);
    expect(requested.filter((r) => r.includes("forno-da-vila"))).toEqual([]);
  });
});
