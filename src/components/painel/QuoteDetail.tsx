"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { QuoteRequest } from "@/domain/types";
import { PageTitle } from "@/components/store/PageTitle";
import { StoreLink } from "@/components/store/StoreLink";
import { formatDateTime } from "@/lib/datetime";
import { QUOTE_STATUS_LABEL, canMarkLost, nextQuoteStatus } from "@/lib/quote-status";
import { useDemoStore } from "@/store/demo-store";
import { useHydrated } from "@/store/use-hydrated";

function Card({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-titulo`} data-testid={id} className="rounded-lg border border-border bg-surface p-md">
      <h2 id={`${id}-titulo`} className="text-lg">
        {title}
      </h2>
      <div className="mt-sm text-sm">{children}</div>
    </section>
  );
}

const primary = "inline-flex min-h-11 items-center justify-center rounded-button bg-primary px-lg font-bold text-background";
const ghost = "inline-flex min-h-11 items-center justify-center rounded-button border border-border bg-surface px-lg font-bold";
const danger = "inline-flex min-h-11 items-center justify-center rounded-button border border-danger bg-surface px-lg font-bold text-danger";

/** nova → em análise → orçamento enviado → ganho; "perdido" (com confirmação) de nova, em análise ou orçamento enviado. */
function QuoteStatusActions({ quote }: { quote: QuoteRequest }) {
  const changeQuoteStatus = useDemoStore((s) => s.changeQuoteStatus);
  const [confirming, setConfirming] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  const next = nextQuoteStatus(quote.status);
  const lost = canMarkLost(quote.status);
  if (!next && !lost) {
    return (
      <p className="mt-md text-sm text-muted" data-testid="quote-status-final">
        Esta solicitação está {QUOTE_STATUS_LABEL[quote.status].toLowerCase()}: não há próximas etapas.
      </p>
    );
  }
  return (
    <section aria-labelledby="orc-acoes" className="mt-md rounded-lg border border-border bg-surface p-md" data-testid="quote-status-actions">
      <h2 id="orc-acoes" className="text-lg">
        Mudar status
      </h2>
      <div className="mt-sm flex flex-wrap gap-sm">
        {next && (
          <button type="button" className={primary} data-testid={`quote-status-to-${next}`} onClick={() => changeQuoteStatus(quote.id, next)}>
            Marcar como {QUOTE_STATUS_LABEL[next]}
          </button>
        )}
        {lost && !confirming && (
          <button type="button" className={danger} data-testid="quote-lost" onClick={() => setConfirming(true)}>
            Marcar como perdido
          </button>
        )}
      </div>
      {confirming && (
        <div
          role="alertdialog"
          aria-labelledby="perdido-titulo"
          aria-describedby="perdido-texto"
          data-testid="lost-confirm"
          className="mt-md rounded-md border border-danger p-md"
          onKeyDown={(e) => e.key === "Escape" && setConfirming(false)}
        >
          <p id="perdido-titulo" className="font-bold">
            Marcar {quote.id} como perdido?
          </p>
          <p id="perdido-texto" className="mt-xs text-sm">
            O status passa para Perdido e não dá para desfazer.
          </p>
          <div className="mt-sm flex flex-wrap gap-sm">
            <button
              ref={confirmRef}
              type="button"
              className={danger}
              data-testid="lost-confirm-yes"
              onClick={() => {
                changeQuoteStatus(quote.id, "perdido");
                setConfirming(false);
              }}
            >
              Sim, marcar como perdido
            </button>
            <button type="button" className={ghost} onClick={() => setConfirming(false)}>
              Voltar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/** Detalhe da solicitação: contato, itens com observações, histórico de status e as ações de status. */
export function QuoteDetail({ id }: { id: string }) {
  const hydrated = useHydrated();
  const quote = useDemoStore((s) => s.quotes.find((q) => q.id === id));

  const back = (
    <StoreLink href="/painel/orcamentos" className="inline-flex min-h-11 items-center text-primary underline">
      ← Orçamentos
    </StoreLink>
  );

  if (!quote) {
    return (
      <section className="px-md py-lg">
        <PageTitle title="Orçamento" />
        {back}
        <h1 className="text-3xl">{hydrated ? "Orçamento não encontrado" : "Carregando…"}</h1>
      </section>
    );
  }

  const { contact } = quote;
  return (
    <article className="px-md py-lg">
      <PageTitle title={`Orçamento ${quote.id}`} />
      {back}
      <div className="mt-xs flex flex-wrap items-baseline gap-md">
        <h1 className="text-3xl" data-testid="detail-id">
          {quote.id}
        </h1>
        <span className="rounded-button border border-border px-sm py-xs text-sm font-bold" data-testid="detail-status">
          {QUOTE_STATUS_LABEL[quote.status]}
        </span>
      </div>
      <p className="mt-xs text-sm text-muted">Recebido em {formatDateTime(quote.createdAt)}</p>

      <QuoteStatusActions quote={quote} />

      <div className="mt-md grid gap-md md:grid-cols-2">
        <Card id="quote-contact" title="Contato">
          <p data-testid="contact-name">{contact.name}</p>
          {contact.company && <p data-testid="contact-company">{contact.company}</p>}
          <p>{contact.email}</p>
          <p>WhatsApp {contact.whatsapp}</p>
          <p>
            Entrega: {contact.city}/{contact.state}
          </p>
          <p>
            Aplicação: <strong data-testid="contact-application">{contact.application}</strong>
          </p>
          {contact.message && (
            <p className="mt-xs" data-testid="contact-message">
              “{contact.message}”
            </p>
          )}
        </Card>

        <Card id="quote-items" title="Itens">
          <ul className="flex flex-col gap-sm">
            {quote.items.map((i, n) => (
              <li key={`${i.productId}-${n}`} className="border-b border-border pb-sm last:border-b-0 last:pb-0" data-testid="quote-item">
                <p className="font-bold">
                  {i.qty}× {i.name}
                </p>
                <p className="text-muted">SKU {i.sku}</p>
                {i.note && (
                  <p className="mt-xs" data-testid="quote-item-note">
                    Observações: {i.note}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card id="quote-history" title="Histórico de status">
          <ol className="flex flex-col gap-xs">
            {quote.history.map((h, i) => (
              <li key={`${h.status}-${h.at}-${i}`} className="flex justify-between gap-md" data-testid="history-entry">
                <span className="font-bold">{QUOTE_STATUS_LABEL[h.status]}</span>
                <span className="text-muted">{formatDateTime(h.at)}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </article>
  );
}
