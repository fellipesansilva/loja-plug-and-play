"use client";

import type { Money } from "@/domain/types";
import { formatBRL } from "@/lib/money";
import { pixPricing } from "@/lib/pix";
import { useDemoStore } from "@/store/demo-store";

/** Linha "No Pix: R$ X" (valor com o desconto do módulo); não renderiza nada com o módulo desligado. */
export function PixLine({ amount, className = "" }: { amount: Money; className?: string }) {
  const descontoPix = useDemoStore((s) => s.config.modules.descontoPix);
  const pricing = pixPricing(amount, descontoPix);
  if (!pricing) return null;
  return (
    <p className={className} data-testid="pix-price">
      No Pix: <strong className="font-bold text-success">{formatBRL(pricing.price)}</strong>
    </p>
  );
}
