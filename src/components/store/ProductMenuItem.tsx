"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/domain/types";
import { productValues } from "@/lib/filters";
import { formatBRL } from "@/lib/money";
import { isSoldOut } from "@/lib/product";
import { useDemoStore } from "@/store/demo-store";
import { CheckIcon, PlusIcon } from "./Icons";
import { PixLine } from "./PixLine";
import { StoreImage } from "./StoreImage";
import { useCartWords } from "./useCartWords";

const THUMB_SIZES = "100px";
const FEEDBACK_MS = 1400;

/**
 * "+" do cardápio: sem variação obrigatória adiciona direto ao carrinho; com variação leva à página do produto.
 * `size` em px de Tailwind (40 = cardápio, 52 = destaque).
 */
export function QuickAddButton({ product, className = "size-10" }: { product: Product; className?: string }) {
  const addToCart = useDemoStore((s) => s.addToCart);
  const words = useCartWords();
  const [added, setAdded] = useState(false);
  const soldOut = isSoldOut(product);
  const needsChoice = product.variants.length > 0;

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), FEEDBACK_MS);
    return () => clearTimeout(t);
  }, [added]);

  const look = `${className} inline-flex shrink-0 items-center justify-center rounded-full border-[3px] border-surface bg-primary text-background shadow-md`;

  if (needsChoice && !soldOut) {
    return (
      <Link href={`/produto/${product.slug}`} aria-label={`Escolher opções de ${product.name}`} className={look}>
        <PlusIcon />
      </Link>
    );
  }
  return (
    <button
      type="button"
      disabled={soldOut}
      aria-label={soldOut ? `${product.name} esgotado` : `Adicionar ${product.name} ${words.to}`}
      onClick={() => {
        addToCart({ productId: product.id, qty: 1 });
        setAdded(true);
      }}
      className={`${look} disabled:opacity-40`}
    >
      {added ? <CheckIcon /> : <PlusIcon />}
    </button>
  );
}

/** Item do cardápio: nome, descrição curta, preço e selos à esquerda; miniatura com "+" à direita. */
export function ProductMenuItem({ product }: { product: Product }) {
  const defs = useDemoStore((s) => s.config.attributeDefs);
  const soldOut = isSoldOut(product);
  const badges = defs.filter((d) => d.highlight).flatMap((d) => productValues(product, d.key));
  const href = `/produto/${product.slug}`;

  return (
    <li data-testid="product-card" className="flex gap-3 rounded-lg border border-border bg-surface p-3">
      <Link href={href} className="min-w-0 flex-1">
        <h3 className="font-body text-base font-extrabold leading-snug text-text">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted">{product.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-base font-extrabold text-primary">{formatBRL(product.price)}</span>
          <PixLine amount={product.price} className="text-xs text-muted" />
          {badges.map((b) => (
            <span key={b} className="rounded-button bg-highlight-bg px-2 py-0.5 text-xs font-bold text-highlight-text">
              {b}
            </span>
          ))}
        </div>
      </Link>
      <div className="relative size-25 shrink-0 self-start">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="relative block size-25 overflow-hidden rounded-md bg-border">
          <StoreImage image={product.images[0]} sizes={THUMB_SIZES} />
        </Link>
        {soldOut && (
          <span className="absolute left-1 top-1 rounded-button bg-text px-2 py-0.5 text-xs font-bold text-background">
            Esgotado
          </span>
        )}
        <div className="absolute -bottom-2 -right-2">
          <QuickAddButton product={product} />
        </div>
      </div>
    </li>
  );
}
