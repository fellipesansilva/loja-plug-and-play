import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { presets } from "@/presets";
import { csvCell, decodeCsvBytes, detectDelimiter, parseCsv, stripBom } from "./csv";
import { BASE_COLUMNS, IMPORT_MAX_ROWS, planImport, templateColumns, templateCsv, type ImportContext } from "./csv-import";

const FIXTURES = path.resolve(import.meta.dirname, "../../tests/fixtures/csv");
const fixture = (name: string) => decodeCsvBytes(new Uint8Array(fs.readFileSync(path.join(FIXTURES, name)))).text;

describe("leitor de CSV", () => {
  it("detecta ; e , pelo cabeçalho (empate vale ;)", () => {
    expect(detectDelimiter("a;b;c\n1;2;3")).toBe(";");
    expect(detectDelimiter("a,b,c\n1,2,3")).toBe(",");
    expect(detectDelimiter("a\n1")).toBe(";");
    expect(detectDelimiter('"a,b";c;d\n1;2;3')).toBe(";");
  });
  it("aceita UTF-8 com e sem BOM", () => {
    expect(stripBom("﻿sku;nome")).toBe("sku;nome");
    expect(parseCsv("﻿sku;nome\n1;A").rows[0].cells).toEqual(["sku", "nome"]);
    expect(parseCsv("sku;nome\n1;A").rows[0].cells).toEqual(["sku", "nome"]);
  });
  it("campos entre aspas (com separador, aspas e quebra de linha) e CRLF/LF/CR", () => {
    const { rows } = parseCsv('a;b\r\n"x;y";"diz ""oi"""\r\n"linha1\nlinha2";z\rfim;1');
    expect(rows.map((r) => r.cells)).toEqual([["a", "b"], ["x;y", 'diz "oi"'], ["linha1\nlinha2", "z"], ["fim", "1"]]);
  });
  it("guarda o número da linha do arquivo e ignora linhas vazias", () => {
    const { rows } = parseCsv("a;b\n\n1;2\n   ;  \n3;4\n");
    expect(rows.map((r) => [r.line, r.cells[0]])).toEqual([[1, "a"], [3, "1"], [5, "3"]]);
  });
  it("decodifica UTF-8 e, se não for UTF-8, cai para Windows-1252", () => {
    expect(decodeCsvBytes(new TextEncoder().encode("preço;descrição"))).toEqual({ text: "preço;descrição", fallback: false });
    const cp1252 = Uint8Array.from([0x70, 0x72, 0x65, 0xe7, 0x6f]); // "preço" em Windows-1252
    expect(decodeCsvBytes(cp1252)).toEqual({ text: "preço", fallback: true });
  });
  it("escreve campos com ; e aspas corretamente", () => {
    expect(csvCell("simples")).toBe("simples");
    expect(csvCell("a;b")).toBe('"a;b"');
    expect(csvCell('diz "oi"')).toBe('"diz ""oi"""');
  });
});

