"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/domain/types";
import { formatBRL } from "@/lib/money";
import {
  missingAxes,
  selectedVariant,
  variantAxes,
  variantPrice,
  type Selection,
} from "@/lib/variants";
import { useDemoStore } from "@/store/demo-store";
import { useHydrated } from "@/store/use-hydrated";
import { ChevronLeftIcon } from "./Icons";
import { InstallmentLine } from "./InstallmentLine";
import { PageTitle } from "./PageTitle";
import { ProductGallery } from "./ProductGallery";
import { ShippingCalculator } from "./ShippingCalculator";
import { VariantSelectors } from "./VariantSelectors";

const LOW_STOCK = 3;
const TOAST_MS = 6000;

export function ProductView({ slug }: { slug: string }) {
  const hydrated = useHydrated();
  const product = useDemoStore((s) => s.products.find((p) => p.slug === slug));

  if (!product) {
    return (
      <section className="mx-auto w-full max-w-5xl px-md py-lg">
        <PageTitle title="Produto" />
        <h1 className="text-2xl">{hydrated ? "Produto não encontrado" : "Carregando…"}</h1>
        {hydrated && (
          <Link href="/" className="mt-md inline-flex min-h-11 items-center text-primary underline">
            Voltar para o início
          </Link>
        )}
      </section>
    );
  }
  // key: trocar de produto (ou de preset) descarta a escolha de variação anterior.
  return <ProductDetails key={product.id} product={product} />;
}

function ProductDetails({ product }: { product: Product }) {
  const router = useRouter();
  const category = useDemoStore((s) => s.categories.find((c) => c.id === product.categoryId));
  const defs = useDemoStore((s) => s.config.attributeDefs);
  const regret = useDemoStore((s) => s.config.policies.regret);
  const cart = useDemoStore((s) => s.cart);
  const addToCart = useDemoStore((s) => s.addToCart);

  const [selection, setSelection] = useState<Selection>({});
  const [warning, setWarning] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  const axes = useMemo(() => variantAxes(product, defs), [product, defs]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

  const variant = selectedVariant(product, axes, selection);
  const price = variantPrice(product, variant);
  const soldOut = product.stock === 0 || (variant !== undefined && variant.stock === 0);
  const available = variant ? variant.stock : axes.length === 0 ? product.stock : null;
  const inCart = cart
    .filter((l) => l.productId === product.id && l.variantId === variant?.id)
    .reduce((sum, l) => sum + l.qty, 0);

  function onSelect(key: string, value: string) {
    setWarning(null);
    setSelection((prev) => {
      const next = { ...prev };
      if (next[key] === value) delete next[key];
      else next[key] = value;
      return next;
    });
  }

  function onAdd() {
    const missing = missingAxes(axes, selection);
    if (missing.length > 0) {
      setWarning(`Escolha: ${missing.map((a) => a.label).join(", ")}`);
      return;
    }
    if (available !== null && inCart >= available) {
      setWarning("Você já adicionou todas as unidades disponíveis ao carrinho.");
      return;
    }
    setWarning(null);
    addToCart({ productId: product.id, variantId: variant?.id, qty: 1 });
    setToast(true);
  }

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push(category ? `/categoria/${category.slug}` : "/");
  }

  return (
    <article className="mx-auto w-full max-w-5xl pb-lg">
      <PageTitle title={product.name} />
      <div className="px-md py-sm">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex min-h-11 items-center gap-xs text-sm font-medium text-text"
        >
          <ChevronLeftIcon />
          Voltar
        </button>
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-lg md:px-md">
        <ProductGallery images={product.images} />

        <div className="flex flex-col gap-md px-md py-md md:px-0 md:py-0">
          {category && (
            <nav aria-label="Você está em" className="text-sm text-muted">
              <ol className="flex flex-wrap items-center gap-xs">
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

          <div>
            <h1 className="text-3xl leading-tight">{product.name}</h1>
            <p className="mt-xs text-sm text-muted" data-testid="product-sku">
              SKU: {variant?.sku ?? product.sku}
            </p>
          </div>

          <div>
            <p className="text-3xl font-bold" data-testid="product-price">
              {formatBRL(price)}
            </p>
            <InstallmentLine price={price} variant="page" className="text-sm text-muted" />
          </div>

          {axes.length > 0 && (
            <VariantSelectors product={product} axes={axes} defs={defs} selection={selection} onSelect={onSelect} />
          )}

          {!soldOut && available !== null && available <= LOW_STOCK && (
            <p className="text-sm font-medium text-warning" data-testid="low-stock">
              {available === 1 ? "Resta 1 unidade" : `Restam ${available} unidades`}
            </p>
          )}

          <div>
            <button
              type="button"
              onClick={onAdd}
              disabled={soldOut}
              className="min-h-12 w-full rounded-button bg-primary px-lg font-bold text-background disabled:cursor-not-allowed disabled:opacity-50"
            >
              {soldOut ? "Esgotado" : "Adicionar ao carrinho"}
            </button>
            {warning && (
              <p role="alert" className="mt-sm text-sm font-medium text-danger">
                {warning}
              </p>
            )}
          </div>

          <ShippingCalculator itemPrice={price} />

          <section aria-labelledby="descricao">
            <h2 id="descricao" className="text-lg">
              Descrição
            </h2>
            <p className="mt-xs text-muted">{product.description}</p>
          </section>

          {product.attributes.length > 0 && (
            <section aria-labelledby="detalhes">
              <h2 id="detalhes" className="text-lg">
                Detalhes
              </h2>
              <dl className="mt-xs divide-y divide-border">
                {product.attributes.map((a) => (
                  <div key={a.key} className="flex justify-between gap-md py-sm text-sm">
                    <dt className="text-muted">{a.label}</dt>
                    <dd className="text-right font-medium">{a.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <p className="text-sm text-muted">
            {regret}{" "}
            <Link href="/trocas-e-devolucoes" className="underline">
              Trocas e devoluções
            </Link>
          </p>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed inset-x-md top-md z-50 mx-auto flex max-w-[28rem] items-center justify-between gap-md rounded-md border border-border bg-surface p-md shadow-lg"
        >
          <span className="font-medium">Adicionado ao carrinho</span>
          <Link href="/carrinho" className="inline-flex min-h-11 items-center font-bold text-primary underline">
            Ver carrinho
          </Link>
        </div>
      )}
    </article>
  );
}
