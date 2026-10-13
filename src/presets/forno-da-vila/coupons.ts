import type { Coupon } from "@/domain/types";

export const coupons: Coupon[] = [
  { code: "VILA15", type: "percent", value: 15, minValue: 5000, active: true },
  { code: "NATAL2023", type: "fixed", value: 1000, active: true, expiresAt: "2023-12-31T23:59:59-03:00" },
];
