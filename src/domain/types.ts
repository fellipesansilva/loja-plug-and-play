/** Valores monetários em centavos de BRL (inteiros), ex.: 18990 = R$ 189,90. Formatar só na exibição (src/lib/money.ts). */
export type Money = number;

export type ThemeTokens = {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
    border: string;
    success: string;
    warning: string;
    danger: string;
  };
  fonts: { heading: string; body: string };
  radii: { sm: string; md: string; lg: string };
  /** Escala de espaçamento nomeada. */
  spacing: { xs: string; sm: string; md: string; lg: string; xl: string };
};

/** Pix NÃO é módulo: está sempre ativo. */
export type Modules = {
  retiradaLocal?: boolean;
  freteGratis?: { enabled: boolean; minValue: Money };
  parcelamento?: { enabled: boolean; maxInstallments: number };
  boleto?: boolean;
  cupom?: boolean;
  assistenteVirtual?: boolean;
};

export type StoreConfig = {
  name: string;
  logo: string;
  legal: {
    /** CNPJ/CPF (fictício nos presets). */
    document: string;
    address: string;
    contact: string;
  };
  theme: ThemeTokens;
  modules: Modules;
  policies: { exchange: string; privacy: string; about: string };
};

export type Category = { id: string; slug: string; name: string };

export type Attribute = { key: string; label: string; value: string };

export type Variant = {
  id: string;
  sku: string;
  /** Ex.: { tamanho: "M", cor: "Preto" } */
  attributes: Record<string, string>;
  price?: Money;
  stock: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  price: Money;
  images: string[];
  description: string;
  sku: string;
  stock: number;
  categoryId: string;
  attributes: Attribute[];
  variants: Variant[];
};

export type OrderStatus =
  | "aguardando_pagamento"
  | "pago"
  | "em_separacao"
  | "enviado"
  | "entregue"
  | "cancelado";

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "aguardando_pagamento",
  "pago",
  "em_separacao",
  "enviado",
  "entregue",
  "cancelado",
];

export type OrderItem = {
  productId: string;
  variantId?: string;
  name: string;
  quantity: number;
  unitPrice: Money;
};

export type Order = {
  id: string;
  items: OrderItem[];
  customer: { name: string; email: string; phone: string };
  delivery:
    | { type: "entrega"; address: string; shipping: Money }
    | { type: "retirada" };
  payment: { method: "pix" | "cartao" | "boleto"; installments?: number };
  status: OrderStatus;
  /** ISO 8601 */
  createdAt: string;
  total: Money;
};

export type Coupon = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minValue?: Money;
  active: boolean;
  /** ISO 8601; ausente = sem expiração. */
  expiresAt?: string;
};

export type Preset = {
  id: string;
  config: StoreConfig;
  categories: Category[];
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  sampleCsv: string;
};
