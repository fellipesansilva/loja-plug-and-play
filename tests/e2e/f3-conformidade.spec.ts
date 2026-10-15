import { devices, type Page } from "@playwright/test";
import { expect, test, consentStorageKey, currentPreset, inStore, FORNO, SHORT, TRAMA } from "./helpers";

const VALID_CPF = "529.982.247-25";

const fixture = () =>
  currentPreset() === TRAMA
    ? { categoria: "feminino", produto: "vestido-midi-linho", pedido: "TS-1001" }
    : { categoria: "pizzas", produto: "pizza-margherita", pedido: "FV-2001" };

const ready = async (page: Page, route = "/") => {
  await page.goto(route);
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => !!window.__demoStore);
};

/** Pedido novo (de agora) gravado direto no store, com e-mail conhecido. */
async function placeRecentOrder(page: Page, id: string, email: string) {
  await page.evaluate(
    ([orderId, mail]) => {
      const st = window.__demoStore!.getState();
      const base = structuredClone(st.orders[0]);
      st.placeOrder({
        ...base,
        id: orderId,
        status: "pago",
        regret: undefined,
        createdAt: new Date().toISOString(),
        customer: { ...base.customer, email: mail },
      });
    },
    [id, email],
  );
}

/** Produto digital de fixture no store (copia o primeiro produto do preset). */
async function addDigitalFixture(page: Page) {
  await page.evaluate(() => {
    const store = window.__demoStore!;
    const base = store.getState().products[0];
    store.setState((s) => ({
      products: [
        ...s.products,
        { ...base, id: "dg-001", slug: "curso-fixture", name: "Curso (fixture)", sku: "DG-001", type: "digital" as const, price: 19700, stock: 0, variants: [] },
      ],
    }));
  });
}

test.describe("H1 · identificação da loja no rodapé", () => {
  const routes = ["/", "/categoria/{categoria}", "/produto/{produto}", "/busca?q=a", "/carrinho", "/sobre", "/privacidade", "/trocas-e-devolucoes", "/arrependimento", "/pedido/{pedido}"];
  for (const route of routes) {
    test(`${route}: o rodapé tem nome, CNPJ, endereço, e-mail e telefone do preset, marcados como fictícios`, async ({ page }) => {
      const f = fixture();
      await ready(page, route.replace("{categoria}", f.categoria).replace("{produto}", f.produto).replace("{pedido}", f.pedido));
      const legal = await page.evaluate(() => window.__demoStore!.getState().config.legal);
      const footer = page.getByTestId("store-footer");
      await expect(footer.getByTestId("footer-name")).toHaveText(legal.name);
      await expect(footer.getByTestId("footer-document")).toHaveText(legal.document);
      await expect(footer.getByTestId("footer-address")).toHaveText(legal.address);
      await expect(footer.getByTestId("footer-email")).toHaveText(legal.email);
      await expect(footer.getByTestId("footer-phone")).toHaveText(legal.phone);
      await expect(footer).toContainText(/fictíci/i);
      for (const v of Object.values(legal)) expect(v.trim().length).toBeGreaterThan(0);
    });
  }

  test("os dados do rodapé já vêm no HTML do servidor", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).toContain("00.000.000/0001-00");
    expect(html).toContain(currentPreset() === TRAMA ? "contato@trama.example" : "pedidos@fornodavila.example");
  });
});

test.describe("H2 · trocas e devoluções", () => {
  test("mostra os 7 dias, o reembolso integral com frete e o link para desistir", async ({ page }) => {
    await ready(page, "/trocas-e-devolucoes");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Trocas e devoluções");
    await expect(page.getByTestId("regret-days")).toHaveText("7 dias");
    await expect(page.getByTestId("arrependimento")).toContainText("a partir do recebimento");
    await expect(page.getByTestId("arrependimento")).toContainText(/reembolso é integral, com o frete incluso/);
    const link = page.getByTestId("regret-link");
    await expect(link).toHaveAttribute("href", inStore("/arrependimento"));
    const defect = await page.evaluate(() => window.__demoStore!.getState().config.policies.defect);
    await expect(page.getByTestId("defect-days")).toHaveText(`${defect.days} dias`);
    // CDC, art. 26: 30 dias (não durável, Forno) e 90 dias (durável, Trama)
    await expect(page.getByTestId("defect-days")).toHaveText(currentPreset() === TRAMA ? "90 dias" : "30 dias");
    await expect(page.getByTestId("defeito")).toContainText(defect.conditions);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`/${SHORT[currentPreset()]}/arrependimento$`));
  });

  test("o texto de produto digital só aparece quando a loja tem produto digital", async ({ page }) => {
    await ready(page, "/trocas-e-devolucoes");
    await expect(page.getByTestId("digital")).toHaveCount(0);
    await addDigitalFixture(page);
    const digital = await page.evaluate(() => window.__demoStore!.getState().config.policies.digital);
    await expect(page.getByTestId("digital")).toContainText(digital!);
  });
});

