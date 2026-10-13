import type { AttributeDef, Product } from "@/domain/types";
import { normalizeText } from "./search";

export type FilterGroup = { key: string; label: string; values: string[] };
/** Valores marcados por chave de atributo. Mesmo atributo: OU. Atributos diferentes: E. */
export type FilterSelection = Record<string, string[]>;
export type SortOrder = "relevantes" | "menor-preco" | "maior-preco";

export const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "relevantes", label: "Mais relevantes" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
];

/** Valores que o produto tem para um atributo (descritivo + variantes). */
export function productValues(p: Product, key: string): string[] {
  const values = [
    ...p.attributes.filter((a) => a.key === key).map((a) => a.value),
    ...p.variants.flatMap((v) => (v.attributes[key] ? [v.attributes[key]] : [])),
  ];
  return [...new Set(values)];
}

/** Filtros gerados dos atributos `filterable` presentes nos produtos; só valores que existem. */
export function buildFilterGroups(products: Product[], defs: AttributeDef[]): FilterGroup[] {
  return defs
    .filter((d) => d.filterable)
    .map((d) => ({
      key: d.key,
      label: d.label,
      values: [...new Set(products.flatMap((p) => productValues(p, d.key)))],
    }))
    .filter((g) => g.values.length > 0);
}

export function applyFilters(products: Product[], selection: FilterSelection): Product[] {
  const active = Object.entries(selection).filter(([, values]) => values.length > 0);
  return products.filter((p) =>
    active.every(([key, wanted]) => productValues(p, key).some((v) => wanted.includes(v))),
  );
}

/** Ordena sem alterar a lista original. "relevantes" mantém a ordem do preset. */
export function sortProducts(products: Product[], order: SortOrder): Product[] {
  if (order === "menor-preco") return [...products].sort((a, b) => a.price - b.price);
  if (order === "maior-preco") return [...products].sort((a, b) => b.price - a.price);
  return [...products];
}

export function countActiveFilters(selection: FilterSelection): number {
  return Object.values(selection).reduce((sum, values) => sum + values.length, 0);
}

const escapeValue = (v: string) => v.replaceAll(",", "%2C");
const unescapeValue = (v: string) => v.replaceAll("%2C", ",");

/** Estado → query string (`tamanho=M,G&cor=Preto&ordem=menor-preco`). Padrão (relevantes) não aparece. */
export function serializeFilters(
  selection: FilterSelection,
  order: SortOrder,
  groups: FilterGroup[],
): URLSearchParams {
  const params = new URLSearchParams();
  for (const g of groups) {
    const chosen = g.values.filter((v) => selection[g.key]?.includes(v));
    if (chosen.length > 0) params.set(g.key, chosen.map(escapeValue).join(","));
  }
  if (order !== "relevantes") params.set("ordem", order);
  return params;
}

/**
 * Query string → estado. Casa valores sem diferenciar maiúsculas/acentos (`cor=preto` acha "Preto")
 * e ignora chaves ou valores que não existem nos filtros atuais.
 */
export function parseFilters(
  params: URLSearchParams,
  groups: FilterGroup[],
): { selection: FilterSelection; order: SortOrder } {
  const selection: FilterSelection = {};
  for (const g of groups) {
    const raw = params.get(g.key);
    if (!raw) continue;
    const wanted = raw.split(",").map((v) => normalizeText(unescapeValue(v)));
    const chosen = g.values.filter((v) => wanted.includes(normalizeText(v)));
    if (chosen.length > 0) selection[g.key] = chosen;
  }
  const order = params.get("ordem");
  return {
    selection,
    order: SORT_OPTIONS.some((o) => o.value === order) ? (order as SortOrder) : "relevantes",
  };
}
