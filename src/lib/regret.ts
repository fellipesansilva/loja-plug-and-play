import type { Order } from "@/domain/types";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Resultado do pedido de arrependimento (simulado).
 * - `ok`: dentro do prazo; o pedido será cancelado.
 * - `already`: este pedido já tem um pedido de arrependimento (devolve o protocolo dele).
 * - `expired`: o prazo passou (a tela mostra o contato para troca por defeito).
 * - `invalid`: pedido inexistente OU e-mail diferente. É de propósito um resultado só, para a tela não revelar se o pedido existe.
 */
export type RegretResult =
  | { kind: "ok"; protocol: string; orderId: string }
  | { kind: "already"; protocol: string; orderId: string }
  | { kind: "expired"; orderId: string }
  | { kind: "invalid" };

const normId = (v: string) => v.trim().replace(/^#/, "").toUpperCase();
const normEmail = (v: string) => v.trim().toLowerCase();

/** Protocolo simulado: data do pedido de arrependimento + 5 caracteres derivados do número do pedido. */
export function regretProtocol(orderId: string, now: Date): string {
  let h = 0;
  for (const ch of orderId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, "");
  return `ARR-${ymd}-${h.toString(36).toUpperCase().padStart(5, "0").slice(-5)}`;
}

/** Dentro do prazo? Conta a partir da data do pedido (a demo não registra a data de recebimento). */
export function withinRegretWindow(createdAt: string, regretDays: number, now: Date): boolean {
  return now.getTime() - new Date(createdAt).getTime() <= regretDays * DAY_MS;
}

export function evaluateRegret(
  orders: readonly Order[],
  orderId: string,
  email: string,
  regretDays: number,
  now: Date,
): RegretResult {
  const order = orders.find((o) => normId(o.id) === normId(orderId));
  if (!order || !normId(orderId) || normEmail(order.customer.email) !== normEmail(email)) return { kind: "invalid" };
  if (order.regret) return { kind: "already", protocol: order.regret.protocol, orderId: order.id };
  if (!withinRegretWindow(order.createdAt, regretDays, now)) return { kind: "expired", orderId: order.id };
  return { kind: "ok", protocol: regretProtocol(order.id, now), orderId: order.id };
}
