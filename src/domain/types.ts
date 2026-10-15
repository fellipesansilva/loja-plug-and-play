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
    /** Selos de destaque ("Nº 1", "Saindo do forno"). */
    highlightBg: string;
    highlightText: string;
    footerBg: string;
    footerText: string;
  };
  fonts: {
    heading: string;
    body: string;
    /** Peso (CSS font-weight) dos títulos h1–h3. */
    headingWeight: string;
    /** Espaçamento entre letras dos títulos (CSS letter-spacing), ex.: "-0.025em". */
    headingTracking: string;
  };
  /** `button` é o raio dos botões (ex.: 999px = pílula). */
  /** `xl` = banner em card; `sheet` = folha de conteúdo da página do produto; `button` = botões e chips. */
  radii: { sm: string; md: string; lg: string; xl: string; sheet: string; button: string };
  /** Proporções (CSS aspect-ratio), ex.: "3 / 4". */
  ratios: { product: string };
  /** Estilo tipográfico do logo (nome da loja). Valores CSS. */
  logo: { transform: string; tracking: string; weight: string; color: string; accent: string };
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
  /** Cartão de crédito. Parcelas só aparecem com `parcelamento` ligado; sem ele o cartão é à vista. */
  cartao?: { enabled: boolean };
  /** Desconto no Pix: `percent` (ex.: 5 = 5%) sobre o valor após o cupom, nunca sobre o frete. */
  descontoPix?: { enabled: boolean; percent: number };
  cupom?: boolean;
  assistenteVirtual?: boolean;
};

/** Candidatos de uma imagem responsiva (`width` em px do arquivo). */
export type ImageCandidate = { src: string; width: number };

/**
 * Fonte responsiva de uma imagem (usada no banner principal): para a janela que casa com `media`, o navegador escolhe
 * entre os candidatos AVIF (ou WebP, se não suportar AVIF) conforme `sizes` e a densidade da tela.
 */
export type ImageSource = {
  media: string;
  sizes: string;
  avif: ImageCandidate[];
  webp: ImageCandidate[];
};

/** Imagem com texto alternativo (vindo do preset). `sources` é opcional: sem ele a imagem é um arquivo único (`src`). */
export type Image = { src: string; alt: string; sources?: ImageSource[] };

