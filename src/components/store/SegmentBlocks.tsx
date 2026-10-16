"use client";

import type { ReactNode } from "react";
import { StoreLink as Link } from "@/components/store/StoreLink";
import type { CaseStudy, HomeBlock, Tone } from "@/domain/types";
import { useDemoStore } from "@/store/demo-store";
import { StoreImage } from "./StoreImage";

type BlockOf<T extends HomeBlock["type"]> = Extract<HomeBlock, { type: T }>;

/** Faixa de ponta a ponta que alterna entre fundo escuro (cor primária) e claro (fundo da loja). */
export function Band({ id, tone = "light", children }: { id: string; tone?: Tone; children: ReactNode }) {
  const dark = tone === "dark";
  return (
    <section
      id={id}
      aria-labelledby={`bloco-${id}`}
      data-tone={tone}
      className={`w-full scroll-mt-md ${dark ? "bg-primary text-background" : "bg-background text-text"}`}
    >
      <div className="mx-auto w-full max-w-page px-md py-xl">{children}</div>
    </section>
  );
}

export function Heading({ id, eyebrow, title, tone = "light" }: { id: string; eyebrow?: string; title: string; tone?: Tone }) {
  return (
    <header>
      {eyebrow && (
        <p className={`text-sm font-bold uppercase tracking-widest ${tone === "dark" ? "text-secondary" : "text-primary"}`}>{eyebrow}</p>
      )}
      <h2 id={`bloco-${id}`} className="mt-xs text-4xl leading-none md:text-6xl">
        {title}
      </h2>
    </header>
  );
}

const focusRing = "focus-visible:outline-secondary";

/** Tile de foto de ponta a ponta com o rótulo sobre o degradê (sem borda). */
function PhotoTile({
  href,
  label,
  text,
  image,
  sizes,
  ratio,
}: {
  href: string;
  label: string;
  text?: string;
  image: { src: string; alt: string };
  sizes: string;
  ratio: string;
}) {
  return (
    <Link href={href} className={`group relative block overflow-hidden rounded-md bg-primary ${ratio} ${focusRing}`}>
      <StoreImage image={image} sizes={sizes} defer className="object-cover transition-transform duration-300 group-hover:scale-105" />
      <span className="scrim-bottom absolute inset-0" aria-hidden="true" />
      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-xs p-md text-background">
        <span className="font-heading text-2xl font-bold uppercase leading-none md:text-3xl">{label}</span>
        {text && <span className="hidden text-sm md:block">{text}</span>}
      </span>
    </Link>
  );
}

