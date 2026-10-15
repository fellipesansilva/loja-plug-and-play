import { devices, type Page } from "@playwright/test";
import { expect, test, FORNO, NAME, ORIGIN, SHORT, TRAMA, currentPreset, storageKey, storeName } from "./helpers";

/** O outro preset: a "outra loja" em relação à loja que está sendo testada. */
const otherPreset = () => (currentPreset() === TRAMA ? FORNO : TRAMA);
const dirOf = (preset: string) => (preset === FORNO ? "forno-da-vila" : "trama-studio");
const fixture = () =>
  currentPreset() === TRAMA
    ? { categoria: "feminino", produto: "vestido-midi-linho", pedido: "TS-1001" }
    : { categoria: "pizzas", produto: "pizza-margherita", pedido: "FV-2001" };

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

test.describe("HTML do servidor: cada rota já nasce no próprio preset", () => {
  test("o HTML da home já é da loja e não cita arquivos da outra", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).toContain(`aria-label="${storeName()}"`);
    expect(html).toContain(`/images/presets/${dirOf(currentPreset())}/`);
    expect(html).not.toContain(`/images/presets/${dirOf(otherPreset())}/`);
    expect(html).not.toContain(`/fonts/${SHORT[otherPreset()]}/`);
    expect(html).toContain(`/fonts/${SHORT[currentPreset()]}/`);
    expect(html).toContain(currentPreset() === TRAMA ? "--t-color-primary:#4b5340" : "--t-color-primary:#cf3512");
  });

  test("o HTML não tem esconder nem preload de imagem injetado", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).not.toContain("data-preset-pending");
  });

  test("o HTML de uma página de produto também é da loja", async ({ request }) => {
    const html = await (await request.get(`/produto/${fixture().produto}`)).text();
    expect(html).toContain(`aria-label="${storeName()}"`);
    expect(html).not.toContain(`/images/presets/${dirOf(otherPreset())}/`);
  });
});

