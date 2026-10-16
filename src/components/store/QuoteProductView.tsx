"use client";

import { useEffect, useState } from "react";
import { PageTitle } from "@/components/store/PageTitle";
import { StoreLink as Link } from "@/components/store/StoreLink";
import { isListed } from "@/lib/product";
import { QUOTE_MAX_QTY, clampQty } from "@/lib/quote";
import { useDemoStore } from "@/store/demo-store";
import { useHydrated } from "@/store/use-hydrated";
import { MinusIcon, PlusIcon } from "./Icons";
import { ProductGallery } from "./ProductGallery";
import { useQuoteWords } from "./useQuoteWords";

const stepper = "inline-flex size-11 items-center justify-center rounded-full border border-border bg-background disabled:opacity-40";

/** Página do produto da loja em orçamento: sem preço; ficha técnica em tabela, aplicações em etiquetas e botão para a lista. */
export function QuoteProductView({ slug }: { slug: string }) {
  const hydrated = useHydrated();
  const product = useDemoStore((s) => s.products.find((p) => p.slug === slug && isListed(p)));
  const category = useDemoStore((s) => s.categories.find((c) => c.id === product?.categoryId));
  const addToQuote = useDemoStore((s) => s.addToQuote);
  const words = useQuoteWords();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 5000);
    return () => clearTimeout(t);
  }, [added]);

  if (!product) {
    return (
      <section className="mx-auto w-full max-w-5xl px-md py-lg">
        <PageTitle title="Produto" />
        <h1 className="text-2xl">{hydrated ? "Produto não encontrado" : "Carregando…"}</h1>
      </section>
    );
  }

  function add() {
    if (!product) return;
    addToQuote(product.id, qty);
    setAdded(true);
  }

  return (
    <article className="mx-auto w-full max-w-5xl px-md py-lg" data-layout="quote">
      <PageTitle title={product.name} />
      {category && (
        <nav aria-label="Você está em" className="mb-md text-sm">
          <ol className="flex flex-wrap items-center gap-xs text-muted">
            <li>
              <Link href="/" className="inline-flex min-h-11 items-center underline">
                Início
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/categoria/${category.slug}`} className="inline-flex min-h-11 items-center underline">
                {category.name}
              </Link>
            </li>
          </ol>
        </nav>
      )}

      {added && (
        <div role="status" data-testid="quote-added" className="fixed inset-x-md top-md z-50 mx-auto flex max-w-[28rem] items-center justify-between gap-md rounded-md border border-border bg-surface p-md shadow-lg">
          <span className="font-medium">{words.added}</span>
          <Link href="/orcamento" className="inline-flex min-h-11 items-center font-bold text-primary underline">
            {words.view}
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-lg md:grid md:grid-cols-2 md:gap-lg">
        <ProductGallery images={product.images} />

        <div className="flex flex-col gap-md">
          <div>
            <h1 className="text-3xl leading-tight">{product.name}</h1>
            <p className="mt-xs text-sm text-muted" data-testid="product-sku">
              SKU: {product.sku}
            </p>
          </div>

          <p className="text-muted">{product.description}</p>

          {product.applications && product.applications.length > 0 && (
            <div>
              <h2 className="text-sm font-bold">Aplicações</h2>
              <ul className="mt-xs flex flex-wrap gap-sm" aria-label="Aplicações" data-testid="applications">
                {product.applications.map((a) => (
                  <li key={a} className="rounded-button border border-border bg-highlight-bg px-3 py-1 text-xs font-bold text-highlight-text">
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-md">
            <div className="flex items-center gap-xs" role="group" aria-label="Quantidade">
              <button type="button" aria-label="Diminuir quantidade" disabled={qty <= 1} onClick={() => setQty((q) => clampQty(q - 1))} className={stepper}>
                <MinusIcon />
              </button>
              <span data-testid="quote-qty" className="min-w-8 text-center font-extrabold">
                {qty}
              </span>
              <button type="button" aria-label="Aumentar quantidade" disabled={qty >= QUOTE_MAX_QTY} onClick={() => setQty((q) => clampQty(q + 1))} className={stepper}>
                <PlusIcon />
              </button>
            </div>
            <button
              type="button"
              onClick={add}
              data-testid="add-to-quote"
              className="min-h-12 min-w-0 flex-1 rounded-button bg-primary px-lg font-bold text-background"
            >
              {words.add}
            </button>
          </div>
          <p className="text-sm text-muted">
            Sem preço na loja: você monta a lista, descreve as medidas e recebe a proposta.{" "}
            <Link href="/condicoes-comerciais" className="underline">
              Condições comerciais
            </Link>
          </p>
        </div>
      </div>

      {product.attributes.length > 0 && (
        <section aria-labelledby="ficha" className="mt-lg">
          <h2 id="ficha" className="text-xl">
            Ficha técnica
          </h2>
          <div className="mt-sm overflow-x-auto rounded-md border border-border bg-surface">
            <table className="w-full text-left text-sm" data-testid="spec-table">
              <caption className="sr-only">Ficha técnica de {product.name}</caption>
              <tbody>
                {product.attributes.map((a) => (
                  <tr key={a.key} className="border-b border-border last:border-b-0">
                    <th scope="row" className="w-2/5 bg-background px-md py-sm font-bold">
                      {a.label}
                    </th>
                    <td className="px-md py-sm">{a.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </article>
  );
}
