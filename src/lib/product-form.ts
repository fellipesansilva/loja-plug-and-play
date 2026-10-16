import type { Attribute, AttributeDef, Category, Image, Product, Variant } from "@/domain/types";
import { formatPriceInput, parsePriceBR } from "./price-input";
import { slugify } from "./slug";

/** Variação no formulário: um valor por eixo (definido pelo preset), SKU, estoque e preço opcional. Tudo texto, como digitado. */
export type VariantForm = { uid: string; values: Record<string, string>; sku: string; stock: string; price: string };

export type ProductFormValues = {
  name: string;
  price: string;
  description: string;
  sku: string;
  stock: string;
  categoryId: string;
  active: boolean;
  images: Image[];
  /** Atributos descritivos (as definições do preset que não são eixo de variação), por chave. */
  attributes: Record<string, string>;
  variants: VariantForm[];
};

export type FormErrors = Record<string, string>;

export const SKU_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
export const MAX_SKU_LENGTH = 40;

/** Definições do preset que são eixo de variação (tamanho, cor, porção...) e as que são só descritivas. */
export function splitDefs(defs: readonly AttributeDef[]): { axes: AttributeDef[]; descriptive: AttributeDef[] } {
  return { axes: defs.filter((d) => d.variant), descriptive: defs.filter((d) => !d.variant) };
}

export function emptyForm(categoryId: string): ProductFormValues {
  return { name: "", price: "", description: "", sku: "", stock: "0", categoryId, active: true, images: [], attributes: {}, variants: [] };
}

let uidCounter = 0;
export const newUid = (): string => `v${Date.now().toString(36)}${(uidCounter++).toString(36)}`;

export function formFromProduct(p: Product, defs: readonly AttributeDef[], opts: { quote?: boolean } = {}): ProductFormValues {
  const { axes, descriptive } = splitDefs(defs);
  return {
    name: p.name,
    price: opts.quote && p.price === 0 ? "" : formatPriceInput(p.price),
    description: p.description,
    sku: p.sku,
    stock: opts.quote && p.stock === 0 ? "" : String(p.stock),
    categoryId: p.categoryId,
    active: p.active !== false,
    images: p.images.map((i) => ({ ...i })),
    attributes: Object.fromEntries(descriptive.map((d) => [d.key, p.attributes.find((a) => a.key === d.key)?.value ?? ""])),
    variants: p.variants.map((v) => ({
      uid: v.id,
      values: Object.fromEntries(axes.map((a) => [a.key, v.attributes[a.key] ?? ""])),
      sku: v.sku,
      stock: String(v.stock),
      price: v.price === undefined ? "" : formatPriceInput(v.price),
    })),
  };
}

const isInt = (t: string) => /^\d+$/.test(t.trim()) && Number(t) <= 1_000_000;

/** Todos os SKUs em uso no catálogo (produto e variações), em minúsculas, fora o produto que está sendo editado. */
export function usedSkus(products: readonly Product[], editingId?: string): Set<string> {
  const used = new Set<string>();
  for (const p of products) {
    if (p.id === editingId) continue;
    used.add(p.sku.toLowerCase());
    for (const v of p.variants) used.add(v.sku.toLowerCase());
  }
  return used;
}

export function skuProblem(sku: string, used: ReadonlySet<string>): string | null {
  const s = sku.trim();
  if (!s) return "Informe o SKU";
  if (s.length > MAX_SKU_LENGTH) return `O SKU pode ter até ${MAX_SKU_LENGTH} caracteres`;
  if (!SKU_PATTERN.test(s)) return "Use só letras, números, ponto, hífen e sublinhado";
  if (used.has(s.toLowerCase())) return "Este SKU já está em uso";
  return null;
}

export type FormContext = {
  /** Loja em orçamento: preço e estoque são opcionais (vazio = sem preço / sob encomenda). */
  quote?: boolean;
  products: readonly Product[];
  categories: readonly Category[];
  defs: readonly AttributeDef[];
  editingId?: string;
};