test.describe("H3 · desistir da compra (simulado)", () => {
  test("há o link no rodapé e na confirmação do pedido", async ({ page }) => {
    await ready(page, "/");
    await expect(page.getByTestId("store-footer").getByRole("link", { name: "Desistir da compra" })).toHaveAttribute("href", inStore("/arrependimento"));
    await placeRecentOrder(page, "XX-7001", "ana@example.com");
    await page.goto("/pedido/XX-7001");
    const link = page.getByTestId("regret-order-link");
    await expect(link).toHaveAttribute("href", inStore("/arrependimento?pedido=XX-7001"));
    await link.click();
    await expect(page.locator("#chk-regretOrder")).toHaveValue("XX-7001");
  });

  test("pedido recente: mostra o protocolo e muda o status para cancelado", async ({ page }) => {
    await ready(page, "/");
    await placeRecentOrder(page, "XX-7002", "ana@example.com");
    await page.goto("/arrependimento");
    await page.locator("#chk-regretOrder").fill("XX-7002");
    await page.locator("#chk-regretEmail").fill("ANA@example.com");
    await page.getByRole("button", { name: "Desistir da compra" }).click();
    const result = page.getByTestId("regret-result");
    await expect(result).toHaveAttribute("data-kind", "ok");
    await expect(page.getByTestId("regret-protocol")).toHaveText(/^ARR-\d{8}-[0-9A-Z]{5}$/);
    const order = await page.evaluate(() => window.__demoStore!.getState().orders.find((o) => o.id === "XX-7002")!);
    expect(order.status).toBe("cancelado");
    expect(order.regret?.protocol).toMatch(/^ARR-/);
    await page.goto("/pedido/XX-7002");
    await expect(page.getByTestId("order-status")).toContainText("Cancelado");
    await expect(page.getByTestId("regret-order-link")).toHaveCount(0);
  });

  test("pedido de fixture com data antiga: recusa por prazo e mostra o contato para troca por defeito", async ({ page }) => {
    await ready(page, "/arrependimento");
    const { id, email } = await page.evaluate((orderId) => {
      const o = window.__demoStore!.getState().orders.find((x) => x.id === orderId)!;
      return { id: o.id, email: o.customer.email };
    }, fixture().pedido);
    await page.locator("#chk-regretOrder").fill(id);
    await page.locator("#chk-regretEmail").fill(email);
    await page.getByRole("button", { name: "Desistir da compra" }).click();
    const result = page.getByTestId("regret-result");
    await expect(result).toHaveAttribute("data-kind", "expired");
    const legal = await page.evaluate(() => window.__demoStore!.getState().config.legal);
    await expect(result).toContainText("prazo de desistência");
    await expect(result).toContainText(legal.email);
    await expect(result).toContainText(legal.phone);
    const status = await page.evaluate((orderId) => window.__demoStore!.getState().orders.find((x) => x.id === orderId)!.status, id);
    expect(status).not.toBe("cancelado");
  });

  test("pedido inexistente e e-mail diferente dão a mesma mensagem, sem revelar se o pedido existe", async ({ page }) => {
    await ready(page, "/");
    await placeRecentOrder(page, "XX-7003", "ana@example.com");
    await page.goto("/arrependimento");
    const messageFor = async (id: string, email: string) => {
      await page.locator("#chk-regretOrder").fill(id);
      await page.locator("#chk-regretEmail").fill(email);
      await page.getByRole("button", { name: "Desistir da compra" }).click();
      const result = page.getByTestId("regret-result");
      await expect(result).toHaveAttribute("data-kind", "invalid");
      return result.innerText();
    };
    const noOrder = await messageFor("XX-0000", "ana@example.com");
    const wrongEmail = await messageFor("XX-7003", "outra@example.com");
    expect(wrongEmail).toBe(noOrder);
    const status = await page.evaluate(() => window.__demoStore!.getState().orders.find((x) => x.id === "XX-7003")!.status);
    expect(status).toBe("pago");
  });

  test("campos vazios mostram erro por campo", async ({ page }) => {
    await ready(page, "/arrependimento");
    await page.getByRole("button", { name: "Desistir da compra" }).click();
    await expect(page.getByText("Informe o número do pedido")).toBeVisible();
    await expect(page.getByText("Informe o e-mail usado na compra")).toBeVisible();
  });
});

