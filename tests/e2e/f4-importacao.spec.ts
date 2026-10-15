import fs from "node:fs";
import path from "node:path";
import { expect, test, currentPreset, SHORT, TRAMA } from "./helpers";
import { MOBILE, overflowOf, ready } from "./painel-helpers";

// Os arquivos de teste ficam no repositório: tests/fixtures/csv
const FIXTURES = path.resolve(__dirname, "../fixtures/csv");
const fixture = (name: string) => path.join(FIXTURES, name);
const own = (kind: "valido" | "linhas-invalidas") => fixture(`${SHORT[currentPreset()]}-${kind}.csv`);

const productCount = (page: import("@playwright/test").Page) => page.evaluate(() => window.__demoStore!.getState().products.length);
const bySku = (page: import("@playwright/test").Page, sku: string) =>
  page.evaluate((s) => window.__demoStore!.getState().products.find((p) => p.sku === s) ?? null, sku);

test.describe("H5 · importação CSV", () => {
  test("baixa o modelo do preset: colunas base + atributos, com BOM e separador ;", async ({ page }) => {
    await ready(page, "/painel/importacao");
    const defs = await page.evaluate(() => window.__demoStore!.getState().config.attributeDefs.map((d) => d.key));
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByTestId("download-template").click()]);
    expect(download.suggestedFilename()).toBe(`modelo-importacao-${SHORT[currentPreset()]}.csv`);
    const bytes = fs.readFileSync((await download.path())!);
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf]); // BOM do UTF-8
    const header = bytes.toString("utf8").replace(/^﻿/, "").split(/\r?\n/)[0];
    expect(header).toBe(["sku", "nome", "preco", "estoque", "categoria", "descricao", ...defs].join(";"));
  });

  test("CSV válido: a prévia mostra criados e atualizados; só confirmar grava", async ({ page }) => {
    await ready(page, "/painel/importacao");
    const before = await productCount(page);
    await page.getByTestId("import-file").setInputFiles(own("valido"));
    await expect(page.getByTestId("import-preview")).toBeVisible();
    await expect(page.getByTestId("count-created")).toHaveText("2");
    await expect(page.getByTestId("count-updated")).toHaveText("1");
    await expect(page.getByTestId("count-errors")).toHaveText("0");
    await expect(page.getByTestId("import-valid-row")).toHaveCount(3);
    expect(await page.getByTestId("import-valid-row").evaluateAll((els) => els.map((e) => e.getAttribute("data-action")))).toEqual(["create", "create", "update"]);
    // a prévia não grava nada
    expect(await productCount(page)).toBe(before);

    await page.getByTestId("import-confirm").click();
    await expect(page.getByTestId("import-done")).toContainText("Importação concluída: 2 criados, 1 atualizado.");
    expect(await productCount(page)).toBe(before + 2);

    const trama = currentPreset() === TRAMA;
    const created = await bySku(page, trama ? "TS-IMP-001" : "FV-IMP-001");
    expect(created).toMatchObject({ name: trama ? "Blusa Importada" : "Calzone Importado", price: trama ? 12990 : 3490, active: true });
    const updated = await bySku(page, trama ? "TS-SPL" : "FV-PEP");
    expect(updated).toMatchObject({ name: trama ? "Saia Plissada Atualizada" : "Pizza de Pepperoni Atualizada", price: trama ? 19990 : 5990 });

    // está na loja
    await page.goto(`/produto/${created!.slug}`);
    await expect(page.getByRole("heading", { level: 1, name: created!.name })).toBeVisible();
    await page.goto(`/produto/${updated!.slug}`);
    await expect(page.getByRole("heading", { level: 1, name: updated!.name })).toBeVisible();
    await expect(page.getByText(trama ? /R\$\s*199,90/ : /R\$\s*59,90/).first()).toBeVisible();

    // e na lista do painel, sem duplicar o atualizado
    await page.goto("/painel/produtos");
    await expect(page.getByTestId("product-row")).toHaveCount(before + 2);
  });

  test("CSV com linhas inválidas: a prévia mostra linha e motivo e só as válidas são importadas", async ({ page }) => {
    await ready(page, "/painel/importacao");
    const before = await productCount(page);
    await page.getByTestId("import-file").setInputFiles(own("linhas-invalidas"));
    await expect(page.getByTestId("count-created")).toHaveText("1");
    await expect(page.getByTestId("count-updated")).toHaveText("1");
    await expect(page.getByTestId("count-errors")).toHaveText("6");

    const errors = page.getByTestId("import-error-row");
    await expect(errors).toHaveCount(6);
    await expect(errors).toHaveText([
      /Linha 3:.*SKU vazio/,
      /Linha 4:.*Preço inválido \(abc\)/,
      /Linha 5:.*Estoque inválido \(-2\)/,
      /Linha 6:.*Categoria desconhecida \(inexistente\)/,
      /Linha 7:.*SKU repetido no arquivo \(já usado na linha 2\)/,
      /Linha 9:.*SKU inválido/,
    ]);

    await page.getByTestId("import-confirm").click();
    await expect(page.getByTestId("import-done")).toContainText("1 criado, 1 atualizado; 6 linhas com erro foram ignoradas.");
    expect(await productCount(page)).toBe(before + 1);
    const trama = currentPreset() === TRAMA;
    expect(await bySku(page, trama ? "TS-OK-001" : "FV-OK-001")).not.toBeNull();
    for (const sku of trama ? ["TS-ERR-PRECO", "TS-ERR-ESTOQUE", "TS-ERR-CAT", "TS ERR SKU"] : ["FV-ERR-PRECO", "FV-ERR-ESTOQUE", "FV-ERR-CAT", "FV ERR SKU"]) {
      expect(await bySku(page, sku), sku).toBeNull();
    }
    // o SKU repetido no arquivo ficou com a primeira linha
    expect((await bySku(page, trama ? "TS-OK-001" : "FV-OK-001"))!.name).toBe(trama ? "Peça Boa" : "Item Bom");
  });

  test("colunas erradas: mensagem clara e nada é importado", async ({ page }) => {
    await ready(page, "/painel/importacao");
    const before = await productCount(page);
    await page.getByTestId("import-file").setInputFiles(fixture("colunas-erradas.csv"));
    await expect(page.getByTestId("import-error")).toContainText("Colunas obrigatórias ausentes: sku, nome, preco, estoque, categoria");
    await expect(page.getByTestId("import-error")).toContainText("Nada foi importado.");
    await expect(page.getByTestId("import-confirm")).toHaveCount(0);
    expect(await productCount(page)).toBe(before);

    await page.getByTestId("import-file").setInputFiles(fixture("sem-estoque.csv"));
    await expect(page.getByTestId("import-error")).toContainText("ausentes: estoque");
    expect(await productCount(page)).toBe(before);
  });

  test("arquivo vazio, só com cabeçalho e acima de 500 linhas: mensagem clara, nada importado", async ({ page }) => {
    await ready(page, "/painel/importacao");
    const before = await productCount(page);
    const input = page.getByTestId("import-file");

    await input.setInputFiles(fixture("vazio.csv"));
    await expect(page.getByTestId("import-error")).toContainText("O arquivo está vazio.");

    await input.setInputFiles(fixture("so-cabecalho.csv"));
    await expect(page.getByTestId("import-error")).toContainText("nenhuma linha de produto");

    const category = await page.evaluate(() => window.__demoStore!.getState().categories[0].slug);
    const rows = (n: number) => Array.from({ length: n }, (_, i) => `BIG-${i + 1};Produto ${i + 1};10,00;1;${category}`).join("\r\n");
    const header = "sku;nome;preco;estoque;categoria";
    await input.setInputFiles({ name: "grande.csv", mimeType: "text/csv", buffer: Buffer.from(`${header}\r\n${rows(501)}\r\n`) });
    await expect(page.getByTestId("import-error")).toContainText("501 linhas de produto; o limite é 500");
    await expect(page.getByTestId("import-confirm")).toHaveCount(0);
    expect(await productCount(page)).toBe(before);

    // 500 linhas passam
    await input.setInputFiles({ name: "limite.csv", mimeType: "text/csv", buffer: Buffer.from(`${header}\r\n${rows(500)}\r\n`) });
    await expect(page.getByTestId("count-created")).toHaveText("500");
    await page.getByTestId("import-confirm").click();
    await expect(page.getByTestId("import-done")).toContainText("500 criados");
    expect(await productCount(page)).toBe(before + 500);
  });

  test("aceita separador ',' e UTF-8 sem BOM; arquivo em Windows-1252 é lido com aviso", async ({ page }) => {
    await ready(page, "/painel/importacao");
    const category = await page.evaluate(() => window.__demoStore!.getState().categories[0].slug);
    const input = page.getByTestId("import-file");
    await input.setInputFiles({ name: "virgula.csv", mimeType: "text/csv", buffer: Buffer.from(`sku,nome,preco,estoque,categoria\nCSV-A,"Pão, com vírgula","1.234,50",3,${category}\n`, "utf8") });
    await expect(page.getByTestId("count-created")).toHaveText("1");
    await expect(page.getByTestId("import-valid-row")).toContainText("Pão, com vírgula");
    await expect(page.getByTestId("import-valid-row")).toContainText(/R\$\s*1\.234,50/);

    await input.setInputFiles({ name: "excel-antigo.csv", mimeType: "text/csv", buffer: Buffer.from(`sku;nome;preco;estoque;categoria\r\nCSV-B;Pão de Açúcar;10,00;2;${category}\r\n`, "latin1") });
    await expect(page.getByTestId("import-valid-row")).toContainText("Pão de Açúcar");
    await expect(page.getByText(/não estava em UTF-8/)).toBeVisible();
  });

  test("cancelar na prévia não importa nada", async ({ page }) => {
    await ready(page, "/painel/importacao");
    const before = await productCount(page);
    await page.getByTestId("import-file").setInputFiles(own("valido"));
    await expect(page.getByTestId("import-preview")).toBeVisible();
    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByTestId("import-preview")).toHaveCount(0);
    expect(await productCount(page)).toBe(before);
  });

  test("Resetar dados desfaz a importação", async ({ page }) => {
    await ready(page, "/painel/importacao");
    const before = await productCount(page);
    await page.getByTestId("import-file").setInputFiles(own("valido"));
    await page.getByTestId("import-confirm").click();
    await expect(page.getByTestId("import-done")).toBeVisible();
    await page.getByRole("button", { name: "Demo", exact: true }).click();
    await page.getByRole("button", { name: "Resetar dados" }).click();
    await expect.poll(() => productCount(page)).toBe(before);
  });

  test.describe("celular 400 px", () => {
    test.use(MOBILE);
    test("tela e prévia sem rolagem horizontal", async ({ page }) => {
      await ready(page, "/painel/importacao");
      expect(await overflowOf(page)).toBeLessThanOrEqual(0);
      await page.getByTestId("import-file").setInputFiles(own("linhas-invalidas"));
      await expect(page.getByTestId("import-preview")).toBeVisible();
      expect(await overflowOf(page)).toBeLessThanOrEqual(0);
    });
  });

  test("campos com rótulo e botões acessíveis", async ({ page }) => {
    await ready(page, "/painel/importacao");
    await expect(page.getByLabel("Arquivo CSV")).toBeVisible();
    await expect(page.getByRole("button", { name: "Baixar modelo (CSV)" })).toBeVisible();
  });
});
