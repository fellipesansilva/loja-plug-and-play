import { notFound } from "next/navigation";
import { presetBySlug } from "@/presets";

/** O preset desta URL está em modo orçamento (`modules.orcamento`)? Preset desconhecido: não. */
export function isQuotePreset(slug: string): boolean {
  return presetBySlug(slug)?.config.modules.orcamento?.enabled === true;
}

/**
 * Guarda de rota (servidor): páginas de venda (carrinho, checkout, pedido, arrependimento, trocas) não existem em loja em orçamento,
 * e as de orçamento (lista, condições comerciais) não existem em loja de venda. Fora disso, 404 de verdade.
 */
export function requireMode(slug: string, mode: "sales" | "quote"): void {
  if (isQuotePreset(slug) !== (mode === "quote")) notFound();
}