test.describe("H4 · privacidade (LGPD)", () => {
  test("as 6 seções aparecem com o conteúdo do preset", async ({ page }) => {
    await ready(page, "/privacidade");
    const privacy = await page.evaluate(() => window.__demoStore!.getState().config.policies.privacy);
    const titles = ["Dados coletados", "Finalidade", "Prazo de guarda", "Compartilhamento", "Seus direitos como titular", "Responsável pelos dados"];
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(titles);
    await expect(page.getByTestId("priv-dados")).toContainText(privacy.dataCollected[0]);
    await expect(page.getByTestId("priv-finalidade")).toContainText(privacy.purpose);
    await expect(page.getByTestId("priv-guarda")).toContainText(privacy.retention);
    await expect(page.getByTestId("priv-compartilhamento")).toContainText(privacy.sharing[0]);
    await expect(page.getByTestId("priv-compartilhamento")).toContainText(/pagamento/i);
    await expect(page.getByTestId("priv-direitos")).toContainText(privacy.rights[0]);
    await expect(page.getByTestId("priv-responsavel")).toContainText(privacy.controller.email);
  });

  test("o checkout tem o link para a política junto dos dados pessoais", async ({ page }) => {
    await ready(page, "/");
    await addDigitalFixture(page);
    await page.evaluate(() => window.__demoStore!.getState().addToCart({ productId: "dg-001", qty: 1 }));
    await page.goto("/checkout");
    const form = page.getByTestId("step-id");
    await expect(form.locator("#chk-cpf")).toBeVisible();
    await expect(form.getByRole("link", { name: "Política de Privacidade" })).toHaveAttribute("href", inStore("/privacidade"));
  });
});

