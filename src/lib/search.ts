import type { Product } from "@/domain/types";

/** NFD + remoção de acentos + minúsculas + espaços colapsados. */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Texto pesquisável do produto: nome, descrição e SKU (do produto e das variantes). */
function haystack(p: Product): string {
  return normalizeText([p.name, p.description, p.sku, ...p.variants.map((v) => v.sku)].join(" "));
}

/** Todas as palavras do termo precisam aparecer (em qualquer campo). Termo vazio não encontra nada. */
export function searchProducts(products: Product[], term: string): Product[] {
  const words = normalizeText(term).split(" ").filter(Boolean);
  if (words.length === 0) return [];
  return products.filter((p) => {
    const text = haystack(p);
    return words.every((w) => text.includes(w));
  });
}
