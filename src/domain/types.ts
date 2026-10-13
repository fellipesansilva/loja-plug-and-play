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
    /** Faixa de aviso do topo. */
    announcementBg: string;
    announcementText: string;
  };
  fonts: {
    heading: string;
    body: string;
    /** Peso (CSS font-weight) dos títulos h1–h3. */
    headingWeight: string;
  };
  /** `button` é o raio dos botões (ex.: 999px = pílula). */
  radii: { sm: string; md: string; lg: string; button: string };
  /** Proporções (CSS aspect-ratio), ex.: "3 / 4". */
  ratios: { product: string };
  /** Estilo tipográfico do logo (nome da loja). Valores CSS. */
  logo: { transform: string; tracking: string; weight: string; color: string };
  /** Escala de espaçamento nomeada. */
  spacing: { xs: string; sm: string; md: string; lg: string; xl: string };
};

/** Pix NÃO é módulo: está sempre ativo. */
export type Modules = {
  retiradaLocal?: boolean;
  freteGratis?: { enabled: boolean; minValue: Money };
  /** `minInstallment` = valor mínimo da parcela em centavos (padrão 2000). */
  parcelamento?: { enabled: boolean; maxInstallments: number; minInstallment?: Money };
  boleto?: boolean;
  cupom?: boolean;
  assistenteVirtual?: boolean;
};

/** Imagem com texto alternativo (vindo do preset). */
export type Image = { src: string; alt: string };

/** Bloco da home. A ordem do array `homeBlocks` é a ordem na página. */
export type HomeBlock =
  | {
      id: string;
      type: "banner";
      enabled: boolean;
      image: Image;
      eyebrow?: string;
      title: string;
      subtitle?: string;
      ctaLabel: string;
      ctaHref: string;
    }
  | { id: string; type: "categories"; enabled: boolean; title?: string; categoryIds: string[] }
  | {
      id: string;
      type: "featured";
      enabled: boolean;
      title: string;
      linkLabel: string;
      linkHref: string;
      productIds: string[];
    };

export type AttributeSelector = "pill" | "swatch" | "list";

/** Definição de um atributo do catálogo (gera seletor, filtro e selo). */
export type AttributeDef = {
  key: string;
  label: string;
  selector: AttributeSelector;
  /** Gera filtro na categoria. */
  filterable: boolean;
  /** Vira selo no card do produto. */
  highlight: boolean;
  /** Só para `swatch`: valor do atributo → cor CSS do círculo. */
  swatches?: Record<string, string>;
};

export type ShippingOption = {
  id: string;
  label: string;
  /** Preço base em centavos, antes do fator regional. */
  basePrice: Money;
  /** Prazo em dias úteis [mín, máx] ou entrega no mesmo dia. */
  days: [number, number] | "same-day";
};

export type ShippingConfig = {
  options: ShippingOption[];
  coverage: "national" | { cepPrefixes: string[] };
};

export type StoreConfig = {
  name: string;
  logo: string;
  seo: { titleTemplate: string; description: string };
  /** Variantes de layout da vitrine, escolhidas pelo preset. */
  layout: {
    /** "icon" = ícone no cabeçalho que abre o campo; "bar" = campo em pílula abaixo do cabeçalho. */
    search: "icon" | "bar";
    /** Formato do tile de categoria na home. */
    categoryTile: "rect" | "circle";
  };
  homeBlocks: HomeBlock[];
  attributeDefs: AttributeDef[];
  shipping: ShippingConfig;
  legal: {
    /** CNPJ/CPF (fictício nos presets). */
    document: string;
    address: string;
    contact: string;
  };
  theme: ThemeTokens;
  modules: Modules;
  policies: {
    exchange: string;
    privacy: string;
    about: string;
    /** Aviso curto sobre arrependimento, exibido na página do produto (antes do link de Trocas e devoluções). */
    regret: string;
  };
};

export type Category = { id: string; slug: string; name: string; image: Image };

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
  images: Image[];
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

export type CartLine = { productId: string; variantId?: string; qty: number };

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
