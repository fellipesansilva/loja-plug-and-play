"use client";

import Image from "next/image";
import { useState } from "react";
import { PageTitle } from "@/components/store/PageTitle";
import { StoreLink } from "@/components/store/StoreLink";
import { formatBRL } from "@/lib/money";
import { isListed, isSoldOut } from "@/lib/product";
import { normalizeText } from "@/lib/search";
import { useDemoStore } from "@/store/demo-store";

const control = "mt-xs h-11 w-full rounded-md border border-border bg-surface px-md text-base";

/** Catálogo no painel: foto, nome, preço, estoque e situação (ativo/inativo), com busca por nome ou SKU. */
export function ProductsList() {
  const products = useDemoStore((s) => s.products);
  const setProductActive = useDemoStore((s) => s.setProductActive);
  const [term, setTerm] = useState("");

  const words = normalizeText(term).split(" ").filter(Boolean);
  const shown = products.filter((p) => {
    if (words.length === 0) return true;
    const text = normalizeText([p.name, p.sku, ...p.variants.map((v) => v.sku)].join(" "));
    return words.every((w) => text.includes(w));
  });

  return (
    <section className="px-md py-lg">
      <PageTitle title="Produtos" />
      <div className="flex flex-wrap items-center justify-between gap-md">
        <h1 className="text-3xl">Produtos</h1>
        <StoreLink
          href="/painel/produtos/novo"
          className="inline-flex min-h-11 items-center justify-center rounded-button bg-primary px-lg font-bold text-background"
          data-testid="new-product"
        >
          Novo produto
        </StoreLink>
      </div>

      <form role="search" aria-label="Buscar produtos" onSubmit={(e) => e.preventDefault()} className="mt-md md:max-w-[20rem]">
        <label htmlFor="prod-busca" className="text-sm font-bold">
          Buscar por nome ou SKU
        </label>
        <input id="prod-busca" type="search" value={term} onChange={(e) => setTerm(e.target.value)} className={control} />
      </form>

      <p className="mt-md text-sm text-muted" role="status" data-testid="products-count">
        {shown.length} {shown.length === 1 ? "produto" : "produtos"}
      </p>

      {shown.length === 0 ? (
        <p className="mt-md" data-testid="products-empty">
          Nenhum produto encontrado.
        </p>
      ) : (
        <ul className="mt-sm flex flex-col gap-sm" data-testid="products-list">
          {shown.map((p) => {
            const listed = isListed(p);
            return (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-md rounded-lg border border-border bg-surface p-md"
                data-testid="product-row"
                data-product-id={p.id}
                data-active={listed}
              >
                <span className="relative size-16 shrink-0 overflow-hidden rounded-md bg-background">
                  {p.images[0] && <Image src={p.images[0].src} alt="" fill sizes="64px" unoptimized className="object-cover" />}
                </span>
                <div className="min-w-[10rem] flex-1">
                  <StoreLink href={`/painel/produtos/${encodeURIComponent(p.id)}`} className="font-bold text-primary underline" data-testid="product-link">
                    {p.name}
                  </StoreLink>
                  <p className="text-sm text-muted">SKU {p.sku}</p>
                </div>
                <dl className="grid grid-cols-3 gap-md text-sm">
                  <div>
                    <dt className="text-muted">Preço</dt>
                    <dd data-testid="product-price">{formatBRL(p.price)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Estoque</dt>
                    <dd data-testid="product-stock">{p.type === "digital" ? "—" : p.stock}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Situação</dt>
                    <dd data-testid="product-status">
                      {listed ? "Ativo" : "Inativo"}
                      {listed && isSoldOut(p) ? " · Esgotado" : ""}
                    </dd>
                  </div>
                </dl>
                <button
                  type="button"
                  onClick={() => setProductActive(p.id, !listed)}
                  aria-label={`${listed ? "Inativar" : "Ativar"} ${p.name}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-button border border-border bg-surface px-md font-bold"
                  data-testid="toggle-active"
                >
                  {listed ? "Inativar" : "Ativar"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
