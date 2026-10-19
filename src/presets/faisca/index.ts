import type { Preset } from "@/domain/types";
import { config } from "./config";
import { categories, products } from "./products";
import { coupons } from "./coupons";
import sampleCsv from "./sample.csv";

/** Faísca: loja de cursos online (demonstração) com área do aluno simulada no navegador (módulo `cursos`). */
export const faisca: Preset = {
  id: "faisca",
  shortId: "faisca",
  config,
  categories,
  products,
  orders: [],
  coupons,
  sampleCsv,
};
