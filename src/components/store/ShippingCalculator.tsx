"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import type { Money } from "@/domain/types";
import { formatBRL } from "@/lib/money";
import { maskCep, quoteShipping } from "@/lib/shipping";
import { useDemoStore } from "@/store/demo-store";

/** Frete simulado por CEP (determinístico, sem rede). Recalcula quando o preço do item muda. */
export function ShippingCalculator({ itemPrice }: { itemPrice: Money }) {
  const inputId = useId();
  const config = useDemoStore((s) => s.config);
  const [typed, setTyped] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  const quote = useMemo(
    () =>
      submitted === null
        ? null
        : quoteShipping({
            cep: submitted,
            itemPrice,
            shipping: config.shipping,
            modules: config.modules,
            storeAddress: config.legal.address,
          }),
    [submitted, itemPrice, config],
  );

  function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(typed);
  }

  return (
    <section aria-labelledby={`${inputId}-titulo`} className="rounded-md border border-border bg-surface p-md">
      <h2 id={`${inputId}-titulo`} className="text-lg">
        Calcular frete
      </h2>
      <form onSubmit={submit} className="mt-sm flex gap-sm">
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className="sr-only">
            CEP
          </label>
          <input
            id={inputId}
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={typed}
            onChange={(e) => setTyped(maskCep(e.target.value))}
            className="h-11 w-full rounded-md border border-border bg-background px-md text-base"
          />
        </div>
        <button type="submit" className="min-h-11 rounded-button bg-primary px-lg font-bold text-background">
          Calcular
        </button>
      </form>

      <div aria-live="polite" className="mt-md text-sm" data-testid="shipping-result">
        {quote?.status === "invalid" && (
          <p role="alert" className="font-medium text-danger">
            CEP inválido
          </p>
        )}
        {quote?.status === "ok" && (
          <div className="flex flex-col gap-sm">
            {!quote.covered && <p className="font-medium">Não entregamos neste CEP</p>}
            {quote.options.length > 0 && (
              <ul className="flex flex-col gap-sm">
                {quote.options.map((o) => (
                  <li key={o.id} className="flex items-baseline justify-between gap-md">
                    <span>
                      <span className="font-medium">{o.label}</span>{" "}
                      <span className="text-muted">· {o.deadline}</span>
                    </span>
                    <span className={o.free ? "font-bold text-success" : "font-bold"}>
                      {o.free ? "Grátis" : formatBRL(o.price)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {quote.missingForFree !== null && (
              <p className="text-muted">Faltam {formatBRL(quote.missingForFree)} para frete grátis</p>
            )}
            {quote.pickup && (
              <p>
                <span className="font-medium">Retirar na loja · grátis</span>
                <span className="block text-muted">{quote.pickup.address}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
