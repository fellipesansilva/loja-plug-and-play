import type { Modules, StoreConfig, Testimonial } from "@/domain/types";

/** Módulos do diferencial (F6). Nenhum é módulo de venda: podem ficar ligados junto com o modo orçamento. */
export const EXTRA_MODULES = ["bot", "whatsapp", "depoimentos", "newsletter"] as const;
export type ExtraModule = (typeof EXTRA_MODULES)[number];

/** Dependências entre módulos do diferencial: o bot oferece o WhatsApp na resposta "não sei", então precisa do módulo whatsapp ligado. */
export const EXTRA_DEPENDS_ON: Partial<Record<ExtraModule, ExtraModule[]>> = { bot: ["whatsapp"] };

export const TESTIMONIALS_MIN = 3;
export const TESTIMONIALS_MAX = 6;

const filled = (v: unknown): boolean => typeof v === "string" && v.trim().length > 0;

/** Depoimento de cliente real só publica com `autorizado: true`; sem `real` é fictício (demonstração). */
export function testimonialProblems(items: Testimonial[]): string[] {
  const problems: string[] = [];
  if (items.length < TESTIMONIALS_MIN || items.length > TESTIMONIALS_MAX) {
    problems.push(`informe de ${TESTIMONIALS_MIN} a ${TESTIMONIALS_MAX} depoimentos; recebido: ${items.length}`);
  }
  const ids = new Set<string>();
  for (const t of items) {
    if (ids.has(t.id)) problems.push(`${t.id}: id repetido`);
    ids.add(t.id);
    if (!filled(t.name) || !filled(t.city) || !filled(t.text)) problems.push(`${t.id}: informe nome, cidade e texto`);
    if (t.real === true && t.autorizado !== true) problems.push(`${t.id}: depoimento de cliente real só publica com autorizado: true`);
  }
  return problems;
}

/** Problemas dos módulos do diferencial (usado pelo validatePreset, que derruba o build). Lista vazia = tudo certo. */
export function extraModuleProblems(cfg: StoreConfig): string[] {
  const m: Modules = cfg.modules;
  const out: string[] = [];
  const need = (ok: boolean, field: string, why: string) => {
    if (!ok) out.push(`${field}: ${why}`);
  };
  for (const [mod, deps] of Object.entries(EXTRA_DEPENDS_ON)) {
    if (m[mod as ExtraModule] === true) for (const d of deps ?? []) need(m[d] === true, `config.modules.${mod}`, `o módulo ${mod} depende do módulo ${d}: ligue os dois`);
  }
  if (m.bot === true) {
    const b = cfg.bot;
    need(
      !!b && [b.openLabel, b.title, b.badge, b.greeting, b.fallback, b.whatsappOffer, b.inputLabel, b.sendLabel, b.closeLabel].every(filled),
      "config.bot",
      "informe os textos do bot (botão, título, marca, saudação, resposta fixa e oferta do WhatsApp)",
    );
    need(
      !!b && b.topics.length >= 1 && b.topics.every((t) => filled(t.id) && filled(t.label) && filled(t.answer) && t.keywords.length > 0 && t.keywords.every(filled)),
      "config.bot.topics",
      "informe temas com id, rótulo, palavras-chave e resposta",
    );
    need(!!b && new Set(b.topics.map((t) => t.id)).size === b.topics.length, "config.bot.topics", "ids de tema repetidos");
  }
  if (m.whatsapp === true) {
    const w = cfg.whatsapp;
    need(!!w && /^\d{10,}$/.test(w.number) && typeof w.isReal === "boolean", "config.whatsapp", "informe number (só dígitos, com DDI e DDD) e isReal");
    need(!!w && [w.openLabel, w.title, w.badge, w.greeting, w.productMessage, w.demoNote, w.copyLabel, w.copiedLabel, w.closeLabel].every(filled), "config.whatsapp", "informe os textos do WhatsApp");
    need(!!w && w.productMessage.includes("{produto}"), "config.whatsapp.productMessage", "a mensagem com produto precisa conter {produto}");
    need(!!w && (w.isReal === true || /demonstra/i.test(w.badge)), "config.whatsapp.badge", "número fictício precisa da marca de demonstração");
  }
  if (m.depoimentos === true) {
    const block = cfg.homeBlocks.find((b) => b.type === "testimonials");
    need(!!block, "config.homeBlocks", "o módulo depoimentos precisa do bloco testimonials na home");
    if (block && block.type === "testimonials") {
      for (const p of testimonialProblems(block.items)) out.push(`config.homeBlocks.${block.id}.items: ${p}`);
      need(block.items.every((t) => t.real === true) || filled(block.demoLabel), `config.homeBlocks.${block.id}.demoLabel`, "informe a marca de depoimento de demonstração");
    }
  }
  if (m.newsletter === true) {
    const n = cfg.newsletter;
    need(
      !!n && [n.title, n.text, n.badge, n.emailLabel, n.consentLabel, n.submitLabel, n.privacyLinkLabel, n.invalidEmail, n.refusal, n.success].every(filled),
      "config.newsletter",
      "informe os textos da newsletter (inclui a mensagem de recusa sem consentimento)",
    );
  }
  return out;
}
