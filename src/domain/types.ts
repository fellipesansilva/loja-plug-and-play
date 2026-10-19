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
  /**
   * Modo orçamento (loja inteira): sem preço, carrinho, checkout, frete, cupom nem meios de pagamento; o cliente monta uma lista
   * e pede orçamento. Não pode coexistir com nenhum dos módulos de venda acima (validado no build).
   */
  orcamento?: { enabled: boolean };
  /**
   * Módulos do diferencial (F6). Todos nascem desligados: preset que não liga o módulo não carrega o código dele.
   * `bot`: atendimento simulado (precisa de `whatsapp` ligado: a resposta "não sei" oferece o WhatsApp).
   * `whatsapp`: botão flutuante. `depoimentos`: seção na home. `newsletter`: campo de e-mail no rodapé.
   */
  bot?: boolean;
  whatsapp?: boolean;
  depoimentos?: boolean;
  newsletter?: boolean;
  /**
   * Área do aluno simulada (loja de cursos): "Meus cursos", página do curso, aula e progresso, tudo no navegador (sem login nem servidor).
   * Estrutural do preset (não é ligado nem desligado no painel): exige `config.cursos` e produtos digitais com `course`.
   */
  cursos?: boolean;
};

/** Tema de resposta do bot: o visitante clica no tema ou escreve uma palavra de `keywords`. Tudo vem do preset (sem IA). */
export type BotTopic = { id: string; label: string; keywords: string[]; answer: string };

/** Textos e respostas do bot simulado (módulo `bot`). */
export type BotConfig = {
  /** Texto do botão que abre a conversa. */
  openLabel: string;
  title: string;
  /** Marca visível na janela ("Simulação"). */
  badge: string;
  greeting: string;
  inputLabel: string;
  sendLabel: string;
  closeLabel: string;
  topics: BotTopic[];
  /** Resposta fixa para pergunta fora do repertório. */
  fallback: string;
  /** Texto do botão que oferece o WhatsApp na resposta fixa. */
  whatsappOffer: string;
};

/** WhatsApp da loja (módulo `whatsapp`). Com `isReal` falso (demo) nada abre a conversa: mostra a mensagem pronta para copiar. */
export type WhatsappConfig = {
  number: string;
  isReal: boolean;
  openLabel: string;
  title: string;
  /** Marca visível (ex.: "Demonstração"). */
  badge: string;
  /** Mensagem sem produto na página. */
  greeting: string;
  /** Mensagem com produto na página; `{produto}` é trocado pelo nome. */
  productMessage: string;
  demoNote: string;
  copyLabel: string;
  copiedLabel: string;
  closeLabel: string;
};

/** Depoimento (módulo `depoimentos`). Sem `real`, é fictício e leva a marca de demonstração. */
export type Testimonial = {
  id: string;
  name: string;
  city: string;
  text: string;
  /** Foto opcional; sem ela aparece a inicial do nome. */
  photo?: Image;
  /** Cliente de verdade: só publica com `autorizado: true` (validado no build). */
  real?: boolean;
  autorizado?: boolean;
};

/** Newsletter (módulo `newsletter`). Nada é enviado: o e-mail fica só no navegador (demo). */
export type NewsletterConfig = {
  title: string;
  text: string;
  /** Marca visível ("Demonstração"). */
  badge: string;
  emailLabel: string;
  consentLabel: string;
  submitLabel: string;
  privacyLinkLabel: string;
  invalidEmail: string;
  /** Mensagem quando o envio é recusado por falta de consentimento. */
  refusal: string;
  success: string;
};

/** Aula de um curso (módulo `cursos`). Sem vídeo: a aula mostra a capa de demonstração e o texto. */
export type Lesson = {
  id: string;
  title: string;
  /** Duração em minutos; a carga horária do curso é a soma das aulas. */
  minutes: number;
  /** Texto da aula, um parágrafo por item. */
  text: string[];
};

