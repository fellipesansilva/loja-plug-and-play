"use client";

import { StoreLink as Link } from "@/components/store/StoreLink";
import type { Product } from "@/domain/types";
import { formatBRL } from "@/lib/money";
import { isSoldOut } from "@/lib/product";
import { productValues } from "@/lib/filters";
import { useDemoStore } from "@/store/demo-store";
import { InstallmentLine } from "./InstallmentLine";
import { PixLine } from "./PixLine";
import { ProductMenuItem } from "./ProductMenuItem";
import { useQuoteMode } from "./useQuoteWords";
import { StoreImage } from "./StoreImage";

const CARD_SIZES = "(min-width: 768px) 25vw, 50vw";

export function ProductCard({ product, defer = false }: { product: Product; defer?: boolean }) {
  const defs = useDemoStore((s) => s.config.attributeDefs);
  const quote = useQuoteMode();
  // Loja em orçamento: sem preço, parcelas, Pix nem "esgotado" (tudo é sob encomenda).
  const soldOut = !quote && isSoldOut(product);
  const badges = defs
    .filter((d) => d.highlight)
    .flatMap((d) => productValues(product, d.key));

  return (
    <li data-testid="product-card">
      <Link href={`/produto/${product.slug}`} className="group block">
        <div className="relative aspect-product overflow-hidden rounded-md border border-border bg-surface">
          <StoreImage image={product.images[0]} sizes={CARD_SIZES} defer={defer} />
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
        {!quote && (
          <>
            <p className="mt-xs text-base font-bold text-text">{formatBRL(product.price)}</p>
            <InstallmentLine price={product.price} variant="card" className="text-xs text-muted" />
            <PixLine amount={product.price} className="text-xs text-muted" />
          </>
        )}
      </Link>
    </li>
  );
}

/** Listagem de produtos no formato escolhido pelo preset (config.layout.listing): grade de cards ou cardápio. */
export function ProductGrid({ products, defer = false }: { products: Product[]; defer?: boolean }) {
  const listing = useDemoStore((s) => s.config.layout.listing);
  if (listing === "menu") {
    return (
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {products.map((p) => (
          <ProductMenuItem key={p.id} product={p} />
        ))}
      </ul>
    );
  }
  // Colunas que fecham as linhas: 4 (ou 3, se a quantidade fecha melhor); no celular, 2.
  const cols = products.length % 4 !== 0 && products.length % 3 === 0 ? 3 : 4;
  return (
    <ul
      className="grid grid-cols-2 gap-x-md gap-y-lg md:[grid-template-columns:repeat(var(--grid-cols),minmax(0,1fr))]"
      style={{ "--grid-cols": cols } as React.CSSProperties}
      data-cols={cols}
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} defer={defer} />
      ))}
    </ul>
  );
}
