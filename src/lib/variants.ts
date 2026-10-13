import type { AttributeDef, Money, Product, Variant } from "@/domain/types";

export type VariantAxis = { key: string; label: string; values: string[] };
export type Selection = Record<string, string>;

/** Eixos de seleção do produto: chaves presentes nas variantes, na ordem das definições do preset. */
export function variantAxes(p: Product, defs: AttributeDef[]): VariantAxis[] {
  const keys = [...new Set(p.variants.flatMap((v) => Object.keys(v.attributes)))];
  const order = (k: string) => {
    const i = defs.findIndex((d) => d.key === k);
    return i === -1 ? defs.length : i;
  };
  return keys
    .sort((a, b) => order(a) - order(b))
    .map((key) => ({
      key,
      label: defs.find((d) => d.key === key)?.label ?? key,
      values: [...new Set(p.variants.map((v) => v.attributes[key]).filter(Boolean))],
    }));
}

/** Uma opção está disponível se existe variante com estoque que combine com ela e com a seleção atual dos outros eixos. */
export function isOptionAvailable(p: Product, selection: Selection, key: string, value: string): boolean {
  return p.variants.some(
    (v) =>
      v.stock > 0 &&
      v.attributes[key] === value &&
      Object.entries(selection).every(([k, val]) => k === key || v.attributes[k] === val),
  );
}

/** Variante escolhida quando todos os eixos estão preenchidos; senão undefined. */
export function selectedVariant(p: Product, axes: VariantAxis[], selection: Selection): Variant | undefined {
  if (axes.some((a) => !selection[a.key])) return undefined;
  return p.variants.find((v) => axes.every((a) => v.attributes[a.key] === selection[a.key]));
}

export function variantPrice(p: Product, v?: Variant): Money {
  return v?.price ?? p.price;
}

/** Eixos ainda sem escolha (para o aviso "Escolha: Tamanho, Cor"). */
export function missingAxes(axes: VariantAxis[], selection: Selection): VariantAxis[] {
  return axes.filter((a) => !selection[a.key]);
}
