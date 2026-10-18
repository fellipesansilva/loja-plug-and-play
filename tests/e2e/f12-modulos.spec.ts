import { type Page } from "@playwright/test";
import { test, expect, currentPreset, SHORT, TRAMA } from "./helpers";
import { ready } from "./painel-helpers";

// F6 · módulos do diferencial: bot, WhatsApp, depoimentos e newsletter. A Trama liga os quatro por padrão (e traz os textos e os dados);
// Forno e Arca não ligam nenhum. Os testes ligam e desligam pelo painel (a mesma configuração salva da F5) e conferem a vitrine.
const slug = () => SHORT[currentPreset()];
const PRODUTO = "/produto/vestido-midi-linho";

async function desligar(page: Page) {
  await ready(page, "/");
  await page.evaluate(() => {
    const st = window.__demoStore!.getState();
    st.saveOverrides({ ...st.overrides, modules: { ...st.config.modules, bot: false, whatsapp: false, depoimentos: false, newsletter: false } });
  });
}
async function ligar(page: Page, keys: ("bot" | "whatsapp" | "depoimentos" | "newsletter")[]) {
  await ready(page, "/");
  await page.evaluate((ks) => {
    const st = window.__demoStore!.getState();
    const modules = { ...st.config.modules };
    for (const k of ks) modules[k] = true;
    st.saveOverrides({ ...st.overrides, modules });
  }, keys);
}
const jsUrls = (page: Page, into: Set<string>) => page.on("request", (r) => /\/_next\/static\/.*\.js/.test(r.url()) && into.add(new URL(r.url()).pathname));
const watchErrors = (page: Page) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
};
const overlap = (a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

test.describe("estado padrão dos presets", () => {
  test("Trama liga os quatro módulos por padrão; Forno não liga nenhum (navegador limpo, sem erro de console)", async ({ page }) => {
    const errors = watchErrors(page);
    const trama = currentPreset() === TRAMA;
    await ready(page, "/");
    await page.waitForTimeout(1500); // depois do portão da foto principal
    await expect(page.getByTestId("bot-botao")).toHaveCount(trama ? 1 : 0);
    await expect(page.getByTestId("whatsapp-botao")).toHaveCount(trama ? 1 : 0);
    await expect(page.getByTestId("depoimentos")).toHaveCount(trama ? 1 : 0);
    await expect(page.getByTestId("newsletter")).toHaveCount(trama ? 1 : 0);
    await expect(page.getByTestId("extras-dock")).toHaveCount(trama ? 1 : 0);
    expect(errors).toEqual([]);
  });

  test("Arca (endereço completo) segue sem módulos", async ({ page }) => {
    test.skip(currentPreset() !== TRAMA, "Roda uma vez (projeto trama)");
    await page.addInitScript(() => localStorage.setItem("loja-consent-v1-arca", JSON.stringify({ choice: "rejected", at: "2026-01-01T00:00:00.000Z", version: "1" })));
    await page.goto("http://localhost:3411/arca", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    for (const id of ["bot-botao", "whatsapp-botao", "depoimentos", "newsletter", "extras-dock"]) await expect(page.getByTestId(id)).toHaveCount(0);
  });

  test("desligados pelo painel, nada aparece na Trama e nenhum arquivo dos módulos é baixado; ligados, os arquivos novos aparecem depois da foto principal", async ({ page }) => {
    test.skip(currentPreset() !== TRAMA, "A Trama é quem traz os dados dos módulos");
    await desligar(page);
    const off = new Set<string>();
    jsUrls(page, off);
    for (const route of ["/", PRODUTO, "/carrinho"]) {
      await ready(page, route);
      await page.waitForTimeout(1200);
      for (const id of ["bot-botao", "whatsapp-botao", "depoimentos", "newsletter", "extras-dock"]) await expect(page.getByTestId(id), `${route} ${id}`).toHaveCount(0);
    }
    expect(off.size).toBeGreaterThan(5);
    page.removeAllListeners("request");
    await ligar(page, ["bot", "whatsapp", "depoimentos", "newsletter"]);
    const on = new Set<string>();
    jsUrls(page, on);
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByTestId("bot-botao")).toBeVisible();
    const novos = [...on].filter((u) => !off.has(u));
    expect(novos.length, `arquivos só dos módulos: ${novos.join(", ")}`).toBeGreaterThanOrEqual(4); // bot, WhatsApp, depoimentos, newsletter
    for (const u of off) expect(novos.includes(u)).toBe(false);
  });

  test("quem já tem configuração salva da Trama mantém o que salvou (módulos desligados ficam desligados depois de recarregar)", async ({ page }) => {
    test.skip(currentPreset() !== TRAMA, "A Trama é quem traz os dados dos módulos");
    await desligar(page);
    await ready(page, "/");
    await page.waitForTimeout(1200);
    await expect(page.getByTestId("bot-botao")).toHaveCount(0);
    await expect(page.getByTestId("depoimentos")).toHaveCount(0);
  });
});

test.describe("módulos ligados (Trama)", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.preset !== TRAMA, "A Trama é quem traz os dados dos módulos");
  });

  test("bot: abre com a marca Simulação, responde um tema e responde fora do repertório com a oferta do WhatsApp", async ({ page }) => {
    const errors = watchErrors(page);
    await ligar(page, ["bot", "whatsapp"]);
    await ready(page, "/");
    await page.getByTestId("bot-botao").click();
    const janela = page.getByTestId("bot-janela");
    await expect(janela).toBeVisible();
    await expect(page.getByTestId("bot-marca")).toHaveText("Simulação");
    await expect(page.getByTestId("bot-msg-bot")).toContainText("atendimento simulado");
    // tema por clique
    await page.getByTestId("bot-tema-prazo").click();
    await expect(page.getByTestId("bot-msg-bot").last()).toContainText("dias úteis");
    // pergunta escrita dentro do repertório
    await page.locator("#bot-pergunta").fill("Posso pagar com pix?");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("bot-msg-bot").last()).toContainText("Pix");
    // fora do repertório: resposta fixa + oferta do WhatsApp
    await page.locator("#bot-pergunta").fill("vocês vendem geladeira?");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("bot-msg-bot").last()).toContainText("Ainda não sei responder");
    await expect(page.getByTestId("bot-oferta-whatsapp")).toBeVisible();
    await page.getByTestId("bot-oferta-whatsapp").click();
    await expect(page.getByTestId("whatsapp-painel")).toBeVisible();
    await expect(page.getByTestId("bot-janela")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("WhatsApp: botão aparece, não cobre o carrinho nem o botão de comprar; a mensagem traz o produto; a demo mostra para copiar", async ({ page }) => {
    const errors = watchErrors(page);
    await ligar(page, ["bot", "whatsapp"]);
    for (const size of [{ width: 400, height: 800 }, { width: 1280, height: 900 }]) {
      await page.setViewportSize(size);
      await ready(page, PRODUTO);
      await expect(page.getByTestId("whatsapp-botao")).toBeVisible();
      const whats = (await page.getByTestId("whatsapp-botao").boundingBox())!;
      const bot = (await page.getByTestId("bot-botao").boundingBox())!;
      const cart = (await page.getByRole("link", { name: /^Carrinho/ }).boundingBox())!;
      const buy = page.getByRole("button", { name: /Adicionar ao carrinho/ });
      for (const [nome, caixa] of [["botão do atendimento", bot], ["carrinho do cabeçalho", cart]] as const) expect(overlap(whats, caixa), `${size.width}px: WhatsApp x ${nome}`).toBe(false);
      if (await buy.count()) expect(overlap(whats, (await buy.first().boundingBox())!), `${size.width}px: WhatsApp x comprar`).toBe(false);
      const demo = page.getByRole("button", { name: /^Demo$/ });
      if (await demo.count()) expect(overlap(whats, (await demo.boundingBox())!), `${size.width}px: WhatsApp x Demo`).toBe(false);
    }
    await page.getByTestId("whatsapp-botao").click();
    await expect(page.getByTestId("whatsapp-marca")).toHaveText("Demonstração");
    await expect(page.getByTestId("whatsapp-mensagem")).toHaveValue("Olá! Tenho interesse em Vestido Midi Linho da Trama Studio. Podem me ajudar?");
    await expect(page.getByRole("link", { name: /WhatsApp/ })).toHaveCount(0); // demo: nada abre o WhatsApp
    await page.getByTestId("whatsapp-copiar").click();
    await expect(page.getByTestId("whatsapp-status")).toHaveText("Mensagem copiada");
    // fora de uma página de produto, a saudação
    await ready(page, "/");
    await page.getByTestId("whatsapp-botao").click();
    await expect(page.getByTestId("whatsapp-mensagem")).toHaveValue("Olá! Gostaria de falar com a Trama Studio.");
    expect(errors).toEqual([]);
  });

  test("depoimentos: aparecem na home com a marca de demonstração em cada um, sem salto de layout", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((l) => {
        for (const e of l.getEntries() as (PerformanceEntry & { hadRecentInput: boolean; value: number })[]) if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    await ligar(page, ["depoimentos"]);
    await ready(page, "/");
    const itens = page.getByTestId("depoimento");
    await expect(itens).toHaveCount(4);
    const marcas = page.getByTestId("depoimento-marca");
    await expect(marcas).toHaveCount(4);
    for (let i = 0; i < 4; i++) await expect(marcas.nth(i)).toHaveText("Depoimento de demonstração");
    await expect(page.getByTestId("depoimentos")).toContainText("fictícios");
    await expect(page.getByTestId("depoimentos-reservado")).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThan(0.01);
  });

  test("newsletter: consentimento nasce desmarcado; sem ele o envio é recusado; com ele confirma e guarda só no navegador", async ({ page }) => {
    await ligar(page, ["newsletter"]);
    await ready(page, "/");
    const box = page.getByTestId("newsletter");
    await expect(box).toBeVisible();
    await expect(page.getByTestId("newsletter-marca")).toHaveText("Demonstração");
    await expect(box.getByRole("link", { name: "Política de Privacidade" })).toHaveAttribute("href", `/${slug()}/privacidade`);
    const consent = page.getByTestId("newsletter-consentimento");
    await expect(consent).not.toBeChecked();
    await box.getByLabel("Seu e-mail").fill("ana@example.com");
    await box.getByRole("button", { name: "Quero receber" }).click();
    await expect(page.getByTestId("newsletter-erro")).toContainText("marque a caixa de consentimento");
    await expect(page.getByTestId("newsletter-confirmacao")).toHaveCount(0);
    expect(await page.evaluate((k) => localStorage.getItem(k), `loja-newsletter-v1-${slug()}`)).toBeNull();
    // e-mail inválido
    await box.getByLabel("Seu e-mail").fill("ana");
    await consent.check();
    await box.getByRole("button", { name: "Quero receber" }).click();
    await expect(page.getByTestId("newsletter-erro")).toContainText("e-mail válido");
    // com consentimento
    await box.getByLabel("Seu e-mail").fill("ana@example.com");
    await box.getByRole("button", { name: "Quero receber" }).click();
    await expect(page.getByTestId("newsletter-confirmacao")).toContainText("demonstração");
    await expect(page.getByTestId("newsletter-erro")).toHaveCount(0);
    const saved = JSON.parse((await page.evaluate((k) => localStorage.getItem(k), `loja-newsletter-v1-${slug()}`))!);
    expect(saved.map((x: { email: string }) => x.email)).toEqual(["ana@example.com"]);
    await expect(consent).not.toBeChecked(); // volta desmarcada
  });
});

