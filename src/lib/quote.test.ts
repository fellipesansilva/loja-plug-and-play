import { describe, expect, it } from "vitest";
import { QUOTE_NOTE_MAX } from "@/domain/types";
import { presets } from "@/presets";
import { createDemoStore } from "@/store/demo-store";
import { EMPTY_CONTACT, addToList, clampNote, clampQty, makeProtocol, toContact, validateContact, whatsappMessage, whatsappUrl } from "./quote";
import { QUOTE_STATUS_LABEL, applyQuoteStatus, canMarkLost, isValidQuoteTransition, nextQuoteStatus } from "./quote-status";

const arca = presets.find((p) => p.id === "arca-inflaveis")!;
const APPS = arca.config.quote!.applications;
const VALID = { ...EMPTY_CONTACT, name: "Ana Souza", email: "ana@example.com", whatsapp: "(19) 91234-5678", city: "Campinas", state: "sp", application: APPS[0] };

describe("lista de orçamento", () => {
  it("adiciona, soma a quantidade do mesmo item e limita a quantidade", () => {
    let list = addToList([], "a");
    list = addToList(list, "b", 3);
    list = addToList(list, "a", 2);
    expect(list).toEqual([
      { productId: "a", qty: 3, note: "" },
      { productId: "b", qty: 3, note: "" },
    ]);
    expect(clampQty(0)).toBe(1);
    expect(clampQty(-4)).toBe(1);
    expect(clampQty(2.9)).toBe(2);
    expect(clampQty(1e9)).toBe(9999);
    expect(clampQty(Number.NaN)).toBe(1);
  });
  it("a observação tem no máximo 500 caracteres", () => {
    expect(clampNote("x".repeat(800))).toHaveLength(QUOTE_NOTE_MAX);
    expect(clampNote("curta")).toBe("curta");
  });
});

describe("protocolo", () => {
  it("tem o formato ORC-AAAAMMDD-XXXXX e não repete um já usado", () => {
    const now = new Date("2026-10-16T12:00:00Z");
    const a = makeProtocol(now, new Set());
    expect(a).toMatch(/^ORC-20261016-[0-9A-Z]{5}$/);
    const b = makeProtocol(now, new Set([a]));
    expect(b).not.toBe(a);
    expect(b).toMatch(/^ORC-20261016-[0-9A-Z]{5}$/);
  });
});

describe("formulário de envio", () => {
  it("aceita dados válidos; empresa e mensagem são opcionais", () => {
    expect(validateContact(VALID, APPS)).toEqual({});
  });
  it("cada campo obrigatório inválido gera erro no próprio campo", () => {
    const e = validateContact({ ...EMPTY_CONTACT }, APPS);
    expect(Object.keys(e).sort()).toEqual(["application", "city", "email", "name", "state", "whatsapp"]);
    expect(validateContact({ ...VALID, email: "x" }, APPS).email).toBeTruthy();
    expect(validateContact({ ...VALID, whatsapp: "123" }, APPS).whatsapp).toBeTruthy();
    expect(validateContact({ ...VALID, state: "S" }, APPS).state).toBeTruthy();
    expect(validateContact({ ...VALID, application: "Qualquer coisa" }, APPS).application).toBeTruthy();
    expect(validateContact({ ...VALID, message: "x".repeat(1001) }, APPS).message).toBeTruthy();
  });
  it("monta o contato limpo (UF em maiúsculas, sem empresa vazia)", () => {
    expect(toContact(VALID)).toEqual({ name: "Ana Souza", email: "ana@example.com", whatsapp: "(19) 91234-5678", city: "Campinas", state: "SP", application: APPS[0], message: "" });
    expect(toContact({ ...VALID, company: " Acme " }).company).toBe("Acme");
  });
});

describe("WhatsApp", () => {
  const items = [
    { name: "Boia de Demarcação", sku: "ARC-BDM-005", qty: 6, note: "Cor laranja, 60 cm" },
    { name: "Blimp Inflável", sku: "ARC-BLI-008", qty: 1, note: "" },
  ];
  it("a mensagem traz itens, quantidades e observações (e o nome, se houver)", () => {
    const m = whatsappMessage("Arca Infláveis", items, "Ana");
    expect(m).toContain("Arca Infláveis");
    expect(m).toContain("1. Boia de Demarcação (ARC-BDM-005) — 6 unidades");
    expect(m).toContain("Observações: Cor laranja, 60 cm");
    expect(m).toContain("2. Blimp Inflável (ARC-BLI-008) — 1 unidade");
    expect(m).not.toMatch(/Observações:\s*$/m);
    expect(m).toContain("Nome: Ana");
    expect(whatsappMessage("Arca", items)).not.toContain("Nome:");
  });
  it("o endereço do wa.me usa só dígitos e a mensagem codificada", () => {
    expect(whatsappUrl("+55 (19) 90000-0000", "Olá & tudo")).toBe("https://wa.me/5519900000000?text=Ol%C3%A1%20%26%20tudo");
  });
});

