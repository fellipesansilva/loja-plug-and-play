"use client";

import Link from "next/link";
import type { HomeBlock } from "@/domain/types";
import { activeHomeBlocks } from "@/lib/home-blocks";
import { useDemoStore } from "@/store/demo-store";
import { ProductGrid } from "./ProductCard";
import { StoreImage } from "./StoreImage";

type BlockOf<T extends HomeBlock["type"]> = Extract<HomeBlock, { type: T }>;

function BannerBlock({ block }: { block: BlockOf<"banner"> }) {
  return (
    <section aria-label={block.title} className="relative h-[460px] overflow-hidden">
      <StoreImage image={block.image} sizes="100vw" lcp />
      <div className="scrim-bottom absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto w-full max-w-5xl px-md pb-lg text-background">
          {block.eyebrow && (
            <p className="text-sm font-bold uppercase tracking-widest">{block.eyebrow}</p>
          )}
          <h1 className="mt-xs max-w-[36rem] text-3xl leading-tight md:text-5xl">{block.title}</h1>
          {block.subtitle && <p className="mt-sm max-w-[36rem] text-base">{block.subtitle}</p>}
          <Link
            href={block.ctaHref}
            className="mt-md inline-flex min-h-11 items-center rounded-button bg-background px-lg font-bold text-text hover:opacity-90"
          >
            {block.ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

function CategoriesBlock({ block }: { block: BlockOf<"categories"> }) {
  const categories = useDemoStore((s) => s.categories);
  const tile = useDemoStore((s) => s.config.layout.categoryTile);
  const items = block.categoryIds.flatMap((id) => categories.find((c) => c.id === id) ?? []);
  const heading = block.title ?? "Categorias";

  return (
    <section aria-labelledby={`bloco-${block.id}`} className="mx-auto w-full max-w-5xl px-md py-lg">
      <h2 id={`bloco-${block.id}`} className="text-2xl">
        {heading}
      </h2>
      <ul className="mt-md grid grid-cols-3 gap-sm md:gap-md">
        {items.map((c) => (
          <li key={c.id}>
            <Link href={`/categoria/${c.slug}`} className="flex flex-col items-center gap-sm text-center">
              {tile === "circle" ? (
                <span className="relative size-24 overflow-hidden rounded-full border border-border bg-surface">
                  <StoreImage image={c.image} sizes="96px" />
                </span>
              ) : (
                <span className="relative block aspect-[3/4] w-full overflow-hidden rounded-md bg-surface">
                  <StoreImage image={c.image} sizes="(min-width: 768px) 25vw, 33vw" />
                </span>
              )}
              <span className="text-sm font-medium text-text">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FeaturedBlock({ block }: { block: BlockOf<"featured"> }) {
  const products = useDemoStore((s) => s.products);
  const items = block.productIds.flatMap((id) => products.find((p) => p.id === id) ?? []);

  return (
    <section aria-labelledby={`bloco-${block.id}`} className="mx-auto w-full max-w-5xl px-md py-lg">
      <div className="flex items-baseline justify-between gap-md">
        <h2 id={`bloco-${block.id}`} className="text-2xl">
          {block.title}
        </h2>
        <Link href={block.linkHref} className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline">
          {block.linkLabel}
        </Link>
      </div>
      <div className="mt-md">
        <ProductGrid products={items} />
      </div>
    </section>
  );
}

/** Home montada por blocos: ordem e `enabled` vêm de `config.homeBlocks`. */
export function HomeBlocks() {
  const blocks = useDemoStore((s) => s.config.homeBlocks);
  const name = useDemoStore((s) => s.config.name);
  const active = activeHomeBlocks(blocks);
  return (
    <>
      {/* Sem banner (que traz o h1), a página mantém um título para leitores de tela. */}
      {!active.some((b) => b.type === "banner") && <h1 className="sr-only">{name}</h1>}
      {active.map((block) => {
        switch (block.type) {
          case "banner":
            return <BannerBlock key={block.id} block={block} />;
          case "categories":
            return <CategoriesBlock key={block.id} block={block} />;
          case "featured":
            return <FeaturedBlock key={block.id} block={block} />;
        }
      })}
    </>
  );
}
