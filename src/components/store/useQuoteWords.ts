"use client";

import { cartWords, type CartWords } from "@/lib/cart-words";
import { useDemoStore } from "@/store/demo-store";

/** Loja em modo orçamento (`modules.orcamento`): sem preço, carrinho nem checkout. */
export function useQuoteMode(): boolean {
  return useDemoStore((s) => s.config.modules.orcamento?.enabled === true);
}

/**
 * Textos da lista de orçamento, no mesmo esquema do cartWords (rótulo e gênero vêm do preset: "Lista de orçamento", feminino),
 * com o texto do botão do produto vindo de `config.quote.addLabel`.
 */
export function useQuoteWords(): CartWords {
  const quote = useDemoStore((s) => s.config.quote);
  const base = cartWords(quote?.listLabel, quote?.listGender);
  return quote ? { ...base, add: quote.addLabel } : base;
}
