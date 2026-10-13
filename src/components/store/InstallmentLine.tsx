"use client";

import type { Money } from "@/domain/types";
import { installmentPlan } from "@/lib/installments";
import { formatBRL } from "@/lib/money";
import { useDemoStore } from "@/store/demo-store";

/** Linha de parcelamento; não renderiza nada com o módulo desligado ou com 1 parcela só. */
export function InstallmentLine({
  price,
  variant,
  className = "",
}: {
  price: Money;
  /** "card": "ou 6x de R$ 63,32 sem juros"; "page": "em até 6x de R$ 63,32 sem juros". */
  variant: "card" | "page";
  className?: string;
}) {
  const parcelamento = useDemoStore((s) => s.config.modules.parcelamento);
  const plan = installmentPlan(price, parcelamento);
  if (!plan) return null;
  const prefix = variant === "card" ? "ou" : "em até";
  return (
    <p className={className} data-testid="installments">
      {prefix} {plan.count}x de {formatBRL(plan.value)} sem juros
    </p>
  );
}
