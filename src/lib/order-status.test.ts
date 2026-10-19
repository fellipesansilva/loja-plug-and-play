import { describe, expect, it } from "vitest";
import type { Order, OrderStatus } from "@/domain/types";
import { presets } from "@/presets";
import { createDemoStore, migrateState } from "@/store/demo-store";
import { STORAGE_VERSION } from "@/store/storage-key";
import { applyStatus, canCancel, isValidTransition, nextStatuses, statusLabel, withHistory } from "./order-status";

const [trama, forno] = presets;
const base = trama.orders[0];
const order = (status: OrderStatus, delivery: Order["delivery"] = { type: "retirada" }): Order => ({ ...structuredClone(base), status, delivery, history: undefined });
const physical: Order["delivery"] = { type: "entrega", address: "Rua A, 1", shipping: 1000 };

describe("transições de status", () => {
  it("fluxo de entrega: aguardando → pago → em separação → enviado → entregue", () => {
    expect(nextStatuses(order("aguardando_pagamento", physical))).toEqual(["pago"]);
    expect(nextStatuses(order("pago", physical))).toEqual(["em_separacao"]);
    expect(nextStatuses(order("em_separacao", physical))).toEqual(["enviado"]);
    expect(nextStatuses(order("enviado", physical))).toEqual(["entregue"]);
    expect(nextStatuses(order("entregue", physical))).toEqual([]);
    expect(nextStatuses(order("cancelado", physical))).toEqual([]);
  });

  it("pedido só digital vai de pago direto para entregue", () => {
    expect(nextStatuses(order("pago", { type: "digital" }))).toEqual(["entregue"]);
    expect(isValidTransition(order("pago", { type: "digital" }), "em_separacao")).toBe(false);
  });

  it("cancelar vale até antes de entregue", () => {
    for (const s of ["aguardando_pagamento", "pago", "em_separacao", "enviado"] as const) expect(canCancel(order(s)), s).toBe(true);
    expect(canCancel(order("entregue"))).toBe(false);
    expect(canCancel(order("cancelado"))).toBe(false);
  });

  it("transições inválidas são recusadas (pular etapa, voltar, mexer em pedido final)", () => {
    const o = order("pago", physical);
    expect(isValidTransition(o, "enviado")).toBe(false);
    expect(isValidTransition(o, "entregue")).toBe(false);
    expect(isValidTransition(o, "aguardando_pagamento")).toBe(false);
    expect(isValidTransition(o, "pago")).toBe(false);
    expect(isValidTransition(o, "em_separacao")).toBe(true);
    expect(isValidTransition(o, "cancelado")).toBe(true);
    expect(isValidTransition(order("entregue", physical), "cancelado")).toBe(false);
    expect(isValidTransition(order("cancelado", physical), "pago")).toBe(false);
  });
});

describe("histórico e rótulos", () => {
  it("pedido sem histórico ganha o status atual na data do pedido; com histórico, fica como está", () => {
    const o = order("pago");
    expect(withHistory(o).history).toEqual([{ status: "pago", at: o.createdAt }]);
    const h = withHistory({ ...o, history: [{ status: "pago", at: "2026-01-01T00:00:00.000Z" }] });
    expect(h.history).toHaveLength(1);
  });

  it("applyStatus acrescenta a mudança com data e hora e não perde o que havia", () => {
    const o = applyStatus(order("pago"), "em_separacao", new Date("2026-10-15T15:30:00Z"));
    expect(o.status).toBe("em_separacao");
    expect(o.history).toEqual([
      { status: "pago", at: o.createdAt },
      { status: "em_separacao", at: "2026-10-15T15:30:00.000Z" },
    ]);
  });

  it("retirada: 'enviado' usa o rótulo do preset; entrega e outros status usam o padrão", () => {
    expect(statusLabel(order("enviado"), "enviado", forno.config)).toBe("Pronto para retirada");
    expect(statusLabel(order("enviado", physical), "enviado", forno.config)).toBe("Enviado");
    expect(statusLabel(order("pago"), "pago", forno.config)).toBe("Pago");
    expect(statusLabel(order("enviado"), "enviado", trama.config)).toBe("Enviado");
  });
});