/** Bloco da home. A ordem do array `homeBlocks` é a ordem na página. */
export type HomeBlock =
  | {
      id: string;
      type: "banner";
      enabled: boolean;
      image: Image;
      /** "full" = faixa de ponta a ponta (padrão); "card" = card com margem e cantos arredondados. */
      variant?: "full" | "card";
      /** Selo sobre a foto (ex.: "Saindo do forno agora"). */
      badge?: string;
      eyebrow?: string;
      title: string;
      subtitle?: string;
      ctaLabel: string;
      ctaHref: string;
      secondaryCtaLabel?: string;
      secondaryCtaHref?: string;
    }
  | { id: string; type: "categories"; enabled: boolean; title?: string; categoryIds: string[] }
  | {
      id: string;
      type: "chips";
      enabled: boolean;
      /** href "#<id>" rola até o bloco com esse id. */
      items: { label: string; href: string }[];
    }
  | { id: string; type: "spotlight"; enabled: boolean; title: string; productId: string }
  | { id: string; type: "shippingProgress"; enabled: boolean }
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
  /** Aparece como linha de resumo (muted) sob a descrição, na página do produto em folha. */
  summary?: boolean;
  /** Pode ser eixo de variação do produto (ex.: tamanho, cor, porção). O formulário do painel gera as variações a partir destes. */
  variant?: boolean;
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
  /** Como a loja chama o carrinho ("Carrinho", "Sacola"). Padrão: "Carrinho". */
  cartLabel?: string;
  /** Gênero gramatical de `cartLabel` ("m": o carrinho, "f": a sacola). Padrão: "m". */
  cartGender?: "m" | "f";
  /** Prefixo do número dos pedidos (ex.: "TS" → TS-1009). Padrão: "PD". */
  orderPrefix?: string;
  logo: string;
  seo: { titleTemplate: string; description: string };
  /** Variantes de layout da vitrine, escolhidas pelo preset. */
  layout: {
    /** "icon" = ícone no cabeçalho que abre o campo; "bar" = campo em pílula abaixo do cabeçalho. */
    search: "icon" | "bar";
    /** Formato do tile de categoria na home. */
    categoryTile: "rect" | "circle";
    /** Listagem de produtos (home, categoria, busca): grade de cards ou cardápio (lista com miniatura e "+"). */
    listing: "grid" | "menu";
    /** Página do produto: "classic" (galeria em proporção do produto) ou "sheet" (foto de ponta a ponta, folha de conteúdo e barra fixa de compra). */
    product: "classic" | "sheet";
  };
  /** Logo em texto com um caractere de destaque colorido (ex.: "forno.da vila" com o ponto). Sem isso, usa `name`. */
  wordmark?: { text: string; accent: string };
  /** Retirada no local: prazo exibido na faixa de aviso (ex.: "20 min") e rótulo do status "enviado" nos pedidos de retirada (ex.: "Pronto para retirada"). */
  pickup?: { leadTime: string; readyLabel: string };
  homeBlocks: HomeBlock[];
  attributeDefs: AttributeDef[];
  shipping: ShippingConfig;
  /** Identificação da loja, exibida no rodapé (todos os campos são obrigatórios: ver validatePreset). */
  legal: {
    /** Nome ou razão social. */
    name: string;
    /** CNPJ ou CPF (fictício nos presets). */
    document: string;
    address: string;
    email: string;
    phone: string;
  };
  theme: ThemeTokens;
  modules: Modules;
  policies: {
    /** Aviso curto sobre arrependimento, exibido na página do produto (antes do link de Trocas e devoluções). */
    regret: string;
    /** Direito de arrependimento (CDC, art. 49): prazo em dias a partir do recebimento. Nunca menor que `MIN_REGRET_DAYS` (validado no build). */
    regretDays: number;
    /** Condições para devolver o produto no arrependimento (ex.: "peça sem uso e com etiqueta"). */
    regretConditions: string;
    /** Troca por defeito: prazo em dias a partir do recebimento e condições. */
    defect: {
      /** Os produtos da loja são duráveis (ex.: roupas) ou não duráveis (ex.: alimentos)? Define o prazo mínimo legal. */
      durability: Durability;
      /** Prazo para reclamar de defeito, em dias. Nunca menor que `MIN_DEFECT_DAYS[durability]` (validado no build). */
      days: number;
      conditions: string;
    };
    /** Texto sobre produto digital (acesso, arrependimento). Obrigatório se o preset tiver produto digital; só aparece quando há. */
    digital?: string;
    about: string;
    privacy: PrivacyPolicy;
    /** Aviso de cookies: o texto e a versão (ao mudar a versão, a escolha é pedida de novo). */
    cookies: { notice: string; version: string };
  };
};

/** Política de privacidade (LGPD): as seis seções da página. */
export type PrivacyPolicy = {
  /** Dados coletados. */
  dataCollected: string[];
  /** Finalidade do tratamento. */
  purpose: string;
  /** Prazo de guarda. */
  retention: string;
  /** Com quem os dados são compartilhados (pagamento, entrega...). */
  sharing: string[];
  /** Direitos do titular. */
  rights: string[];
  /** Responsável pelos dados (encarregado). */
  controller: { name: string; email: string };
};

export type Durability = "durable" | "nonDurable";

/** Prazo mínimo para reclamar de defeito (CDC, art. 26): 30 dias em produto não durável, 90 dias em durável. */
export const MIN_DEFECT_DAYS: Record<Durability, number> = { nonDurable: 30, durable: 90 };

