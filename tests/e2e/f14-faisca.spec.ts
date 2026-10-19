import { type Page } from "@playwright/test";
import { test, expect, ORIGIN, TRAMA } from "./helpers";
import { MOBILE, overflowOf } from "./painel-helpers";

// Faísca: loja de cursos com área do aluno simulada no navegador (módulo `cursos`). Os testes rodam uma vez (projeto trama), com
// endereços completos (/faisca/...), como os da Arca.
test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.metadata.preset !== TRAMA, "A Faísca roda uma vez (projeto trama)");
  await page.addInitScript(() => {
    try {
      if (!localStorage.getItem("loja-consent-v1-faisca")) {
        localStorage.setItem("loja-consent-v1-faisca", JSON.stringify({ choice: "rejected", at: "2026-01-01T00:00:00.000Z", version: "1" }));
      }
    } catch {}
  });
});

const FAISCA = `${ORIGIN}/faisca`;
const FOTO = "fotografia-com-o-celular";
const DESENHO = "desenho-do-zero";
const AULAS_FOTO = ["luz", "enquadramento", "ajustes", "composicao", "edicao", "projeto"];

async function abrir(page: Page, route = "") {
  await page.goto(`${FAISCA}${route}`);
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => !!window.__demoStore);
}
const state = (page: Page) =>
  page.evaluate(() => {
    const s = window.__demoStore!.getState();
    return { orders: s.orders, progress: s.progress, cart: s.cart };
  });

async function identificar(page: Page) {
  await page.locator("#chk-name").fill("Ana Souza");
  await page.locator("#chk-email").fill("ana@example.com");
  await page.locator("#chk-cpf").fill("529.982.247-25");
  await page.getByRole("button", { name: "Continuar" }).click();
}

