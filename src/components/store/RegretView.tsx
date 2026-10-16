"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { RegretResult } from "@/lib/regret";
import { useDemoStore } from "@/store/demo-store";
import { useHydrated } from "@/store/use-hydrated";
import { FormField } from "./FormField";
import { PageTitle } from "./PageTitle";
import { StoreLink } from "./StoreLink";

/** Desistir da compra (arrependimento, CDC art. 49), simulado: número do pedido + e-mail. */
export function RegretView() {
  const params = useSearchParams();
  const policies = useDemoStore((s) => s.config.policies);
  const legal = useDemoStore((s) => s.config.legal);
  const requestRegret = useDemoStore((s) => s.requestRegret);
  const hydrated = useHydrated();

  const [orderId, setOrderId] = useState(params.get("pedido") ?? "");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ orderId?: string; email?: string }>({});
  const [result, setResult] = useState<RegretResult | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!orderId.trim()) next.orderId = "Informe o número do pedido";
    if (!email.trim()) next.email = "Informe o e-mail usado na compra";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      setResult(null);
      return;
    }
    setResult(requestRegret(orderId, email));
  }

  const done = result?.kind === "ok" || result?.kind === "already";

  return (
    <section className="mx-auto w-full max-w-page px-md py-lg">
      <PageTitle title="Desistir da compra" />
      <h1 className="text-3xl">Desistir da compra</h1>
      <p className="mt-sm text-muted">
        Você tem {policies.regretDays} dias a partir do recebimento para desistir, com reembolso integral (frete incluso).{" "}
        <StoreLink href="/trocas-e-devolucoes" className="underline">
          Trocas e devoluções
        </StoreLink>
        . Esta é uma simulação: nenhum pedido real é afetado.
      </p>

      {result && (
        <div role="status" data-testid="regret-result" data-kind={result.kind} className="mt-md rounded-md border border-border bg-surface p-md">
          {result.kind === "ok" && (
            <>
              <p className="font-bold">Pedido de desistência registrado.</p>
              <p>
                Protocolo: <strong data-testid="regret-protocol">{result.protocol}</strong>
              </p>
              <p>
                O pedido {result.orderId} foi cancelado e o reembolso será integral, com o frete incluso.
              </p>
            </>
          )}
          {result.kind === "already" && (
            <>
              <p className="font-bold">Este pedido já tem um pedido de desistência.</p>
              <p>
                Protocolo: <strong data-testid="regret-protocol">{result.protocol}</strong>
              </p>
            </>
          )}
          {result.kind === "expired" && (
            <>
              <p className="font-bold">O prazo de desistência deste pedido já passou ({policies.regretDays} dias).</p>
              <p>
                Se o produto chegou com defeito, a troca vale por {policies.defect.days} dias a partir do recebimento. Fale com a loja: {legal.email} ·{" "}
                {legal.phone}.
              </p>
            </>
          )}
          {result.kind === "invalid" && (
            <p role="alert" className="font-medium text-danger">
              Não encontramos um pedido com esses dados. Confira o número do pedido e o e-mail usados na compra.
            </p>
          )}
        </div>
      )}

      {!done && (
        <form noValidate onSubmit={submit} className="mt-md flex flex-col gap-md md:max-w-[28rem]" data-testid="regret-form">
          <FormField
            name="regretOrder"
            label="Número do pedido"
            autoComplete="off"
            value={orderId}
            error={errors.orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
          <FormField
            name="regretEmail"
            label="E-mail da compra"
            type="email"
            autoComplete="email"
            value={email}
            error={errors.email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={!hydrated}
            className="flex min-h-12 w-full items-center justify-center rounded-button bg-primary px-lg font-bold text-background disabled:opacity-60"
          >
            Desistir da compra
          </button>
        </form>
      )}
    </section>
  );
}
