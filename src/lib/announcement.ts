import type { Modules } from "@/domain/types";
import { formatBRLCompact } from "./money";

/** Mensagem da faixa de aviso gerada pelos módulos ligados; null = sem faixa. */
export function announcementMessage(modules: Modules): string | null {
  const parts: string[] = [];
  if (modules.freteGratis?.enabled) {
    parts.push(`Frete grátis acima de ${formatBRLCompact(modules.freteGratis.minValue)}`);
  }
  if (modules.retiradaLocal) parts.push("Retire na loja");
  return parts.length > 0 ? parts.join(" · ") : null;
}
