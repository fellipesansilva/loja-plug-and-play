import type { Coupon, Money } from "@/domain/types";

export type CouponResult =
  | { status: "applied"; coupon: Coupon; discount: Money }
  | { status: "expired" }
  | { status: "invalid" }
  | { status: "below-min"; minValue: Money };

/**
 * Valida um código de cupom contra o subtotal. O código não diferencia maiúsculas/minúsculas.
 * Desconto percentual é arredondado ao centavo; nenhum desconto passa do subtotal.
 */
export function applyCoupon(code: string, coupons: Coupon[], subtotal: Money, now: Date = new Date()): CouponResult {
  const wanted = code.trim().toLowerCase();
  const coupon = wanted ? coupons.find((c) => c.code.toLowerCase() === wanted) : undefined;
  if (!coupon || !coupon.active) return { status: "invalid" };
  if (coupon.expiresAt && new Date(coupon.expiresAt) <= now) return { status: "expired" };
  if (coupon.minValue !== undefined && subtotal < coupon.minValue) {
    return { status: "below-min", minValue: coupon.minValue };
  }
  const raw = coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  return { status: "applied", coupon, discount: Math.max(0, Math.min(raw, subtotal)) };
}