/** Conteúdo de um curso (produto digital do módulo `cursos`): instrutor fictício e a ementa, aula a aula. */
export type Course = {
  instructor: string;
  /** Uma linha sobre o instrutor (marcada como fictícia no preset). */
  instructorNote: string;
  lessons: Lesson[];
};

/** Textos da área do aluno (módulo `cursos`). Tudo vem do preset. */
export type CursosConfig = {
  /** Link do menu e título da página ("Meus cursos"). */
  myCoursesLabel: string;
  intro: string;
  /** Lista vazia: ninguém comprou curso neste navegador. */
  empty: string;
  emptyCtaLabel: string;
  /** Botão da confirmação do pedido e da lista ("Acessar curso"). */
  accessLabel: string;
  /** Marca sobre a capa da aula ("Aula de demonstração") e o aviso de que não há vídeo. */
  demoLabel: string;
  demoNote: string;
  completeLabel: string;
  completedLabel: string;
  /** Motivo do bloqueio: pedido aguardando pagamento e pedido cancelado / pagamento recusado. {pedido} vira o número do pedido. */
  lockedAwaiting: string;
  lockedCanceled: string;
  /** Texto de apoio da lista de aulas e do progresso. */
  progressLabel: string;
  syllabusTitle: string;
  instructorLabel: string;
  workloadLabel: string;
  /** Marca de demonstração do instrutor e do curso (aparece na página do curso). */
  demoBadge: string;
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
export type Image = {
  src: string;
  alt: string;
  sources?: ImageSource[];
  /** Só para a foto principal da home: gera um <link rel="preload"> com o mesmo srcset do <picture>. */
  preload?: boolean;
};

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
  | { id: string; type: "categories"; enabled: boolean; title?: string; categoryIds: string[]; /** Fotos das categorias só começam a baixar depois que a foto principal da página foi pintada. */ deferImages?: boolean }
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
      /** Imagens dos cards só são baixadas perto da janela e depois que a foto principal da página foi pintada (para blocos abaixo da primeira tela; poupa banda para o LCP). */
      deferImages?: boolean;
    }
  /** Entrada por necessidade (usa `config.needs`: cada necessidade leva a uma página com os produtos dela). */
  | { id: string; type: "needs"; enabled: boolean; tone?: Tone; eyebrow?: string; title: string }
  /** Depoimentos (módulo `depoimentos`): de 3 a 6, cada um com a marca de demonstração quando fictício. */
  | { id: string; type: "testimonials"; enabled: boolean; title: string; note: string; demoLabel: string; items: Testimonial[] }
  /** Entrada por setor (usa `config.sectors`: cada setor tem página com os produtos da aplicação e um case). */
  | { id: string; type: "sectors"; enabled: boolean; tone?: Tone; eyebrow?: string; title: string }
  /** Indicadores. Os valores são do preset e vêm marcados (`note`, ex.: "Números fictícios, apenas demonstração"). */
  | { id: string; type: "stats"; enabled: boolean; tone?: Tone; title?: string; items: { value: string; label: string }[]; note?: string }
  /** Projetos entregues (usa `config.cases`; `caseIds` define quais e a ordem). */
  | { id: string; type: "cases"; enabled: boolean; tone?: Tone; eyebrow?: string; title: string; caseIds: string[]; note?: string }
  /** Processo em passos, com um destaque opcional (ex.: "prévia gratuita"). */
  | {
      id: string;
      type: "process";
      enabled: boolean;
      tone?: Tone;
      eyebrow?: string;
      title: string;
      /** Passo com este número ganha destaque (1 = primeiro). */
      highlight?: { step: number; label: string };
      steps: { title: string; text: string }[];
    }
  /** Chamada final. */
  | { id: string; type: "cta"; enabled: boolean; tone?: Tone; title: string; text?: string; ctaLabel: string; ctaHref: string };

/** Cor da paleta do configurador: só estas cores aparecem para o cliente (`valor` é CSS, vem do preset). */
export type PaletaCor = { id: string; nome: string; valor: string };

