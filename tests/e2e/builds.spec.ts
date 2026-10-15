import { devices, expect, test, type Page } from "@playwright/test";
import { FORNO, NAME, SHORT, TRAMA, URL_OF, currentPreset, storageKey, storeName } from "./helpers";

/** O outro preset: a "outra loja" em relação ao build que está sendo testado. */
const otherPreset = () => (currentPreset() === TRAMA ? FORNO : TRAMA);
const dirOf = (preset: string) => (preset === FORNO ? "forno-da-vila" : "trama-studio");

type Frame = { visibility: string; pending: boolean; name: string | null; text: string };

/** Grava, a cada quadro desde o início do documento, a visibilidade da página e o que ela mostra. */
async function watchFrames(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __frames: Frame[] };
    w.__frames = [];
    const loop = () => {
      const el = document.querySelector('[data-testid="store-name"]');
      w.__frames.push({
        visibility: getComputedStyle(document.documentElement).visibility,
        pending: document.documentElement.hasAttribute("data-preset-pending"),
        name: el?.getAttribute("aria-label") ?? null,
        text: document.body?.innerText ?? "",
      });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
}
const frames = (page: Page) => page.evaluate(() => (window as unknown as { __frames: Frame[] }).__frames);

test.describe("HTML do servidor: cada build já nasce no próprio preset", () => {
  test("o HTML da home já é da loja deste build e não cita arquivos da outra", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).toContain(`aria-label="${storeName()}"`);
    expect(html).toContain(`/images/presets/${dirOf(currentPreset())}/`);
    expect(html).not.toContain(`/images/presets/${dirOf(otherPreset())}/`);
    expect(html).not.toContain(NAME[otherPreset()]);
    // o tema também vem pronto do servidor
    expect(html).toContain(currentPreset() === TRAMA ? "--t-color-primary:#4b5340" : "--t-color-primary:#cf3512");
  });

  test("o HTML não tem esconder nem preload injetado", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).not.toContain("data-preset-pending");
    expect(html).not.toMatch(/rel="preload"[^>]*as="image"/);
    expect(html).not.toMatch(/as="image"[^>]*rel="preload"/);
  });

  test("o HTML de uma página de produto também é da loja deste build", async ({ request }) => {
    const slug = currentPreset() === TRAMA ? "vestido-midi-linho" : "pizza-margherita";
    const html = await (await request.get(`/produto/${slug}`)).text();
    expect(html).toContain(`aria-label="${storeName()}"`);
    expect(html).not.toContain(NAME[otherPreset()]);
  });
});

test.describe("rede: nenhum arquivo do outro preset", () => {
  for (const route of ["/", "/categoria/{categoria}", "/produto/{produto}", "/carrinho", "/busca?q=a"]) {
    test(`${route}: a rede não baixa nada do outro preset`, async ({ page }) => {
      const fixture =
        currentPreset() === TRAMA
          ? { categoria: "feminino", produto: "vestido-midi-linho" }
          : { categoria: "pizzas", produto: "pizza-margherita" };
      const requested: string[] = [];
      page.on("request", (r) => requested.push(new URL(r.url()).pathname));
      await page.goto(route.replace("{categoria}", fixture.categoria).replace("{produto}", fixture.produto));
      await page.waitForLoadState("networkidle");
      const foreign = requested.filter((p) => p.includes(`/images/presets/${dirOf(otherPreset())}/`));
      expect(foreign).toEqual([]);
      expect(requested.some((p) => p.includes(`/images/presets/${dirOf(currentPreset())}/`)) || route === "/carrinho").toBe(true);
    });
  }
});

