/**
 * Texto de uma variante para exibir ao lado do nome do produto: os valores juntos por " / " e qualquer
 * parêntese vira vírgula ("Grande (8 fatias)" → "Grande, 8 fatias"), para o nome nunca ficar com parênteses aninhados.
 */
export function variantText(attributes: Record<string, string>): string {
  return Object.values(attributes)
    .join(" / ")
    .replace(/\s*\(([^)]*)\)/g, ", $1")
    .trim();
}

/** Nome do item no pedido e no resumo: "Pizza Margherita · Grande, 8 fatias". */
export function itemName(productName: string, variant?: string | null): string {
  return variant ? `${productName} · ${variant}` : productName;
}
