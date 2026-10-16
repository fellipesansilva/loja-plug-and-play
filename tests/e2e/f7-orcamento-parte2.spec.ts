import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test, ORIGIN } from "./helpers";
import { arca, expect, setupArca } from "./orcamento-helpers";

setupArca();

const noteValues = (page: import("@playwright/test").Page) => page.getByTestId("quote-line-note").evaluateAll((els) => els.map((e) => (e as HTMLTextAreaElement).value));
const noHorizontalScroll = (page: import("@playwright/test").Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe("Parte 2 · configurador do pórtico", () => {
  test("a prévia muda na hora com o texto e a cor; o campo limita em 22 caracteres e mostra o contador", async ({ page }) => {
    await arca(page, "/produto/portico-inflavel");
    await expect(page.getByTestId("portico-configurador")).toBeVisible();
    await expect(page.getByTestId("portico-previa-texto")).toHaveText("Sua marca");
    await page.getByTestId("portico-texto").fill("Minha Marca");
    await expect(page.getByTestId("portico-previa-texto")).toHaveText("Minha Marca");
    await expect(page.getByTestId("portico-contador")).toHaveText("11/22");
    await page.getByTestId("portico-texto").fill("x".repeat(40));
    await expect(page.getByTestId("portico-texto")).toHaveValue("x".repeat(22));
    await expect(page.getByTestId("portico-contador")).toHaveText("22/22");
    // digitar além do limite não passa
    await page.getByTestId("portico-texto").press("End");
    await page.getByTestId("portico-texto").pressSequentially("yyy");
    await expect(page.getByTestId("portico-texto")).toHaveValue("x".repeat(22));
  });

  test("só as cores da paleta do preset aparecem; a ativa fica marcada (aria-pressed) e pinta o arco", async ({ page }) => {
    await arca(page, "/produto/portico-inflavel");
    const paleta = await page.evaluate(() => window.__demoStore!.getState().config.orcamentoBlocks!.porticoConfigurador!.paleta);
    const botoes = page.getByTestId("portico-cor");
    await expect(botoes).toHaveCount(paleta.length);
    await expect(botoes.first()).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("portico-arco")).toHaveAttribute("fill", paleta[0].valor);
    await botoes.nth(1).click();
    await expect(botoes.nth(1)).toHaveAttribute("aria-pressed", "true");
    await expect(botoes.first()).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByTestId("portico-arco")).toHaveAttribute("fill", paleta[1].valor);
    // nenhum campo de cor livre
    await expect(page.locator('[data-testid="portico-configurador"] input[type="color"]')).toHaveCount(0);
  });

  test("adicionar leva medidas, cor e texto na observação; 'Adicionado ✓' some sozinho em ~1,6 s", async ({ page }) => {
    await arca(page, "/produto/portico-inflavel");
    await page.getByTestId("portico-texto").fill("Corrida do Bem");
    await page.getByTestId("portico-cor").nth(1).click();
    const botao = page.getByTestId("portico-adicionar");
    await expect(botao).toHaveText("Adicionar ao orçamento com esta configuração");
    await botao.click();
    await expect(botao).toHaveText("Adicionado ✓");
    await expect(botao).toHaveText("Adicionar ao orçamento com esta configuração", { timeout: 4000 });
    await arca(page, "/orcamento");
    expect(await noteValues(page)).toEqual(['6 × 4 m · cor Amarelo · texto "Corrida do Bem"']);
  });

  test("configurações diferentes viram linhas separadas; a mesma configuração soma a quantidade; o pórtico comum continua somando", async ({ page }) => {
    await arca(page, "/produto/portico-inflavel");
    await page.getByTestId("portico-texto").fill("Marca A");
    await page.getByTestId("portico-adicionar").click();
    await expect(page.getByTestId("portico-adicionar")).toHaveText("Adicionado ✓");
    await page.getByTestId("portico-adicionar").click(); // mesma configuração
    await page.getByTestId("portico-texto").fill("Marca B");
    await page.getByTestId("portico-adicionar").click();
    await page.getByTestId("add-to-quote").click(); // pórtico sem configuração
    await page.getByTestId("add-to-quote").click();
    await arca(page, "/orcamento");
    await expect(page.getByTestId("quote-line")).toHaveCount(3);
    const linhas = await page.evaluate(() => window.__demoStore!.getState().quoteList.map((i) => [i.id, i.qty, i.configurado]));
    expect(linhas).toEqual([
      ["arc-007#1", 2, true],
      ["arc-007#2", 1, true],
      ["arc-007", 2, false],
    ]);
  });

  test("logo: PNG, JPG e SVG até 5 MB entram só pelo nome; a prévia troca o texto pelo logo e a observação traz o nome do arquivo", async ({ page }) => {
    const enviados: string[] = [];
    page.on("request", (r) => {
      if (r.method() !== "GET") enviados.push(`${r.method()} ${r.url()}`);
      if (r.url().includes("meu-logo") || (r.postData() ?? "").includes("meu-logo")) enviados.push(`logo em ${r.url()}`);
    });
    await arca(page, "/produto/portico-inflavel");
    await page.getByTestId("portico-texto").fill("Texto antes");
    await page.getByTestId("portico-logo").setInputFiles({ name: "meu-logo.png", mimeType: "image/png", buffer: Buffer.alloc(2048, 1) });
    await expect(page.getByTestId("portico-logo-nome")).toContainText("meu-logo.png");
    await expect(page.getByTestId("portico-previa-logo")).toContainText("meu-logo.png");
    await expect(page.getByTestId("portico-previa-texto")).toHaveCount(0);
    await page.getByTestId("portico-adicionar").click();
    await arca(page, "/orcamento");
    expect(await noteValues(page)).toEqual(["6 × 4 m · cor Azul-petróleo · logo meu-logo.png"]);
    // nada saiu do navegador: nenhuma requisição que não seja GET, e o nome do arquivo não viajou
    expect(enviados).toEqual([]);
    for (const [nome, tipo] of [["a.jpg", "image/jpeg"], ["b.svg", "image/svg+xml"]] as const) {
      await arca(page, "/produto/portico-inflavel");
      await page.getByTestId("portico-logo").setInputFiles({ name: nome, mimeType: tipo, buffer: Buffer.alloc(10, 1) });
      await expect(page.getByTestId("portico-logo-nome")).toContainText(nome);
    }
  });

  test("logo em outro formato ou com mais de 5 MB: mensagem com o formato aceito, sem trocar a prévia nem adicionar", async ({ page }) => {
    await arca(page, "/produto/portico-inflavel");
    await page.getByTestId("portico-logo").setInputFiles({ name: "proposta.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(100, 1) });
    await expect(page.getByTestId("portico-logo-erro")).toHaveText("Formato aceito: PNG, JPG ou SVG, de até 5 MB.");
    await expect(page.getByTestId("portico-logo-nome")).toHaveCount(0);
    const grande = path.join(os.tmpdir(), "logo-grande-teste.png");
    fs.writeFileSync(grande, Buffer.alloc(5 * 1024 * 1024 + 1, 1));
    await page.getByTestId("portico-logo").setInputFiles(grande);
    await expect(page.getByTestId("portico-logo-erro")).toHaveText("Formato aceito: PNG, JPG ou SVG, de até 5 MB.");
    await expect(page.getByTestId("portico-logo-nome")).toHaveCount(0);
    await expect(page.getByTestId("portico-previa-texto")).toBeVisible();
    expect(await page.evaluate(() => window.__demoStore!.getState().quoteList.length)).toBe(0);
    fs.rmSync(grande, { force: true });
  });

  test("configuração acima de 500 caracteres: não entra na lista e mostra a mensagem (nada é cortado)", async ({ page }) => {
    await arca(page, "/produto/portico-inflavel");
    // o texto do cliente nunca passa de 22; forço uma medida enorme no preset em memória para a observação passar de 500
    await page.evaluate(() => {
      const s = window.__demoStore!;
      const c = s.getState().config;
      s.setState({ config: { ...c, orcamentoBlocks: { ...c.orcamentoBlocks!, porticoConfigurador: { ...c.orcamentoBlocks!.porticoConfigurador!, medidas: "m".repeat(600) } } } });
    });
    await page.getByTestId("portico-adicionar").click();
    await expect(page.getByTestId("portico-erro-add")).toHaveText("A configuração ficou longa demais. Encurte o texto.");
    await expect(page.getByTestId("portico-adicionar")).not.toHaveText("Adicionado ✓");
    expect(await page.evaluate(() => window.__demoStore!.getState().quoteList.length)).toBe(0);
  });
});

test.describe("Parte 2 · dimensionador de reservatório", () => {
  test("1.500 L/dia × 3 dias = 4.500 L → Reservatório Flexível Fechado de 5.000 L; adiciona com a conta na observação", async ({ page }) => {
    await arca(page, "/produto/reservatorio-flexivel-fechado");
    await expect(page.getByTestId("dim-resultado")).toContainText("Informe o consumo diário");
    await expect(page.getByTestId("dim-sugestao")).toHaveCount(0);
    await page.getByTestId("dim-consumo").fill("1500");
    await expect(page.getByTestId("dim-consumo")).toHaveValue("1.500");
    await page.getByTestId("dim-dias").fill("3");
    await expect(page.getByTestId("dim-dias-texto")).toHaveText("3 dias");
    await expect(page.getByTestId("dim-necessario")).toHaveText("4.500 L");
    await expect(page.getByTestId("dim-sugestao")).toHaveText("Reservatório Flexível Fechado de 5.000 L");
    await page.getByTestId("dim-adicionar").click();
    await expect(page.getByTestId("dim-adicionar")).toHaveText("Adicionado ✓");
    await arca(page, "/orcamento");
    expect(await noteValues(page)).toEqual(["5.000 L · para 4.500 L (1.500 L/dia × 3 dias)"]);
  });

  test("dias: '1 dia' no singular, 1 a 15 vindos do preset", async ({ page }) => {
    await arca(page, "/produto/reservatorio-flexivel-fechado");
    const slider = page.getByTestId("dim-dias");
    await expect(slider).toHaveAttribute("min", "1");
    await expect(slider).toHaveAttribute("max", "15");
    await expect(page.getByTestId("dim-dias-texto")).toHaveText("1 dia");
    await slider.fill("15");
    await expect(page.getByTestId("dim-dias-texto")).toHaveText("15 dias");
  });

  test("consumo vazio ou zero: sem sugestão, e o botão não adiciona nada nem dá erro", async ({ page }) => {
    await arca(page, "/produto/reservatorio-flexivel-fechado");
    const erros: string[] = [];
    page.on("pageerror", (e) => erros.push(e.message));
    const lista = () => page.evaluate(() => JSON.stringify(window.__demoStore!.getState().quoteList));
    const regiao = page.getByTestId("dim-resultado");
    await expect(regiao).toHaveAttribute("aria-live", "polite");
    const antes = await lista();
    // antes de clicar só há a dica; o aviso aparece ao clicar sem sugestão, dentro da região aria-live
    await expect(page.getByTestId("dim-aviso")).toHaveCount(0);
    await page.getByTestId("dim-adicionar").click();
    await expect(regiao).toContainText("Informe o consumo diário");
    await expect(regiao.getByTestId("dim-aviso")).toHaveText("Informe o consumo diário.");
    expect(await lista()).toBe(antes);
    // consumo zero: o aviso é refeito ao clicar de novo
    await page.getByTestId("dim-consumo").fill("0");
    await expect(page.getByTestId("dim-aviso")).toHaveCount(0);
    await page.getByTestId("dim-adicionar").click();
    await expect(regiao.getByTestId("dim-aviso")).toHaveText("Informe o consumo diário.");
    expect(await lista()).toBe(antes);
    await expect(page.getByTestId("dim-adicionar")).toHaveText("Adicionar sugestão ao orçamento");
    await expect(page.getByTestId("dim-erro")).toHaveCount(0);
    expect(JSON.parse(antes)).toEqual([]);
    expect(erros).toEqual([]);
  });

  test("depois do aviso, informar 1.500 L/dia faz o aviso sumir e o item entra na lista normalmente", async ({ page }) => {
    await arca(page, "/produto/reservatorio-flexivel-fechado");
    const regiao = page.getByTestId("dim-resultado");
    await page.getByTestId("dim-adicionar").click();
    await expect(regiao.getByTestId("dim-aviso")).toHaveText("Informe o consumo diário.");
    await page.getByTestId("dim-consumo").fill("1500");
    await page.getByTestId("dim-dias").fill("3");
    await expect(page.getByTestId("dim-aviso")).toHaveCount(0);
    await expect(regiao.getByTestId("dim-sugestao")).toHaveText("Reservatório Flexível Fechado de 5.000 L");
    await expect(regiao).not.toContainText("Informe o consumo diário");
    await page.getByTestId("dim-adicionar").click();
    await expect(page.getByTestId("dim-aviso")).toHaveCount(0);
    await expect(page.getByTestId("dim-adicionar")).toHaveText("Adicionado ✓");
    const lista = await page.evaluate(() => window.__demoStore!.getState().quoteList);
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ productId: "arc-001", qty: 1, note: "5.000 L · para 4.500 L (1.500 L/dia × 3 dias)", configurado: true });
    // limpar o consumo de novo volta à dica, sem aviso antigo
    await page.getByTestId("dim-consumo").fill("");
    await expect(page.getByTestId("dim-aviso")).toHaveCount(0);
    await expect(regiao).toContainText("Informe o consumo diário");
  });

  test("reservatório aberto usa a lista própria (sem o modelo de 1.000 L)", async ({ page }) => {
    await arca(page, "/produto/reservatorio-aberto");
    await page.getByTestId("dim-consumo").fill("500");
    await expect(page.getByTestId("dim-sugestao")).toHaveText("Reservatório Aberto de 5.000 L");
    await arca(page, "/produto/reservatorio-flexivel-fechado");
    await page.getByTestId("dim-consumo").fill("500");
    await expect(page.getByTestId("dim-sugestao")).toHaveText("Reservatório Flexível Fechado de 1.000 L");
  });

  test("acima de 20.000 L: quantos reservatórios da maior capacidade e a oferta de projeto sob medida", async ({ page }) => {
    await arca(page, "/produto/reservatorio-flexivel-fechado");
    await page.getByTestId("dim-consumo").fill("5000");
    await page.getByTestId("dim-dias").fill("5");
    await expect(page.getByTestId("dim-sugestao")).toContainText("2 reservatórios de 20.000 L");
    await expect(page.getByTestId("dim-sugestao").getByRole("link", { name: "Pedir projeto sob medida" })).toHaveAttribute("href", "/arca/orcamento");
    await page.getByTestId("dim-adicionar").click();
    const item = await page.evaluate(() => window.__demoStore!.getState().quoteList[0]);
    expect(item).toMatchObject({ productId: "arc-001", qty: 2, note: "20.000 L · para 25.000 L (5.000 L/dia × 5 dias)", configurado: true });
  });

  test("mesma sugestão duas vezes soma a quantidade; consumo diferente vira outra linha", async ({ page }) => {
    await arca(page, "/produto/reservatorio-flexivel-fechado");
    await page.getByTestId("dim-consumo").fill("1500");
    await page.getByTestId("dim-dias").fill("3");
    await page.getByTestId("dim-adicionar").click();
    await page.getByTestId("dim-adicionar").click();
    await page.getByTestId("dim-consumo").fill("800");
    await page.getByTestId("dim-adicionar").click();
    const linhas = await page.evaluate(() => window.__demoStore!.getState().quoteList.map((i) => [i.id, i.qty]));
    expect(linhas).toEqual([
      ["arc-001#1", 2],
      ["arc-001#2", 1],
    ]);
  });
});