test.describe("fontes: só as do preset do build", () => {
  test("a rede e o documento só têm as fontes desta loja", async ({ page }) => {
    const fonts: string[] = [];
    page.on("response", (r) => {
      if (/.woff2$/.test(r.url())) fonts.push(r.url().split("/").pop()!);
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const families = await page.evaluate(() => [...new Set([...document.fonts].map((f) => f.family.replace(/ Fallback$/, "")))]);
    const heading = currentPreset() === TRAMA ? "Bodoni Moda" : "Bricolage Grotesque";
    const foreign = currentPreset() === TRAMA ? "Bricolage Grotesque" : "Bodoni Moda";
    expect(families).toContain(heading);
    expect(families).toContain("Manrope");
    expect(families).not.toContain(foreign);
    expect(fonts.length).toBe(2); // título + texto
  });
});

test.describe("a página nunca é escondida", () => {
  for (const route of ["/", "/categoria/{categoria}", "/produto/{produto}", "/carrinho", "/checkout", "/pedido/{pedido}"]) {
    test(`${route}: nenhum quadro com a página escondida, nem com estado salvo`, async ({ page }) => {
      const fixture =
        currentPreset() === TRAMA
          ? { categoria: "feminino", produto: "vestido-midi-linho", pedido: "TS-1001" }
          : { categoria: "pizzas", produto: "pizza-margherita", pedido: "FV-2001" };
      await watchFrames(page);
      await page.goto("/");
      await page.waitForFunction(() => !!window.__demoStore);
      // estado salvo desta loja (carrinho e edição), para a segunda carga ler o localStorage
      await page.evaluate(() => {
        const s = window.__demoStore!;
        s.getState().setStoreName(s.getState().config.name); // força a gravação do estado
        const first = s.getState().products.find((p) => p.stock > 0 && p.variants.length === 0)!;
        s.getState().addToCart({ productId: first.id, qty: 1 });
      });
      await page.goto(route.replace("{categoria}", fixture.categoria).replace("{produto}", fixture.produto).replace("{pedido}", fixture.pedido));
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(300);
      const all = await frames(page);
      expect(all.length).toBeGreaterThan(3);
      expect(all.filter((f) => f.visibility === "hidden")).toEqual([]);
      expect(all.filter((f) => f.pending)).toEqual([]);
      // o conteúdo que aparece é sempre da loja deste build
      expect(all.filter((f) => f.name && f.name !== storeName())).toEqual([]);
      expect(all.filter((f) => f.text.toLowerCase().includes(NAME[otherPreset()].toLowerCase()))).toEqual([]);
    });
  }

  test("a home é visível desde o primeiro quadro, com o banner do preset do build", async ({ page }) => {
    await watchFrames(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const all = await frames(page);
    const named = all.filter((f) => f.name !== null);
    expect(named.length).toBeGreaterThan(0);
    expect(named.every((f) => f.visibility === "visible" && f.name === storeName())).toBe(true);
  });
});

test.describe("mobile: banner baixado uma única vez", () => {
  test.use({
    userAgent: devices["Pixel 5"].userAgent,
    isMobile: true,
    hasTouch: true,
    viewport: { width: 400, height: 800 },
    screen: { width: 400, height: 800 },
    deviceScaleFactor: 2,
  });

  test("o único arquivo de banner da rede é o do preset do build", async ({ page }) => {
    const banners: string[] = [];
    page.on("request", (r) => {
      const p = new URL(r.url()).pathname;
      if (/\/banner[^/]*\.(avif|webp)$/.test(p)) banners.push(p);
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(banners).toHaveLength(1);
    expect(banners[0]).toContain(`/images/presets/${dirOf(currentPreset())}/banner-m-`);
    expect(banners[0].endsWith(".avif")).toBe(true);
  });
});

test.describe("link antigo ?preset= (a URL da outra loja vem de NEXT_PUBLIC_DEMO_URLS)", () => {
  test("?preset=<outra loja> redireciona para a URL dela", async ({ page }) => {
    await page.goto(`/?preset=${SHORT[otherPreset()]}`);
    await expect(page).toHaveURL(new RegExp(`^${URL_OF[otherPreset()]}/?$`));
    await expect(page.getByTestId("store-name")).toHaveAccessibleName(NAME[otherPreset()]);
  });

  test("mantém o caminho, os demais parâmetros e a âncora", async ({ page }) => {
    await page.goto(`/busca?q=a&preset=${otherPreset()}&ordem=x#topo`);
    await expect(page).toHaveURL(`${URL_OF[otherPreset()]}/busca?q=a&ordem=x#topo`);
    await expect(page.getByTestId("store-name")).toHaveAccessibleName(NAME[otherPreset()]);
  });

  test("?preset= do próprio preset ou desconhecido é ignorado (sem redirecionar)", async ({ page }) => {
    for (const key of [SHORT[currentPreset()], currentPreset(), "orbita", ""]) {
      await page.goto(`/?preset=${key}`);
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId("store-name")).toHaveAccessibleName(storeName());
      expect(new URL(page.url()).origin).toBe(new URL(URL_OF[currentPreset()]).origin);
    }
  });

  test("o redirecionamento é do script inline (acontece mesmo sem o JS do React carregar)", async ({ page }) => {
    await page.route("**/_next/static/**/*.js", (route) => route.abort());
    const requested = page.waitForRequest((r) => r.url().startsWith(URL_OF[otherPreset()]));
    await page.goto(`/?preset=${SHORT[otherPreset()]}`).catch(() => undefined);
    expect((await requested).url()).toBe(`${URL_OF[otherPreset()]}/`);
  });
});

test.describe("estado separado por loja", () => {
  test("o estado desta loja fica na chave dela; chave de outra loja e a chave antiga são ignoradas", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => !!window.__demoStore);
    // payload de carrinho/pedidos de OUTRA loja (e da chave antiga) no mesmo domínio
    await page.evaluate(
      ([foreignKey]) => {
        const fake = (presetId: string, id: string) =>
          JSON.stringify({
            state: {
              presetId,
              config: window.__demoStore!.getState().config,
              categories: [],
              products: [],
              orders: [{ id, items: [], total: 1 }],
              coupons: [],
              cart: [{ lineId: "x", productId: "x", addonIds: [], qty: 3 }],
              checkout: { couponCode: null, cep: "", shippingId: null },
            },
            version: 4,
          });
        localStorage.setItem(foreignKey, fake("outro", "FOREIGN-1"));
        localStorage.setItem("loja-demo-v1", fake("outro", "LEGACY-1"));
      },
      [storageKey(otherPreset())],
    );
    await page.reload();
    await page.waitForFunction(() => !!window.__demoStore);
    await page.waitForLoadState("networkidle");
    const s = await page.evaluate(() => {
      const st = window.__demoStore!.getState();
      return { orders: st.orders.map((o) => o.id), cart: st.cart.length };
    });
    expect(s.cart).toBe(0);
    expect(s.orders.some((id) => /FOREIGN|LEGACY/.test(id))).toBe(false);
    await expect(page.getByTestId("cart-count")).toHaveCount(0);
  });

  test("pedido feito numa loja não aparece na outra (carrinho e pedidos da outra ficam intactos)", async ({ page, browser }) => {
    test.skip(currentPreset() !== FORNO, "o pedido é feito no Forno e a Trama é conferida em seguida");
    await page.goto("/");
    await page.waitForFunction(() => !!window.__demoStore);
    await page.evaluate(() => {
      const st = window.__demoStore!.getState();
      st.addToCart({ productId: "fv-013", qty: 2 });
      st.placeOrder({
        id: "FV-9001",
        items: [{ productId: "fv-013", name: "Brownie com Calda de Chocolate", quantity: 2, unitPrice: 1490 }],
        customer: { name: "Ana Souza", email: "ana@example.com", phone: "(11) 91234-5678" },
        delivery: { type: "retirada" },
        payment: { method: "pix" },
        status: "aguardando_pagamento",
        createdAt: new Date().toISOString(),
        total: 2980,
      });
      st.addToCart({ productId: "fv-013", qty: 1 }); // um item novo no carrinho do Forno
    });
    expect(await page.evaluate(() => window.__demoStore!.getState().orders[0].id)).toBe("FV-9001");

    // a Trama (outra loja, outra URL): nada do Forno
    const ctx = await browser.newContext();
    const trama = await ctx.newPage();
    await trama.goto(URL_OF[TRAMA]);
    await trama.waitForFunction(() => !!window.__demoStore);
    await trama.waitForLoadState("networkidle");
    const t = await trama.evaluate(() => {
      const st = window.__demoStore!.getState();
      return { orders: st.orders.map((o) => o.id), cart: st.cart.length, name: st.config.name };
    });
    expect(t.name).toBe("Trama Studio");
    expect(t.cart).toBe(0);
    expect(t.orders.every((id) => id.startsWith("TS-"))).toBe(true);
    expect(t.orders).not.toContain("FV-9001");
    await expect(trama.getByTestId("cart-count")).toHaveCount(0);
    await ctx.close();
  });
});
