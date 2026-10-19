"use client";

import { StoreLink as Link } from "@/components/store/StoreLink";
import { usePresetRouter } from "@/components/store/StoreLink";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/domain/types";
import { unitPrice } from "@/lib/cart";
import { formatBRL } from "@/lib/money";
import { availableStock, isDigital, isListed, isSoldOut } from "@/lib/product";
import {
  missingAxes,
  selectedVariant,
  variantAxes,
  variantPrice,
  type Selection,
} from "@/lib/variants";
import { useDemoStore } from "@/store/demo-store";
import { useHydrated } from "@/store/use-hydrated";
import { ChevronLeftIcon, HeartIcon, MinusIcon, PlusIcon } from "./Icons";
import { InstallmentLine } from "./InstallmentLine";
import { CourseSyllabus } from "./CourseSyllabus";
import { PageTitle } from "./PageTitle";
import { PixLine } from "./PixLine";
import { ProductGallery } from "./ProductGallery";
import { ShippingCalculator } from "./ShippingCalculator";
import { useCartWords } from "./useCartWords";
import { VariantSelectors } from "./VariantSelectors";

const LOW_STOCK = 3;
const TOAST_MS = 6000;
const MAX_QTY = 99;

export function ProductView({ slug }: { slug: string }) {
  const hydrated = useHydrated();
  const product = useDemoStore((s) => s.products.find((p) => p.slug === slug && isListed(p)));

  if (!product) {
    return (
      <section className="mx-auto w-full max-w-page px-md py-lg">
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
  // key: trocar de produto (ou de preset) descarta a escolha de variação e de adicionais anterior.
  return <ProductDetails key={product.id} product={product} />;
}

/** "Turbine seu pedido": adicionais opcionais do produto, com o preço de cada um à direita. */
function AddonsSection({
  product,
  chosen,
  onToggle,
}: {
  product: Product;
  chosen: string[];
  onToggle: (id: string) => void;
}) {
  if (!product.addons?.length) return null;
  return (
    <fieldset data-testid="addons">
      <legend className="mb-sm text-lg font-extrabold">Turbine seu pedido</legend>
      <div className="flex flex-col gap-sm">
        {product.addons.map((a) => (
          <label
            key={a.id}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border bg-surface px-md py-sm"
          >
            <input
              type="checkbox"
              checked={chosen.includes(a.id)}
              onChange={() => onToggle(a.id)}
              className="size-5 shrink-0 accent-primary"
            />
            <span className="flex-1">{a.label}</span>
            <span className="font-bold text-primary">+ {formatBRL(a.price)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ProductDetails({ product }: { product: Product }) {
  const router = usePresetRouter();
  const category = useDemoStore((s) => s.categories.find((c) => c.id === product.categoryId));
  const defs = useDemoStore((s) => s.config.attributeDefs);
  const regret = useDemoStore((s) => s.config.policies.regret);
  const sheet = useDemoStore((s) => s.config.layout.product) === "sheet";
  const cart = useDemoStore((s) => s.cart);
  const addToCart = useDemoStore((s) => s.addToCart);
  const words = useCartWords();

  const [selection, setSelection] = useState<Selection>({});
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [favorite, setFavorite] = useState(false);
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
  const unit = unitPrice(product, variant?.id, addonIds);
  const total = unit * qty;
  const digital = isDigital(product);
  const soldOut = isSoldOut(product) || (!digital && variant !== undefined && variant.stock === 0);
  const available = variant ? availableStock(product, variant.id) : axes.length === 0 ? availableStock(product) : null;
  const inCart = cart
    .filter((l) => l.productId === product.id && l.variantId === variant?.id)
    .reduce((sum, l) => sum + l.qty, 0);
  const maxQty = available === null ? MAX_QTY : Math.max(1, Math.min(MAX_QTY, available - inCart));
  const summary = product.attributes.filter((a) => defs.find((d) => d.key === a.key)?.summary);

  function onSelect(key: string, value: string) {
    setWarning(null);
    setSelection((prev) => {
      const next = { ...prev };
      if (next[key] === value) delete next[key];
      else next[key] = value;
      return next;
    });
  }

  function toggleAddon(id: string) {
    setAddonIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function onAdd() {
    const missing = missingAxes(axes, selection);
    if (missing.length > 0) {
      setWarning(`Escolha: ${missing.map((a) => a.label).join(", ")}`);
      return;
    }
    if (available !== null && inCart >= available) {
      setWarning(`Você já adicionou todas as unidades disponíveis ${words.to}.`);
      return;
    }
    setWarning(null);
    addToCart({ productId: product.id, variantId: variant?.id, addonIds, qty });
    setQty(1);
    setToast(true);
  }

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push(category ? `/categoria/${category.slug}` : "/");
  }

  const lowStock =
    !soldOut && available !== null && available <= LOW_STOCK ? (
      <p className="text-sm font-medium text-warning" data-testid="low-stock">
        {available === 1 ? "Resta 1 unidade" : `Restam ${available} unidades`}
      </p>
    ) : null;

  const warningMessage = warning ? (
    <p role="alert" className="mt-sm text-sm font-medium text-danger">
      {warning}
    </p>
  ) : null;

  const regretLine = (
    <p className="text-sm text-muted">
      {regret}{" "}
      <Link href="/trocas-e-devolucoes" className="underline">
        Trocas e devoluções
      </Link>
    </p>
  );

  const toastView = toast && (
    <div
      role="status"
      className="fixed inset-x-md top-md z-50 mx-auto flex max-w-[28rem] items-center justify-between gap-md rounded-md border border-border bg-surface p-md shadow-lg"
    >
      <span className="font-medium">{words.added}</span>
      <Link href="/carrinho" className="inline-flex min-h-11 items-center font-bold text-primary underline">
        {words.view}
      </Link>
    </div>
  );

  if (sheet) {
    const stepper = "inline-flex size-11 items-center justify-center rounded-full border border-border bg-background disabled:opacity-40";
    return (
      <article className="mx-auto w-full max-w-page" data-layout="sheet">
        <PageTitle title={product.name} />
        <div className="md:grid md:grid-cols-2 md:gap-lg md:px-md md:pt-md">
          <ProductGallery images={product.images} tall>
            <button
              type="button"
              onClick={goBack}
              aria-label="Voltar"
              className="absolute left-3 top-3 inline-flex size-11 items-center justify-center rounded-full bg-surface text-text shadow-md"
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              onClick={() => setFavorite((v) => !v)}
              aria-pressed={favorite}
              aria-label="Favoritar"
              className="absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-full bg-surface text-primary shadow-md"
            >
              <HeartIcon filled={favorite} />
            </button>
          </ProductGallery>

          <div className="relative z-10 -mt-4 flex flex-col gap-md rounded-t-sheet bg-background px-md pb-lg pt-lg md:mt-0 md:px-0 md:pt-0">
            {product.badges && product.badges.length > 0 && (
              <ul className="flex flex-wrap gap-sm" aria-label="Destaques do produto">
                {product.badges.map((b) => (
                  <li
                    key={b}
                    className="rounded-button bg-highlight-bg px-3 py-1 text-xs font-bold text-highlight-text"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            )}

            <div>
              <h1 className="text-[34px] leading-tight">{product.name}</h1>
              <p className="mt-sm text-muted">{product.description}</p>
              {summary.map((a) => (
                <p key={a.key} className="mt-xs text-sm text-muted">
                  {a.label}: {a.value}
                </p>
              ))}
              <p className="mt-xs text-xs text-muted" data-testid="product-sku">
                SKU: {variant?.sku ?? product.sku}
              </p>
            </div>

            <div>
              <p className="text-3xl font-extrabold text-primary" data-testid="product-price">
                {formatBRL(price)}
              </p>
              <InstallmentLine price={price} variant="page" className="text-sm text-muted" />
              <PixLine amount={price} className="text-sm text-muted" />
            </div>

            {axes.length > 0 && (
              <VariantSelectors product={product} axes={axes} defs={defs} selection={selection} onSelect={onSelect} />
            )}

            <AddonsSection product={product} chosen={addonIds} onToggle={toggleAddon} />

            {lowStock}
            {warningMessage}

            {!digital && <ShippingCalculator itemPrice={unit} />}
            {regretLine}
          </div>
        </div>

        {/* Barra fixa de compra: gruda no rodapé da tela e para ao fim do artigo, sem cobrir o rodapé da loja. */}
        <div className="sticky bottom-0 z-30 border-t border-border bg-surface px-md py-sm" style={{ transform: "translateY(calc(var(--cookie-banner-h, 0px) * -1))" }}>
          <div className="mx-auto flex w-full max-w-page items-center gap-sm">
            <div className="flex items-center gap-xs" role="group" aria-label="Quantidade">
              <button
                type="button"
                aria-label="Diminuir quantidade"
                disabled={soldOut || qty <= 1}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className={stepper}
              >
                <MinusIcon />
              </button>
              <span data-testid="qty" aria-live="polite" className="min-w-6 text-center text-lg font-extrabold">
                {qty}
              </span>
              <button
                type="button"
                aria-label="Aumentar quantidade"
                disabled={soldOut || qty >= maxQty}
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                className={stepper}
              >
                <PlusIcon />
              </button>
            </div>
            <button
              type="button"
              onClick={onAdd}
              disabled={soldOut}
              className="flex min-h-12 min-w-0 flex-1 items-center justify-between gap-sm rounded-button bg-primary px-md font-bold text-background disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{soldOut ? "Esgotado" : "Adicionar"}</span>
              {!soldOut && <span data-testid="add-total">{formatBRL(total)}</span>}
            </button>
          </div>
        </div>
        {toastView}
      </article>
    );
  }

  return (
    <article className="mx-auto w-full max-w-page pb-lg">
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
              <PixLine amount={price} className="text-sm text-muted" />
          </div>

          {axes.length > 0 && (
            <VariantSelectors product={product} axes={axes} defs={defs} selection={selection} onSelect={onSelect} />
          )}

          <AddonsSection product={product} chosen={addonIds} onToggle={toggleAddon} />

          {lowStock}

          <div>
            <button
              type="button"
              onClick={onAdd}
              disabled={soldOut}
              className="min-h-12 w-full rounded-button bg-primary px-lg font-bold text-background disabled:cursor-not-allowed disabled:opacity-50"
            >
              {soldOut ? "Esgotado" : words.add}
            </button>
            {warningMessage}
          </div>

          {!digital && <ShippingCalculator itemPrice={unit} />}

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

          <CourseSyllabus product={product} />

          {regretLine}
        </div>
      </div>

      {toastView}
    </article>
  );
}