/** Valida o formulário. Chaves de erro: name, price, sku, stock, categoryId, images, variants, variant-<i>-<campo|eixo>. */
export function validateProductForm(f: ProductFormValues, ctx: FormContext): FormErrors {
  const errors: FormErrors = {};
  const { axes } = splitDefs(ctx.defs);

  if (f.name.trim().length < 2) errors.name = "Informe o nome do produto";
  if (!(ctx.quote && f.price.trim() === "") && parsePriceBR(f.price) === null) errors.price = "Preço inválido. Use o formato 19,90";

  const used = usedSkus(ctx.products, ctx.editingId);
  const skuError = skuProblem(f.sku, used);
  if (skuError) errors.sku = skuError;
  // o SKU do produto também não pode repetir o de uma variação do próprio formulário
  const seen = new Set<string>([f.sku.trim().toLowerCase()]);

  if (!ctx.categories.some((c) => c.id === f.categoryId)) errors.categoryId = "Escolha a categoria";
  if (f.images.length === 0) errors.images = "Escolha ou envie ao menos uma imagem";
  if (f.images.some((i) => !i.alt.trim())) errors.images = "Descreva cada imagem (texto alternativo)";

  if (f.variants.length === 0) {
    if (!(ctx.quote && f.stock.trim() === "") && !isInt(f.stock)) errors.stock = "Estoque inválido. Use um número inteiro, 0 ou maior";
  } else {
    const combos = new Set<string>();
    f.variants.forEach((v, i) => {
      for (const axis of axes) if (!v.values[axis.key]?.trim()) errors[`variant-${i}-${axis.key}`] = `Informe ${axis.label.toLowerCase()}`;
      const own = skuProblem(v.sku, used);
      if (own) errors[`variant-${i}-sku`] = own;
      else if (seen.has(v.sku.trim().toLowerCase())) errors[`variant-${i}-sku`] = "Este SKU já está em uso";
      else seen.add(v.sku.trim().toLowerCase());
      if (!isInt(v.stock)) errors[`variant-${i}-stock`] = "Estoque inválido";
      if (v.price.trim() && parsePriceBR(v.price) === null) errors[`variant-${i}-price`] = "Preço inválido. Use o formato 19,90";
      const combo = axes.map((a) => (v.values[a.key] ?? "").trim().toLowerCase()).join("|");
      if (axes.length > 0 && combos.has(combo) && !errors[`variant-${i}-${axes[0].key}`]) errors[`variant-${i}-${axes[0].key}`] = "Esta combinação já existe";
      combos.add(combo);
    });
    if (Object.keys(errors).some((k) => k.startsWith("variant-"))) errors.variants = "Corrija as variações destacadas";
  }
  return errors;
}

function uniqueSlug(name: string, products: readonly Product[], editingId?: string): string {
  const base = slugify(name) || "produto";
  const taken = new Set(products.filter((p) => p.id !== editingId).map((p) => p.slug));
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

/** Monta o produto a partir do formulário JÁ validado. Edição mantém o que o formulário não mexe (slug, tipo, adicionais, selos, atributos fora do preset). */
export function productFromForm(f: ProductFormValues, ctx: FormContext & { newId: () => string }): Product {
  const { axes, descriptive } = splitDefs(ctx.defs);
  const existing = ctx.editingId ? ctx.products.find((p) => p.id === ctx.editingId) : undefined;
  const id = existing?.id ?? ctx.newId();

  const variants: Variant[] = f.variants.map((v, i) => {
    const old = existing?.variants.find((x) => x.id === v.uid);
    return {
      id: old?.id ?? `${id}-v${i + 1}-${v.uid}`.toLowerCase(),
      sku: v.sku.trim(),
      attributes: Object.fromEntries(axes.map((a) => [a.key, v.values[a.key].trim()])),
      ...(v.price.trim() ? { price: parsePriceBR(v.price)! } : {}),
      stock: Number(v.stock),
    };
  });

  const edited: Attribute[] = descriptive.flatMap((d) => {
    const value = (f.attributes[d.key] ?? "").trim();
    return value ? [{ key: d.key, label: d.label, value }] : [];
  });
  const untouched = (existing?.attributes ?? []).filter((a) => !descriptive.some((d) => d.key === a.key));

  return {
    ...(existing ?? {}),
    id,
    slug: existing?.slug ?? uniqueSlug(f.name, ctx.products),
    name: f.name.trim(),
    price: f.price.trim() === "" ? 0 : parsePriceBR(f.price)!,
    images: f.images.map((i) => ({ src: i.src, alt: i.alt.trim() })),
    description: f.description.trim(),
    sku: f.sku.trim(),
    stock: variants.length ? variants.reduce((sum, v) => sum + v.stock, 0) : f.stock.trim() === "" ? 0 : Number(f.stock),
    categoryId: f.categoryId,
    attributes: [...edited, ...untouched],
    variants,
    active: f.active,
  };
}
