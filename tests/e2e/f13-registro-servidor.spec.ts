import fs from "node:fs";
import path from "node:path";
import { type Page } from "@playwright/test";
import { test, expect, ORIGIN, TRAMA } from "./helpers";

// Registro de presets por servidor: cada loja recebe só os dados do próprio preset (props do layout, no HTML); o JavaScript não leva os
// dados de nenhum preset. Estes testes conferem (1) o JS servido, (2) que o estado salvo no navegador pela versão anterior (fixtures
// geradas na main 0544250) continua valendo e (3) "Resetar dados". Rodam uma vez (projeto trama), com endereços completos.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.metadata.preset !== TRAMA, "Roda uma vez (projeto trama)");
});

const fixture = (nome: string): Record<string, string> => JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "tests/fixtures/estado-salvo", `${nome}.json`), "utf8"));

/** Grava o estado salvo (uma vez por aba: o "Resetar dados" apaga as chaves e a recarga não pode gravá-las de novo). */
async function semear(page: Page, estado: Record<string, string>) {
  await page.addInitScript((e) => {
    if (sessionStorage.getItem("__semeado")) return;
    sessionStorage.setItem("__semeado", "1");
    for (const [k, v] of Object.entries(e)) localStorage.setItem(k, v);
  }, estado);
}
const abrir = async (page: Page, url: string) => {
  await page.goto(`${ORIGIN}${url}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => !!window.__demoStore);
};
const rootVar = (page: Page, n: string) => page.evaluate((v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim(), n);
async function resetar(page: Page) {
  await page.getByRole("button", { name: "Demo", exact: true }).click();
  await page.getByRole("button", { name: "Resetar dados" }).click();
}

test.describe("o JavaScript não leva dados de preset", () => {
  test("nenhum JS servido em /trama, /forno e /arca contém dados de preset (nome de produto, razão social, textos)", async ({ page, request }) => {
    const termos = ["Pizza Margherita", "Vestido Midi Linho", "Pórtico Inflável", "Reservatório Flexível", "Bolo Vulcão", "Calça Alfaiataria", "Trama Studio Comércio", "Forno da Vila Alimentos", "Arca Infláveis Indústria", "contato@trama.example"];
    for (const slug of ["trama", "forno", "arca"]) {
      const js = new Set<string>();
      page.on("response", (r) => /\/_next\/static\/.*\.js$/.test(r.url()) && js.add(r.url()));
      await page.goto(`${ORIGIN}/${slug}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1200);
      expect(js.size).toBeGreaterThan(8);
      for (const u of js) {
        const text = await (await request.get(u)).text();
        for (const t of termos) expect(text.includes(t), `${slug}: ${new URL(u).pathname.split("/").pop()} contém "${t}"`).toBe(false);
      }
      // e o HTML da própria loja tem os dados dela (vieram do servidor)
      const html = await (await request.get(`${ORIGIN}/${slug}`)).text();
      expect(html).toContain({ trama: "Trama Studio", forno: "Forno da Vila", arca: "Arca Infláveis" }[slug]!);
      page.removeAllListeners("response");
    }
  });

  test("o HTML de uma loja não leva os produtos de outra", async ({ request }) => {
    const trama = await (await request.get(`${ORIGIN}/trama`)).text();
    for (const t of ["Pizza Margherita", "Pórtico Inflável", "FV-001", "ARC-"]) expect(trama.includes(t), t).toBe(false);
    const forno = await (await request.get(`${ORIGIN}/forno`)).text();
    for (const t of ["Vestido Midi Linho", "Pórtico Inflável", "TS-VML"]) expect(forno.includes(t), t).toBe(false);
  });
});

