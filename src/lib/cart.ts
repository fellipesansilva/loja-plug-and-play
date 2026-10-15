import type { Addon, CartLine, Money, Product } from "@/domain/types";

/** Identificador da combinação produto + variante + adicionais (a ordem dos adicionais não importa). */
export function makeLineId(productId: string, variantId: string | undefined, addonIds: string[]): string {
  return [productId, variantId ?? "", ...[...addonIds].sort()].join("|");
}

/** Adicionais do produto que existem no cadastro, na ordem escolhida (ids desconhecidos são ignorados). */
export function selectedAddons(product: Product, addonIds: string[]): Addon[] {
  return (product.addons ?? []).filter((a) => addonIds.includes(a.id));
}

/** Preço unitário = preço da variante (ou do produto) + soma dos adicionais. */
export function unitPrice(product: Product, variantId: string | undefined, addonIds: string[]): Money {
  const variant = variantId ? product.variants.find((v) => v.id === variantId) : undefined;
  const base = variant?.price ?? product.price;
  return base + selectedAddons(product, addonIds).reduce((sum, a) => sum + a.price, 0);
}

export function lineTotal(product: Product, line: Pick<CartLine, "variantId" | "addonIds" | "qty">): Money {
  return unitPrice(product, line.variantId, line.addonIds) * line.qty;
}

export function cartCount(cart: CartLine[]): number {
  return cart.reduce((sum, l) => sum + l.qty, 0);
}

/** Subtotal do carrinho (linhas de produtos que não existem mais no catálogo são ignoradas). */
export function cartSubtotal(cart: CartLine[], products: Product[]): Money {
  return cart.reduce((sum, line) => {
    const product = products.find((p) => p.id === line.productId);
    return product ? sum + lineTotal(product, line) : sum;
  }, 0);
}

export type FreeShippingProgress =
  | { state: "hidden" }
  | { state: "missing"; missing: Money; subtotal: Money; ratio: number }
  | { state: "reached"; subtotal: Money; ratio: 1 };

/**
 * Barra de frete grátis: some com o carrinho vazio ou o módulo desligado; abaixo do mínimo mostra quanto falta;
 * a partir do mínimo mostra que o frete é grátis.
 */
export function freeShippingProgress(
  subtotal: Money,
  itemCount: number,
  freteGratis: { enabled: boolean; minValue: Money } | undefined,
): FreeShippingProgress {
  if (!freteGratis?.enabled || itemCount === 0) return { state: "hidden" };
  if (subtotal >= freteGratis.minValue) return { state: "reached", subtotal, ratio: 1 };
  return {
    state: "missing",
    missing: freteGratis.minValue - subtotal,
    subtotal,
    ratio: Math.max(0, subtotal / freteGratis.minValue),
  };
}

export type AddToCartInput = { productId: string; variantId?: string; addonIds?: string[]; qty: number };

/**
 * Soma `qty` à linha com o mesmo lineId (ou cria uma nova), limitando ao estoque da variante/produto.
 * O estoque é compartilhado entre as linhas do mesmo produto/variante (combinações de adicionais diferentes).
 * Devolve o carrinho anterior se nada puder ser adicionado.
 */
export function addLine(cart: CartLine[], products: Product[], input: AddToCartInput): CartLine[] {
  const product = products.find((p) => p.id === input.productId);
  if (!product || input.qty < 1) return cart;
  const addonIds = [...new Set(input.addonIds ?? [])]
    .filter((id) => product.addons?.some((a) => a.id === id))
    .sort();
  const lineId = makeLineId(product.id, input.variantId, addonIds);

  const stock = input.variantId
    ? (product.variants.find((v) => v.id === input.variantId)?.stock ?? 0)
    : product.stock;
  const sameStock = (l: CartLine) => l.productId === product.id && l.variantId === input.variantId;
  const inOtherLines = cart.filter((l) => sameStock(l) && l.lineId !== lineId).reduce((s, l) => s + l.qty, 0);
  const current = cart.find((l) => l.lineId === lineId)?.qty ?? 0;
  const next = Math.min(current + input.qty, stock - inOtherLines);
  if (next <= current) return cart;

  const line: CartLine = { lineId, productId: product.id, variantId: input.variantId, addonIds, qty: next };
  return current > 0 ? cart.map((l) => (l.lineId === lineId ? line : l)) : [...cart, line];
}