test.describe("H5 · consentimento de cookies", () => {
  test.use({ seedConsent: false });

  const banner = (page: Page) => page.getByRole("dialog", { name: "Aviso de cookies" });
  const saved = (page: Page) => page.evaluate((k) => localStorage.getItem(k), consentStorageKey());

  test("primeira visita: o aviso aparece com Aceitar e Recusar de mesmo destaque", async ({ page }) => {
    await ready(page, "/");
    await expect(banner(page)).toBeVisible();
    const notice = await page.evaluate(() => window.__demoStore!.getState().config.policies.cookies.notice);
    await expect(banner(page)).toContainText(notice);
    const accept = banner(page).getByRole("button", { name: "Aceitar" });
    const reject = banner(page).getByRole("button", { name: "Recusar" });
    const style = (b: typeof accept) =>
      b.evaluate((el) => {
        const c = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { bg: c.backgroundColor, color: c.color, border: c.borderTopColor, weight: c.fontWeight, size: c.fontSize, w: Math.round(r.width), h: Math.round(r.height) };
      });
    expect(await style(accept)).toEqual(await style(reject));
    expect(await saved(page)).toBeNull();
  });

  test("aceitar grava escolha, data e versão e o aviso não volta ao recarregar", async ({ page }) => {
    await ready(page, "/");
    await banner(page).getByRole("button", { name: "Aceitar" }).click();
    await expect(banner(page)).toHaveCount(0);
    const record = JSON.parse((await saved(page))!);
    expect(record.choice).toBe("accepted");
    expect(record.version).toBe(await page.evaluate(() => window.__demoStore!.getState().config.policies.cookies.version));
    expect(Number.isNaN(Date.parse(record.at))).toBe(false);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(400);
    await expect(banner(page)).toHaveCount(0);
  });

  test("recusar grava a recusa e o aviso não volta", async ({ page }) => {
    await ready(page, "/");
    await banner(page).getByRole("button", { name: "Recusar" }).click();
    await expect(banner(page)).toHaveCount(0);
    expect(JSON.parse((await saved(page))!).choice).toBe("rejected");
    await page.goto("/sobre");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(400);
    await expect(banner(page)).toHaveCount(0);
  });

  test("Preferências de cookies no rodapé reabre a escolha e permite mudar", async ({ page }) => {
    await ready(page, "/");
    await banner(page).getByRole("button", { name: "Recusar" }).click();
    await page.getByTestId("store-footer").getByRole("button", { name: "Preferências de cookies" }).click();
    await expect(banner(page)).toBeVisible();
    await banner(page).getByRole("button", { name: "Aceitar" }).click();
    await expect(banner(page)).toHaveCount(0);
    expect(JSON.parse((await saved(page))!).choice).toBe("accepted");
  });

  test("a escolha é separada por loja (a chave do outro preset não vale)", async ({ page }) => {
    await ready(page, "/");
    await page.evaluate(
      ([k]) => localStorage.setItem(k, JSON.stringify({ choice: "accepted", at: "2026-01-01T00:00:00.000Z", version: "1" })),
      [consentStorageKey(currentPreset() === TRAMA ? FORNO : TRAMA)],
    );
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(banner(page)).toBeVisible();
  });

  test("escolha dada para outra versão do texto pergunta de novo", async ({ page }) => {
    await ready(page, "/");
    await page.evaluate(
      ([k]) => localStorage.setItem(k, JSON.stringify({ choice: "accepted", at: "2026-01-01T00:00:00.000Z", version: "antiga" })),
      [consentStorageKey()],
    );
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(banner(page)).toBeVisible();
  });

  test("nenhum cookie nem script de terceiros é carregado, aceitando ou recusando", async ({ page, context }) => {
    const external: string[] = [];
    page.on("request", (r) => {
      const u = new URL(r.url());
      if (u.origin !== "http://localhost:3411" && !u.protocol.startsWith("data")) external.push(r.url());
    });
    await ready(page, "/");
    await banner(page).getByRole("button", { name: "Recusar" }).click();
    await page.reload();
    await page.waitForLoadState("networkidle");
    expect(await context.cookies()).toEqual([]);
    expect(external).toEqual([]);
    await page.getByRole("button", { name: "Preferências de cookies" }).click();
    await banner(page).getByRole("button", { name: "Aceitar" }).click();
    await page.reload();
    await page.waitForLoadState("networkidle");
    expect(await context.cookies()).toEqual([]);
    expect(external).toEqual([]);
  });

  test("o aviso não causa deslocamento de layout na home (CLS 0)", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __cls: number; __shifts: unknown[] };
      w.__cls = 0;
      w.__shifts = [];
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean; sources?: { node?: Node }[] }[]) {
          if (!e.hadRecentInput) {
            w.__cls += e.value;
            w.__shifts.push({ value: e.value, nodes: (e.sources ?? []).map((s) => (s.node as Element | undefined)?.nodeName) });
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(banner(page)).toBeVisible();
    await page.waitForTimeout(1500);
    const { cls, shifts } = await page.evaluate(() => {
      const w = window as unknown as { __cls: number; __shifts: unknown[] };
      return { cls: w.__cls, shifts: w.__shifts };
    });
    expect({ cls, shifts }).toEqual({ cls: 0, shifts: [] });
  });

  test("com o aviso aberto, o botão Demo, o carrinho e a compra ficam livres", async ({ page }) => {
    await ready(page, "/");
    const slug = await page.evaluate(() => window.__demoStore!.getState().products.find((p) => p.stock > 0 && p.variants.length === 0 && !p.type && !(p.addons ?? []).length)!.slug);
    await page.goto(`/produto/${slug}`);
    await page.waitForLoadState("networkidle");
    await expect(banner(page)).toBeVisible();
    const box = (await banner(page).boundingBox())!;
    const overlaps = (b: { x: number; y: number; width: number; height: number }) =>
      b.x < box.x + box.width && b.x + b.width > box.x && b.y < box.y + box.height && b.y + b.height > box.y;
    for (const target of [page.getByRole("button", { name: "Demo", exact: true }), page.getByRole("link", { name: /^(Carrinho|Sacola)/ }).first()]) {
      const b = (await target.boundingBox())!;
      expect(overlaps(b), String(await target.textContent())).toBe(false);
    }
    // a barra fixa de compra (página "sheet") sobe com o aviso; nos demais layouts o botão está no fluxo da página
    const stickyAdd = page.locator(".sticky.bottom-0").getByRole("button", { name: /Adicionar/ });
    if (await stickyAdd.count()) expect(overlaps((await stickyAdd.boundingBox())!)).toBe(false);
    // e dá para comprar com o aviso aberto (o clique só acontece se nada cobrir o botão)
    await page.getByRole("button", { name: /Adicionar/ }).first().click();
    await expect(page.getByRole("status")).toBeVisible();
  });

  test.describe("celular 400 px", () => {
    test.use({
      userAgent: devices["Pixel 5"].userAgent,
      isMobile: true,
      hasTouch: true,
      viewport: { width: 400, height: 800 },
      screen: { width: 400, height: 800 },
      deviceScaleFactor: 2,
    });

    test("barra de compra e botão Demo ficam acima do aviso, e o layout não desloca", async ({ page }) => {
      await page.addInitScript(() => {
        const w = window as unknown as { __cls: number };
        w.__cls = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) w.__cls += e.value;
        }).observe({ type: "layout-shift", buffered: true });
      });
      await ready(page, `/produto/${fixture().produto}`);
      await expect(banner(page)).toBeVisible();
      await page.waitForTimeout(800);
      const box = (await banner(page).boundingBox())!;
      const demo = (await page.getByRole("button", { name: "Demo", exact: true }).boundingBox())!;
      expect(demo.y + demo.height).toBeLessThanOrEqual(box.y + 1);
      const add = page.getByRole("button", { name: /Adicionar/ }).first();
      await add.scrollIntoViewIfNeeded();
      const b = (await add.boundingBox())!;
      expect(b.y + b.height).toBeLessThanOrEqual(box.y + 1);
      expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBe(0);
    });
  });
});

