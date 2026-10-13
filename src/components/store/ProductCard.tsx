"use client";

import Link from "next/link";
import type { Product } from "@/domain/types";
import { formatBRL } from "@/lib/money";
import { productValues } from "@/lib/filters";
import { useDemoStore } from "@/store/demo-store";
import { InstallmentLine } from "./InstallmentLine";
import { StoreImage } from "./StoreImage";

const CARD_SIZES = "(min-width: 768px) 25vw, 50vw";

export function ProductCard({ product }: { product: Product }) {
  const defs = useDemoStore((s) => s.config.attributeDefs);
  const soldOut = product.stock === 0;
  const badges = defs
    .filter((d) => d.highlight)
    .flatMap((d) => productValues(product, d.key));

  return (
    <li data-testid="product-card">
      <Link href={`/produto/${product.slug}`} className="group block">
        <div className="relative aspect-product overflow-hidden rounded-md border border-border bg-surface">
          <StoreImage image={product.images[0]} sizes={CARD_SIZES} />
          {soldOut && (
            <span className="absolute left-sm top-sm rounded-sm bg-text px-sm py-xs text-xs font-bold text-background">
              Esgotado
            </span>
          )}
          {badges.length > 0 && (
            <span className="absolute bottom-sm left-sm flex flex-wrap gap-xs">
              {badges.map((b) => (
                <span
                  key={b}
                  className="rounded-sm border border-border bg-surface px-sm py-xs text-xs font-medium text-success"
                >
                  {b}
                </span>
              ))}
            </span>
          )}
        </div>
        <h3 className="mt-sm text-sm font-medium leading-snug text-text group-hover:underline">
          {product.name}
        </h3>
        <p className="mt-xs text-base font-bold text-text">{formatBRL(product.price)}</p>
        <InstallmentLine price={product.price} variant="card" className="text-xs text-muted" />
      </Link>
    </li>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-md gap-y-lg md:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </ul>
  );
}
