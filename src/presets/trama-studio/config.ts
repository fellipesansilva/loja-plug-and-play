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
      categoryIds: ["feminino", "masculino", "acessorios"],
    },
    {
      id: "destaques",
      type: "featured",
      enabled: true,
      title: "Destaques",
      linkLabel: "Ver todos",
      linkHref: "/categoria/feminino",
      productIds: ["ts-001", "ts-002", "ts-006", "ts-003", "ts-008", "ts-014", "ts-016", "ts-012"],
    },
    { id: "frete-gratis", type: "shippingProgress", enabled: true },
  ],
  attributeDefs: [
    { key: "tamanho", label: "Tamanho", selector: "pill", filterable: true, highlight: false },
    {
      key: "cor",
      label: "Cor",
      selector: "swatch",
      filterable: true,
      highlight: false,
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
    document: "00.000.000/0001-00 (fictício, apenas demonstração)",
    address: "Rua Exemplo, 123 — São Paulo/SP (endereço fictício)",
    contact: "contato@trama.example · (11) 0000-0000",
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
  modules: {
    retiradaLocal: false,
    freteGratis: { enabled: true, minValue: 19900 },
    parcelamento: { enabled: true, maxInstallments: 6, minInstallment: 2000 },
    boleto: true,
    descontoPix: { enabled: true, percent: 5 },
    cupom: true,
    assistenteVirtual: false,
  },
  policies: {
    regret: "Direito de arrependimento: você pode desistir da compra em até 7 dias após o recebimento.",
    exchange:
      "Você pode solicitar a troca ou devolução em até 7 dias após o recebimento, com a peça sem uso e com etiqueta. (Texto de demonstração.)",
    privacy:
      "Coletamos apenas os dados necessários para processar seu pedido. Esta é uma loja de demonstração: nenhum dado real é enviado a servidores.",
    about:
      "A Trama Studio é uma marca fictícia de moda atemporal, criada para demonstrar a plataforma de loja virtual plug and play.",
  },
};