/** Linha de reservatório do dimensionador: produto do catálogo e capacidades disponíveis (litros, inteiros, em ordem crescente). */
export type LinhaReservatorio = { produto: string; capacidades: number[] };

/**
 * Ferramentas do modo orçamento. Tudo vem do preset: produto-alvo, paleta, limites e capacidades. `ativos` liga as duas ferramentas
 * (desligado ou ausente em Trama e Forno).
 */
export type OrcamentoBlocks = {
  ativos: boolean;
  porticoConfigurador?: {
    /** Id do produto que mostra o configurador. */
    alvoProduto: string;
    textoMax: number;
    /** Texto mostrado na prévia (e na observação) enquanto o cliente não digita. */
    textoExemplo: string;
    /** Medidas escritas na observação do item (ex.: "6 × 4 m"). */
    medidas: string;
    paleta: PaletaCor[];
  };
  dimensionador?: {
    fechado: LinhaReservatorio;
    aberto: LinhaReservatorio;
    diasMin: number;
    diasMax: number;
    unidadeConsumo: string;
    /** O que oferecer quando o volume passa da maior capacidade. */
    fallbackAcimaDoMaior: "projeto-sob-medida";
  };
};

/** Opção aprovada da paleta de um preset: `value` é uma cor hexadecimal. */
export type ColorChoice = { id: string; label: string; value: string };
/** Fonte aprovada de um preset: `value` é a pilha CSS completa (a variável da fonte do preset e as reservas). */
export type FontChoice = { id: string; label: string; value: string };

/**
 * O que o painel (Configurações › Tema) oferece: só opções aprovadas no preset, nunca cor livre. A cor principal e a de destaque
 * trocam `colors.primary` e `colors.secondary` (e os tokens que, no preset, repetem essas cores); `contrastPairs` diz que textos
 * ficam sobre que fundos, para o contraste mínimo de 4,5:1 (src/theme/contrast.ts).
 */
export type ThemeChoices = {
  primary: ColorChoice[];
  accent: ColorChoice[];
  fonts: { heading: FontChoice[]; body: FontChoice[] };
  contrastPairs: [fg: keyof ThemeTokens["colors"], bg: keyof ThemeTokens["colors"]][];
};

/** Fundo da seção: "dark" usa a cor primária; "light" (padrão) o fundo da loja. */
export type Tone = "dark" | "light";

