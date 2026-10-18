"use client";

import { useId, useState } from "react";
import { StoreLink } from "@/components/store/StoreLink";
import { newsletterKeyFor, validateNewsletter } from "@/lib/newsletter";
import { safeStorage } from "@/store/safe-storage";
import { useDemoStore } from "@/store/demo-store";
import { usePreset } from "@/store/PresetProvider";

/**
 * Newsletter no rodapé (módulo `newsletter`). A caixa de consentimento nasce desmarcada; sem ela o envio é recusado.
 * Nada é enviado: o e-mail fica só no navegador (demonstração).
 */
export default function Newsletter() {
  const cfg = useDemoStore((s) => s.config.newsletter);
  const { slug } = usePreset();
  const id = useId();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<{ field: "email" | "consent"; message: string } | null>(null);
  const [done, setDone] = useState(false);
  if (!cfg) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = validateNewsletter({ email, consent }, cfg!);
    if (!r.ok) {
      setError({ field: r.field, message: r.message });
      setDone(false);
      return;
    }
    try {
      const key = newsletterKeyFor(slug);
      const list = JSON.parse(safeStorage.getItem(key) ?? "[]") as { email: string; at: string }[];
      safeStorage.setItem(key, JSON.stringify([...list.filter((x) => x.email !== r.email), { email: r.email, at: new Date().toISOString() }]));
    } catch {
      // armazenamento indisponível: a confirmação continua valendo para a demonstração
    }
    setError(null);
    setDone(true);
    setEmail("");
    setConsent(false);
  }

  return (
    <section aria-labelledby={`${id}-titulo`} data-testid="newsletter" className="mb-lg rounded-md border border-border bg-surface p-md text-text">
      <div className="flex flex-wrap items-center gap-sm">
        <h2 id={`${id}-titulo`} className="text-xl">
          {cfg.title}
        </h2>
        <span data-testid="newsletter-marca" className="rounded-button border border-border bg-highlight-bg px-3 py-1 text-xs font-bold text-highlight-text">
          {cfg.badge}
        </span>
      </div>
      <p className="mt-xs text-sm">{cfg.text}</p>
      <form noValidate onSubmit={submit} className="mt-sm flex max-w-[34rem] flex-col gap-sm">
        <div>
          <label htmlFor={`${id}-email`} className="text-sm font-bold">
            {cfg.emailLabel}
          </label>
          <input
            id={`${id}-email`}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={error?.field === "email" ? true : undefined}
            aria-describedby={error?.field === "email" ? `${id}-erro` : undefined}
            className="mt-xs h-11 w-full rounded-md border border-border bg-background px-md text-base aria-[invalid=true]:border-danger"
          />
        </div>
        <label className="flex items-start gap-sm text-sm">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} data-testid="newsletter-consentimento" className="mt-[3px] size-5 shrink-0" />
          <span>
            {cfg.consentLabel}{" "}
            <StoreLink href="/privacidade" className="underline">
              {cfg.privacyLinkLabel}
            </StoreLink>
            .
          </span>
        </label>
        {error && (
          <p id={`${id}-erro`} role="alert" data-testid="newsletter-erro" className="text-sm font-bold text-danger">
            {error.message}
          </p>
        )}
        {done && (
          <p role="status" data-testid="newsletter-confirmacao" className="text-sm font-bold text-success">
            {cfg.success}
          </p>
        )}
        <button type="submit" className="min-h-11 w-fit rounded-button bg-primary px-lg font-bold text-background">
          {cfg.submitLabel}
        </button>
      </form>
    </section>
  );
}