describe.each(presets.filter((p) => !p.config.modules.orcamento?.enabled && !p.config.modules.cursos).map((p) => [p.id, p] as const))("importação CSV · %s", (_id, preset) => {
  let n = 0;
  const ctx = (over: Partial<ImportContext> = {}): ImportContext => ({
    products: preset.products,
    categories: preset.categories,
    defs: preset.config.attributeDefs,
    placeholderColor: "112233",
    newId: () => `imp-${n++}`,
    ...over,
  });
  const short = preset.shortId;
  /** Trama e Órbita (moda e eletrônicos) têm arquivos de teste próprios; o Forno usa os dele. */
  const own = short === "trama" || short === "orbita";
  const cat = preset.categories[0];
  const header = `sku;nome;preco;estoque;categoria;descricao;${preset.config.attributeDefs.map((d) => d.key).join(";")}`;
  const csv = (...rows: string[]) => [header, ...rows].join("\r\n");

  it("o modelo tem as colunas base + um atributo por definição do preset, com BOM e ;", () => {
    const cols = templateColumns(preset.config.attributeDefs);
    expect(cols.slice(0, BASE_COLUMNS.length)).toEqual([...BASE_COLUMNS]);
    expect(cols.slice(BASE_COLUMNS.length)).toEqual(preset.config.attributeDefs.map((d) => d.key));
    const text = templateCsv(preset.config.attributeDefs, preset.categories);
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(parseCsv(text).rows[0].cells).toEqual(cols);
    // o próprio modelo (com a linha de exemplo) é importável
    const plan = planImport(text, ctx());
    expect(plan).toMatchObject({ ok: true, created: 1, updated: 0, errors: 0 });
  });

  it("arquivo válido: cria e atualiza pelo SKU (arquivos de teste do repositório)", () => {
    const file = own ? `${short}-valido.csv` : "forno-valido.csv";
    const plan = planImport(fixture(file), ctx());
    expect(plan).toMatchObject({ ok: true, created: 2, updated: 1, errors: 0 });
    if (!plan.ok) return;
    const [a, b, c] = plan.rows;
    expect([a.action, b.action, c.action]).toEqual(["create", "create", "update"]);
    expect(a.product).toMatchObject({ active: true, variants: [] });
    expect(a.product!.images).toHaveLength(1);
    expect(c.product!.id).toBe(preset.products.find((p) => p.sku === c.sku)!.id); // atualizou o existente, não criou outro
    expect(c.product!.slug).toBe(preset.products.find((p) => p.sku === c.sku)!.slug);
  });

  it("preço em formato BR (vírgula, com aspas no ,) e com ponto; grava em centavos", () => {
    const file = own ? `${short}-valido.csv` : "forno-valido.csv";
    const plan = planImport(fixture(file), ctx());
    if (!plan.ok) throw new Error("plano");
    const prices = plan.rows.map((r) => r.product!.price);
    expect(prices).toEqual(own ? [12990, 7990, 19990] : [3490, 1490, 5990]);
  });

  it("linhas inválidas: a prévia traz número da linha e motivo, e só as válidas entram", () => {
    const file = own ? `${short}-linhas-invalidas.csv` : "forno-linhas-invalidas.csv";
    const plan = planImport(fixture(file), ctx());
    expect(plan).toMatchObject({ ok: true, created: 1, updated: 1, errors: 6 });
    if (!plan.ok) return;
    const errors = plan.rows.filter((r) => r.action === "error");
    expect(errors.map((r) => r.line)).toEqual([3, 4, 5, 6, 7, 9]);
    expect(errors.map((r) => r.reason)).toEqual([
      "SKU vazio",
      expect.stringContaining("Preço inválido (abc)"),
      expect.stringContaining("Estoque inválido (-2)"),
      expect.stringContaining("Categoria desconhecida (inexistente)"),
      "SKU repetido no arquivo (já usado na linha 2)",
      expect.stringContaining("SKU inválido"),
    ]);
    expect(plan.rows.filter((r) => r.product).map((r) => r.action)).toEqual(["create", "update"]);
  });

  it("colunas erradas, sem uma coluna obrigatória, vazio, só cabeçalho: nada importado, mensagem clara", () => {
    expect(planImport(fixture("colunas-erradas.csv"), ctx())).toEqual({
      ok: false,
      error: expect.stringContaining("Colunas obrigatórias ausentes: sku, nome, preco, estoque, categoria"),
    });
    expect(planImport(fixture("sem-estoque.csv"), ctx())).toEqual({ ok: false, error: expect.stringContaining("ausentes: estoque") });
    expect(planImport(fixture("vazio.csv"), ctx())).toEqual({ ok: false, error: "O arquivo está vazio." });
    expect(planImport("﻿  \r\n\r\n", ctx())).toEqual({ ok: false, error: "O arquivo está vazio." });
    expect(planImport(fixture("so-cabecalho.csv"), ctx())).toEqual({ ok: false, error: expect.stringContaining("nenhuma linha de produto") });
  });

  it("acima de 500 linhas: recusa o arquivo inteiro; 500 passa", () => {
    const rows = (count: number) => Array.from({ length: count }, (_, i) => `NOVO-${i + 1};Produto ${i + 1};10,00;1;${cat.slug};;`);
    const big = planImport(csv(...rows(IMPORT_MAX_ROWS + 1)), ctx());
    expect(big).toEqual({ ok: false, error: expect.stringContaining(`limite é ${IMPORT_MAX_ROWS}`) });
    const edge = planImport(csv(...rows(IMPORT_MAX_ROWS)), ctx());
    expect(edge).toMatchObject({ ok: true, created: IMPORT_MAX_ROWS, errors: 0 });
  });

  it("coluna repetida e coluna fora do modelo (ignorada, com aviso)", () => {
    expect(planImport("sku;sku;nome;preco;estoque;categoria\r\nA;B;C;1,00;1;x", ctx())).toEqual({ ok: false, error: expect.stringContaining('"sku" aparece mais de uma vez') });
    const plan = planImport(`${header};observacao\r\nNOVO-X;Produto X;10,00;1;${cat.slug};;${";".repeat(preset.config.attributeDefs.length - 1)};texto`, ctx());
    expect(plan).toMatchObject({ ok: true, ignoredColumns: ["observacao"] });
  });

  it("SKU de variação de outro produto e estoque diferente em produto com variações são erros", () => {
    const withVariant = preset.products.find((p) => p.variants.length > 0)!;
    const plan = planImport(
      csv(
        `${withVariant.variants[0].sku};Nome;10,00;1;${cat.slug};;`,
        `${withVariant.sku};${withVariant.name};10,00;${withVariant.stock + 1};${cat.slug};;`,
        `${withVariant.sku}-X;Outro;10,00;1;${cat.slug};;`,
      ),
      ctx(),
    );
    if (!plan.ok) throw new Error("plano");
    expect(plan.rows[0].reason).toMatch(/variação do produto/);
    expect(plan.rows[1].reason).toMatch(/Produto com variações/);
    expect(plan.rows[2].action).toBe("create");
    // com o mesmo estoque, atualiza (nome e preço) sem mexer nas variações
    const ok = planImport(csv(`${withVariant.sku};Nome Novo;10,00;${withVariant.stock};${cat.slug};;`), ctx());
    if (!ok.ok) throw new Error("plano");
    expect(ok.rows[0].action).toBe("update");
    expect(ok.rows[0].product!.variants).toEqual(withVariant.variants);
  });

  it("categoria pode ser o slug ou o nome, sem acento nem caixa; SKU sem diferenciar caixa atualiza o existente", () => {
    const existing = preset.products.find((p) => !p.variants.length)!;
    const plan = planImport(csv(`${existing.sku.toLowerCase()};Novo Nome;10,00;${existing.stock};${cat.name.toUpperCase()};;`), ctx());
    if (!plan.ok) throw new Error("plano");
    expect(plan.rows[0]).toMatchObject({ action: "update" });
    expect(plan.rows[0].product!.categoryId).toBe(cat.id);
  });

  it("não grava nada: o planejamento não muda os produtos recebidos", () => {
    const before = structuredClone(preset.products);
    planImport(fixture(own ? `${short}-valido.csv` : "forno-valido.csv"), ctx());
    expect(preset.products).toEqual(before);
  });
});
