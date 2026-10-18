"use client";

import { useEffect, useState } from "react";
import { PageTitle } from "@/components/store/PageTitle";
import { StoreLink as Link } from "@/components/store/StoreLink";
import { isListed } from "@/lib/product";
import { QUOTE_MAX_QTY, clampQty } from "@/lib/quote";
import { useDemoStore } from "@/store/demo-store";
import { useHydrated } from "@/store/use-hydrated";
import { MinusIcon, PlusIcon } from "./Icons";
import dynamic from "next/dynamic";
import { useAfterLcp } from "@/lib/after-lcp";
import { Band, CaseCard, Heading } from "./SegmentBlocks";
import { ProductGallery } from "./ProductGallery";
import { useQuoteWords } from "./useQuoteWords";

// As ferramentas do orçamento ficam abaixo da primeira tela: o código delas só é pedido depois que a foto principal foi pintada
// (useAfterLcp), para não disputar banda com o LCP. Até lá o espaço fica reservado com a altura das ferramentas (sem salto de layout).
// Alturas medidas nas páginas (400 a 1440 px): configurador 851 a 806 px no celular e 593 a 566 px no desktop; dimensionador 550 e 358 px.
// Ficam um pouco abaixo da altura real: o que muda de lugar quando a ferramenta chega está abaixo da primeira tela.
const PORTICO_SLOT = "min-h-[50rem] md:min-h-[35rem]";
const DIMENSIONADOR_SLOT = "min-h-[34rem] md:min-h-[22rem]";

function ToolSlot({ className }: { className: string }) {
  return <div aria-hidden="true" data-testid="ferramenta-reservada" className={className} />;
}

const Dimensionador = dynamic(() => import("@/components/orcamento/Dimensionador").then((m) => m.Dimensionador), {
  ssr: false,
  loading: () => <ToolSlot className={DIMENSIONADOR_SLOT} />,
});
const PorticoConfigurador = dynamic(() => import("@/components/orcamento/PorticoConfigurador").then((m) => m.PorticoConfigurador), {
  ssr: false,
  loading: () => <ToolSlot className={PORTICO_SLOT} />,
});

const stepper ="inline-flex size-11 items-center justify-center rounded-full border border-border bg-background disabled:opacity-40";