/** Compra o curso pelo site (produto → carrinho → checkout em 2 etapas) e devolve o número do pedido. Pix por padrão. */
async function comprar(page: Page, slug: string, pagamento: "pix" | "recusado" = "pix"): Promise<string | null> {
  await abrir(page, `/produto/${slug}`);
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await abrir(page, "/carrinho");
  await page.getByRole("link", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await identificar(page);
  if (pagamento === "recusado") {
    await page.getByRole("radio", { name: "Cartão de crédito" }).check();
    await page.locator("#chk-cardNumber").fill("5555555555554444");
    await page.locator("#chk-cardName").fill("ANA SOUZA");
    await page.locator("#chk-cardExpiry").fill("1230");
    await page.locator("#chk-cardCvv").fill("7381");
    await page.getByTestId("finish").click();
    return null;
  }
  await page.getByTestId("finish").click();
  await expect(page).toHaveURL(/\/pedido\/FS-\d+$/);
  return page.url().split("/").pop()!;
}

async function demo(page: Page, botao: "Simular pagamento aprovado" | "Simular pagamento recusado" | "Resetar dados") {
  await page.getByRole("button", { name: "Demo", exact: true }).click();
  await page.getByRole("button", { name: botao }).click();
}

test.describe("H1 · vitrine", () => {
  test("home com 6 a 8 cursos, banner da loja e menu com Meus cursos; sem erro de console", async ({ page }) => {
    const erros: string[] = [];
    page.on("console", (m) => m.type() === "error" && erros.push(m.text()));
    page.on("pageerror", (e) => erros.push(e.message));
    await abrir(page);
    await expect(page.getByTestId("store-name")).toHaveAccessibleName("Faísca");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Acenda uma ideia nova esta semana");
    await expect(page.getByTestId("product-card").first()).toBeAttached();
    const n = await page.getByTestId("product-card").count();
    expect(n).toBeGreaterThanOrEqual(6);
    expect(n).toBeLessThanOrEqual(8);
    await expect(page.getByRole("navigation", { name: "Menu principal" }).getByRole("link", { name: "Meus cursos" })).toBeVisible();
    expect(erros).toEqual([]);
  });

  test("o HTML da home traz o banner com preload dos recortes AVIF; JS e HTML não trazem dados das outras lojas", async ({ request }) => {
    const html = await (await request.get(FAISCA)).text();
    expect(html).toMatch(/rel="preload"[^>]*as="image"[^>]*banner-m-\d+\.avif/);
    for (const termo of ["Pizza Margherita", "Pórtico Inflável", "Vestido Midi Linho"]) expect(html.includes(termo), termo).toBe(false);
  });

  test("catálogo por categoria e filtro de nível", async ({ page }) => {
    await abrir(page, "/categoria/tecnologia");
    await expect(page.getByTestId("product-card")).toHaveCount(2);
    await abrir(page, "/categoria/criatividade");
    await expect(page.getByTestId("product-card")).toHaveCount(3);
  });

  test("página do curso: ementa com aulas, instrutor fictício, carga horária e preço; sem frete", async ({ page }) => {
    await abrir(page, `/produto/${FOTO}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Fotografia com o Celular");
    await expect(page.getByTestId("product-price")).toHaveText("R$ 129,00");
    await expect(page.getByTestId("course-syllabus")).toBeVisible();
    await expect(page.getByTestId("course-instructor")).toContainText("Helena Marques");
    await expect(page.getByTestId("course-instructor")).toContainText("fictícia");
    await expect(page.getByTestId("course-workload")).toHaveText("2 h 7 min · 6 aulas");
    await expect(page.getByTestId("course-lessons").getByRole("listitem")).toHaveCount(6);
    await expect(page.getByText(/calcular frete|CEP/i)).toHaveCount(0);
    await expect(page.getByTestId("course-access")).toHaveCount(0); // ainda não comprou
  });

  test("checkout sem frete nem endereço: 2 etapas (identificação e pagamento)", async ({ page }) => {
    await abrir(page, `/produto/${FOTO}`);
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await abrir(page, "/carrinho");
    await expect(page.getByTestId("shipping-options")).toHaveCount(0);
    await page.getByRole("link", { name: "Continuar" }).click();
    await expect(page.getByTestId("steps").getByRole("listitem")).toHaveText([/Identificação/, /Pagamento/]);
    await expect(page.locator("#chk-cep, #chk-street")).toHaveCount(0);
    await identificar(page);
    await expect(page.getByRole("radio", { name: /^Pix/ })).toBeChecked();
    await expect(page.getByTestId("finish")).toHaveText(/Finalizar pedido · R\$\s122,55/); // 129,00 − 5% no Pix
  });
});

test.describe("H2 · acesso depois do pagamento", () => {
  test("Pix aguardando: confirmação sem 'Acessar curso' e Meus cursos bloqueado com o motivo; aprovado libera", async ({ page }) => {
    const pedido = await comprar(page, FOTO);
    expect(pedido).toBe("FS-1001");
    await expect(page.getByTestId("order-status")).toHaveText("Aguardando pagamento");
    await expect(page.getByTestId("pix-panel")).toBeVisible();
    await expect(page.getByTestId("course-access")).toHaveCount(0);
    await expect(page.getByTestId("order-course-locked")).toContainText("ainda não foi aprovado");

    await abrir(page, "/meus-cursos");
    await expect(page.getByTestId("my-course")).toHaveCount(1);
    await expect(page.getByTestId("my-course")).toHaveAttribute("data-status", "aguardando");
    await expect(page.getByTestId("course-locked-reason")).toHaveText("Curso bloqueado: o pagamento do pedido FS-1001 ainda não foi aprovado.");
    await expect(page.getByTestId("course-access")).toHaveCount(0);

    // a página do curso e a da aula também não abrem o conteúdo
    await abrir(page, `/meus-cursos/${FOTO}`);
    await expect(page.getByTestId("course-locked-reason")).toContainText("FS-1001");
    await expect(page.getByTestId("lesson-list")).toHaveCount(0);
    await abrir(page, `/meus-cursos/${FOTO}/aula/luz`);
    await expect(page.getByTestId("course-locked")).toBeVisible();
    await expect(page.getByTestId("lesson-complete")).toHaveCount(0);

    // pagamento aprovado: a confirmação mostra "Acessar curso"
    await abrir(page, `/pedido/${pedido}`);
    await demo(page, "Simular pagamento aprovado");
    await expect(page.getByTestId("order-status")).toHaveText("Pago");
    await expect(page.getByTestId("order-course-access")).toBeVisible();
    await expect(page.getByTestId("course-access")).toHaveText("Acessar curso");
    await page.getByTestId("course-access").click();
    await expect(page).toHaveURL(new RegExp(`/faisca/meus-cursos/${FOTO}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Fotografia com o Celular");
  });

  test("pagamento recusado: cartão recusado não cria pedido nem libera curso; pedido recusado pelo Demo bloqueia com o motivo", async ({ page }) => {
    await comprar(page, DESENHO, "recusado");
    await expect(page.getByText("Cartão recusado (demonstração)")).toBeVisible();
    await expect(page).toHaveURL(/\/checkout$/);
    expect((await state(page)).orders).toHaveLength(0);
    await abrir(page, "/meus-cursos");
    await expect(page.getByTestId("my-courses-empty")).toBeVisible();
    // o curso segue no carrinho depois da recusa; esvazia para comprar só outro curso
    await page.evaluate(() => {
      const st = window.__demoStore!.getState();
      for (const l of st.cart) st.removeLine(l.lineId);
    });

    const pedido = await comprar(page, FOTO);
    await demo(page, "Simular pagamento recusado");
    await expect(page.getByTestId("order-status")).toHaveText("Cancelado");
    await expect(page.getByTestId("order-course-locked")).toContainText("cancelado ou o pagamento não foi aprovado");
    await abrir(page, "/meus-cursos");
    await expect(page.getByTestId("my-course")).toHaveAttribute("data-status", "cancelado");
    await expect(page.getByTestId("course-locked-reason")).toContainText(`${pedido}`);
    await expect(page.getByTestId("course-locked-reason")).toContainText("cancelado");
    await abrir(page, `/meus-cursos/${FOTO}/aula/luz`);
    await expect(page.getByTestId("lesson-complete")).toHaveCount(0);
    expect((await state(page)).progress).toEqual({});
  });

  test("pago → entregue (regra do produto digital): o acesso e o progresso continuam", async ({ page }) => {
    const pedido = await comprar(page, FOTO);
    await demo(page, "Simular pagamento aprovado");
    await abrir(page, `/meus-cursos/${FOTO}/aula/luz`);
    await page.getByTestId("lesson-complete").click();
    await expect(page.getByTestId("lesson-complete")).toBeDisabled();
    await abrir(page, `/painel/pedidos/${pedido}`);
    await page.getByTestId("status-to-entregue").click();
    await expect(page.getByTestId("detail-status")).toHaveText("Entregue");
    await abrir(page, "/meus-cursos");
    await expect(page.getByTestId("my-course")).toHaveAttribute("data-status", "liberado");
    await expect(page.getByTestId("course-progress")).toHaveText("17%");
  });
});

test.describe("H3 · área do aluno", () => {
  test("Meus cursos lista só o que foi comprado neste navegador", async ({ page }) => {
    await abrir(page, "/meus-cursos");
    await expect(page.getByTestId("my-courses-empty")).toBeVisible();
    await comprar(page, FOTO);
    await demo(page, "Simular pagamento aprovado");
    await abrir(page, "/meus-cursos");
    await expect(page.getByTestId("my-course")).toHaveCount(1);
    await expect(page.getByTestId("my-course")).toContainText("Fotografia com o Celular");
    await expect(page.getByTestId("my-course")).not.toContainText("Desenho do Zero");
  });

  test("curso, aula e progresso: concluir aulas atualiza o percentual e sobrevive ao recarregar", async ({ page }) => {
    await comprar(page, FOTO);
    await demo(page, "Simular pagamento aprovado");
    await abrir(page, `/meus-cursos/${FOTO}`);
    await expect(page.getByTestId("course-progress")).toHaveText("0%");
    await expect(page.getByTestId("lesson-item")).toHaveCount(6);

    await page.getByTestId("course-continue").click();
    await expect(page).toHaveURL(new RegExp(`/aula/${AULAS_FOTO[0]}$`));
    // capa de demonstração + texto da aula, sem vídeo
    await expect(page.getByTestId("lesson-cover")).toContainText("Aula de demonstração");
    await expect(page.getByTestId("lesson-cover")).toContainText("A luz muda tudo");
    await expect(page.getByTestId("lesson-text")).toContainText("Antes de pensar no celular");
    await expect(page.locator("video, iframe")).toHaveCount(0);
    await expect(page.getByTestId("lesson-complete")).toHaveText("Marcar como concluída");
    await page.getByTestId("lesson-complete").click();
    await expect(page.getByTestId("lesson-complete")).toHaveText("✓ Aula concluída");
    await expect(page.getByTestId("course-progress")).toHaveText("17%");
    expect((await state(page)).progress).toEqual({ "fs-001": ["luz"] });

    // recarregar: o progresso vem do estado salvo no navegador
    await page.reload();
    await page.waitForFunction(() => !!window.__demoStore);
    await expect(page.getByTestId("lesson-complete")).toBeDisabled();
    await expect(page.getByTestId("course-progress")).toHaveText("17%");

    // navegação entre aulas e a próxima aula do curso
    await page.getByTestId("lesson-next").click();
    await expect(page).toHaveURL(new RegExp(`/aula/${AULAS_FOTO[1]}$`));
    await expect(page.getByTestId("lesson-complete")).toHaveText("Marcar como concluída");
    await page.getByTestId("lesson-prev").click();
    await expect(page).toHaveURL(new RegExp(`/aula/${AULAS_FOTO[0]}$`));
    await abrir(page, `/meus-cursos/${FOTO}`);
    await expect(page.getByTestId("lesson-item").first()).toHaveAttribute("data-done", "true");
    await expect(page.getByTestId("course-continue")).toContainText("Continuar: Enquadramento e regra dos terços");

    // concluir todas as aulas: 100% e "Curso concluído"
    for (const id of AULAS_FOTO.slice(1)) {
      await abrir(page, `/meus-cursos/${FOTO}/aula/${id}`);
      await page.getByTestId("lesson-complete").click();
    }
    await abrir(page, `/meus-cursos/${FOTO}`);
    await expect(page.getByTestId("course-progress")).toHaveText("100%");
    await expect(page.getByTestId("course-complete")).toHaveText("Curso concluído");
    await abrir(page, "/meus-cursos");
    await expect(page.getByTestId("course-progress")).toHaveText("100%");
  });

  test("aula ou curso inexistentes mostram aviso, sem erro", async ({ page }) => {
    const erros: string[] = [];
    page.on("pageerror", (e) => erros.push(e.message));
    await comprar(page, FOTO);
    await demo(page, "Simular pagamento aprovado");
    await abrir(page, `/meus-cursos/${FOTO}/aula/nao-existe`);
    await expect(page.getByText("Aula não encontrada neste curso")).toBeVisible();
    await abrir(page, "/meus-cursos/curso-que-nao-existe");
    await expect(page.getByText("Curso não encontrado entre os seus cursos")).toBeVisible();
    expect(erros).toEqual([]);
  });

  test("Resetar dados apaga cursos comprados e progresso", async ({ page }) => {
    await comprar(page, FOTO);
    await demo(page, "Simular pagamento aprovado");
    await abrir(page, `/meus-cursos/${FOTO}/aula/luz`);
    await page.getByTestId("lesson-complete").click();
    expect((await state(page)).progress).toEqual({ "fs-001": ["luz"] });
    await demo(page, "Resetar dados");
    const s = await state(page);
    expect(s.orders).toEqual([]);
    expect(s.progress).toEqual({});
    await abrir(page, "/meus-cursos");
    await expect(page.getByTestId("my-courses-empty")).toBeVisible();
  });

  test("o estado salvo da Faísca é separado das outras lojas", async ({ page }) => {
    await comprar(page, FOTO);
    const chaves = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("loja-")).sort());
    expect(chaves).toContain("loja-demo-v1-faisca");
    expect(chaves).not.toContain("loja-demo-v1-trama");
    await page.goto(`${ORIGIN}/trama`);
    await page.waitForFunction(() => !!window.__demoStore);
    expect(await page.evaluate(() => window.__demoStore!.getState().progress)).toEqual({});
    expect(await page.evaluate(() => window.__demoStore!.getState().orders.some((o) => o.id.startsWith("FS-")))).toBe(false);
  });
});

