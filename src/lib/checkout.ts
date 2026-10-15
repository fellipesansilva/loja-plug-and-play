import type { Order, OrderStatus } from "@/domain/types";
import type { ResolvedLine } from "./cart";
import { itemName } from "./item-name";
import type { Totals } from "./totals";

/** Monta o pedido a partir das linhas do carrinho já resolvidas. Nenhum dado sensível de cartão entra aqui. */
export function buildOrder(input: {
  id: string;
  lines: ResolvedLine[];
  customer: Order["customer"];
  delivery: Order["delivery"];
  payment: Order["payment"];
  totals: Totals;
  couponCode?: string;
  now?: Date;
}): Order {
  const status: OrderStatus = input.payment.method === "cartao" ? "pago" : "aguardando_pagamento";
  return {
    id: input.id,
    items: input.lines.map(({ line, product, variantLabel, addons, unit }) => ({
      productId: product.id,
      variantId: line.variantId,
      lineId: line.lineId,
      addons: addons.length ? addons : undefined,
      name: itemName(product.name, variantLabel),
      quantity: line.qty,
      unitPrice: unit,
    })),
    customer: input.customer,
    delivery: input.delivery,
    payment: input.payment,
    status,
    createdAt: (input.now ?? new Date()).toISOString(),
    subtotal: input.totals.subtotal,
    couponCode: input.couponCode,
    couponDiscount: input.totals.couponDiscount || undefined,
    pixDiscount: input.totals.pixDiscount || undefined,
    total: input.totals.total,
  };
}
