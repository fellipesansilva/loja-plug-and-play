import type { Modules, Money } from "@/domain/types";

/**
 * Desconto no Pix sobre um valor (preço de produto ou subtotal): `percent`% arredondado ao centavo.
 * Devolve null com o módulo desligado, ausente ou com percentual inválido.
 */
export function pixPricing(amount: Money, module: Modules["descontoPix"]): { price: Money; discount: Money } | null {
  if (!module?.enabled || !(module.percent > 0)) return null;
  const discount = Math.round((amount * module.percent) / 100);
  return { price: amount - discount, discount };
}
