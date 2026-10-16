"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { StoreLink as Link } from "@/components/store/StoreLink";
import type { QuoteRequest } from "@/domain/types";
import { EMPTY_CONTACT, QUOTE_MESSAGE_MAX, toContact, validateContact, whatsappMessage, whatsappUrl, type ContactForm } from "@/lib/quote";
import { maskPhone } from "@/lib/validation";
import { useDemoStore } from "@/store/demo-store";
import { CopyButton } from "./CopyButton";
import { FormField } from "./FormField";

type Line = { name: string; sku: string; qty: number; note: string };

const primary = "flex min-h-12 w-full items-center justify-center rounded-button bg-primary px-lg font-bold text-background";
const secondary = "flex min-h-12 w-full items-center justify-center rounded-button border border-border bg-surface px-lg font-bold";
const field = "mt-xs w-full rounded-md border bg-surface px-md text-base";

/** Formulário de envio do pedido de orçamento e botão do WhatsApp (mensagem pronta; sem abrir conversa quando o número não é real). */
export function QuoteForm({ lines, onSent }: { lines: Line[]; onSent: (request: QuoteRequest) => void }) {
  const config = useDemoStore((s) => s.config);
  const submitQuote = useDemoStore((s) => s.submitQuote);
  const quote = config.quote!;
  const id = useId();

  const [form, setForm] = useState<ContactForm>(EMPTY_CONTACT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusTick, setFocusTick] = useState(0);
  const [wppOpen, setWppOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const set = <K extends keyof ContactForm>(key: K, value: ContactForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (focusTick > 0) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [focusTick]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const found = validateContact(form, quote.applications);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFocusTick((t) => t + 1);
      return;
    }
    const request = submitQuote(toContact(form));
    if (request) onSent(request);
  }

  const message = whatsappMessage(config.name, lines, form.name);

  function openWhatsapp() {
    if (quote.whatsapp.isReal) window.open(whatsappUrl(quote.whatsapp.number, message), "_blank", "noopener,noreferrer");
    else setWppOpen(true);
  }

  return (
    <div className="mt-lg">
      <form ref={formRef} noValidate onSubmit={submit} className="flex max-w-[40rem] flex-col gap-md" data-testid="quote-form" aria-label="Enviar pedido de orçamento">
        <h2 className="text-xl">Seus dados</h2>
        {Object.keys(errors).length > 0 && (
          <p role="alert" className="rounded-md border border-danger p-sm text-sm font-medium text-danger" data-testid="quote-form-errors">
            Corrija os campos destacados para enviar.
          </p>
        )}
        <FormField name="quoteName" label="Nome" autoComplete="name" value={form.name} error={errors.name} onChange={(e) => set("name", e.target.value)} />
        <FormField name="quoteCompany" label="Empresa (opcional)" autoComplete="organization" value={form.company} onChange={(e) => set("company", e.target.value)} />
        <FormField name="quoteEmail" label="E-mail" type="email" autoComplete="email" value={form.email} error={errors.email} onChange={(e) => set("email", e.target.value)} />
        <FormField
          name="quoteWhatsapp"
          label="WhatsApp"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(19) 91234-5678"
          value={form.whatsapp}
          error={errors.whatsapp}
          onChange={(e) => set("whatsapp", maskPhone(e.target.value))}
        />
        <div className="grid grid-cols-[1fr_5.5rem] gap-md">
          <FormField name="quoteCity" label="Cidade de entrega" autoComplete="address-level2" value={form.city} error={errors.city} onChange={(e) => set("city", e.target.value)} />
          <FormField name="quoteState" label="UF" maxLength={2} autoComplete="address-level1" value={form.state} error={errors.state} onChange={(e) => set("state", e.target.value.toUpperCase())} />
        </div>
        <div>
          <label htmlFor={`${id}-app`} className="text-sm font-bold">
            Aplicação
          </label>
          <select
            id={`${id}-app`}
            name="quoteApplication"
            value={form.application}
            aria-invalid={errors.application ? true : undefined}
            aria-describedby={errors.application ? `${id}-app-erro` : undefined}
            onChange={(e) => set("application", e.target.value)}
            className={`${field} h-11 ${errors.application ? "border-danger" : "border-border"}`}
          >
            <option value="">Escolha a aplicação</option>
            {quote.applications.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          {errors.application && (
            <p id={`${id}-app-erro`} className="mt-xs text-sm font-medium text-danger">
              {errors.application}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={`${id}-msg`} className="text-sm font-bold">
            Mensagem (opcional)
          </label>
          <textarea
            id={`${id}-msg`}
            name="quoteMessage"
            rows={4}
            maxLength={QUOTE_MESSAGE_MAX}
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            className={`${field} border-border p-md`}
          />
        </div>

        <p className="text-sm text-muted" data-testid="quote-data-notice">
          Usamos estes dados só para responder ao seu pedido de orçamento. Saiba mais na{" "}
          <Link href="/privacidade" className="underline">
            Política de Privacidade
          </Link>
          .
        </p>

        <button type="submit" className={primary} data-testid="quote-submit">
          Enviar pedido de orçamento
        </button>
        <button type="button" className={secondary} onClick={openWhatsapp} data-testid="quote-whatsapp">
          Enviar pelo WhatsApp
        </button>
      </form>

      {wppOpen && <WhatsappDialog message={message} number={quote.whatsapp.number} onClose={() => setWppOpen(false)} />}
    </div>
  );
}

/** Demonstração: o número não é real, então nada abre a conversa. Mostra a mensagem pronta e o botão Copiar. */
function WhatsappDialog({ message, number, onClose }: { message: string; number: string; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
  }, []);
  const digits = number.replace(/\D/g, "");
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-text/50 p-md md:items-center" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="wpp-titulo" data-testid="whatsapp-dialog" className="flex max-h-[90vh] w-full max-w-[34rem] flex-col gap-sm overflow-auto rounded-lg border border-border bg-surface p-md shadow-lg">
        <h2 id="wpp-titulo" className="text-xl">
          Mensagem para o WhatsApp
        </h2>
        <p className="text-sm text-muted">
          Demonstração: o número da loja é fictício, então nenhuma conversa foi aberta. Copie a mensagem e envie para o WhatsApp {digits.replace(/^(\d{2})(\d{2})(\d{5})(\d{4})$/, "+$1 ($2) $3-$4")}.
        </p>
        <pre data-testid="whatsapp-message" className="whitespace-pre-wrap rounded-md border border-border bg-background p-sm text-sm">
          {message}
        </pre>
        <div className="flex flex-wrap gap-sm">
          <CopyButton text={message} />
          <button ref={closeRef} type="button" onClick={onClose} className="inline-flex min-h-11 items-center rounded-button border border-border bg-surface px-md text-sm font-bold">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
