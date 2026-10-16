import type { QuoteRequest, QuoteStatus } from "@/domain/types";

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  nova: "Nova",
  em_analise: "Em análise",
  orcamento_enviado: "Orçamento enviado",
  ganho: "Ganho",
  perdido: "Perdido",
};

/** Próxima etapa: nova → em análise → orçamento enviado → ganho. Ganho e perdido são finais. */
export function nextQuoteStatus(status: QuoteStatus): QuoteStatus | null {
  switch (status) {
    case "nova":
      return "em_analise";
    case "em_analise":
      return "orcamento_enviado";
    case "orcamento_enviado":
      return "ganho";
    default:
      return null;
  }
}

/** "Perdido" pode ser marcado de nova, em análise ou orçamento enviado. */
export function canMarkLost(status: QuoteStatus): boolean {
  return status === "nova" || status === "em_analise" || status === "orcamento_enviado";
}

export function isValidQuoteTransition(status: QuoteStatus, to: QuoteStatus): boolean {
  return to === "perdido" ? canMarkLost(status) : nextQuoteStatus(status) === to;
}

export function applyQuoteStatus(q: QuoteRequest, status: QuoteStatus, at: Date): QuoteRequest {
  return { ...q, status, history: [...q.history, { status, at: at.toISOString() }] };
}
