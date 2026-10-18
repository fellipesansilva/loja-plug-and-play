"use client";

import type { HomeBlock } from "@/domain/types";
import { StoreImage } from "@/components/store/StoreImage";

type Block = Extract<HomeBlock, { type: "testimonials" }>;

/** Seção de depoimentos da home (módulo `depoimentos`). Fictício = marca de demonstração em cada depoimento. */
export default function Testimonials({ block }: { block: Block }) {
  return (
    <section id={block.id} aria-labelledby={`bloco-${block.id}`} data-testid="depoimentos" className="mx-auto w-full max-w-page px-md py-lg">
      <h2 id={`bloco-${block.id}`} className="text-2xl">
        {block.title}
      </h2>
      <ul className="mt-md grid gap-md sm:grid-cols-2 lg:grid-cols-3">
        {block.items.map((t) => (
          <li key={t.id} data-testid="depoimento" className="flex min-w-0 flex-col gap-sm rounded-md border border-border bg-surface p-md">
            {t.real !== true && (
              <p data-testid="depoimento-marca" className="w-fit rounded-button border border-border bg-highlight-bg px-3 py-1 text-xs font-bold text-highlight-text">
                {block.demoLabel}
              </p>
            )}
            <blockquote className="text-base">“{t.text}”</blockquote>
            <figure className="mt-auto flex items-center gap-sm">
              {t.photo ? (
                <span className="relative block size-11 shrink-0 overflow-hidden rounded-full bg-background">
                  <StoreImage image={t.photo} sizes="44px" />
                </span>
              ) : (
                <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-background">
                  {t.name.trim().charAt(0).toUpperCase()}
                </span>
              )}
              <figcaption className="min-w-0 text-sm">
                <span className="block font-bold">{t.name}</span>
                <span className="block text-muted">{t.city}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <p className="mt-sm text-xs text-muted">{block.note}</p>
    </section>
  );
}
