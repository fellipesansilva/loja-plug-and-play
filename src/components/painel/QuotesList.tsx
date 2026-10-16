"use client";

import { useState } from "react";
import { QUOTE_STATUSES, type QuoteStatus } from "@/domain/types";
import { PageTitle } from "@/components/store/PageTitle";
import { StoreLink } from "@/components/store/StoreLink";
import { formatDateTime } from "@/lib/datetime";
import { QUOTE_STATUS_LABEL, filterQuotes } from "@/lib/quote-status";
import { useDemoStore } from "@/store/demo-store";

const control = "mt-xs h-11 w-full rounded-md border border-border bg-surface px-md text-base";

/** Solicitações de orçamento do preset (exemplos e feitas na demo). */
export function QuotesList() {
  const quotes = useDemoStore((s) => s.quotes);
  const [status, setStatus] = useState<QuoteStatus | "todos">("todos");
  const [term, setTerm] = useState("");
  const shown = filterQuotes(quotes, status, term);

  return (
    <section className="px-md py-md md:py-lg">
      <PageTitle title="Orçamentos" />
      <h1 className="text-2xl md:text-3xl">Orçamentos</h1>

      <form role="search" aria-label="Filtrar orçamentos" onSubmit={(e) => e.preventDefault()} className="mt-sm grid grid-cols-2 gap-sm md:mt-md md:max-w-[40rem] md:gap-md">
        <div>
          <label htmlFor="orc-busca" className="text-sm font-bold">
            Buscar por protocolo, nome ou empresa
          </label>
          <input id="orc-busca" type="search" value={term} onChange={(e) => setTerm(e.target.value)} className={control} />
        </div>
        <div>
          <label htmlFor="orc-status" className="text-sm font-bold">
            Status
          </label>
          <select id="orc-status" value={status} onChange={(e) => setStatus(e.target.value as QuoteStatus | "todos")} className={control}>
            <option value="todos">Todos</option>
            {QUOTE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {QUOTE_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </form>

      <p className="mt-md text-sm text-muted" role="status" data-testid="quotes-count">
        {shown.length} {shown.length === 1 ? "orçamento" : "orçamentos"}
      </p>

      {shown.length === 0 ? (
        <p className="mt-md" data-testid="quotes-empty">
          Nenhum orçamento encontrado.
        </p>
      ) : (
        <ul className="mt-sm flex flex-col gap-sm" data-testid="quotes-list">
          {shown.map((q) => (
            <li
              key={q.id}
              className="relative rounded-lg border border-border bg-surface p-md focus-within:ring-2 focus-within:ring-primary"
              data-testid="quote-row"
              data-quote-id={q.id}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-sm">
                <StoreLink
                  href={`/painel/orcamentos/${encodeURIComponent(q.id)}`}
                  className="font-bold text-primary underline after:absolute after:inset-0 after:content-['']"
                  data-testid="quote-link"
                >
                  {q.id}
                </StoreLink>
                <span className="rounded-button border border-border px-sm py-xs text-sm font-bold" data-testid="quote-row-status">
                  {QUOTE_STATUS_LABEL[q.status]}
                </span>
              </div>
              <dl className="mt-sm grid grid-cols-2 gap-x-md gap-y-xs text-sm md:grid-cols-4">
                <div>
                  <dt className="text-muted">Data</dt>
                  <dd>{formatDateTime(q.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Cliente</dt>
                  <dd>{q.contact.name}</dd>
                </div>
                <div>
                  <dt className="text-muted">Empresa</dt>
                  <dd>{q.contact.company ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Itens</dt>
                  <dd>
                    {q.items.length} {q.items.length === 1 ? "item" : "itens"}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
