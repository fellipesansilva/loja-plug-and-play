"use client";

import { useState } from "react";
import { PageTitle } from "@/components/store/PageTitle";
import { StoreLink as Link } from "@/components/store/StoreLink";
import { QUOTE_NOTE_MAX, type QuoteRequest } from "@/domain/types";
import { isListed } from "@/lib/product";
import { QUOTE_MAX_QTY, clampQty } from "@/lib/quote";
import { useDemoStore } from "@/store/demo-store";
import { useHydrated } from "@/store/use-hydrated";
import { MinusIcon, PlusIcon } from "./Icons";
import { QuoteForm } from "./QuoteForm";
import { StoreImage } from "./StoreImage";
import { useQuoteWords } from "./useQuoteWords";

const stepper = "inline-flex size-11 items-center justify-center rounded-full border border-border bg-background disabled:opacity-40";

/** Página da lista de orçamento: itens com quantidade e observação, e o formulário de envio. */
export function QuoteListView() {
  const hydrated = useHydrated();
  const words = useQuoteWords();
  const intro = useDemoStore((s) => s.config.quote?.intro ?? "");
  const quoteList = useDemoStore((s) => s.quoteList);
  const products = useDemoStore((s) => s.products);
  const categories = useDemoStore((s) => s.categories);
  const setQuoteQty = useDemoStore((s) => s.setQuoteQty);
  const setQuoteNote = useDemoStore((s) => s.setQuoteNote);
  const removeFromQuote = useDemoStore((s) => s.removeFromQuote);
  const [sent, setSent] = useState<QuoteRequest | null>(null);

  const lines = quoteList.flatMap((item) => {
    const product = products.find((p) => p.id === item.productId && isListed(p));
    return product ? [{ item, product }] : [];
  });

  const title = words.name;

  if (lines.length === 0) {
    return (
      <section className="mx-auto w-full max-w-5xl px-md py-lg">
        <PageTitle title={title} />
        <h1 className="text-3xl">{title}</h1>
        {sent ? (
          <div role="status" data-testid="quote-sent" className="mt-md rounded-lg border border-border bg-surface p-lg">
            <h2 className="text-xl">Pedido de orçamento enviado</h2>
            <p className="mt-sm">
              Protocolo: <strong data-testid="quote-protocol">{sent.id}</strong>
            </p>
            <p className="mt-xs text-sm text-muted">
              Recebemos {sent.items.length} {sent.items.length === 1 ? "item" : "itens"}. Respondemos para {sent.contact.email} e para o WhatsApp {sent.contact.whatsapp} com a proposta
              comercial. Esta é uma simulação: nada foi enviado de verdade.
            </p>
            <Link href="/" className="mt-md inline-flex min-h-11 items-center rounded-button bg-primary px-lg font-bold text-background">
              Voltar à loja
            </Link>
          </div>
        ) : (
          <div className="mt-md rounded-lg border border-border bg-surface p-lg text-center" data-testid="quote-empty">
            <p className="font-medium">{hydrated ? words.empty : "Carregando…"}</p>
            {hydrated && (
              <Link
                href={categories[0] ? `/categoria/${categories[0].slug}` : "/"}
                className="mt-md inline-flex min-h-11 items-center rounded-button bg-primary px-lg font-bold text-background"
              >
                Ver produtos
              </Link>
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-md py-lg">
      <PageTitle title={title} />
      <h1 className="text-3xl">{title}</h1>
      <p className="mt-xs max-w-[40rem] text-muted">{intro}</p>

      <ul className="mt-md flex flex-col gap-sm" aria-label="Itens" data-testid="quote-lines">
        {lines.map(({ item, product }) => (
          <li key={product.id} data-testid="quote-line" data-product-id={product.id} className="flex gap-3 rounded-lg border border-border bg-surface p-3">
            <Link href={`/produto/${product.slug}`} className="relative block size-20 shrink-0 overflow-hidden rounded-md bg-border">
              <StoreImage image={product.images[0]} sizes="80px" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/produto/${product.slug}`} className="inline-block py-1 font-bold leading-snug">
                {product.name}
              </Link>
              <p className="text-sm text-muted">SKU: {product.sku}</p>

              <div className="mt-sm flex items-center gap-xs" role="group" aria-label={`Quantidade de ${product.name}`}>
                <button type="button" aria-label={`Diminuir quantidade de ${product.name}`} disabled={item.qty <= 1} onClick={() => setQuoteQty(product.id, item.qty - 1)} className={stepper}>
                  <MinusIcon />
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={QUOTE_MAX_QTY}
                  value={item.qty}
                  aria-label={`Quantidade de ${product.name} (número)`}
                  data-testid="quote-line-qty"
                  onChange={(e) => setQuoteQty(product.id, clampQty(Number(e.target.value)))}
                  className="h-11 w-20 rounded-md border border-border bg-background text-center text-base font-extrabold"
                />
                <button type="button" aria-label={`Aumentar quantidade de ${product.name}`} disabled={item.qty >= QUOTE_MAX_QTY} onClick={() => setQuoteQty(product.id, item.qty + 1)} className={stepper}>
                  <PlusIcon />
                </button>
              </div>

              <div className="mt-sm">
                <label htmlFor={`nota-${product.id}`} className="text-sm font-bold">
                  Observações de {product.name}
                </label>
                <textarea
                  id={`nota-${product.id}`}
                  rows={2}
                  maxLength={QUOTE_NOTE_MAX}
                  value={item.note}
                  placeholder="Medidas, cor, aplicação…"
                  onChange={(e) => setQuoteNote(product.id, e.target.value)}
                  data-testid="quote-line-note"
                  className="mt-xs w-full rounded-md border border-border bg-background p-sm text-base"
                />
                <p className="text-right text-xs text-muted" data-testid="quote-note-count">
                  {item.note.length}/{QUOTE_NOTE_MAX}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeFromQuote(product.id)}
                aria-label={`Remover ${product.name}`}
                className="inline-flex min-h-11 items-center text-sm text-muted underline"
              >
                Remover
              </button>
            </div>
          </li>
        ))}
      </ul>

      <QuoteForm
        lines={lines.map(({ item, product }) => ({ name: product.name, sku: product.sku, qty: item.qty, note: item.note }))}
        onSent={(request) => setSent(request)}
      />
    </section>
  );
}