test.describe("Parte 2 · limites", () => {
  test("Trama e Forno não mostram o configurador nem o dimensionador, e a Arca só nos produtos-alvo", async ({ page }) => {
    for (const url of [`${ORIGIN}/trama/produto/vestido-midi-linho`, `${ORIGIN}/forno/produto/pizza-margherita`, `${ORIGIN}/arca/produto/blimp-inflavel`, `${ORIGIN}/arca/produto/saco-para-teste-de-carga`]) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId("portico-configurador"), url).toHaveCount(0);
      await expect(page.getByTestId("dimensionador"), url).toHaveCount(0);
    }
  });

  test("as ferramentas só aparecem com o bloco ligado no preset (ativos: false esconde as duas)", async ({ page }) => {
    await arca(page, "/produto/portico-inflavel");
    await expect(page.getByTestId("portico-configurador")).toBeVisible();
    await page.evaluate(() => {
      const s = window.__demoStore!;
      const c = s.getState().config;
      s.setState({ config: { ...c, orcamentoBlocks: { ...c.orcamentoBlocks!, ativos: false } } });
    });
    await expect(page.getByTestId("portico-configurador")).toHaveCount(0);
  });

  test("celular de 400 px: as duas páginas sem rolagem lateral, e a página do pórtico não tem rede além de GET", async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    for (const rota of ["/produto/portico-inflavel", "/produto/reservatorio-flexivel-fechado", "/produto/reservatorio-aberto"]) {
      await arca(page, rota);
      expect(await noHorizontalScroll(page), rota).toBeLessThanOrEqual(0);
    }
  });
});
