import { describe, expect, it } from "vitest";
import { presets } from "@/presets";
import { parseCsv } from "./csv";
import { planImport, templateCsv, type ImportContext } from "./csv-import";
import { formFromProduct, productFromForm, validateProductForm } from "./product-form";
import { filterQuotes } from "./quote-status";

describe("modo orçamento: lista do painel, produto e CSV sem preço", () => {
  const arcaP = presets.find((p) => p.id === "arca-inflaveis")!;
  const ctx = (over: Partial<ImportContext> = {}): ImportContext => ({
    quote: true,
    products: arcaP.products,
    categories: arcaP.categories,
    defs: arcaP.config.attributeDefs,
    placeholderColor: "0f4c5c",
    newId: () => "imp-x",
    ...over,
  });
  const header = "sku,nome,preco,estoque,categoria,descricao";

  it("filterQuotes: mais recente primeiro; filtra por status; busca protocolo, nome ou empresa sem acento", () => {
    const q = arcaP.quotes!;
    const all = filterQuotes(q, "todos", "");
    expect(all.map((x) => x.createdAt)).toEqual([...all.map((x) => x.createdAt)].sort().reverse());
    expect(filterQuotes(q, "ganho", "").map((x) => x.status)).toEqual(["ganho"]);
    expect(filterQuotes(q, "todos", "orc-20260312-t9c3d")).toHaveLength(1);
    expect(filterQuotes(q, "todos", "helena prado")).toHaveLength(1);
    expect(filterQuotes(q, "todos", "metalurgica")).toHaveLength(1); // "Metalúrgica Prado"
    expect(filterQuotes(q, "perdido", "helena")).toEqual([]);
  });

  it("CSV sem preço: colunas preco e estoque são opcionais (ausentes ou vazias), criando com preço 0", () => {
    const base = { sku: "A-1", cat: arcaP.categories[0].slug };
    const noCols = planImport(`sku;nome;categoria\r\n${base.sku};Item Novo;${base.cat}`, ctx());
    expect(noCols).toMatchObject({ ok: true, created: 1, errors: 0 });
    if (noCols.ok) expect(noCols.rows[0].product).toMatchObject({ price: 0, stock: 0 });
    const empty = planImport(`${header}\r\n${base.sku},Item Novo,,,${base.cat},`, ctx());
    expect(empty).toMatchObject({ ok: true, created: 1 });
    // loja de venda segue exigindo preço e estoque
    expect(planImport(`sku;nome;categoria\r\nA-1;Item;${base.cat}`, ctx({ quote: false }))).toEqual({ ok: false, error: expect.stringContaining("ausentes: preco, estoque") });
  });

  it("CSV sem preço: preço informado vale, preço inválido ainda é erro e atualizar com preço vazio mantém o atual", () => {
    const first = arcaP.products[0];
    const cat = arcaP.categories[0].slug;
    const plan = planImport(`${header}\r\nB-1,Com preço,"12,50",,${cat},\r\nB-2,Ruim,abc,,${cat},\r\n${first.sku},Novo nome,,,${cat},`, ctx());
    if (!plan.ok) throw new Error("plano");
    expect(plan.rows[0].product!.price).toBe(1250);
    expect(plan.rows[1]).toMatchObject({ action: "error", reason: expect.stringContaining("Preço inválido") });
    expect(plan.rows[2]).toMatchObject({ action: "update" });
    expect(plan.rows[2].product).toMatchObject({ price: first.price, stock: first.stock, name: "Novo nome" });
  });

  it("o modelo em modo orçamento traz preço e estoque vazios no exemplo", () => {
    const rows = parseCsv(templateCsv(arcaP.config.attributeDefs, arcaP.categories, true)).rows;
    const example = Object.fromEntries(rows[1].cells.map((c, i) => [rows[0].cells[i], c]));
    expect(example.preco).toBe("");
    expect(example.estoque).toBe("");
    expect(example.categoria).toBe(arcaP.categories[0].slug);
  });

  it("formulário de produto em orçamento: preço e estoque vazios valem; preço preenchido continua sendo validado", () => {
    const form = formFromProduct(arcaP.products[0], arcaP.config.attributeDefs, { quote: true });
    expect(form.price).toBe("");
    expect(form.stock).toBe("");
    const ctx2 = { quote: true, products: arcaP.products, categories: arcaP.categories, defs: arcaP.config.attributeDefs, editingId: arcaP.products[0].id };
    expect(validateProductForm(form, ctx2)).toEqual({});
    expect(validateProductForm({ ...form, price: "abc" }, ctx2).price).toBeTruthy();
    expect(validateProductForm({ ...form, stock: "-1" }, ctx2).stock).toBeTruthy();
    expect(validateProductForm(form, { ...ctx2, quote: false }).price).toBeTruthy();
    const product = productFromForm(form, { ...ctx2, newId: () => "x" });
    expect(product).toMatchObject({ price: 0, stock: 0, id: arcaP.products[0].id });
  });
});