describe("status da solicitação", () => {
  it("nova → em análise → orçamento enviado → ganho; ganho e perdido são finais", () => {
    expect(nextQuoteStatus("nova")).toBe("em_analise");
    expect(nextQuoteStatus("em_analise")).toBe("orcamento_enviado");
    expect(nextQuoteStatus("orcamento_enviado")).toBe("ganho");
    expect(nextQuoteStatus("ganho")).toBeNull();
    expect(nextQuoteStatus("perdido")).toBeNull();
  });
  it("perdido só de nova, em análise ou orçamento enviado", () => {
    for (const s of ["nova", "em_analise", "orcamento_enviado"] as const) expect(canMarkLost(s), s).toBe(true);
    for (const s of ["ganho", "perdido"] as const) expect(canMarkLost(s), s).toBe(false);
  });
  it("transições inválidas são recusadas", () => {
    expect(isValidQuoteTransition("nova", "ganho")).toBe(false);
    expect(isValidQuoteTransition("nova", "orcamento_enviado")).toBe(false);
    expect(isValidQuoteTransition("em_analise", "nova")).toBe(false);
    expect(isValidQuoteTransition("ganho", "perdido")).toBe(false);
    expect(isValidQuoteTransition("nova", "perdido")).toBe(true);
    expect(isValidQuoteTransition("nova", "em_analise")).toBe(true);
  });
  it("rótulos e histórico", () => {
    expect(QUOTE_STATUS_LABEL.orcamento_enviado).toBe("Orçamento enviado");
    const q = applyQuoteStatus(arca.quotes![0], "perdido", new Date("2026-10-16T10:00:00Z"));
    expect(q.status).toBe("perdido");
    expect(q.history.at(-1)).toEqual({ status: "perdido", at: "2026-10-16T10:00:00.000Z" });
    expect(q.history.length).toBe(arca.quotes![0].history.length + 1);
  });
});

describe("store em orçamento", () => {
  const product = arca.products[0];
  const other = arca.products[1];

  it("monta a lista, edita quantidade e observação, remove", () => {
    const s = createDemoStore(arca.id);
    s.getState().addToQuote(product.id);
    s.getState().addToQuote(other.id, 2);
    s.getState().addToQuote(product.id, 2);
    s.getState().setQuoteQty(other.id, 5);
    s.getState().setQuoteNote(product.id, "x".repeat(900));
    expect(s.getState().quoteList).toEqual([
      { productId: product.id, qty: 3, note: "x".repeat(500) },
      { productId: other.id, qty: 5, note: "" },
    ]);
    s.getState().removeFromQuote(product.id);
    expect(s.getState().quoteList.map((i) => i.productId)).toEqual([other.id]);
  });

  it("enviar grava a solicitação com itens e contato, esvazia a lista e devolve o protocolo", () => {
    const s = createDemoStore(arca.id);
    const before = s.getState().quotes.length;
    s.getState().addToQuote(product.id, 2);
    s.getState().setQuoteNote(product.id, "Medidas 3 x 2 m");
    const now = new Date("2026-10-16T12:00:00Z");
    const request = s.getState().submitQuote(toContact(VALID), now)!;
    expect(request.id).toMatch(/^ORC-20261016-[0-9A-Z]{5}$/);
    expect(request.status).toBe("nova");
    expect(request.items).toEqual([{ productId: product.id, name: product.name, sku: product.sku, qty: 2, note: "Medidas 3 x 2 m" }]);
    expect(request.history).toEqual([{ status: "nova", at: now.toISOString() }]);
    expect(s.getState().quoteList).toEqual([]);
    expect(s.getState().quotes).toHaveLength(before + 1);
    expect(s.getState().quotes[0].id).toBe(request.id);
    // lista vazia não gera solicitação
    expect(s.getState().submitQuote(toContact(VALID), now)).toBeNull();
    expect(s.getState().quotes).toHaveLength(before + 1);
  });

  it("changeQuoteStatus percorre nova → ganho, marca perdido com histórico e recusa transição inválida", () => {
    const s = createDemoStore(arca.id);
    s.getState().addToQuote(product.id);
    const a = s.getState().submitQuote(toContact(VALID), new Date("2026-10-16T12:00:00Z"))!;
    s.getState().addToQuote(product.id);
    const b = s.getState().submitQuote(toContact(VALID), new Date("2026-10-16T12:00:05Z"))!;
    const at = new Date("2026-10-17T09:00:00Z");
    expect(s.getState().changeQuoteStatus(a.id, "ganho", at)).toBe(false);
    for (const to of ["em_analise", "orcamento_enviado", "ganho"] as const) expect(s.getState().changeQuoteStatus(a.id, to, at)).toBe(true);
    expect(s.getState().quotes.find((q) => q.id === a.id)!.history.map((h) => h.status)).toEqual(["nova", "em_analise", "orcamento_enviado", "ganho"]);
    expect(s.getState().changeQuoteStatus(a.id, "perdido", at)).toBe(false);
    expect(s.getState().changeQuoteStatus(b.id, "perdido", at)).toBe(true);
    expect(s.getState().quotes.find((q) => q.id === b.id)!.status).toBe("perdido");
    expect(s.getState().changeQuoteStatus("ORC-404", "em_analise", at)).toBe(false);
  });

  it("reset volta as solicitações de exemplo e esvazia a lista", () => {
    const s = createDemoStore(arca.id);
    s.getState().addToQuote(product.id);
    s.getState().submitQuote(toContact(VALID));
    s.getState().addToQuote(other.id);
    s.getState().reset();
    expect(s.getState().quotes.map((q) => q.id)).toEqual(arca.quotes!.map((q) => q.id));
    expect(s.getState().quoteList).toEqual([]);
  });

  it("Trama e Forno nascem sem solicitações nem lista", () => {
    for (const id of ["trama-studio", "forno-da-vila"]) {
      const st = createDemoStore(id).getState();
      expect(st.quotes).toEqual([]);
      expect(st.quoteList).toEqual([]);
    }
  });
});
