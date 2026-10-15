import { describe, expect, it } from "vitest";
import type { Order } from "@/domain/types";
import { presets } from "@/presets";
import { evaluateRegret, regretProtocol, withinRegretWindow } from "./regret";

const base = presets[0].orders[0];
const NOW = new Date("2026-10-15T12:00:00-03:00");
const order = (over: Partial<Order>): Order => ({
  ...structuredClone(base),
  id: "TS-9001",
  customer: { ...base.customer, email: "Ana@Example.com" },
  ...over,
});
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();

describe("pedido de arrependimento", () => {
  it("pedido de até 7 dias: ok, com protocolo", () => {
    const r = evaluateRegret([order({ createdAt: daysAgo(2) })], "TS-9001", "ana@example.com", 7, NOW);
    expect(r).toEqual({ kind: "ok", protocol: regretProtocol("TS-9001", NOW), orderId: "TS-9001" });
    expect(regretProtocol("TS-9001", NOW)).toMatch(/^ARR-20261015-[0-9A-Z]{5}$/);
  });

  it("o limite é exatamente 7 dias; passou um pouco, expira", () => {
    expect(withinRegretWindow(daysAgo(7), 7, NOW)).toBe(true);
    expect(withinRegretWindow(new Date(NOW.getTime() - 7 * 86_400_000 - 1000).toISOString(), 7, NOW)).toBe(false);
    expect(evaluateRegret([order({ createdAt: daysAgo(30) })], "TS-9001", "ana@example.com", 7, NOW)).toEqual({
      kind: "expired",
      orderId: "TS-9001",
    });
  });

  it("pedido inexistente e e-mail diferente dão o MESMO resultado (não revela se o pedido existe)", () => {
    const orders = [order({ createdAt: daysAgo(1) })];
    const noOrder = evaluateRegret(orders, "TS-0000", "ana@example.com", 7, NOW);
    const wrongEmail = evaluateRegret(orders, "TS-9001", "outra@example.com", 7, NOW);
    expect(noOrder).toEqual({ kind: "invalid" });
    expect(wrongEmail).toEqual(noOrder);
    expect(evaluateRegret(orders, "", "", 7, NOW)).toEqual({ kind: "invalid" });
  });

  it("número e e-mail ignoram maiúsculas, espaços e o #", () => {
    expect(evaluateRegret([order({ createdAt: daysAgo(1) })], " #ts-9001 ", " ANA@example.com ", 7, NOW).kind).toBe("ok");
  });

  it("pedido que já pediu arrependimento devolve o mesmo protocolo", () => {
    const o = order({ createdAt: daysAgo(1), regret: { protocol: "ARR-X", requestedAt: NOW.toISOString() } });
    expect(evaluateRegret([o], "TS-9001", "ana@example.com", 7, NOW)).toEqual({ kind: "already", protocol: "ARR-X", orderId: "TS-9001" });
  });

  it("o prazo é o do preset (14 dias passa onde 7 não passaria)", () => {
    const o = [order({ createdAt: daysAgo(10) })];
    expect(evaluateRegret(o, "TS-9001", "ana@example.com", 7, NOW).kind).toBe("expired");
    expect(evaluateRegret(o, "TS-9001", "ana@example.com", 14, NOW).kind).toBe("ok");
  });
});
