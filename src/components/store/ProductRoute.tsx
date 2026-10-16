"use client";

import { ProductView } from "./ProductView";
import { QuoteProductView } from "./QuoteProductView";
import { useQuoteMode } from "./useQuoteWords";

/** Página do produto: com `modules.orcamento` ligado vira a página sem preço, com botão para a lista de orçamento. */
export function ProductRoute({ slug }: { slug: string }) {
  return useQuoteMode() ? <QuoteProductView slug={slug} /> : <ProductView slug={slug} />;
}
