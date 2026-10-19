import { type Page } from "@playwright/test";
import { test, expect, ORIGIN, TRAMA } from "./helpers";
import { MOBILE, overflowOf } from "./painel-helpers";

// Órbita: loja de eletrônicos premium (marca fictícia, tema escuro). Roda uma vez (projeto trama), com endereços completos (/orbita/...).
test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.metadata.preset !== TRAMA, "A Órbita roda uma vez (projeto trama)");
  await page.addInitScript(() => {
    try {
      if (!localStorage.getItem("loja-consent-v1-orbita")) {
        localStorage.setItem("loja-consent-v1-orbita", JSON.stringify({ choice: "rejected", at: "2026-01-01T00:00:00.000Z", version: "1" }));
      }
    } catch {}
  });
});

const ORBITA = `${ORIGIN}/orbita`;

async function abrir(page: Page, route = "") {
  await page.goto(`${ORBITA}${route}`);
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => !!window.__demoStore);
}
const rootVar = (page: Page, n: string) => page.evaluate((v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim(), n);

test.describe("H1 · vitrine", () => {
  test("home: banner, categorias, mais vendidos; tema escuro; módulos do diferencial desligados; sem erro de console", async ({ page }) => {
    const erros: string[] = [];
    page.on("console", (m) => m.type() === "error" && erros.push(m.text()));
    page.on("pageerror", (e) => erros.push(e.message));
    await abrir(page);
    await page.waitForTimeout(1500);
    await expect(page.getByTestId("store-name")).toHaveAccessibleName("Órbita");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Som e tecnologia em outra órbita");
    expect(await rootVar(page, "--t-color-background")).toBe("#0e1116");
    await expect(page.getByTestId("product-card").first()).toBeAttached();
    expect(await page.getByTestId("product-card").count()).toBe(4);
    for (const id of ["bot-botao", "whatsapp-botao", "depoimentos", "newsletter"]) await expect(page.getByTestId(id), id).toHaveCount(0);
    expect(erros).toEqual([]);
  });

  test("o HTML da home traz o preload do banner (AVIF) e nenhum preload de fonte; não traz dados das outras lojas", async ({ request }) => {
    const html = await (await request.get(ORBITA)).text();
    expect(html).toMatch(/rel="preload"[^>]*as="image"[^>]*banner-m-\d+\.avif/);
    expect(html).not.toMatch(/rel="preload"[^>]*as="font"/);
    for (const termo of ["Pizza Margherita", "Pórtico Inflável", "Vestido Midi Linho", "Fotografia com o Celular"]) expect(html.includes(termo), termo).toBe(false);
  });

  test("categoria lista os produtos e o filtro de voltagem aparece nos acessórios", async ({ page }) => {
    await abrir(page, "/categoria/audio");
    await expect(page.getByTestId("product-card")).toHaveCount(6);
    await abrir(page, "/categoria/acessorios");
    await expect(page.getByTestId("product-card")).toHaveCount(6);
    await expect(page.getByText("Voltagem").first()).toBeVisible();
  });

  test("busca por 'smartwatch' acha os dois relógios e 'xyz' mostra o aviso de nada encontrado", async ({ page }) => {
    await abrir(page, "/busca?q=smartwatch");
    await expect(page.getByTestId("result-count")).toHaveText("2 produtos");
    await expect(page.getByTestId("product-card").first()).toContainText("Smartwatch");
    await abrir(page, "/busca?q=xyzxyz");
    await expect(page.getByTestId("search-empty")).toBeVisible();
  });

  test("produto com especificações como atributos, variações de modelo e cor e 2 fotos", async ({ page }) => {
    await abrir(page, "/produto/fone-orbita-studio-anc");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Fone Órbita Studio ANC");
    await expect(page.getByTestId("product-price")).toHaveText("R$ 1.299,00");
    const detalhes = page.getByRole("region", { name: "Detalhes" }).or(page.locator("section[aria-labelledby=detalhes]"));
    await expect(detalhes).toContainText("Conexão");
    await expect(detalhes).toContainText("Bluetooth 5.3");
    await expect(detalhes).toContainText("Bateria");
    await expect(detalhes).toContainText("40 h");
    await expect(page.getByRole("button", { name: "Lite", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Pro", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Grafite", exact: true })).toBeVisible();
    await abrir(page, "/produto/carregador-orbita-gan-65-w");
    await expect(page.locator("section[aria-labelledby=detalhes]")).toContainText("Bivolt (100–240 V)");
  });
});

test.describe("H2 · compra e troca", () => {
  test("compra até o Pix: produto com variações → carrinho com frete por CEP → checkout → Pix", async ({ page }) => {
    await abrir(page, "/produto/fone-orbita-studio-anc");
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await expect(page.locator("p[role=alert]")).toContainText("Escolha");
    await page.getByRole("button", { name: "Pro", exact: true }).click();
    await page.getByRole("button", { name: "Prata", exact: true }).click();
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await page.getByRole("status").getByRole("link", { name: "Ver carrinho" }).click();
    await expect(page).toHaveURL(/\/orbita\/carrinho$/);
    await page.getByLabel("CEP").fill("01310-100");
    await page.getByRole("button", { name: "Calcular" }).click();
    await page.getByTestId("shipping-options").getByLabel(/Econômico/).check();
    await expect(page.getByTestId("sum-subtotal")).toContainText("1.299,00");
    await expect(page.getByTestId("pix-price")).toContainText("No Pix");
    await page.getByRole("link", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByTestId("steps").getByRole("listitem")).toHaveText([/Identificação/, /Entrega/, /Pagamento/]);
    await page.locator("#chk-name").fill("Ana Souza");
    await page.locator("#chk-email").fill("ana@example.com");
    await page.locator("#chk-phone").fill("11912345678");
    await page.locator("#chk-cpf").fill("529.982.247-25");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.locator("#chk-street").fill("Av. Paulista");
    await page.locator("#chk-number").fill("1000");
    await page.locator("#chk-district").fill("Bela Vista");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByRole("radio", { name: /^Pix/ })).toBeChecked();
    await page.getByTestId("finish").click();
    await expect(page).toHaveURL(/\/orbita\/pedido\/OR-\d+$/);
    await expect(page.getByTestId("order-status")).toHaveText("Aguardando pagamento");
    await expect(page.getByTestId("fake-qr")).toBeVisible();
    await expect(page.getByTestId("pix-code")).toContainText("DEMO");
    await expect(page.getByTestId("order-items")).toContainText("Fone Órbita Studio ANC");
    await expect(page.getByTestId("order-payment")).toHaveText("Pix");
  });

  test("cartão em até 10 parcelas sem juros", async ({ page }) => {
    await abrir(page, "/produto/smartwatch-orbita-s-pro");
    await page.getByRole("button", { name: "45mm", exact: true }).click();
    await page.getByRole("button", { name: "Prata", exact: true }).click();
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await abrir(page, "/carrinho");
    await page.getByLabel("CEP").fill("01310-100");
    await page.getByRole("button", { name: "Calcular" }).click();
    await page.getByTestId("shipping-options").getByLabel(/Econômico/).check();
    await page.getByRole("link", { name: "Continuar" }).click();
    await page.locator("#chk-name").fill("Ana Souza");
    await page.locator("#chk-email").fill("ana@example.com");
    await page.locator("#chk-phone").fill("11912345678");
    await page.locator("#chk-cpf").fill("529.982.247-25");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.locator("#chk-street").fill("Av. Paulista");
    await page.locator("#chk-number").fill("1000");
    await page.locator("#chk-district").fill("Bela Vista");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("radio", { name: "Cartão de crédito" }).check();
    await expect(page.locator("#chk-installments option")).toHaveCount(10);
    await page.locator("#chk-cardNumber").fill("4111111111111111");
    await page.locator("#chk-cardName").fill("ANA SOUZA");
    await page.locator("#chk-cardExpiry").fill("1230");
    await page.locator("#chk-cardCvv").fill("123");
    await page.locator("#chk-installments").selectOption("10");
    await page.getByTestId("finish").click();
    await expect(page).toHaveURL(/\/orbita\/pedido\/OR-\d+$/);
    await expect(page.getByTestId("order-payment")).toContainText("Cartão de crédito");
    expect(await page.evaluate(() => window.__demoStore!.getState().orders[0].payment.installments)).toBe(10);
  });

  test("troca: o prazo de 90 dias (bem durável, CDC art. 26) aparece em Trocas e devoluções e o arrependimento de 7 dias na página do produto", async ({ page }) => {
    await abrir(page, "/produto/fone-orbita-air");
    await expect(page.getByText(/Direito de arrependimento: você pode desistir da compra em até 7 dias/)).toBeVisible();
    await abrir(page, "/trocas-e-devolucoes");
    await expect(page.getByText(/avise em até 90 dias/)).toBeVisible();
    expect(await page.evaluate(() => window.__demoStore!.getState().config.policies.defect.days)).toBe(90);
  });
});

