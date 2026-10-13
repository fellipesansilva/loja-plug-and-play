import type { Coupon } from "@/domain/types";

export const coupons: Coupon[] = [
  { code: "BEMVINDA10", type: "percent", value: 10, minValue: 10000, active: true },
  { code: "VERAO2024", type: "percent", value: 20, active: true, expiresAt: "2024-03-01T00:00:00-03:00" },
];
