import type { Order, OrderStatus, StoreConfig } from "@/domain/types";
import { ORDER_STATUS_LABEL } from "./payment";

/** Garante o histórico: pedido sem histórico (exemplo do preset ou estado salvo antigo) ganha o status atual na data do pedido. */
export function withHistory(order: Order): Order {
  return order.history && order.history.length > 0 ? order : { ...order, history: [{ status: order.status, at: order.createdAt }] };
}

/** Novo status do pedido, com a mudança registrada no histórico (data e hora ISO). */
export function applyStatus(order: Order, status: OrderStatus, at: Date): Order {
  const current = withHistory(order);
  return { ...current, status, history: [...(current.history ?? []), { status, at: at.toISOString() }] };
}

/**
 * Próximas etapas válidas do pedido: aguardando pagamento → pago → em separação → enviado → entregue.
 * Pedido só digital vai de pago direto para entregue. Entregue e cancelado são finais.
 * (O cancelamento é a parte, em `canCancel`.)
 */
export function nextStatuses(order: Pick<Order, "status" | "delivery">): OrderStatus[] {
  switch (order.status) {
    case "aguardando_pagamento":
      return ["pago"];
    case "pago":
      return order.delivery.type === "digital" ? ["entregue"] : ["em_separacao"];
    case "em_separacao":
      return ["enviado"];
    case "enviado":
      return ["entregue"];
    default:
      return [];
  }
}

/** Cancelar vale até antes de entregue. */
export function canCancel(order: Pick<Order, "status">): boolean {
  return order.status !== "entregue" && order.status !== "cancelado";
}

/** Uma mudança de status é válida se é a próxima etapa ou o cancelamento permitido. */
export function isValidTransition(order: Pick<Order, "status" | "delivery">, to: OrderStatus): boolean {
  return to === "cancelado" ? canCancel(order) : nextStatuses(order).includes(to);
}

/**
 * Rótulo do status. No pedido de retirada, "enviado" vira o rótulo do preset (ex.: "Pronto para retirada");
 * sem esse rótulo no preset, vale o rótulo padrão.
 */
export function statusLabel(order: Pick<Order, "delivery">, status: OrderStatus, config: Pick<StoreConfig, "pickup">): string {
  if (status === "enviado" && order.delivery.type === "retirada" && config.pickup?.readyLabel) return config.pickup.readyLabel;
  return ORDER_STATUS_LABEL[status];
}
