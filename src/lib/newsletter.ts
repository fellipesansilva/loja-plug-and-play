import type { NewsletterConfig } from "@/domain/types";

export type NewsletterResult = { ok: true; email: string } | { ok: false; field: "email" | "consent"; message: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Inscrição na newsletter. A caixa de consentimento nasce desmarcada e é obrigatória: sem ela o envio é recusado com a mensagem
 * do preset (LGPD: o consentimento é uma escolha ativa, nunca presumida).
 */
export function validateNewsletter(input: { email: string; consent: boolean }, cfg: NewsletterConfig): NewsletterResult {
  const email = input.email.trim();
  if (!EMAIL.test(email)) return { ok: false, field: "email", message: cfg.invalidEmail };
  if (!input.consent) return { ok: false, field: "consent", message: cfg.refusal };
  return { ok: true, email };
}

/** Chave onde os e-mails de demonstração ficam (só no navegador, por preset). */
export function newsletterKeyFor(slug: string): string {
  return `loja-newsletter-v1-${slug}`;
}