/** Card tipográfico (sem foto): título, frase e número de produtos; alterna azul-petróleo e amarelo. */
export function NeedsBlock({ block }: { block: BlockOf<"needs"> }) {
  const needs = useDemoStore((s) => s.config.needs);
  if (!needs?.length) return null;
  return (
    <Band id={block.id} tone={block.tone}>
      <Heading id={block.id} eyebrow={block.eyebrow} title={block.title} tone={block.tone} />
      <ul className="mt-lg grid grid-cols-1 gap-sm sm:grid-cols-2 md:gap-md lg:grid-cols-4" data-testid="needs">
        {needs.map((n, i) => {
          const yellow = i % 2 === 1;
          return (
            <li key={n.slug} className="flex">
              <Link
                href={`/necessidade/${n.slug}`}
                data-variant={yellow ? "secondary" : "primary"}
                className={`group flex min-h-56 w-full flex-col justify-between gap-md rounded-md p-md transition-opacity hover:opacity-90 ${yellow ? "bg-secondary text-text focus-visible:outline-text" : "bg-primary text-background focus-visible:outline-secondary"}`}
              >
                <span className="flex flex-col gap-xs">
                  <span className="font-heading text-5xl font-bold uppercase leading-none">{n.label}</span>
                  <span className="text-sm">{n.description}</span>
                </span>
                <span className="text-xs font-bold uppercase tracking-widest" data-testid="need-count">
                  {n.productIds.length} {n.productIds.length === 1 ? "produto" : "produtos"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Band>
  );
}

export function SectorsBlock({ block }: { block: BlockOf<"sectors"> }) {
  const sectors = useDemoStore((s) => s.config.sectors);
  if (!sectors?.length) return null;
  return (
    <Band id={block.id} tone={block.tone}>
      <Heading id={block.id} eyebrow={block.eyebrow} title={block.title} tone={block.tone} />
      <ul className="mt-lg grid grid-cols-2 gap-sm md:grid-cols-3 md:gap-md" data-testid="sectors">
        {sectors.map((x) => (
          <li key={x.slug}>
            <PhotoTile
              href={`/setor/${x.slug}`}
              label={x.label}
              image={x.image}
              sizes="(min-width: 1024px) 330px, 50vw"
              ratio="aspect-[4/3]"
            />
          </li>
        ))}
      </ul>
    </Band>
  );
}

export function StatsBlock({ block }: { block: BlockOf<"stats"> }) {
  const dark = block.tone === "dark";
  return (
    <Band id={block.id} tone={block.tone}>
      {block.title ? (
        <Heading id={block.id} title={block.title} tone={block.tone} />
      ) : (
        <h2 id={`bloco-${block.id}`} className="sr-only">
          Números
        </h2>
      )}
      <dl className="grid grid-cols-2 gap-lg md:grid-cols-4" data-testid="stats">
        {block.items.map((i) => (
          <div key={i.label} className="flex flex-col-reverse">
            <dt className={`text-sm font-medium ${dark ? "text-background" : "text-muted"}`}>{i.label}</dt>
            <dd className={`font-heading text-5xl font-bold leading-none md:text-6xl ${dark ? "text-secondary" : "text-primary"}`}>
              {i.value}
            </dd>
          </div>
        ))}
      </dl>
      {block.note && <p className={`mt-lg text-xs ${dark ? "text-background/80" : "text-muted"}`}>{block.note}</p>}
    </Band>
  );
}

/** Projeto entregue: foto, cidade/UF, produto e o resultado em uma frase. */
export function CaseCard({ item }: { item: CaseStudy }) {
  const product = useDemoStore((s) => s.products.find((p) => p.id === item.productId));
  return (
    <article data-testid="case-card" className="flex flex-col overflow-hidden rounded-md bg-surface">
      <div className="relative aspect-[4/3] bg-primary">
        <StoreImage image={item.image} sizes="(min-width: 1024px) 330px, 100vw" defer />
      </div>
      <div className="flex flex-1 flex-col gap-xs p-md">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">{item.city}</p>
        <h3 className="text-2xl leading-tight">{item.title}</h3>
        <p className="text-sm text-text">{item.result}</p>
        {product && (
          <Link
            href={`/produto/${product.slug}`}
            className="mt-auto inline-flex min-h-11 items-center pt-xs text-sm font-bold text-primary underline"
          >
            {product.name}
          </Link>
        )}
      </div>
    </article>
  );
}

export function CasesBlock({ block }: { block: BlockOf<"cases"> }) {
  const cases = useDemoStore((s) => s.config.cases);
  const items = block.caseIds.flatMap((id) => cases?.find((c) => c.id === id) ?? []);
  if (!items.length) return null;
  return (
    <Band id={block.id} tone={block.tone}>
      <Heading id={block.id} eyebrow={block.eyebrow} title={block.title} tone={block.tone} />
      <ul className="mt-lg grid gap-md md:grid-cols-3" data-testid="cases">
        {items.map((c) => (
          <li key={c.id} className="flex">
            <div className="flex w-full">
              <CaseCard item={c} />
            </div>
          </li>
        ))}
      </ul>
      {block.note && <p className="mt-md text-xs text-muted">{block.note}</p>}
    </Band>
  );
}

export function ProcessBlock({ block }: { block: BlockOf<"process"> }) {
  return (
    <Band id={block.id} tone={block.tone}>
      <Heading id={block.id} eyebrow={block.eyebrow} title={block.title} tone={block.tone} />
      <ol className="mt-lg grid gap-lg md:grid-cols-4 md:gap-md" data-testid="process">
        {block.steps.map((s, i) => {
          const highlighted = block.highlight?.step === i + 1;
          return (
            <li key={s.title} className="flex flex-col gap-xs border-t-4 border-secondary pt-md" data-highlight={highlighted || undefined}>
              <span className="font-heading text-5xl font-bold leading-none text-secondary">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="text-2xl leading-tight">{s.title}</h3>
              {highlighted && block.highlight && (
                <p className="inline-flex w-fit rounded-button bg-highlight-bg px-3 py-1 text-xs font-bold uppercase tracking-wide text-highlight-text">
                  {block.highlight.label}
                </p>
              )}
              <p className="text-sm">{s.text}</p>
            </li>
          );
        })}
      </ol>
    </Band>
  );
}

export function CtaBlock({ block }: { block: BlockOf<"cta"> }) {
  const dark = block.tone === "dark";
  return (
    <Band id={block.id} tone={block.tone}>
      <div className="flex flex-col items-start gap-md md:flex-row md:items-end md:justify-between">
        <div className="max-w-[36rem]">
          <h2 id={`bloco-${block.id}`} className="text-4xl leading-none md:text-6xl">
            {block.title}
          </h2>
          {block.text && <p className="mt-sm text-base">{block.text}</p>}
        </div>
        <Link
          href={block.ctaHref}
          className={`inline-flex min-h-12 items-center rounded-button px-xl font-bold hover:opacity-90 ${dark ? "bg-background text-text focus-visible:outline-secondary" : "bg-primary text-background"}`}
        >
          {block.ctaLabel}
        </Link>
      </div>
    </Band>
  );
}
