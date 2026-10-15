import type { Product } from "@/domain/types";

export function isDigital(product: Product): boolean {
  return product.type === "digital";
}

/** Unidades disponíveis para compra. Produto digital não tem estoque: está sempre disponível. */
export function availableStock(product: Product, variantId?: string): number {
  if (isDigital(product)) return Number.POSITIVE_INFINITY;
  if (variantId) return product.variants.find((v) => v.id === variantId)?.stock ?? 0;
  return product.stock;
}

/** Esgotado no catálogo (digital nunca esgota). */
export function isSoldOut(product: Product): boolean {
  return !isDigital(product) && product.stock === 0;
}
