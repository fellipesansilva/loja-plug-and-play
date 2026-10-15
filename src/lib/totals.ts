import type { Modules, Money } from "@/domain/types";
import { pixPricing } from "./pix";

export type PaymentMethod = "pix" | "cartao" | "boleto";

export type Totals = {
  subtotal: Money;
  couponDiscount: Money;
  /** Subtotal depois do cupom (base do desconto Pix). */
  afterCoupon: Money;
  pixDiscount: Money;
  shipping: Money;
  total: Money;
};

/**
 * Cálculo único do total (centavos inteiros; arredondamento só em cada parcela):
 * subtotal dos itens − cupom − desconto Pix (só no Pix, sobre o valor após o cupom, nunca sobre o frete) + frete.
 */
export function computeTotals(input: {
  subtotal: Money;
  couponDiscount?: Money;
  shipping?: Money;
  method?: PaymentMethod;
  descontoPix?: Modules["descontoPix"];
}): Totals {
  const subtotal = input.subtotal;
  const couponDiscount = Math.min(Math.max(0, input.couponDiscount ?? 0), subtotal);
  const afterCoupon = subtotal - couponDiscount;
  const pixDiscount = input.method === "pix" ? (pixPricing(afterCoupon, input.descontoPix)?.discount ?? 0) : 0;
  const shipping = Math.max(0, input.shipping ?? 0);
  return {
    subtotal,
    couponDiscount,
    afterCoupon,
    pixDiscount,
    shipping,
    total: afterCoupon - pixDiscount + shipping,
  };
}