describe("store: mudança de status", () => {
  it("changeOrderStatus só aceita transição válida e registra no histórico", () => {
    const store = createDemoStore(trama);
    store.getState().placeOrder({ ...order("pago", physical), id: "XX-1" });
    const at = new Date("2026-10-15T12:00:00Z");
    expect(store.getState().changeOrderStatus("XX-1", "enviado", at)).toBe(false);
    expect(store.getState().changeOrderStatus("XX-1", "em_separacao", at)).toBe(true);
    expect(store.getState().changeOrderStatus("XX-404", "pago", at)).toBe(false);
    const o = store.getState().orders.find((x) => x.id === "XX-1")!;
    expect(o.status).toBe("em_separacao");
    expect(o.history!.map((h) => h.status)).toEqual(["pago", "em_separacao"]);
    expect(store.getState().changeOrderStatus("XX-1", "cancelado", at)).toBe(true);
    expect(store.getState().orders.find((x) => x.id === "XX-1")!.history!.at(-1)).toEqual({ status: "cancelado", at: at.toISOString() });
  });

  it("todos os pedidos do preset nascem com histórico", () => {
    for (const p of presets) {
      const s = createDemoStore(p).getState();
      expect(s.orders.every((o) => (o.history?.length ?? 0) >= 1)).toBe(true);
    }
  });
});

describe("migração do estado salvo (v5 → v6)", () => {
  it("a versão do formato subiu para 9", () => {
    expect(STORAGE_VERSION).toBe(9);
  });

  it("mantém os pedidos (e ganham histórico), o carrinho e o catálogo; config volta a ser a do preset, com nome e tema editados", () => {
    const v5 = {
      presetId: forno.id,
      config: { ...structuredClone(forno.config), name: "Meu Forno", pickup: { leadTime: "20 min" } },
      categories: forno.categories,
      products: forno.products.slice(0, 2),
      orders: [{ ...structuredClone(forno.orders[0]), id: "FV-9999", history: undefined }],
      coupons: forno.coupons,
      cart: [{ lineId: "x", productId: "fv-001", qty: 1, addonIds: [] }],
      checkout: { couponCode: null, cep: "01310100", shippingId: "economico" },
    };
    const m = migrateState(v5, 5, forno);
    expect(m.orders!.map((o) => o.id)).toEqual(["FV-9999"]);
    expect(m.orders![0].history).toEqual([{ status: forno.orders[0].status, at: forno.orders[0].createdAt }]);
    expect(m.cart).toEqual(v5.cart);
    expect(m.products).toHaveLength(2);
    expect(m.config!.name).toBe("Meu Forno");
    expect(m.config!.pickup).toEqual(forno.config.pickup);
    expect(m.config!.pickup!.readyLabel).toBe("Pronto para retirada");
  });

  it("v7 → v8: loja em orçamento recebe o catálogo novo e mantém a lista e as solicitações; loja de venda segue como está", () => {
    const arca = presets.find((x) => x.id === "arca-inflaveis")!;
    const old = {
      presetId: arca.id,
      config: { ...structuredClone(arca.config), name: "Minha Arca", needs: undefined, sectors: undefined },
      categories: arca.categories,
      products: arca.products.slice(0, 5),
      quoteList: [{ productId: "arc-004", qty: 2, note: "" }],
      quotes: [],
    };
    const m = migrateState(old, 7, arca);
    expect(m.config!.name).toBe("Minha Arca");
    expect(m.config!.sectors).toHaveLength(6);
    expect(m.products).toHaveLength(arca.products.length);
    expect(m.quoteList).toEqual([{ id: "arc-004", productId: "arc-004", qty: 2, note: "", configurado: false }]);
    const sales = { presetId: forno.id, config: forno.config, products: forno.products.slice(0, 2) };
    expect(migrateState(sales, 7, forno)).toEqual({ ...sales, quoteList: [] });
  });

  it("formato que não dá para aproveitar (outra versão, outro preset, vazio) é descartado", () => {
    expect(migrateState({ presetId: trama.id, config: trama.config }, 4, trama)).toEqual({});
    expect(migrateState({ presetId: forno.id, config: forno.config }, 5, trama)).toEqual({});
    expect(migrateState(undefined, 5, trama)).toEqual({});
  });
});
