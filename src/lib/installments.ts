import type { Modules, Money } from "@/domain/types";

/** Parcela mínima padrão (R$ 20,00), usada quando o preset não define `minInstallment`. */
export const DEFAULT_MIN_INSTALLMENT: Money = 2000;

export type InstallmentPlan = { count: number; value: Money };

/**
 * n = min(maxInstallments, floor(preço / parcelaMínima)). Com n ≤ 1 (ou módulo desligado) não há plano.
 * O valor da parcela é arredondado ao centavo.
 */
export function installmentPlan(price: Money, module: Modules["parcelamento"]): InstallmentPlan | null {
  if (!module?.enabled) return null;
  const min = module.minInstallment ?? DEFAULT_MIN_INSTALLMENT;
  const count = Math.min(module.maxInstallments, Math.floor(price / min));
  if (count <= 1) return null;
  return { count, value: Math.round(price / count) };
}
