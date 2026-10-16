import { type Page } from "@playwright/test";
import { expect, test } from "./helpers";
import { MOBILE, VALID_CPF, overflowOf, placeOrder, ready } from "./painel-helpers";

test.use(MOBILE);

/** Alvos interativos visíveis menores que `min` px (WCAG 2.2 AA: 24 × 24). Link no meio de uma frase é exceção. */
async function smallTargets(page: Page, min = 24) {
  return page.evaluate((limit) => {
    const out: string[] = [];
    const els = document.querySelectorAll<HTMLElement>("a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button]");
    for (const el of els) {
      const st = getComputedStyle(el);
      if (st.visibility === "hidden" || st.display === "none" || el.closest("[aria-hidden=true]")) continue;
      let r = el.getBoundingClientRect();
      if (r.width <= 1 && r.height <= 1) continue; // sr-only
      // rádio e caixa de seleção: a área clicável inclui o rótulo
      if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio") && el.labels?.length) {
        const label = el.labels[0].getBoundingClientRect();
        r = label;
      }
      if (el.tagName === "A" && st.display === "inline") continue; // link dentro de frase
      if (r.width < limit || r.height < limit) {
        const text = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("name") || el.id || el.tagName).trim().slice(0, 40);
        out.push(`${el.tagName.toLowerCase()} "${text}" ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    }
    return [...new Set(out)];
  }, min);
}

async function seedCart(page: Page) {
  await page.evaluate(() => {
    const st = window.__demoStore!.getState();
    const p = st.products.find((x) => x.stock >= 2 && x.variants.length === 0 && !x.type && !(x.addons ?? []).length)!;
    st.addToCart({ productId: p.id, qty: 1 });
    st.setShipping("01310100", "economico");
  });
}

test.describe("F4 · polimento no celular (400 × 800)", () => {
  test("alvos de toque de pelo menos 24 × 24 px no painel, no carrinho e no checkout", async ({ page }) => {
    await ready(page, "/");
    await placeOrder(page, { id: "XX-9001" });
    await seedCart(page);
    const routes = ["/painel/pedidos", "/painel/pedidos/XX-9001", "/painel/produtos", "/painel/produtos/novo", "/painel/importacao", "/carrinho", "/checkout"];
    const found: Record<string, string[]> = {};
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      if (route === "/painel/produtos/novo") await page.getByTestId("add-variant").click();
      found[route] = await smallTargets(page);
    }
    // etapas seguintes do checkout (entrega e pagamento com cartão)
    await page.goto("/checkout");
    await page.locator("#chk-name").fill("Ana Souza");
    await page.locator("#chk-email").fill("ana@example.com");
    await page.locator("#chk-phone").fill("11912345678");
    await page.locator("#chk-cpf").fill(VALID_CPF);
    await page.getByRole("button", { name: "Continuar" }).click();
    found["/checkout (entrega)"] = await smallTargets(page);
    await page.locator("#chk-street").fill("Av. Paulista");
    await page.locator("#chk-number").fill("1000");
    await page.locator("#chk-district").fill("Bela Vista");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("radio", { name: "Cartão de crédito" }).check();
    found["/checkout (pagamento)"] = await smallTargets(page);
    expect(Object.fromEntries(Object.entries(found).filter(([, v]) => v.length))).toEqual({});
  });

  test("menu do painel e botão Demo com 44 px de altura", async ({ page }) => {
    await ready(page, "/painel/pedidos");
    for (const name of ["Produtos", "Pedidos", "Importação", "Configurações"]) {
      const box = (await page.getByRole("navigation", { name: "Menu do painel" }).getByRole("link", { name, exact: true }).boundingBox())!;
      expect(box.height, name).toBeGreaterThanOrEqual(44);
    }
    expect((await page.getByRole("button", { name: "Demo", exact: true }).boundingBox())!.height).toBeGreaterThanOrEqual(44);
  });

  test("painel compacto: menu em faixa com rolagem, faixa fina e o primeiro pedido na metade de cima da tela", async ({ page }) => {
    await ready(page, "/painel/pedidos");
    const nav = page.getByRole("navigation", { name: "Menu do painel" });
    const navBox = (await nav.boundingBox())!;
    expect(navBox.height).toBeLessThanOrEqual(64);
    // a faixa rola na horizontal dentro do menu, sem estourar a página
    expect(await nav.locator("ul").evaluate((ul) => ul.scrollWidth > ul.clientWidth)).toBe(true);
    expect(await overflowOf(page)).toBeLessThanOrEqual(0);
    const banner = (await page.getByTestId("painel-demo-banner").boundingBox())!;
    expect(banner.height).toBeLessThanOrEqual(26);
    const top = await page.getByTestId("order-row").first().evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    expect(top).toBeLessThan(400); // metade de cima de uma tela de 800 px
  });

  test("a faixa 'Painel de demonstração' não cobre o menu: no topo ela vem antes do menu; rolando, só cobre o que rolou", async ({ page }) => {
    await ready(page, "/painel/pedidos");
    const banner = page.getByTestId("painel-demo-banner");
    const nav = page.getByRole("navigation", { name: "Menu do painel" });
    const b0 = (await banner.boundingBox())!;
    const n0 = (await nav.boundingBox())!;
    expect(b0.y + b0.height).toBeLessThanOrEqual(n0.y + 0.5);
    // rolagem real: a faixa fica colada no topo da tela
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(300);
    const b1 = (await banner.boundingBox())!;
    expect(b1.y).toBeGreaterThanOrEqual(0);
    expect(b1.y).toBeLessThanOrEqual(1);
  });

  test("a linha inteira do pedido é clicável", async ({ page }) => {
    await ready(page, "/");
    await placeOrder(page, { id: "XX-9002" });
    await page.goto("/painel/pedidos");
    const row = page.locator('[data-order-id="XX-9002"]');
    const box = (await row.boundingBox())!;
    // toca no canto direito da linha (longe do número do pedido)
    await page.touchscreen.tap(box.x + box.width - 12, box.y + box.height - 12);
    await expect(page).toHaveURL(/\/painel\/pedidos\/XX-9002$/);
  });

  test("o botão Demo não cobre texto no fim do detalhe do pedido nem do carrinho", async ({ page }) => {
    await ready(page, "/");
    await placeOrder(page, { id: "XX-9003" });
    await seedCart(page);
    for (const route of ["/painel/pedidos/XX-9003", "/carrinho", "/painel/produtos", "/checkout"]) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(200);
      const covered = await page.evaluate(() => {
        const demo = [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Demo")!.getBoundingClientRect();
        const hits: string[] = [];
        for (const el of document.querySelectorAll<HTMLElement>("main *, footer *")) {
          if (el.children.length > 0) continue;
          const text = el.textContent?.trim();
          if (!text) continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (r.left < demo.right && r.right > demo.left && r.top < demo.bottom && r.bottom > demo.top) hits.push(text.slice(0, 40));
        }
        return hits;
      });
      expect(covered, route).toEqual([]);
    }
  });
});