test.describe("painel da F5 · Configurações › Módulos", () => {
  test("os quatro módulos novos aparecem: ligados na Trama, desligados nos demais presets", async ({ page }) => {
    const esperado = currentPreset() === TRAMA ? "true" : "false";
    await ready(page, "/painel/configuracoes/modulos");
    for (const k of ["bot", "whatsapp", "depoimentos", "newsletter"]) {
      await expect(page.getByTestId(`modulo-${k}`)).toBeVisible();
      await expect(page.getByTestId(`modulo-${k}`).getByRole("switch")).toHaveAttribute("aria-checked", esperado);
    }
    await expect(page.getByTestId("modulo-bot")).toContainText("Depende de: WhatsApp.");
    await expect(page.getByTestId("modulo-whatsapp")).toContainText("Usado por: Atendimento simulado (bot).");
  });

  test("dependência bot → WhatsApp: desligar o WhatsApp desliga o bot; ligar o bot liga o WhatsApp junto; salvar vale na loja", async ({ page }) => {
    test.skip(currentPreset() !== TRAMA, "Só a Trama traz os dados dos módulos (no Forno a validação do build recusa)");
    await ready(page, "/painel/configuracoes/modulos");
    const sw = (k: string) => page.getByTestId(`modulo-${k}`).getByRole("switch");
    await expect(sw("bot")).toHaveAttribute("aria-checked", "true");
    await sw("whatsapp").click();
    await expect(sw("whatsapp")).toHaveAttribute("aria-checked", "false");
    await expect(sw("bot")).toHaveAttribute("aria-checked", "false");
    await expect(page.getByTestId("modulos-avisos")).toContainText("Atendimento simulado (bot) foi desligado junto: depende de WhatsApp.");
    await sw("bot").click();
    await expect(sw("bot")).toHaveAttribute("aria-checked", "true");
    await expect(sw("whatsapp")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("modulos-avisos")).toContainText("WhatsApp foi ligado junto: Atendimento simulado (bot) depende dele.");
    // desliga tudo, salva e confere a loja; depois liga de novo
    for (const k of ["depoimentos", "newsletter", "whatsapp"]) await sw(k).click();
    await expect(sw("bot")).toHaveAttribute("aria-checked", "false");
    await page.getByTestId("modulos-salvar").click();
    await expect(page.getByTestId("modulos-status")).toContainText("Módulos salvos");
    await ready(page, "/");
    await page.waitForTimeout(1200);
    for (const id of ["bot-botao", "whatsapp-botao", "depoimentos", "newsletter"]) await expect(page.getByTestId(id)).toHaveCount(0);
    await ready(page, "/painel/configuracoes/modulos");
    await sw("bot").click();
    await sw("depoimentos").click();
    await sw("newsletter").click();
    await page.getByTestId("modulos-salvar").click();
    await expect(page.getByTestId("modulos-status")).toContainText("Módulos salvos");
    await ready(page, "/");
    await expect(page.getByTestId("bot-botao")).toBeVisible();
    await expect(page.getByTestId("whatsapp-botao")).toBeVisible();
  });

  test("preset sem os textos de um módulo: a validação do build recusa ligar (Forno)", async ({ page }) => {
    test.skip(currentPreset() === TRAMA, "A Trama traz os dados; o Forno não");
    await ready(page, "/painel/configuracoes/modulos");
    await page.getByTestId("modulo-newsletter").getByRole("switch").click();
    await expect(page.getByTestId("modulos-erro")).toContainText("validação do build");
    await expect(page.getByTestId("modulo-newsletter").getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });
});
