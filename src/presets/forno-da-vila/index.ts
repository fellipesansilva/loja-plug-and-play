import type { Preset } from "@/domain/types";
import { config } from "./config";
import { categories, products } from "./products";
import { orders } from "./orders";
import { coupons } from "./coupons";
import sampleCsv from "./sample.csv";

export const fornoDaVila: Preset = {
  id: "forno-da-vila",
  config,
  categories,
  products,
  orders,
  coupons,
  sampleCsv,
};
