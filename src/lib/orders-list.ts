import type { Order, OrderStatus } from "@/domain/types";
import { normalizeText } from "./search";

/** Do mais recente ao mais antigo (pela data do pedido). */
export function sortOrders(orders: readonly Order[]): Order[] {
  return [...orders].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/** Filtro por status ("todos" não filtra) e busca por número do pedido ou nome do cliente (sem acento nem caixa). */
export function filterOrders(orders: readonly Order[], status: OrderStatus | "todos", term: string): Order[] {
  const words = normalizeText(term).split(" ").filter(Boolean);
  return sortOrders(orders).filter((o) => {
    if (status !== "todos" && o.status !== status) return false;
    if (words.length === 0) return true;
    const text = normalizeText(`${o.id} ${o.customer.name}`);
    return words.every((w) => text.includes(w));
  });
}