test.describe("estado salvo antes da mudança continua valendo", () => {
  test("Trama: carrinho, tema, módulos e prazo de troca salvos continuam; Resetar dados volta ao padrão do preset", async ({ page }) => {
    const erros: string[] = [];
    page.on("console", (m) => m.type() === "error" && erros.push(m.text()));
    page.on("pageerror", (e) => erros.push(e.message));
    await semear(page, fixture("trama"));
    await abrir(page, "/trama");
    await page.waitForTimeout(1500);
    await expect(page.getByTestId("cart-count")).toHaveText("1");
    expect(await rootVar(page, "--t-color-primary")).toBe("#2f3430"); // tema salvo no painel
    await expect(page.getByTestId("bot-botao")).toHaveCount(1); // módulos salvos: bot e WhatsApp ligados
    await expect(page.getByTestId("whatsapp-botao")).toHaveCount(1);
    await expect(page.getByTestId("newsletter")).toHaveCount(0); // desligados no painel antes da mudança
    await expect(page.getByTestId("depoimentos")).toHaveCount(0);
    expect(await page.evaluate(() => window.__demoStore!.getState().config.policies.defect.days)).toBe(120);
    // o painel mostra o que foi salvo
    await abrir(page, "/trama/painel/configuracoes/loja");
    await expect(page.locator("#loja-defectDays")).toHaveValue("120");
    await abrir(page, "/trama/painel/configuracoes/modulos");
    await expect(page.getByTestId("modulo-newsletter").getByRole("switch")).toHaveAttribute("aria-checked", "false");
    await expect(page.getByTestId("modulo-bot").getByRole("switch")).toHaveAttribute("aria-checked", "true");
    await abrir(page, "/trama/painel/configuracoes/tema");
    await expect(page.getByTestId("tema-principal").locator('input[value="grafite"]')).toBeChecked();
    // carrinho da loja
    await abrir(page, "/trama/carrinho");
    await expect(page.getByTestId("cart-line")).toHaveCount(1);
    // Resetar dados: volta ao padrão do preset (tema, módulos, carrinho e a chave da configuração)
    await resetar(page);
    await expect(page.getByTestId("cart-line")).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("loja-config-v1-trama"))).toBeNull();
    await abrir(page, "/trama");
    await page.waitForTimeout(1500);
    expect(await rootVar(page, "--t-color-primary")).toBe("#4b5340");
    for (const id of ["bot-botao", "whatsapp-botao", "depoimentos", "newsletter"]) await expect(page.getByTestId(id), id).toHaveCount(1);
    expect(await page.evaluate(() => window.__demoStore!.getState().config.policies.defect.days)).toBe(90);
    expect(erros).toEqual([]);
  });

  test("Forno: carrinho com adicional salvo continua; Resetar dados esvazia", async ({ page }) => {
    await semear(page, fixture("forno"));
    await abrir(page, "/forno/carrinho");
    await expect(page.getByTestId("cart-line")).toHaveCount(1);
    await expect(page.getByTestId("line-qty")).toHaveText("2");
    await resetar(page);
    await expect(page.getByTestId("cart-line")).toHaveCount(0);
  });

  test("Arca: lista de orçamento salva continua; Resetar dados esvazia", async ({ page }) => {
    await semear(page, fixture("arca"));
    await abrir(page, "/arca/orcamento");
    expect(await page.evaluate(() => window.__demoStore!.getState().quoteList.map((i) => i.qty))).toEqual([2]);
    await resetar(page);
    expect(await page.evaluate(() => window.__demoStore!.getState().quoteList.length)).toBe(0);
  });
});

test.describe("troca de loja pelo botão Demo", () => {
  test("trocar de Trama para Forno e voltar entrega os dados de cada loja (estado separado, sem erro)", async ({ page }) => {
    const erros: string[] = [];
    page.on("console", (m) => m.type() === "error" && erros.push(m.text()));
    page.on("pageerror", (e) => erros.push(e.message));
    await abrir(page, "/trama");
    await page.getByRole("button", { name: "Demo", exact: true }).click();
    await page.getByRole("list", { name: "Lojas da demonstração" }).getByRole("link", { name: "Forno da Vila" }).click();
    await expect(page).toHaveURL(/\/forno$/);
    await expect(page.getByTestId("announcement-bar")).toContainText("Retire na loja");
    expect(await page.evaluate(() => window.__demoStore!.getState().presetId)).toBe("forno-da-vila");
    await page.getByRole("button", { name: "Demo", exact: true }).click();
    await page.getByRole("list", { name: "Lojas da demonstração" }).getByRole("link", { name: "Trama Studio" }).click();
    await expect(page).toHaveURL(/\/trama$/);
    expect(await page.evaluate(() => window.__demoStore!.getState().presetId)).toBe("trama-studio");
    await expect(page.getByTestId("announcement-bar")).toContainText("Frete grátis");
    expect(erros).toEqual([]);
  });
});
