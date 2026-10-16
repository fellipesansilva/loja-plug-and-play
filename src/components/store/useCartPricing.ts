"use client";

import { useMemo } from "react";
import type { Money } from "@/domain/types";
import { billableLines, cartBlockers, cartIsAllDigital, physicalSubtotal, resolveLines } from "@/lib/cart";
import { applyCoupon } from "@/lib/coupon";
import { quoteShipping, type ShippingQuote } from "@/lib/shipping";
import { computeTotals, type PaymentMethod } from "@/lib/totals";
import { useDemoStore } from "@/store/demo-store";

export type SelectedShipping = {
  id: string;
  kind: "ship" | "pickup";
  label: string;
  price: Money;
  /** Prazo ("2 a 3 dias úteis", "hoje"); ausente na retirada. */
  deadline?: string;
};

/** Tudo que carrinho e checkout precisam saber do preço: linhas, cupom, frete escolhido e totais por forma de pagamento. */
export function useCartPricing() {
  const cart = useDemoStore((s) => s.cart);
  const products = useDemoStore((s) => s.products);
  const coupons = useDemoStore((s) => s.coupons);
  const checkout = useDemoStore((s) => s.checkout);
  const config = useDemoStore((s) => s.config);

  const lines = useMemo(() => resolveLines(cart, products), [cart, products]);
  const blockers = cartBlockers(lines);
  // Item indisponível (ou com estoque menor que a quantidade) não entra no subtotal, no frete nem no total.
  const billable = billableLines(lines);
  const subtotal = billable.reduce((sum, l) => sum + l.total, 0);
  const physical = physicalSubtotal(billable);
  const allDigital = cartIsAllDigital(billable);

  // O cupom é revalidado a cada mudança do carrinho (ex.: o mínimo deixa de ser atingido).
  const coupon = checkout.couponCode ? applyCoupon(checkout.couponCode, coupons, subtotal) : null;
  const couponDiscount = coupon?.status === "applied" ? coupon.discount : 0;

  const quote: ShippingQuote | null = useMemo(
    () =>
      allDigital || !checkout.cep
        ? null
        : quoteShipping({
            cep: checkout.cep,
            itemPrice: physical,
            shipping: config.shipping,
            modules: config.modules,
            storeAddress: config.legal.address,
          }),
    [allDigital, checkout.cep, physical, config],
  );

  const pickupAvailable = !!config.modules.retiradaLocal && !allDigital;

  let selected: SelectedShipping | null = null;
  if (!allDigital && checkout.shippingId === "pickup" && pickupAvailable) {
    selected = { id: "pickup", kind: "pickup", label: "Retirar na loja", price: 0 };
  } else if (!allDigital && checkout.shippingId && quote?.status === "ok") {
    const option = quote.options.find((o) => o.id === checkout.shippingId);
    if (option) selected = { id: option.id, kind: "ship", label: option.label, price: option.price, deadline: option.deadline };
  }

  const shipping = selected?.price ?? 0;
  const totalsFor = (method: PaymentMethod) =>
    computeTotals({ subtotal, couponDiscount, shipping, method, descontoPix: config.modules.descontoPix });

  return {
    lines,
    subtotal,
    physicalSubtotal: physical,
    allDigital,
    checkout,
    coupon,
    couponDiscount,
    quote,
    pickupAvailable,
    selected,
    /** Itens indisponíveis ou com estoque menor que a quantidade: o checkout não finaliza enquanto houver. */
    blockers,
    /** Pode seguir para o checkout: carrinho com itens, sem item indisponível e entrega escolhida (dispensada só para carrinho 100% digital). */
    canContinue: lines.length > 0 && blockers.length === 0 && (allDigital || selected !== null),
    totalsFor,
    config,
  };
}
