import type {
  Attribute,
  Coupon,
  Money,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  Variant,
} from "@/domain/types";

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Imagem de placeholder local (SVG gerado por /placeholder). `color` = hex sem "#". */
export function placeholderUrl(label: string, color: string): string {
  return `/placeholder?l=${encodeURIComponent(label)}&c=${color}`;
}

export function attrs(entries: Record<string, [label: string, value: string]>): Attribute[] {
  return Object.entries(entries).map(([key, [label, value]]) => ({ key, label, value }));
}

type ProductInput = {
  id: string;
  name: string;
  price: Money;
  sku: string;
  categoryId: string;
  description: string;
  color: string;
  stock?: number;
  attributes?: Attribute[];
  variants?: Variant[];
};

/** Produto com variações tem estoque = soma das variantes. */
export function product(input: ProductInput, imageCount = 2): Product {
  const variants = input.variants ?? [];
  const stock = variants.length
    ? variants.reduce((sum, v) => sum + v.stock, 0)
    : (input.stock ?? 0);
  return {
    id: input.id,
    slug: slugify(input.name),
    name: input.name,
    price: input.price,
    images: Array.from({ length: imageCount }, (_, i) =>
      placeholderUrl(i === 0 ? input.name : `${input.name} ${i + 1}`, input.color),
    ),
    description: input.description,
    sku: input.sku,
    stock,
    categoryId: input.categoryId,
    attributes: input.attributes ?? [],
    variants,
  };
}

/** Gera variantes tamanho × cor com SKU `${base}-${tamanho}-${cor}`. */
export function gridVariants(
  base: string,
  sizes: string[],
  colors: { name: string; code: string }[],
  stockOf: (size: string, color: string) => number,
): Variant[] {
  return sizes.flatMap((size) =>
    colors.map((c) => ({
      id: `${base}-${size}-${c.code}`.toLowerCase(),
      sku: `${base}-${size}-${c.code}`,
      attributes: { tamanho: size, cor: c.name },
      stock: stockOf(size, c.name),
    })),
  );
}

export function orderItem(p: Product, quantity: number, variant?: Variant): OrderItem {
  return {
    productId: p.id,
    variantId: variant?.id,
    name: variant ? `${p.name} (${Object.values(variant.attributes).join(" / ")})` : p.name,
    quantity,
    unitPrice: variant?.price ?? p.price,
  };
}

type OrderInput = Omit<Order, "total" | "status"> & { status: OrderStatus };

export function order(input: OrderInput): Order {
  const subtotal = input.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const shipping = input.delivery.type === "entrega" ? input.delivery.shipping : 0;
  return { ...input, total: subtotal + shipping };
}

export function isCouponValid(c: Coupon, now: Date = new Date()): boolean {
  return c.active && (!c.expiresAt || new Date(c.expiresAt) > now);
}
