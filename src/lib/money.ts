import type { Money } from "@/domain/types";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Único ponto de formatação monetária: recebe centavos inteiros. */
export function formatBRL(cents: Money): string {
  return brl.format(cents / 100);
}

/** Converte texto de reais ("319,90" ou "319.90") em centavos. */
export function parseBRLToCents(text: string): number {
  const normalized = text.trim().replace(/\./g, text.includes(",") ? "" : ".").replace(",", ".");
  return Math.round(parseFloat(normalized) * 100);
}
