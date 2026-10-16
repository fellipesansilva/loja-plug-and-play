"use client";

import { StoreLink as Link } from "@/components/store/StoreLink";
import { billableLines, cartCount, freeShippingProgress, resolveLines } from "@/lib/cart";
import { formatBRL } from "@/lib/money";
import { useDemoStore } from "@/store/demo-store";
import { useCartWords } from "./useCartWords";

/** Barra de frete grátis: só aparece com itens no carrinho e o módulo de frete grátis ligado. */
export function ShippingProgress() {
  const cart = useDemoStore((s) => s.cart);
  const products = useDemoStore((s) => s.products);
  const freteGratis = useDemoStore((s) => s.config.modules.freteGratis);
  const words = useCartWords();

  const billable = billableLines(resolveLines(cart, products));
  const subtotal = billable.reduce((sum, l) => sum + l.total, 0);
  const progress = freeShippingProgress(subtotal, cartCount(billable.map((l) => l.line)), freteGratis);
  if (progress.state === "hidden") return null;

  const reached = progress.state === "reached";
  return (
    <section
      aria-label="Frete grátis"
      data-testid="shipping-progress"
      className="mx-auto w-full max-w-5xl px-md py-sm"
    >
      <div className="rounded-lg border border-border bg-surface p-md">
        <div className="flex flex-wrap items-center justify-between gap-sm">
          <p role="status" className="text-sm font-medium text-text">
            {reached ? (
              <span className="font-bold text-success">Você ganhou frete grátis</span>
            ) : (
              <>
                Faltam <strong className="font-extrabold text-primary">{formatBRL(progress.missing)}</strong> para o frete
                grátis
              </>
            )}
          </p>
          <Link
            href="/carrinho"
            className="inline-flex min-h-11 items-center rounded-button bg-primary px-md text-sm font-bold text-background"
          >
            {words.view} · {formatBRL(progress.subtotal)}
          </Link>
        </div>
        <div
          role="progressbar"
          aria-label="Progresso para o frete grátis"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress.ratio * 100)}
          className="mt-sm h-2 overflow-hidden rounded-button bg-border"
        >
          <div
            className={`h-full rounded-button ${reached ? "bg-success" : "bg-primary"}`}
            style={{ width: `${Math.round(progress.ratio * 100)}%` }}
          />
        </div>
      </div>
    </section>
  );
}
