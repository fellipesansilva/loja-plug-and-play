import type { StoreConfig } from "@/domain/types";
import { bannerImage } from "./images";

export const config: StoreConfig = {
  name: "Trama Studio",
  cartLabel: "Carrinho",
  orderPrefix: "TS",
  logo: "/placeholder?l=Trama%20Studio&c=4b5340",
  seo: {
    titleTemplate: "%s · Trama Studio",
    description: "Moda atemporal em linho e algodão: peças femininas, masculinas e acessórios com entrega para todo o Brasil.",
  },
  layout: { search: "icon", categoryTile: "rect", listing: "grid", product: "classic" },
  homeBlocks: [
    {
      id: "banner",
      type: "banner",
      enabled: true,
      image: bannerImage,
      eyebrow: "Nova coleção",
      title: "Linho e algodão para os dias quentes",
      subtitle: "Peças atemporais, feitas para durar.",
      ctaLabel: "Ver feminino",
      ctaHref: "/categoria/feminino",
    },
    {
      id: "categorias",
      type: "categories",
      enabled: true,
      title: "Compre por categoria",
      deferImages: true,
      categoryIds: ["feminino", "masculino", "acessorios"],
    },
    {
      id: "destaques",
      type: "featured",
      enabled: true,
      title: "Destaques",
      deferImages: true,
      linkLabel: "Ver todos",
      linkHref: "/categoria/feminino",
      productIds: ["ts-001", "ts-002", "ts-006", "ts-003", "ts-008", "ts-014", "ts-016", "ts-012"],
    },
    { id: "frete-gratis", type: "shippingProgress", enabled: true },
  ],
  attributeDefs: [
    { key: "tamanho", label: "Tamanho", selector: "pill", filterable: true, highlight: false, variant: true },
    {
      key: "cor",
      label: "Cor",
      selector: "swatch",
      filterable: true,
      highlight: false,
      variant: true,
      swatches: {
        Preto: "#1c1b19",
        "Off-white": "#ece7dc",
        Areia: "#c9b79c",
        Marinho: "#1f2a44",
      },
    },
    { key: "material", label: "Material", selector: "pill", filterable: false, highlight: false },
    { key: "modelagem", label: "Modelagem", selector: "pill", filterable: false, highlight: false },
  ],
  shipping: {
    options: [
      { id: "economico", label: "Econômico", basePrice: 1490, days: [5, 8] },
      { id: "expresso", label: "Expresso", basePrice: 2490, days: [2, 3] },
    ],
    coverage: "national",
  },
  legal: {
    name: "Trama Studio Comércio de Moda Ltda. (fictícia)",
    document: "00.000.000/0001-00 (fictício, apenas demonstração)",
    address: "Rua Exemplo, 123 — São Paulo/SP (endereço fictício)",
    email: "contato@trama.example",
    phone: "(11) 0000-0000",
  },
  theme: {
    colors: {
      primary: "#4b5340",
      secondary: "#a68a64",
      background: "#f5f3ef",
      surface: "#f5f3ef",
      text: "#1c1b19",
      muted: "#6b675f",
      border: "#ddd8cf",
      success: "#3f5a2e",
      warning: "#b7791f",
      danger: "#b4443c",
      announcementBg: "#4b5340",
      announcementText: "#ffffff",
      highlightBg: "#4b5340",
      highlightText: "#ffffff",
      footerBg: "#f5f3ef",
      footerText: "#6b675f",
    },
    fonts: {
      heading: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif",
      body: "var(--font-manrope), system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      headingWeight: "400",
      headingTracking: "0",
    },
    radii: { sm: "0", md: "0", lg: "0", xl: "0", sheet: "0", button: "0" },
    ratios: { product: "3 / 4" },
    logo: {
      transform: "uppercase",
      tracking: "0.18em",
      weight: "600",
      color: "var(--t-color-text)",
      accent: "var(--t-color-text)",
    },
    spacing: { xs: "0.25rem", sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2.5rem" },
  },
  // Opções que o painel oferece em Configurações › Tema (aprovadas aqui; nunca cor livre). A primeira de cada lista é a do tema acima.
  themeChoices: {
    primary: [
      { id: "oliva", label: "Oliva", value: "#4b5340" },
      { id: "grafite", label: "Grafite", value: "#2f3430" },
      { id: "petroleo", label: "Petróleo", value: "#26475a" },
      { id: "vinho", label: "Vinho", value: "#6e2f3a" },
    ],
    accent: [
      { id: "areia", label: "Areia", value: "#a68a64" },
      { id: "ocre", label: "Ocre", value: "#b8863b" },
      { id: "salvia", label: "Sálvia", value: "#8a9a7b" },
      { id: "cafe", label: "Café", value: "#5c4033" },
    ],
    fonts: {
      heading: [
        { id: "bodoni-moda", label: "Bodoni Moda (serifada)", value: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif" },
        { id: "manrope", label: "Manrope (sem serifa)", value: "var(--font-manrope), system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
      ],
      body: [{ id: "manrope", label: "Manrope", value: "var(--font-manrope), system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }],
    },
    // Texto sobre fundo: cada par precisa de 4,5:1 (WCAG AA).
    contrastPairs: [
      ["announcementText", "announcementBg"],
      ["highlightText", "highlightBg"],
      ["background", "primary"],
      ["primary", "background"],
      ["text", "secondary"],
    ],
  },
  modules: {
    retiradaLocal: false,
    freteGratis: { enabled: true, minValue: 19900 },
    parcelamento: { enabled: true, maxInstallments: 6, minInstallment: 2000 },
    boleto: true,
    cartao: { enabled: true },
    descontoPix: { enabled: true, percent: 5 },
    cupom: true,
    assistenteVirtual: false,
  },
  policies: {
    regret: "Direito de arrependimento: você pode desistir da compra em até 7 dias após o recebimento.",
    regretDays: 7,
    regretConditions: "A peça deve estar sem uso, lavagem ou alteração, e com a etiqueta. (Texto de demonstração.)",
    defect: {
      durability: "durable",
      days: 90,
      conditions:
        "Se a peça apresentar defeito de fabricação, avise em até 90 dias após o recebimento: trocamos por outra igual ou devolvemos o valor, e o frete da devolução é por nossa conta. (Texto de demonstração.)",
    },
    digital:
      "Produtos digitais (como e-books e cursos) liberam o acesso logo após a confirmação do pagamento. O direito de arrependimento de 7 dias vale a partir da compra, e o reembolso é integral. (Texto de demonstração.)",
    about:
      "A Trama Studio é uma marca fictícia de moda atemporal, criada para demonstrar a plataforma de loja virtual plug and play.",
    privacy: {
      dataCollected: [
        "Nome, e-mail, celular e CPF, informados no checkout.",
        "Endereço de entrega.",
        "Itens, valores e forma de pagamento do pedido (nunca o número completo do cartão nem o CVV).",
        "Sua escolha sobre cookies e sobre o recebimento de ofertas.",
      ],
      purpose:
        "Processar e entregar o pedido, emitir a nota fiscal, atender você após a compra e cumprir obrigações legais. Só enviamos ofertas se você marcar essa opção. (Texto de demonstração.)",
      retention:
        "Dados do pedido ficam guardados por 5 anos, prazo das obrigações fiscais. Dados de ofertas ficam até você pedir a remoção. (Texto de demonstração.)",
      sharing: [
        "Operadora de pagamento, para autorizar a cobrança.",
        "Transportadora, para entregar o pedido.",
        "Autoridades, quando a lei exigir.",
      ],
      rights: [
        "Confirmar que tratamos seus dados e acessá-los.",
        "Corrigir dados incompletos ou desatualizados.",
        "Pedir anonimização, bloqueio ou eliminação de dados desnecessários.",
        "Pedir a portabilidade dos dados.",
        "Revogar o consentimento e se opor ao tratamento, quando cabível.",
      ],
      controller: { name: "Encarregado de dados da Trama Studio (fictício)", email: "privacidade@trama.example" },
    },
    cookies: {
      notice:
        "Usamos apenas cookies essenciais para a loja funcionar. Você escolhe se permite também os não essenciais (como medição de audiência), que hoje não usamos. (Texto de demonstração.)",
      version: "1",
    },
  },
};
