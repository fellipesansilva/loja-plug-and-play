"use client";

import { PageTitle } from "@/components/store/PageTitle";
import { StoreLink as Link } from "@/components/store/StoreLink";
import type { Image as ImageData } from "@/domain/types";
import { useDemoStore } from "@/store/demo-store";
import { useHydrated } from "@/store/use-hydrated";
import { useListedProducts } from "@/store/use-listed-products";
import { ProductGrid } from "./ProductCard";
import { Band, CaseCard, Heading } from "./SegmentBlocks";
import { StoreImage } from "./StoreImage";

const KIND = {
  setor: { eyebrow: "Setor", productsTitle: "Produtos para este setor" },
  necessidade: {
    eyebrow: "Necessidade",
    productsTitle: "Produtos para esta necessidade",
  },
} as const;

/** Página de um setor (`/setor/<slug>`) ou de uma necessidade (`/necessidade/<slug>`): foto, produtos da aplicação e, no setor, um case. */
export function SegmentPageView({ kind, slug }: { kind: keyof typeof KIND; slug: string }) {
  const hydrated = useHydrated();
  const entry = useDemoStore((s) => (kind === "setor" ? s.config.sectors : s.config.needs)?.find((e) => e.slug === slug));
  const caseStudy = useDemoStore((s) =>
    kind === "setor" ? s.config.cases?.find((c) => c.id === s.config.sectors?.find((x) => x.slug === slug)?.caseId) : undefined,
  );
  const listed = useListedProducts();
  const copy = KIND[kind];

  if (!entry) {
    return (
      <section className="mx-auto w-full max-w-page px-md py-lg">
        <PageTitle title={copy.eyebrow} />
        <h1 className="text-2xl">{hydrated ? `${copy.eyebrow} não encontrado` : "Carregando…"}</h1>
      </section>
    );
  }
  const image = (entry as { image?: ImageData }).image;
  const products = entry.productIds.flatMap((id) => listed.find((p) => p.id === id) ?? []);

  return (
    <>
      <PageTitle title={entry.label} />
      <section
        className={`relative w-full overflow-hidden bg-primary ${image ? "h-[320px] md:h-[420px]" : ""}`}
        data-testid="segment-hero"
      >
        {image && (
          <>
            <StoreImage image={image} sizes="100vw" lcp />
            <div className="scrim-bottom absolute inset-0" />
          </>
        )}
        <div className={image ? "absolute inset-x-0 bottom-0" : "py-xl"}>
          <div className="mx-auto w-full max-w-page px-md pb-lg text-background">
            <nav aria-label="Você está em" className="text-sm">
              <ol className="flex flex-wrap items-center gap-xs">
                <li>
                  <Link href="/" className="inline-flex min-h-11 items-center underline">
                    Início
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>{copy.eyebrow}</li>
              </ol>
            </nav>
            <h1 className="text-5xl leading-none md:text-7xl">{entry.label}</h1>
            <p className="mt-sm max-w-[36rem] text-base">{entry.description}</p>
          </div>
        </div>
      </section>

      <section id="produtos" aria-labelledby="bloco-produtos" className="mx-auto w-full max-w-page px-md py-xl">
        <h2 id="bloco-produtos" className="text-3xl md:text-4xl">
          {copy.productsTitle}
        </h2>
        <div className="mt-md">
          <ProductGrid products={products} defer />
        </div>
      </section>

      {caseStudy && (
        <Band id="case" tone="dark">
          <Heading id="case" eyebrow="Projeto entregue" title="Na prática" tone="dark" />
          <div className="mt-lg max-w-[28rem] text-text">
            <CaseCard item={caseStudy} />
          </div>
          <p className="mt-md text-xs text-background/80">Projeto de demonstração: cliente, cidade e resultado são fictícios.</p>
        </Band>
      )}

      <Band id="pedir" tone="light">
        <div className="flex flex-col items-start gap-md md:flex-row md:items-end md:justify-between">
          <h2 id="bloco-pedir" className="max-w-[28rem] text-4xl leading-none md:text-5xl">
            Quer um projeto para {entry.label.toLowerCase()}?
          </h2>
          <Link
            href="/orcamento"
            className="inline-flex min-h-12 items-center rounded-button bg-primary px-xl font-bold text-background hover:opacity-90"
          >
            Pedir orçamento
          </Link>
        </div>
      </Band>
    </>
  );
}
