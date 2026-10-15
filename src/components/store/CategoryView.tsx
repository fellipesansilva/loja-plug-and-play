"use client";

import { StoreLink as Link } from "@/components/store/StoreLink";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  applyFilters,
  buildFilterGroups,
  countActiveFilters,
  parseFilters,
  serializeFilters,
  sortProducts,
  type FilterSelection,
  type SortOrder,
} from "@/lib/filters";
import { useDemoStore } from "@/store/demo-store";
import { useListedProducts } from "@/store/use-listed-products";
import { useHydrated } from "@/store/use-hydrated";
import { CategoryChips } from "./CategoryChips";
import { FilterDrawer, FilterSidebar } from "./FilterPanel";
import { PageTitle } from "./PageTitle";
import { ProductGrid } from "./ProductCard";

export function CategoryView({ slug }: { slug: string }) {
  const hydrated = useHydrated();
  const category = useDemoStore((s) => s.categories.find((c) => c.slug === slug));
  const products = useListedProducts();
  const defs = useDemoStore((s) => s.config.attributeDefs);
  const listing = useDemoStore((s) => s.config.layout.listing);
  const allCategories = useDemoStore((s) => s.categories);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const inCategory = useMemo(
    () => products.filter((p) => p.categoryId === category?.id),
    [products, category?.id],
  );
  const groups = useMemo(() => buildFilterGroups(inCategory, defs), [inCategory, defs]);
  // A URL é a fonte da verdade (abrir/colar um link reaplica tudo), mas o estado local responde na hora ao clique;
  // quando a URL (ou os filtros disponíveis) mudam por fora, o estado local é refeito a partir dela.
  const fromUrl = useMemo(() => parseFilters(searchParams, groups), [searchParams, groups]);
  const [state, setState] = useState(fromUrl);
  const [seenUrl, setSeenUrl] = useState(fromUrl);
  if (seenUrl !== fromUrl) {
    setSeenUrl(fromUrl);
    setState(fromUrl);
  }
  const { selection, order } = state;
  const visible = useMemo(
    () => sortProducts(applyFilters(inCategory, selection), order),
    [inCategory, selection, order],
  );
  const activeCount = countActiveFilters(selection);

  const update = useCallback(
    (nextSelection: FilterSelection, nextOrder: SortOrder) => {
      setState({ selection: nextSelection, order: nextOrder });
      const query = serializeFilters(nextSelection, nextOrder, groups).toString();
      // History API nativa: o Next sincroniza com useSearchParams na hora (sem navegação nem rolagem).
      window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
    },
    [groups, pathname],
  );

  const toggle = (key: string, value: string) => {
    const current = selection[key] ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    update({ ...selection, [key]: next }, order);
  };
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  if (!category) {
    return (
      <section className="mx-auto w-full max-w-5xl px-md py-lg">
        <PageTitle title="Categoria" />
        <h1 className="text-2xl">{hydrated ? "Categoria não encontrada" : "Carregando…"}</h1>
        {hydrated && (
          <Link href="/" className="mt-md inline-flex min-h-11 items-center text-primary underline">
            Voltar para o início
          </Link>
        )}
      </section>
    );
  }

  const panelProps = {
    groups,
    selection,
    order,
    total: visible.length,
    onToggle: toggle,
    onOrder: (o: SortOrder) => update(selection, o),
    onClear: () => update({}, order),
  };

  return (
    <section className="mx-auto w-full max-w-5xl px-md py-lg">
      <PageTitle title={category.name} />
      {listing === "menu" && (
        <div className="mb-md">
          <CategoryChips
            items={allCategories.map((c) => ({ label: c.name, href: `/categoria/${c.slug}`, active: c.id === category.id }))}
          />
        </div>
      )}
      <h1 className="text-3xl">{category.name}</h1>
      <div className="mt-sm flex items-center justify-between gap-md">
        <p className="text-sm text-muted" data-testid="result-count" aria-live="polite">
          {visible.length} {visible.length === 1 ? "produto" : "produtos"}
        </p>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-haspopup="dialog"
          className="min-h-11 rounded-button border border-border bg-surface px-md text-sm font-medium md:hidden"
        >
          Filtrar{activeCount > 0 ? ` (${activeCount})` : ""}
        </button>
      </div>
      <div className="mt-md flex gap-lg">
        <FilterSidebar {...panelProps} />
        <div className="min-w-0 flex-1">
          {visible.length > 0 ? (
            <ProductGrid products={visible} />
          ) : (
            <div className="rounded-md border border-border bg-surface p-lg text-center">
              <p>Nenhum produto encontrado com esses filtros.</p>
              <button
                type="button"
                onClick={() => update({}, order)}
                className="mt-md min-h-11 rounded-button bg-primary px-lg font-bold text-background"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      </div>
      <FilterDrawer {...panelProps} open={drawerOpen} onClose={closeDrawer} triggerRef={triggerRef} />
    </section>
  );
}
