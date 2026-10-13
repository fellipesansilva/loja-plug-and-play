import type { Preset } from "@/domain/types";
import { config } from "./config";
import { categories, products } from "./products";
import { orders } from "./orders";
import { coupons } from "./coupons";
import sampleCsv from "./sample.csv";

export const tramaStudio: Preset = {
  id: "trama-studio",
  config,
  categories,
  products,
  orders,
  coupons,
  sampleCsv,
};
