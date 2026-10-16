import type { Preset } from "@/domain/types";
import { config } from "./config";
import { categories, products } from "./products";
import { quotes } from "./quotes";
import sampleCsv from "./sample.csv";

export const arcaInflaveis: Preset = {
  id: "arca-inflaveis",
  shortId: "arca",
  config,
  categories,
  products,
  // Loja em orçamento: sem pedidos nem cupons.
  orders: [],
  coupons: [],
  quotes,
  sampleCsv,
};