test.describe("H4 · regras, outras lojas e painel", () => {
  test("Meus cursos, curso e aula não existem nas outras lojas: 404 de verdade; o menu delas não muda", async ({ request, page }) => {
    for (const slug of ["trama", "forno", "arca"]) {
      for (const rota of ["/meus-cursos", `/meus-cursos/${FOTO}`, `/meus-cursos/${FOTO}/aula/luz`]) {
        expect((await request.get(`${ORIGIN}/${slug}${rota}`)).status(), `${slug}${rota}`).toBe(404);
      }
    }
    for (const rota of ["", `/${FOTO}`, `/${FOTO}/aula/luz`]) expect((await request.get(`${FAISCA}/meus-cursos${rota}`)).status(), rota).toBe(200);
    await page.goto(`${ORIGIN}/trama`);
    await expect(page.getByRole("navigation", { name: "Menu principal" }).getByRole("link", { name: "Meus cursos" })).toHaveCount(0);
  });

  test("política de produto digital e arrependimento marcadas para revisão jurídica", async ({ page }) => {
    await abrir(page, "/trocas-e-devolucoes");
    await expect(page.getByText(/Cursos são produtos digitais/)).toBeVisible();
    await expect(page.getByText(/revisão jurídica/).first()).toBeVisible();
  });

  test("painel: o tema da Faísca troca, salva e continua depois de recarregar; módulos e produtos abrem", async ({ page }) => {
    const erros: string[] = [];
    page.on("console", (m) => m.type() === "error" && erros.push(m.text()));
    page.on("pageerror", (e) => erros.push(e.message));
    await abrir(page, "/painel/configuracoes/tema");
    const primaria = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--t-color-primary").trim());
    expect(await primaria()).toBe("#3b2fb5");
    await page.getByTestId("tema-principal").getByText("Esmeralda", { exact: true }).click();
    await page.getByTestId("tema-salvar").click();
    await expect(page.getByTestId("tema-status")).toContainText("Tema salvo");
    await abrir(page, "/painel/configuracoes/tema");
    expect(await primaria()).toBe("#0f6b52");
    await abrir(page, "/");
    expect(await primaria()).toBe("#0f6b52");
    await abrir(page, "/painel/configuracoes/modulos");
    await expect(page.getByTestId("modulo-cupom")).toBeVisible();
    await abrir(page, "/painel/produtos");
    await expect(page.getByTestId("product-row")).toHaveCount(7);
    expect(erros).toEqual([]);
  });
});

test.describe("H5 · celular de 400 px", () => {
  test.use(MOBILE);
  test("home, curso, Meus cursos, curso do aluno e aula sem rolagem horizontal", async ({ page }) => {
    await comprar(page, FOTO);
    await demo(page, "Simular pagamento aprovado");
    for (const rota of ["", `/produto/${FOTO}`, "/meus-cursos", `/meus-cursos/${FOTO}`, `/meus-cursos/${FOTO}/aula/luz`, "/carrinho"]) {
      await abrir(page, rota);
      await page.waitForTimeout(600);
      expect(await overflowOf(page), rota || "home").toBeLessThanOrEqual(0);
    }
  });
});
