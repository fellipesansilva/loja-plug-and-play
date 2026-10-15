import { describe, expect, it } from "vitest";
import type { Order } from "@/domain/types";
import { presets } from "@/presets";
import { filterOrders, sortOrders } from "./orders-list";

const base = presets[0].orders[0];
const mk = (id: string, name: string, status: Order["status"], createdAt: string): Order => ({
  ...structuredClone(base),
  id,
  status,
  createdAt,
  customer: { ...base.customer, name },
});
const orders = [
  mk("TS-1", "Ana Souza", "pago", "2026-03-01T10:00:00Z"),
  mk("TS-3", "João Álvares", "enviado", "2026-03-03T10:00:00Z"),
  mk("TS-2", "Maria Lima", "pago", "2026-03-02T10:00:00Z"),
];

describe("lista de pedidos do painel", () => {
  it("ordena do mais recente ao mais antigo", () => {
    expect(sortOrders(orders).map((o) => o.id)).toEqual(["TS-3", "TS-2", "TS-1"]);
  });
  it("filtra por status", () => {
    expect(filterOrders(orders, "pago", "").map((o) => o.id)).toEqual(["TS-2", "TS-1"]);
    expect(filterOrders(orders, "todos", "")).toHaveLength(3);
    expect(filterOrders(orders, "cancelado", "")).toEqual([]);
  });
  it("busca por número ou nome, sem acento nem caixa", () => {
    expect(filterOrders(orders, "todos", "ts-2").map((o) => o.id)).toEqual(["TS-2"]);
    expect(filterOrders(orders, "todos", "joao alvares").map((o) => o.id)).toEqual(["TS-3"]);
    expect(filterOrders(orders, "todos", "souza")).toHaveLength(1);
    expect(filterOrders(orders, "pago", "maria").map((o) => o.id)).toEqual(["TS-2"]);
    expect(filterOrders(orders, "enviado", "maria")).toEqual([]);
  });
  it("não muda a lista original", () => {
    const copy = orders.map((o) => o.id);
    sortOrders(orders);
    expect(orders.map((o) => o.id)).toEqual(copy);
  });
});
