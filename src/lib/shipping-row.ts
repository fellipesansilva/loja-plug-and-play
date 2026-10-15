import type { Money } from "@/domain/types";
import { formatBRL } from "./money";

export type ShippingRowKind = "pickup" | "ship" | "digital" | "pending";

/**
 * Linha de frete do resumo (carrinho, checkout e pedido). Retirada no local não é "frete grátis":
 * a linha vira "Retirada no local" com R$ 0,00. Na entrega a linha continua "Frete", com "Grátis" quando o valor é zero.
 */
export function shippingRow(kind: ShippingRowKind, price: Money = 0, pending = "A calcular"): { label: string; value: string } {
  switch (kind) {
    case "pickup":
      return { label: "Retirada no local", value: formatBRL(0) };
    case "ship":
      return { label: "Frete", value: price === 0 ? "Grátis" : formatBRL(price) };
    case "digital":
      return { label: "Frete", value: "Não se aplica" };
    default:
      return { label: "Frete", value: pending };
  }
}