/** Setor atendido (loja em orçamento): página `/setor/<slug>` com os produtos da aplicação e um case. */
export type Sector = { slug: string; label: string; description: string; image: Image; productIds: string[]; caseId?: string };
/** Necessidade do cliente: página `/necessidade/<slug>` com os produtos que a atendem. */
export type Need = { slug: string; label: string; description: string; productIds: string[] };
/** Projeto entregue (demonstração). */
export type CaseStudy = { id: string; title: string; city: string; productId: string; result: string; image: Image; sectorSlug?: string };

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
  /** Módulos do diferencial (F6): textos e dados, obrigatórios quando o módulo correspondente está ligado. */
  bot?: BotConfig;
  whatsapp?: WhatsappConfig;
  newsletter?: NewsletterConfig;
  /** Textos da área do aluno (obrigatório quando `modules.cursos` está ligado). */
  cursos?: CursosConfig;
  /** Textos e dados do modo orçamento (obrigatório quando `modules.orcamento.enabled`). */
  quote?: {
    /** Nome da lista ("Lista de orçamento") e o gênero gramatical dele, como `cartLabel`/`cartGender`. */
    listLabel: string;
    listGender: "m" | "f";
    /** Texto do botão do produto ("Adicionar ao orçamento"). */
    addLabel: string;
    /** Introdução da página da lista. */
    intro: string;
    /** Opções do campo "aplicação" do formulário. */
    applications: string[];
    /** WhatsApp da loja. Com `isReal` falso (demo) nada abre a conversa: mostra a mensagem pronta para copiar. */
    whatsapp: { number: string; isReal: boolean };
  };
  /** Retirada no local: prazo exibido na faixa de aviso (ex.: "20 min") e rótulo do status "enviado" nos pedidos de retirada (ex.: "Pronto para retirada"). */
  pickup?: { leadTime: string; readyLabel: string };
  homeBlocks: HomeBlock[];
  /** Ferramentas do modo orçamento na página do produto (configurador de pórtico, dimensionador de reservatório). */
  orcamentoBlocks?: OrcamentoBlocks;
  /** Entradas por necessidade, setor e projetos entregues (opcionais; só a Arca usa por enquanto). */
  needs?: Need[];
  sectors?: Sector[];
  cases?: CaseStudy[];
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
  /** Opções aprovadas para o painel trocar o tema (ver ThemeChoices). */
  themeChoices?: ThemeChoices;
  modules: Modules;
  policies: {
    /** Aviso curto sobre arrependimento, exibido na página do produto (antes do link de Trocas e devoluções). Não se aplica a loja em orçamento. */
    regret?: string;
    /** Direito de arrependimento (CDC, art. 49): prazo em dias a partir do recebimento. Nunca menor que `MIN_REGRET_DAYS` (validado no build). */
    regretDays?: number;
    /** Condições para devolver o produto no arrependimento (ex.: "peça sem uso e com etiqueta"). */
    regretConditions?: string;
    /** Condições comerciais (loja em orçamento, no lugar de Trocas e devoluções): produção, frete. A garantia vem de `defect`. */
    commercial?: { production: string; freight: string };
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

/** `image` é opcional: o bloco de categorias da home usa um tile tipográfico quando a loja não tem foto da categoria. */
export type Category = { id: string; slug: string; name: string; image?: Image };

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
  /** Aplicações do produto (etiquetas na página; ex.: "Agro", "Eventos"). */
  applications?: string[];
  /** Setores do produto (slugs de `config.sectors`): viram links para as páginas de setor. */
  sectorSlugs?: string[];
  /** Até 3 benefícios com número (ex.: "20 min" / "para instalar"), na página do produto. */
  benefits?: { value: string; label: string }[];
  /** Curso (só com `modules.cursos`; o produto é `digital`): instrutor e aulas. */
  course?: Course;
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

export type QuoteStatus = "nova" | "em_analise" | "orcamento_enviado" | "ganho" | "perdido";

export const QUOTE_STATUSES: readonly QuoteStatus[] = ["nova", "em_analise", "orcamento_enviado", "ganho", "perdido"];

/** Item da lista de orçamento do visitante (sem preço): produto, quantidade e observação (até 500 caracteres). */
/**
 * Linha da lista de orçamento. `id` identifica a linha: nos itens comuns é o próprio `productId` (somar o mesmo produto aumenta a
 * quantidade); nos itens configurados (pórtico com a marca, reservatório dimensionado) cada configuração é uma linha com id próprio.
 */
export type QuoteListItem = { id: string; productId: string; qty: number; note: string; configurado: boolean };

export const QUOTE_NOTE_MAX = 500;

/** Item de uma solicitação enviada: guarda nome e SKU da época do envio. */
export type QuoteRequestItem = { productId: string; name: string; sku: string; qty: number; note: string };

export type QuoteContact = {
  name: string;
  company?: string;
  email: string;
  whatsapp: string;
  city: string;
  state: string;
  application: string;
  message: string;
};

/** Solicitação de orçamento (simulada). O protocolo é o id (ORC-AAAAMMDD-XXXXX). */
export type QuoteRequest = {
  id: string;
  createdAt: string;
  status: QuoteStatus;
  items: QuoteRequestItem[];
  contact: QuoteContact;
  history: { status: QuoteStatus; at: string }[];
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
  /** Solicitações de orçamento de exemplo (só em loja com `modules.orcamento`). */
  quotes?: QuoteRequest[];
  sampleCsv: string;
};