test.describe("H3 · outras lojas, painel e celular", () => {
  test("painel Demo lista as lojas, e a Órbita não aparece no JS nem no HTML das outras", async ({ page, request }) => {
    await abrir(page);
    await page.getByRole("button", { name: "Demo", exact: true }).click();
    await expect(page.getByRole("list", { name: "Lojas da demonstração" }).getByRole("listitem")).toHaveText(["Trama Studio", "Forno da Vila", "Arca Infláveis", "Faísca", "Órbita"]);
    for (const slug of ["trama", "forno", "arca", "faisca"]) {
      const html = await (await request.get(`${ORIGIN}/${slug}`)).text();
      for (const termo of ["Fone Órbita Studio ANC", "ORB-FST", "Órbita Eletrônicos"]) expect(html.includes(termo), `${slug}: ${termo}`).toBe(false);
    }
  });

  test("painel: o tema escuro da Órbita troca de cor principal, salva e continua depois de recarregar", async ({ page }) => {
    const erros: string[] = [];
    page.on("console", (m) => m.type() === "error" && erros.push(m.text()));
    page.on("pageerror", (e) => erros.push(e.message));
    await abrir(page, "/painel/configuracoes/tema");
    expect(await rootVar(page, "--t-color-primary")).toBe("#8ab4ff");
    await page.getByTestId("tema-principal").getByText("Menta", { exact: true }).click();
    await page.getByTestId("tema-salvar").click();
    await expect(page.getByTestId("tema-status")).toContainText("Tema salvo");
    await abrir(page, "/painel/configuracoes/tema");
    expect(await rootVar(page, "--t-color-primary")).toBe("#7ee0c3");
    await abrir(page, "/painel/configuracoes/modulos");
    await expect(page.getByTestId("modulo-bot").getByRole("switch")).toHaveAttribute("aria-checked", "false");
    await abrir(page, "/painel/produtos");
    await expect(page.getByTestId("product-row")).toHaveCount(16);
    expect(erros).toEqual([]);
  });

  test.describe("celular de 400 px", () => {
    test.use(MOBILE);
    test("home, categoria, produto e carrinho sem rolagem horizontal", async ({ page }) => {
      for (const rota of ["", "/categoria/audio", "/produto/fone-orbita-studio-anc", "/carrinho"]) {
        await abrir(page, rota);
        await page.waitForTimeout(500);
        expect(await overflowOf(page), rota || "home").toBeLessThanOrEqual(0);
      }
    });
  });
});
