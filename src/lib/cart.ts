import type { Addon, CartLine, Money, Product } from "@/domain/types";
import { variantText } from "./item-name";
import { availableStock, isDigital, isListed } from "./product";

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

/**
 * Subtotal do carrinho. Só entram as linhas disponíveis: produto removido do catálogo, inativo, sem estoque ou com
 * estoque menor que a quantidade ficam de fora (e, por isso, também do frete grátis).
 */
export function cartSubtotal(cart: CartLine[], products: Product[]): Money {
  return billableLines(resolveLines(cart, products)).reduce((sum, l) => sum + l.total, 0);
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

  const stock = availableStock(product, input.variantId);
  const sameStock = (l: CartLine) => l.productId === product.id && l.variantId === input.variantId;
  const inOtherLines = cart.filter((l) => sameStock(l) && l.lineId !== lineId).reduce((s, l) => s + l.qty, 0);
  const current = cart.find((l) => l.lineId === lineId)?.qty ?? 0;
  const next = Math.min(current + input.qty, stock - inOtherLines);
  if (next <= current) return cart;

  const line: CartLine = { lineId, productId: product.id, variantId: input.variantId, addonIds, qty: next };
  return current > 0 ? cart.map((l) => (l.lineId === lineId ? line : l)) : [...cart, line];
}

/**
 * Situação de uma linha frente ao catálogo de agora:
 * - `unavailable`: o produto (ou a variação) foi inativado/removido, ou o estoque acabou;
 * - `short`: o estoque não cobre a quantidade pedida (`left` unidades ainda disponíveis);
 * - `ok`.
 */
export type Availability = { status: "ok" } | { status: "unavailable" } | { status: "short"; left: number };

/** Linha do carrinho com o produto, a variante e os preços já resolvidos. */
export type ResolvedLine = {
  line: CartLine;
  product: Product;
  variantLabel: string | null;
  addons: Addon[];
  unit: Money;
  total: Money;
  /** Máximo que o seletor de quantidade permite (estoque da variante menos o das outras linhas do mesmo item). */
  maxQty: number;
  digital: boolean;
  availability: Availability;
};

const MAX_QTY = 99;

export function resolveLines(cart: CartLine[], products: Product[]): ResolvedLine[] {
  return cart.flatMap((line) => {
    const product = products.find((p) => p.id === line.productId);
    if (!product) return [];
    const variant = line.variantId ? product.variants.find((v) => v.id === line.variantId) : undefined;
    const others = cart
      .filter((l) => l.lineId !== line.lineId && l.productId === line.productId && l.variantId === line.variantId)
      .reduce((s, l) => s + l.qty, 0);
    const stock = availableStock(product, line.variantId);
    const left = stock - others;
    const missingVariant = !!line.variantId && !variant;
    const availability: Availability =
      !isListed(product) || missingVariant || left <= 0
        ? { status: "unavailable" }
        : line.qty > left
          ? { status: "short", left }
          : { status: "ok" };
    return [
      {
        line,
        product,
        variantLabel: variant ? variantText(variant.attributes) : null,
        addons: selectedAddons(product, line.addonIds),
        unit: unitPrice(product, line.variantId, line.addonIds),
        total: lineTotal(product, line),
        maxQty: Math.max(1, Math.min(MAX_QTY, stock - others)),
        digital: isDigital(product),
        availability,
      },
    ];
  });
}

/** Linhas que entram no subtotal, no frete e no total: as disponíveis. */
export function billableLines(lines: ResolvedLine[]): ResolvedLine[] {
  return lines.filter((l) => l.availability.status === "ok");
}

/** Linhas que impedem de finalizar: indisponíveis ou com estoque menor que a quantidade. */
export function cartBlockers(lines: ResolvedLine[]): ResolvedLine[] {
  return lines.filter((l) => l.availability.status !== "ok");
}

/** Carrinho só com produtos digitais (e com itens): não tem entrega nem frete. */
export function cartIsAllDigital(lines: ResolvedLine[]): boolean {
  return lines.length > 0 && lines.every((l) => l.digital);
}

/** Subtotal dos itens físicos: base do frete grátis (produto digital não conta para o frete). */
export function physicalSubtotal(lines: ResolvedLine[]): Money {
  return lines.filter((l) => !l.digital).reduce((sum, l) => sum + l.total, 0);
}

/** Ajusta a quantidade de uma linha, entre 1 e o máximo permitido (estoque). */
export function setLineQty(cart: CartLine[], products: Product[], lineId: string, qty: number): CartLine[] {
  const resolved = resolveLines(cart, products).find((l) => l.line.lineId === lineId);
  if (!resolved) return cart;
  const next = Math.max(1, Math.min(Math.floor(qty), resolved.maxQty));
  return cart.map((l) => (l.lineId === lineId ? { ...l, qty: next } : l));
}

export function removeLine(cart: CartLine[], lineId: string): CartLine[] {
  return cart.filter((l) => l.lineId !== lineId);
}