/** Página do produto da loja em orçamento: sem preço; ficha técnica em tabela, aplicações em etiquetas e botão para a lista. */
export function QuoteProductView({ slug }: { slug: string }) {
  const hydrated = useHydrated();
  const product = useDemoStore((s) => s.products.find((p) => p.slug === slug && isListed(p)));
  const category = useDemoStore((s) => s.categories.find((c) => c.id === product?.categoryId));
  const addToQuote = useDemoStore((s) => s.addToQuote);
  const sectors = useDemoStore((s) => s.config.sectors);
  const cases = useDemoStore((s) => s.config.cases);
  const blocks = useDemoStore((s) => s.config.orcamentoBlocks);
  const words = useQuoteWords();
  const toolsReady = useAfterLcp();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 5000);
    return () => clearTimeout(t);
  }, [added]);

  if (!product) {
    return (
      <section className="mx-auto w-full max-w-page px-md py-lg">
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

  const productSectors = (product.sectorSlugs ?? []).flatMap((slug) => sectors?.find((x) => x.slug === slug) ?? []);
  // Case do próprio produto; sem ele, o case do primeiro setor do produto.
  const relatedCase =
    cases?.find((c) => c.productId === product.id) ?? cases?.find((c) => c.id === productSectors.find((x) => x.caseId)?.caseId);

  return (
    <div className="max-md:pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]">
      <article className="mx-auto w-full max-w-page px-md py-lg" data-layout="quote">
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
          <div
            role="status"
            data-testid="quote-added"
            className="fixed inset-x-md top-md z-50 mx-auto flex max-w-[28rem] items-center justify-between gap-md rounded-md border border-border bg-surface p-md shadow-lg"
          >
            <span className="font-medium">{words.added}</span>
            <Link href="/orcamento" className="inline-flex min-h-11 items-center font-bold text-primary underline">
              {words.view}
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-lg md:grid md:grid-cols-2 md:gap-lg">
          <ProductGallery images={product.images} gutterRem={2} />

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
                    <li
                      key={a}
                      className="rounded-button border border-border bg-highlight-bg px-3 py-1 text-xs font-bold text-highlight-text"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {productSectors.length > 0 && (
              <div>
                <h2 className="text-sm font-bold">Setores que usam</h2>
                <ul className="mt-xs flex flex-wrap gap-sm" data-testid="product-sectors">
                  {productSectors.map((x) => (
                    <li key={x.slug}>
                      <Link
                        href={`/setor/${x.slug}`}
                        className="inline-flex min-h-11 items-center rounded-button bg-primary px-md text-sm font-bold text-background hover:opacity-90"
                      >
                        {x.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* No celular a barra de quantidade e o botão ficam fixos na base da tela. */}
            <div
              data-testid="quote-bar"
              className="flex flex-wrap items-center gap-md max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:flex-nowrap max-md:gap-sm max-md:bg-surface max-md:px-md max-md:pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] max-md:pt-sm max-md:shadow-[0_-4px_16px_rgba(0,0,0,0.12)]"
            >
              <div className="flex items-center gap-xs" role="group" aria-label="Quantidade">
                <button
                  type="button"
                  aria-label="Diminuir quantidade"
                  disabled={qty <= 1}
                  onClick={() => setQty((q) => clampQty(q - 1))}
                  className={stepper}
                >
                  <MinusIcon />
                </button>
                <span data-testid="quote-qty" className="min-w-8 text-center font-extrabold">
                  {qty}
                </span>
                <button
                  type="button"
                  aria-label="Aumentar quantidade"
                  disabled={qty >= QUOTE_MAX_QTY}
                  onClick={() => setQty((q) => clampQty(q + 1))}
                  className={stepper}
                >
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
      </article>

      {/* Ferramentas do orçamento (config.orcamentoBlocks): só quando ligadas e para o produto-alvo de cada uma. */}
    {blocks?.ativos && blocks.porticoConfigurador?.alvoProduto === product.id && (toolsReady ? <PorticoConfigurador product={product} /> : <ToolSlot className={PORTICO_SLOT} />)}
    {blocks?.ativos && blocks.dimensionador && (blocks.dimensionador.fechado.produto === product.id || blocks.dimensionador.aberto.produto === product.id) && (
      toolsReady ? <Dimensionador product={product} /> : <ToolSlot className={DIMENSIONADOR_SLOT} />
    )}

    {product.benefits && product.benefits.length > 0 && (
        <Band id="beneficios" tone="dark">
          <h2 id="bloco-beneficios" className="sr-only">
            Benefícios
          </h2>
          <dl className="grid gap-lg md:grid-cols-3" data-testid="benefits">
            {product.benefits.map((b) => (
              <div key={b.label} className="flex flex-col-reverse gap-xs">
                <dt className="text-sm font-medium">{b.label}</dt>
                <dd className="font-heading text-5xl font-bold leading-none text-secondary md:text-6xl">{b.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-lg text-xs text-background/80">Números de demonstração; os valores reais vêm na proposta.</p>
        </Band>
      )}

      {product.attributes.length > 0 && (
        <div className="mx-auto w-full max-w-page px-md py-xl">
          <section aria-labelledby="ficha">
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
        </div>
      )}

      {relatedCase && (
        <Band id="case" tone="dark">
          <Heading id="case" eyebrow="Projeto entregue" title="Na prática" tone="dark" />
          <div className="mt-lg max-w-[28rem] text-text">
            <CaseCard item={relatedCase} />
          </div>
          <p className="mt-md text-xs text-background/80">Projeto de demonstração: cliente, cidade e resultado são fictícios.</p>
        </Band>
      )}
    </div>
  );
}
