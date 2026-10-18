import type { WhatsappConfig } from "@/domain/types";

/** Mensagem pré-preenchida: com produto na página usa `productMessage` ({produto} vira o nome); sem produto, a saudação. */
export function whatsappText(cfg: WhatsappConfig, productName?: string | null): string {
  const name = productName?.trim();
  return name ? cfg.productMessage.replace(/\{produto\}/g, name) : cfg.greeting;
}

/** Link do WhatsApp. Só existe com número real (`isReal`): na demonstração nada abre a conversa. */
export function whatsappUrl(cfg: WhatsappConfig, text: string): string | null {
  const digits = cfg.number.replace(/\D/g, "");
  if (!cfg.isReal || digits.length < 10) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** Produto da página: `/produto/<slug>` (já sem o prefixo do preset). */
export function productSlugOf(path: string): string | null {
  return /^\/produto\/([^/?#]+)/.exec(path)?.[1] ?? null;
}