test.describe("H6 · dados mínimos e consentimento de marketing no checkout", () => {
  async function toIdentification(page: Page) {
    await ready(page, "/");
    await addDigitalFixture(page);
    await page.evaluate(() => window.__demoStore!.getState().addToCart({ productId: "dg-001", qty: 1 }));
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");
  }
  async function fill(page: Page, over: Partial<Record<"name" | "email" | "phone" | "cpf", string>> = {}) {
    const v = { name: "Ana Souza", email: "ana@example.com", phone: "", cpf: VALID_CPF, ...over };
    await page.locator("#chk-name").fill(v.name);
    await page.locator("#chk-email").fill(v.email);
    if (v.phone) await page.locator("#chk-phone").fill(v.phone);
    await page.locator("#chk-cpf").fill(v.cpf);
  }
  const finishOrder = async (page: Page) => {
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByTestId("step-payment")).toBeVisible();
    await page.getByTestId("finish").click();
    await expect(page.getByTestId("order-status")).toBeVisible();
    return page.evaluate(() => window.__demoStore!.getState().orders[0]);
  };

  test("a caixa 'Quero receber ofertas' vem desmarcada", async ({ page }) => {
    await toIdentification(page);
    await expect(page.getByLabel("Quero receber ofertas")).not.toBeChecked();
  });

  test("sem marcar: o pedido funciona e não grava consentimento de marketing", async ({ page }) => {
    await toIdentification(page);
    await fill(page);
    const order = await finishOrder(page);
    expect(order.customer.marketingOptIn).toBe(false);
    expect(order.customer.marketingConsentAt).toBeUndefined();
  });

  test("marcando: grava o consentimento com a data", async ({ page }) => {
    await toIdentification(page);
    await fill(page);
    await page.getByLabel("Quero receber ofertas").check();
    const before = Date.now();
    const order = await finishOrder(page);
    expect(order.customer.marketingOptIn).toBe(true);
    const at = Date.parse(order.customer.marketingConsentAt!);
    expect(at).toBeGreaterThanOrEqual(before - 5000);
    expect(at).toBeLessThanOrEqual(Date.now() + 5000);
  });

  test("pedido só de produto digital não exige celular; com celular digitado ele precisa ser válido", async ({ page }) => {
    await toIdentification(page);
    await expect(page.getByLabel("Celular (opcional)")).toBeVisible();
    await fill(page, { phone: "123" });
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByText("Celular inválido")).toBeVisible();
    await page.locator("#chk-phone").fill("");
    const order = await finishOrder(page);
    expect(order.customer.phone).toBe("");
  });

  test("pedido com entrega continua exigindo nome, e-mail, celular e CPF (e só esses)", async ({ page }) => {
    await ready(page, "/");
    await page.evaluate(() => {
      const st = window.__demoStore!.getState();
      const product = st.products.find((p) => p.stock > 0 && p.variants.length === 0 && !p.type)!;
      st.addToCart({ productId: product.id, qty: 1 });
    });
    await page.goto("/carrinho");
    await page.getByLabel("CEP").fill("01310100");
    await page.getByRole("button", { name: "Calcular" }).click();
    await page.getByTestId("shipping-options").getByRole("radio").first().check();
    await page.getByRole("link", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    for (const field of ["name", "email", "phone", "cpf"]) await expect(page.locator(`#chk-${field}`)).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("[aria-invalid=true]")).toHaveCount(4);
  });
});