test.describe("rede: nada do outro preset (imagem, fonte ou tema)", () => {
  for (const route of ["/", "/categoria/{categoria}", "/produto/{produto}", "/carrinho", "/busca?q=a", "/sobre", "/painel/produtos"]) {
    test(`${route}: a rede não baixa nada do outro preset`, async ({ page }) => {
      const requested: string[] = [];
      page.on("request", (r) => requested.push(new URL(r.url()).pathname));
      await page.goto(route.replace("{categoria}", fixture().categoria).replace("{produto}", fixture().produto));
      await page.waitForLoadState("networkidle");
      const other = otherPreset();
      expect(requested.filter((p) => p.includes(`/images/presets/${dirOf(other)}/`))).toEqual([]);
      expect(requested.filter((p) => p.includes(`/fonts/${SHORT[other]}/`))).toEqual([]);
      // nenhuma fonte, em nenhum formato, de outra família
      const foreignFamily = currentPreset() === TRAMA ? /bricolage/i : /bodoni/i;
      expect(requested.filter((p) => foreignFamily.test(p))).toEqual([]);
    });
  }

  test("a home baixa as fontes e a imagem principal do próprio preset", async ({ page }) => {
    const fonts: string[] = [];
    const images: string[] = [];
    page.on("response", (r) => {
      const p = new URL(r.url()).pathname;
      if (p.endsWith(".woff2")) fonts.push(p);
      if (p.includes("/images/presets/")) images.push(p);
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(fonts.sort()).toEqual([`/fonts/${SHORT[currentPreset()]}/manrope-latin.woff2`, `/fonts/${SHORT[currentPreset()]}/${currentPreset() === TRAMA ? "bodoni-moda" : "bricolage-grotesque"}-latin.woff2`].sort());
    expect(images.length).toBeGreaterThan(0);
    expect(images.every((p) => p.includes(`/images/presets/${dirOf(currentPreset())}/`))).toBe(true);
    const families = await page.evaluate(() => [...new Set([...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family))]);
    expect(families).toContain(currentPreset() === TRAMA ? "Bodoni Moda" : "Bricolage Grotesque");
    expect(families).toContain("Manrope");
  });
});

test.describe("a página nunca é escondida", () => {
  for (const route of ["/", "/categoria/{categoria}", "/produto/{produto}", "/carrinho", "/checkout", "/pedido/{pedido}"]) {
    test(`${route}: nenhum quadro com a página escondida, nem com estado salvo`, async ({ page }) => {
      await watchFrames(page);
      await page.goto("/");
      await page.waitForFunction(() => !!window.__demoStore);
      await page.evaluate(() => {
        const s = window.__demoStore!;
        s.getState().setStoreName(s.getState().config.name); // força a gravação do estado
        const first = s.getState().products.find((p) => p.stock > 0 && p.variants.length === 0)!;
        s.getState().addToCart({ productId: first.id, qty: 1 });
      });
      const f = fixture();
      await page.goto(route.replace("{categoria}", f.categoria).replace("{produto}", f.produto).replace("{pedido}", f.pedido));
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(300);
      const all = await frames(page);
      expect(all.length).toBeGreaterThan(3);
      expect(all.filter((x) => x.visibility === "hidden")).toEqual([]);
      expect(all.filter((x) => x.pending)).toEqual([]);
      expect(all.filter((x) => x.name && x.name !== storeName())).toEqual([]);
      expect(all.filter((x) => x.text.toLowerCase().includes(NAME[otherPreset()].toLowerCase()))).toEqual([]);
    });
  }

  test("a home é visível desde o primeiro quadro, com o banner do preset", async ({ page }) => {
    await watchFrames(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const named = (await frames(page)).filter((x) => x.name !== null);
    expect(named.length).toBeGreaterThan(0);
    expect(named.every((x) => x.visibility === "visible" && x.name === storeName())).toBe(true);
  });
});

for (const dpr of [1.75, 2]) {
  test.describe(`mobile 400 px, DPR ${dpr}: banner baixado uma única vez`, () => {
    test.use({
      userAgent: devices["Pixel 5"].userAgent,
      isMobile: true,
      hasTouch: true,
      viewport: { width: 400, height: 800 },
      screen: { width: 400, height: 800 },
      deviceScaleFactor: dpr,
    });

    test("o único arquivo de banner da rede é o do preset", async ({ page }) => {
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
}

test.describe("endereços: raiz, links antigos e 404", () => {
  const get = (request: import("@playwright/test").APIRequestContext, path: string) =>
    request.get(`${ORIGIN}${path}`, { maxRedirects: 0 });
  const location = (res: { headers(): Record<string, string> }) => (res.headers()["location"] ?? "").replace(ORIGIN, "");

  test("/ redireciona para o preset padrão (/trama)", async ({ request }) => {
    const res = await get(request, "/");
    expect([307, 308]).toContain(res.status());
    expect(location(res)).toBe("/trama");
  });

  test("/?preset=forno e /produto/<x>?preset=forno vão para o mesmo caminho em /forno", async ({ request }) => {
    expect(location(await get(request, "/?preset=forno"))).toBe("/forno");
    expect(location(await get(request, "/produto/pizza-margherita?preset=forno"))).toBe("/forno/produto/pizza-margherita");
    expect(location(await get(request, "/busca?q=a&preset=FORNO&ordem=x"))).toBe("/forno/busca?q=a&ordem=x");
  });

  test("caminho da loja sem preset vai para o padrão", async ({ request }) => {
    expect(location(await get(request, "/carrinho"))).toBe("/trama/carrinho");
    expect(location(await get(request, "/produto/vestido-midi-linho"))).toBe("/trama/produto/vestido-midi-linho");
    expect(location(await get(request, "/painel/produtos"))).toBe("/trama/painel/produtos");
  });

  test("no navegador, o link antigo termina na loja certa", async ({ page }) => {
    await page.goto(`${ORIGIN}/produto/pizza-margherita?preset=forno`);
    await expect(page).toHaveURL(`${ORIGIN}/forno/produto/pizza-margherita`);
    await expect(page.getByTestId("store-name")).toHaveAccessibleName(NAME[FORNO]);
    await page.goto(`${ORIGIN}/?preset=forno`);
    await expect(page).toHaveURL(`${ORIGIN}/forno`);
    await page.goto(`${ORIGIN}/`);
    await expect(page).toHaveURL(`${ORIGIN}/trama`);
  });

  test("preset desconhecido retorna 404 de verdade", async ({ request }) => {
    for (const path of ["/orbita", "/xyz", "/orbita/carrinho", "/orbita/produto/pizza-margherita"]) {
      expect((await get(request, path)).status(), path).toBe(404);
    }
  });

  test("páginas dos dois presets existem com status 200", async ({ request }) => {
    for (const slug of ["trama", "forno"]) {
      for (const path of ["", "/carrinho", "/checkout", "/busca", "/sobre", "/privacidade", "/trocas-e-devolucoes", "/painel/produtos", "/painel/login"]) {
        expect((await get(request, `/${slug}${path}`)).status(), `/${slug}${path}`).toBe(200);
      }
    }
  });
});

test.describe("links internos sempre levam o prefixo do preset", () => {
  const routes = ["/", "/categoria/{categoria}", "/produto/{produto}", "/busca?q=a", "/carrinho", "/checkout", "/sobre", "/privacidade", "/trocas-e-devolucoes", "/arrependimento", "/pedido/{pedido}", "/painel/produtos", "/painel/pedidos", "/painel/configuracoes/loja"];

  for (const route of routes) {
    test(`${route}: todo <a href="/…"> começa por /${"<preset>"}`, async ({ page }) => {
      const f = fixture();
      await page.goto(route.replace("{categoria}", f.categoria).replace("{produto}", f.produto).replace("{pedido}", f.pedido));
      await page.waitForLoadState("networkidle");
      await page.waitForFunction(() => !!window.__demoStore);
      const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""));
      const internal = hrefs.filter((h) => h.startsWith("/") && !h.startsWith("//"));
      expect(internal.length).toBeGreaterThan(0);
      const slug = SHORT[currentPreset()];
      const bad = internal.filter((h) => h !== `/${slug}` && !h.startsWith(`/${slug}/`) && !h.startsWith(`/${slug}?`) && !h.startsWith(`/${slug}#`));
      expect(bad).toEqual([]);
    });
  }

  test("navegar pelos links mantém o preset no endereço", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(() => !!window.__demoStore);
    await page.locator('a[href$="/carrinho"]').first().click();
    await expect(page).toHaveURL(new RegExp(`/${SHORT[currentPreset()]}/carrinho$`));
  });
});

test.describe("estado separado por loja (mesmo domínio, mesmo navegador)", () => {
  test("estado de outra loja e a chave antiga são ignorados", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => !!window.__demoStore);
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

  test("pedido feito em /forno não aparece em /trama (carrinho e pedidos), e o Forno segue intacto", async ({ page }) => {
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
      st.addToCart({ productId: "fv-013", qty: 1 });
    });

    // /trama no MESMO navegador e domínio: nada do Forno
    await page.goto(`${ORIGIN}/trama`);
    await page.waitForFunction(() => !!window.__demoStore && window.__demoStore.getState().presetId === "trama-studio");
    await page.waitForLoadState("networkidle");
    const t = await page.evaluate(() => {
      const st = window.__demoStore!.getState();
      return { orders: st.orders.map((o) => o.id), cart: st.cart.length, name: st.config.name };
    });
    expect(t.name).toBe("Trama Studio");
    expect(t.cart).toBe(0);
    expect(t.orders.every((id) => id.startsWith("TS-"))).toBe(true);
    expect(t.orders).not.toContain("FV-9001");
    await expect(page.getByTestId("cart-count")).toHaveCount(0);
    await page.goto(`${ORIGIN}/trama/painel/pedidos`);
    await expect(page.getByText("FV-9001")).toHaveCount(0);

    // de volta ao /forno, o pedido e o carrinho continuam lá
    await page.goto(`${ORIGIN}/forno`);
    await page.waitForFunction(() => !!window.__demoStore && window.__demoStore.getState().presetId === "forno-da-vila");
    await expect.poll(() => page.evaluate(() => window.__demoStore!.getState().orders[0].id)).toBe("FV-9001");
    expect(await page.evaluate(() => window.__demoStore!.getState().cart.length)).toBeGreaterThan(0);
  });
});
