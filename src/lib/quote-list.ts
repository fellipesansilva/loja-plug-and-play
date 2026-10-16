import { QUOTE_NOTE_MAX, type QuoteListItem } from "@/domain/types";
import { clampQty } from "./quote";

/** Mensagem quando a configuração (observação gerada) passa do limite. Nada é cortado: o item não entra. */
export const CONFIG_TOO_LONG = "A configuração ficou longa demais. Encurte o texto.";

export type AddConfiguredResult = { ok: true; list: QuoteListItem[] } | { ok: false; error: string; list: QuoteListItem[] };

/** Próximo id de linha configurada do produto: "<produto>#1", "<produto>#2"... (nunca igual ao id de um item comum, que é só o produto). */
export function nextConfiguredId(list: readonly QuoteListItem[], productId: string): string {
  let max = 0;
  for (const item of list) {
    if (item.productId !== productId || !item.configurado) continue;
    const n = Number(item.id.split("#")[1]);
    if (Number.isInteger(n) && n > max) max = n;
  }
  return `${productId}#${max + 1}`;
}

/**
 * Adiciona um item configurado. Cada configuração é uma linha própria; a mesma configuração (mesmo texto de observação, do mesmo
 * produto) soma a quantidade na linha que já existe. Observação acima de 500 caracteres: recusa, sem cortar.
 */
export function addConfiguredToList(list: QuoteListItem[], productId: string, note: string, qty = 1): AddConfiguredResult {
  if (note.length > QUOTE_NOTE_MAX) return { ok: false, error: CONFIG_TOO_LONG, list };
  const n = clampQty(qty);
  const same = list.find((i) => i.configurado && i.productId === productId && i.note === note);
  if (same) return { ok: true, list: list.map((i) => (i === same ? { ...i, qty: clampQty(i.qty + n) } : i)) };
  return { ok: true, list: [...list, { id: nextConfiguredId(list, productId), productId, qty: n, note, configurado: true }] };
}

/**
 * Formato antigo (v8): { productId, qty, note } sem id. Cada item recebe id = productId e configurado = false (sem perda de dados);
 * itens que já têm id e a marca ficam como estão.
 */
export function normalizeQuoteList(raw: unknown): QuoteListItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((r): QuoteListItem[] => {
    if (!r || typeof r !== "object" || typeof (r as { productId?: unknown }).productId !== "string") return [];
    const x = r as Partial<QuoteListItem> & { productId: string };
    return [
      {
        id: typeof x.id === "string" && x.id ? x.id : x.productId,
        productId: x.productId,
        qty: clampQty(typeof x.qty === "number" ? x.qty : 1),
        note: typeof x.note === "string" ? x.note : "",
        configurado: x.configurado === true,
      },
    ];
  });
}
