"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { searchProducts } from "@/lib/search";
import { useDemoStore } from "@/store/demo-store";
import { PageTitle } from "./PageTitle";
import { ProductGrid } from "./ProductCard";

export function SearchView() {
  const term = (useSearchParams().get("q") ?? "").trim();
  const products = useDemoStore((s) => s.products);
  const categories = useDemoStore((s) => s.categories);
  const results = useMemo(() => searchProducts(products, term), [products, term]);

  return (
    <section className="mx-auto w-full max-w-5xl px-md py-lg">
      <PageTitle title={term ? `Busca: ${term}` : "Busca"} />
      <h1 className="text-3xl">{term ? `Resultados para “${term}”` : "Busca"}</h1>

      {!term && <p className="mt-sm text-muted">Digite o que você procura no campo de busca.</p>}

      {term && results.length > 0 && (
        <>
          <p className="mt-sm text-sm text-muted" data-testid="result-count" aria-live="polite">
            {results.length} {results.length === 1 ? "produto" : "produtos"}
          </p>
          <div className="mt-md">
            <ProductGrid products={results} />
          </div>
        </>
      )}

      {term && results.length === 0 && (
        <div className="mt-md rounded-md border border-border bg-surface p-lg" data-testid="search-empty">
          <p className="font-medium">Nenhum produto encontrado para “{term}”</p>
          <p className="mt-sm text-sm text-muted">Que tal navegar por uma categoria?</p>
          <ul className="mt-md flex flex-wrap gap-sm">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/categoria/${c.slug}`}
                  className="inline-flex min-h-11 items-center rounded-button border border-border px-md text-sm font-medium hover:border-primary"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