/** Prazo mínimo legal do direito de arrependimento (CDC, art. 49), em dias. */
export const MIN_REGRET_DAYS = 7;

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

/** Item opcional vendido junto do produto (ex.: sorvete, morangos), com preço próprio em centavos. */
export type Addon = { id: string; label: string; price: Money };

/** Produto físico (padrão) ou digital: sem estoque, sem frete e sem etapa de entrega no checkout. */
export type ProductType = "physical" | "digital";

export type Product = {
  id: string;
  slug: string;
  /** Padrão: `"physical"`. */
  type?: ProductType;
  name: string;
  price: Money;
  images: Image[];
  description: string;
  sku: string;
  stock: number;
  categoryId: string;
  attributes: Attribute[];
  variants: Variant[];
  /** Adicionais opcionais ("Turbine seu pedido"). */
  addons?: Addon[];
  /** Selos de destaque do produto (ex.: "Nº 1 da semana"). */
  badges?: string[];
  /** Padrão: `true`. Inativo some da loja (lista, busca, home e página do produto), mas continua no painel. */
  active?: boolean;
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

/** Uma mudança de status do pedido, com data e hora (ISO 8601). */
export type StatusEntry = { status: OrderStatus; at: string };

export type OrderItem = {
  productId: string;
  variantId?: string;
  /** Linha do carrinho de origem (produto + variante + adicionais). */
  lineId?: string;
  addons?: Addon[];
  name: string;
  quantity: number;
  unitPrice: Money;
};

/**
 * Linha do carrinho. `lineId` = produto + variante + adicionais ordenados (ver src/lib/cart.ts):
 * a mesma combinação soma a quantidade; combinação diferente vira linha nova.
 */
export type CartLine = {
  lineId: string;
  productId: string;
  variantId?: string;
  addonIds: string[];
  qty: number;
};

export type Order = {
  id: string;
  items: OrderItem[];
  customer: {
    name: string;
    email: string;
    phone: string;
    /** CPF mascarado (`***.***.***-12`): o número completo nunca é gravado. */
    cpf?: string;
    marketingOptIn?: boolean;
    /** ISO 8601 do momento em que o cliente marcou "Quero receber ofertas". Só existe se marcou. */
    marketingConsentAt?: string;
  };
  delivery:
    | { type: "entrega"; address: string; shipping: Money }
    | { type: "retirada" }
    | { type: "digital" };
  payment: {
    method: "pix" | "cartao" | "boleto";
    installments?: number;
    /** Cartão: só bandeira e últimos 4 dígitos. O número completo e o CVV nunca são gravados. */
    brand?: string;
    last4?: string;
    /** Boleto: vencimento (AAAA-MM-DD). */
    dueDate?: string;
    /** Pix: código copia-e-cola fictício; boleto: linha digitável fictícia. */
    code?: string;
  };
  subtotal?: Money;
  couponCode?: string;
  couponDiscount?: Money;
  pixDiscount?: Money;
  status: OrderStatus;
  /** Histórico de status, do mais antigo ao mais recente. O primeiro item é o status inicial na data do pedido. */
  history?: StatusEntry[];
  /** Pedido de arrependimento (simulado): protocolo e data. O status passa a "cancelado". */
  regret?: { protocol: string; requestedAt: string };
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

/** Escolhas do carrinho que seguem para o checkout (cupom, CEP e entrega). */
export type CheckoutDraft = {
  couponCode: string | null;
  /** Só dígitos (8) quando válido; vazio = não informado. */
  cep: string;
  /** id da opção de frete, ou "pickup" (retirada). */
  shippingId: string | null;
};

export type Preset = {
  id: string;
  /** Segmento da URL do preset (`/forno/...`): apelido curto, único e sem espaços. */
  shortId: string;
  config: StoreConfig;
  categories: Category[];
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  sampleCsv: string;
};
