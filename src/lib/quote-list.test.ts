import { describe, expect, it } from "vitest";
import { QUOTE_NOTE_MAX, type QuoteListItem } from "@/domain/types";
import { arcaInflaveis as arca } from "@/presets/arca-inflaveis";
import { createDemoStore, migrateState } from "@/store/demo-store";
import { STORAGE_VERSION } from "@/store/storage-key";
import { addToList } from "./quote";
import { addConfiguredToList, CONFIG_TOO_LONG, normalizeQuoteList } from "./quote-list";

const P = "arc-007";
const ok = (r: ReturnType<typeof addConfiguredToList>): QuoteListItem[] => {
  if (!r.ok) throw new Error(r.error);
  return r.list;
};

describe("lista de orçamento com itens configurados", () => {
  it("item configurado é sempre uma linha nova, mesmo com o mesmo produto já na lista", () => {
    let list = addToList([], P);
    list = ok(addConfiguredToList(list, P, "6 × 4 m · cor Azul · texto A"));
    list = ok(addConfiguredToList(list, P, "6 × 4 m · cor Amarelo · texto A"));
    expect(list.map((i) => [i.id, i.configurado, i.qty])).toEqual([
      [P, false, 1],
      [`${P}#1`, true, 1],
      [`${P}#2`, true, 1],
    ]);
  });

  it("a mesma configuração soma a quantidade na linha que já existe", () => {
    const nota = "5.000 L · para 4.500 L (1.500 L/dia × 3 dias)";
    let list = ok(addConfiguredToList([], "arc-001", nota));
    list = ok(addConfiguredToList(list, "arc-001", nota));
    list = ok(addConfiguredToList(list, "arc-001", nota, 3));
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: "arc-001#1", qty: 5, note: nota, configurado: true });
  });

  it("item sem configuração segue somando quantidade, e não se mistura com os configurados", () => {
    let list = addToList([], P);
    list = ok(addConfiguredToList(list, P, "x"));
    list = addToList(list, P, 2);
    expect(list.map((i) => [i.id, i.qty])).toEqual([
      [P, 3],
      [`${P}#1`, 1],
    ]);
  });

  it("observação de 501 caracteres é recusada, sem cortar; 500 passa", () => {
    const r = addConfiguredToList([], P, "x".repeat(QUOTE_NOTE_MAX + 1));
    expect(r).toEqual({ ok: false, error: CONFIG_TOO_LONG, list: [] });
    expect(CONFIG_TOO_LONG).toBe("A configuração ficou longa demais. Encurte o texto.");
    const fine = addConfiguredToList([], P, "x".repeat(QUOTE_NOTE_MAX));
    expect(fine.ok && fine.list[0].note.length).toBe(QUOTE_NOTE_MAX);
  });

  it("o id de uma linha nova não repete o de uma removida (continua depois do maior)", () => {
    let list = ok(addConfiguredToList([], P, "a"));
    list = ok(addConfiguredToList(list, P, "b"));
    list = list.filter((i) => i.id !== `${P}#1`);
    list = ok(addConfiguredToList(list, P, "c"));
    expect(list.map((i) => i.id)).toEqual([`${P}#2`, `${P}#3`]);
  });
});

describe("store: ações pelo id da linha", () => {
  it("quantidade, observação e remoção valem para a linha, não para o produto inteiro", () => {
    const s = createDemoStore(arca.id);
    s.getState().addToQuote(P);
    expect(s.getState().addConfiguredToQuote(P, "cfg A")).toEqual({ ok: true });
    expect(s.getState().addConfiguredToQuote(P, "cfg B")).toEqual({ ok: true });
    s.getState().setQuoteQty(`${P}#2`, 7);
    s.getState().setQuoteNote(`${P}#1`, "cfg A editada");
    expect(s.getState().quoteList.map((i) => [i.id, i.qty, i.note])).toEqual([
      [P, 1, ""],
      [`${P}#1`, 1, "cfg A editada"],
      [`${P}#2`, 7, "cfg B"],
    ]);
    s.getState().removeFromQuote(`${P}#1`);
    expect(s.getState().quoteList.map((i) => i.id)).toEqual([P, `${P}#2`]);
  });

  it("recusa configuração longa sem alterar a lista", () => {
    const s = createDemoStore(arca.id);
    s.getState().addToQuote(P);
    const r = s.getState().addConfiguredToQuote(P, "y".repeat(501));
    expect(r).toEqual({ ok: false, error: CONFIG_TOO_LONG });
    expect(s.getState().quoteList).toHaveLength(1);
  });

  it("itens configurados viram linhas separadas na solicitação, com a observação", () => {
    const s = createDemoStore(arca.id);
    s.getState().addConfiguredToQuote(P, "cor Azul");
    s.getState().addConfiguredToQuote(P, "cor Amarelo");
    const req = s
      .getState()
      .submitQuote({ name: "Ana", email: "a@b.co", whatsapp: "19999990000", city: "Campinas", state: "SP", application: arca.config.quote!.applications[0], message: "" });
    expect(req!.items.map((i) => i.note)).toEqual(["cor Azul", "cor Amarelo"]);
  });
});

describe("migração v8 → v9 da lista", () => {
  it("fixture da versão 8: cada item recebe id = produto e configurado = false, sem perder nada; a config da Arca ganha as ferramentas", () => {
    expect(STORAGE_VERSION).toBe(9);
    const v8 = {
      presetId: arca.id,
      config: { ...structuredClone(arca.config), name: "Minha Arca", orcamentoBlocks: undefined },
      categories: arca.categories,
      products: arca.products,
      orders: [],
      coupons: [],
      cart: [],
      checkout: { couponCode: null, cep: "", shippingId: null },
      quoteList: [
        { productId: "arc-004", qty: 2, note: "Ensaio de 10 t" },
        { productId: "arc-007", qty: 1, note: "" },
      ],
      quotes: [],
    };
    const m = migrateState(v8, 8, arca.id);
    expect(m.quoteList).toEqual([
      { id: "arc-004", productId: "arc-004", qty: 2, note: "Ensaio de 10 t", configurado: false },
      { id: "arc-007", productId: "arc-007", qty: 1, note: "", configurado: false },
    ]);
    expect(m.config!.name).toBe("Minha Arca");
    expect(m.config!.orcamentoBlocks?.ativos).toBe(true);
    expect(m.products).toHaveLength(arca.products.length);
  });

  it("estado já no formato novo não muda; lixo vira lista vazia", () => {
    const novo: QuoteListItem[] = [{ id: "arc-007#1", productId: "arc-007", qty: 2, note: "a", configurado: true }];
    expect(normalizeQuoteList(novo)).toEqual(novo);
    expect(normalizeQuoteList(undefined)).toEqual([]);
    expect(normalizeQuoteList([null, 3, { qty: 1 }])).toEqual([]);
  });

  it("loja de venda: estado v8 segue como está (lista vazia normalizada)", () => {
    const forno = { presetId: "forno-da-vila", config: { name: "x" }, products: [] };
    const m = migrateState(forno, 8, "forno-da-vila");
    expect(m.quoteList).toEqual([]);
    expect(m.products).toEqual([]);
  });
});
