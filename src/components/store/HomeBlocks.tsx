"use client";

import Link from "next/link";
import type { HomeBlock } from "@/domain/types";
import { activeHomeBlocks } from "@/lib/home-blocks";
import { formatBRL } from "@/lib/money";
import { useDemoStore } from "@/store/demo-store";
import { CategoryChips } from "./CategoryChips";
import { ProductGrid } from "./ProductCard";
import { QuickAddButton } from "./ProductMenuItem";
import { ShippingProgress } from "./ShippingProgress";
import { StoreImage } from "./StoreImage";

type BlockOf<T extends HomeBlock["type"]> = Extract<HomeBlock, { type: T }>;

function BannerBlock({ block }: { block: BlockOf<"banner"> }) {
  const card = block.variant === "card";
  const content = (
    <>
      <StoreImage image={block.image} sizes={card ? "(min-width: 1024px) 1024px, 100vw" : "100vw"} lcp />
      <div className="scrim-bottom absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0">
        <div className={`mx-auto w-full max-w-5xl text-background ${card ? "p-md pb-lg" : "px-md pb-lg"}`}>
          {block.badge && (
            <p className="mb-sm inline-flex items-center gap-2 rounded-button bg-highlight-bg px-3 py-1 text-xs font-bold text-highlight-text">
              <span aria-hidden="true" className="size-2 rounded-full bg-primary" />
              {block.badge}
            </p>
          )}
          {block.eyebrow && <p className="text-sm font-bold uppercase tracking-widest">{block.eyebrow}</p>}
          <h1
            className={`mt-xs max-w-[36rem] leading-[1.05] ${card ? "text-[44px] md:text-6xl" : "text-3xl leading-tight md:text-5xl"}`}
          >
            {block.title}
          </h1>
          {block.subtitle && <p className="mt-sm max-w-[36rem] text-base">{block.subtitle}</p>}
          <div className="mt-md flex flex-wrap gap-sm">
            <Link
              href={block.ctaHref}
              className={`inline-flex min-h-11 items-center rounded-button px-lg font-bold hover:opacity-90 ${card ? "bg-primary text-background" : "bg-background text-text"}`}
            >
              {block.ctaLabel}
            </Link>
            {block.secondaryCtaLabel && block.secondaryCtaHref && (
              <Link
                href={block.secondaryCtaHref}
                className="inline-flex min-h-11 items-center rounded-button bg-background px-lg font-bold text-text hover:opacity-90"
              >
                {block.secondaryCtaLabel}
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );

  if (card) {
    return (
      <section id={block.id} aria-label={block.title} className="mx-auto w-full max-w-5xl px-3 pt-3">
        <div className="relative h-[480px] overflow-hidden rounded-xl">{content}</div>
      </section>
    );
  }
  return (
    <section id={block.id} aria-label={block.title} className="relative h-[460px] overflow-hidden">
      {content}
    </section>
  );
}

function CategoriesBlock({ block }: { block: BlockOf<"categories"> }) {
  const categories = useDemoStore((s) => s.categories);
  const tile = useDemoStore((s) => s.config.layout.categoryTile);
  const items = block.categoryIds.flatMap((id) => categories.find((c) => c.id === id) ?? []);
  const heading = block.title ?? "Categorias";

  return (
    <section id={block.id} aria-labelledby={`bloco-${block.id}`} className="mx-auto w-full max-w-5xl px-md py-lg">
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

function ChipsBlock({ block }: { block: BlockOf<"chips"> }) {
  return (
    <section id={block.id} className="mx-auto w-full max-w-5xl px-md pt-md">
      <CategoryChips items={block.items.map((item, i) => ({ ...item, active: i === 0 }))} />
    </section>
  );
}

function SpotlightBlock({ block }: { block: BlockOf<"spotlight"> }) {
  const product = useDemoStore((s) => s.products.find((p) => p.id === block.productId));
  if (!product) return null;
  const badge = product.badges?.[0];
  const href = `/produto/${product.slug}`;

  return (
    <section id={block.id} aria-labelledby={`bloco-${block.id}`} className="mx-auto w-full max-w-5xl px-md py-lg">
      <h2 id={`bloco-${block.id}`} className="text-2xl">
        {block.title}
      </h2>
      <article data-testid="spotlight" className="mt-md rounded-lg border border-border bg-surface p-3">
        <Link href={href} className="relative block h-[230px] overflow-hidden rounded-md bg-border">
          <StoreImage image={product.images[0]} sizes="(min-width: 1024px) 1024px, 100vw" />
          {badge && (
            <span className="absolute left-3 top-3 rounded-button bg-highlight-bg px-3 py-1 text-xs font-bold text-highlight-text">
              {badge}
            </span>
          )}
        </Link>
        <div className="mt-3 flex items-end justify-between gap-md">
          <Link href={href} className="min-w-0 flex-1">
            <h3 className="font-body text-xl font-extrabold leading-snug">{product.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted">{product.description}</p>
            <p className="mt-2 text-lg font-extrabold text-primary">{formatBRL(product.price)}</p>
          </Link>
          <QuickAddButton product={product} className="size-13" />
        </div>
      </article>
    </section>
  );
}

function FeaturedBlock({ block }: { block: BlockOf<"featured"> }) {
  const products = useDemoStore((s) => s.products);
  const items = block.productIds.flatMap((id) => products.find((p) => p.id === id) ?? []);

  return (
    <section
      id={block.id}
      aria-labelledby={`bloco-${block.id}`}
      className="mx-auto w-full max-w-5xl scroll-mt-md px-md py-lg"
    >
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
          case "chips":
            return <ChipsBlock key={block.id} block={block} />;
          case "spotlight":
            return <SpotlightBlock key={block.id} block={block} />;
          case "featured":
            return <FeaturedBlock key={block.id} block={block} />;
          case "shippingProgress":
            return <ShippingProgress key={block.id} />;
        }
      })}
    </>
  );
}
