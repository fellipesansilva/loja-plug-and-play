import type { Coupon } from "@/domain/types";

export const coupons: Coupon[] = [
  { code: "ORBITA10", type: "percent", value: 10, minValue: 20000, active: true },
  { code: "LANCAMENTO", type: "percent", value: 15, active: true, expiresAt: "2025-01-31T23:59:59-03:00" },
];
