import type { StoreConfig } from "@/domain/types";
import { bannerImage } from "./images";

export const config: StoreConfig = {
  name: "Forno da Vila",
  cartLabel: "Sacola",
  cartGender: "f",
  orderPrefix: "FV",
  logo: "/placeholder?l=Forno%20da%20Vila&c=cf3512",
  wordmark: { text: "forno.da vila", accent: "." },
  pickup: { leadTime: "20 min", readyLabel: "Pronto para retirada" },
  seo: {
    titleTemplate: "%s · Forno da Vila",
    description: "Pizzas, pães e doces saindo do forno todos os dias. Peça online e receba em casa ou retire na loja em 20 minutos.",
  },
  layout: { search: "bar", categoryTile: "circle", listing: "menu", product: "sheet" },
  homeBlocks: [
    {
      id: "banner",
      type: "banner",
      enabled: true,
      variant: "card",
      image: bannerImage,
      badge: "Saindo do forno agora",
      title: "Pizza quente, direto do forno",
      ctaLabel: "Pedir agora",
      ctaHref: "/categoria/pizzas",
      secondaryCtaLabel: "Ver cardápio",
      secondaryCtaHref: "/categoria/pizzas",
    },
    {
      id: "categorias-chips",
      type: "chips",
      enabled: true,
      items: [
        { label: "Mais pedidos", href: "#destaques" },
        { label: "Pizzas", href: "/categoria/pizzas" },
        { label: "Pães", href: "/categoria/paes" },
        { label: "Doces", href: "/categoria/doces" },
        { label: "Bebidas", href: "/categoria/bebidas" },
      ],
    },
    { id: "campeoes", type: "spotlight", enabled: true, title: "Os campeões da casa", productId: "fv-012" },
    {
      id: "destaques",
      type: "featured",
      enabled: true,
      title: "Mais pedidos",
      linkLabel: "Ver todos",
      linkHref: "/categoria/pizzas",
      productIds: ["fv-001", "fv-002", "fv-006", "fv-013"],
    },
    { id: "frete-gratis", type: "shippingProgress", enabled: true },
  ],
  attributeDefs: [
    { key: "porcao", label: "Porção", selector: "list", filterable: false, highlight: false, variant: true },
    { key: "dieta", label: "Restrição alimentar", selector: "pill", filterable: true, highlight: true },
    { key: "sabor", label: "Sabor", selector: "pill", filterable: false, highlight: false },
    { key: "validade", label: "Validade", selector: "pill", filterable: false, highlight: false },
    { key: "restricoes", label: "Restrições", selector: "pill", filterable: false, highlight: false, summary: true },
  ],
  shipping: {
    options: [
      { id: "economico", label: "Econômico", basePrice: 990, days: [1, 2] },
      { id: "expresso", label: "Expresso", basePrice: 1690, days: "same-day" },
    ],
    coverage: { cepPrefixes: ["0"] },
  },
  legal: {
    name: "Forno da Vila Alimentos Ltda. (fictícia)",
    document: "00.000.000/0001-00 (fictício, apenas demonstração)",
    address: "Praça Exemplo, 45 — São Paulo/SP (endereço fictício)",
    email: "pedidos@fornodavila.example",
    phone: "(11) 0000-0000",
  },
  theme: {
    colors: {
      primary: "#cf3512",
      secondary: "#ffc531",
      background: "#fff8ee",
      surface: "#ffffff",
      text: "#2a140a",
      muted: "#7a5a45",
      border: "#f1e1cb",
      success: "#2f7a3a",
      warning: "#c98a12",
      danger: "#c0392b",
      announcementBg: "#ffc531",
      announcementText: "#2a140a",
      highlightBg: "#ffc531",
      highlightText: "#2a140a",
      footerBg: "#fbebd6",
      footerText: "#6e4e39",
    },
    fonts: {
      heading: "var(--font-bricolage), 'Trebuchet MS', 'Segoe UI', sans-serif",
      body: "var(--font-manrope), system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      headingWeight: "800",
      headingTracking: "-0.025em",
    },
    radii: { sm: "12px", md: "16px", lg: "20px", xl: "28px", sheet: "24px", button: "999px" },
    ratios: { product: "1 / 1" },
    logo: {
      transform: "none",
      tracking: "-0.02em",
      weight: "800",
      color: "var(--t-color-text)",
      accent: "var(--t-color-primary)",
    },
    spacing: { xs: "0.25rem", sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2.5rem" },
  },
  modules: {
    retiradaLocal: true,
    freteGratis: { enabled: true, minValue: 8000 },
    parcelamento: { enabled: false, maxInstallments: 1 },
    boleto: false,
    cartao: { enabled: true },
    descontoPix: { enabled: false, percent: 5 },
    cupom: true,
    assistenteVirtual: false,
  },
  policies: {
    regret:
      "Direito de arrependimento: você pode desistir da compra em até 7 dias após o recebimento (CDC, art. 49). Para alimentos, o produto deve estar lacrado e conservado conforme a embalagem.",
    regretDays: 7,
    regretConditions:
      "Por se tratar de alimentos perecíveis, o produto deve estar lacrado e conservado conforme a embalagem. (Texto de demonstração.)",
    defect: {
      durability: "nonDurable",
      days: 30,
      conditions:
        "Se o pedido chegar com problema (produto estragado, trocado ou fora das condições de consumo), avise em até 30 dias após o recebimento, com uma foto: refazemos o pedido ou devolvemos o valor. Alimentos perecíveis devem ser avisados o quanto antes. (Texto de demonstração.)",
    },
    digital:
      "Produtos digitais (como vales e receitas em PDF) são enviados por e-mail após a confirmação do pagamento. O direito de arrependimento de 7 dias vale a partir da compra, e o reembolso é integral. (Texto de demonstração.)",
    about:
      "O Forno da Vila é uma cozinha artesanal fictícia, criada para demonstrar a plataforma de loja virtual plug and play.",
    privacy: {
      dataCollected: [
        "Nome, e-mail, celular e CPF, informados no checkout.",
        "Endereço de entrega, quando o pedido não é para retirada.",
        "Itens, valores e forma de pagamento do pedido (nunca o número completo do cartão nem o CVV).",
        "Sua escolha sobre cookies e sobre o recebimento de ofertas.",
      ],
      purpose:
        "Preparar e entregar o pedido, emitir a nota fiscal, avisar você sobre o andamento e cumprir obrigações legais. Só enviamos ofertas se você marcar essa opção. (Texto de demonstração.)",
      retention:
        "Dados do pedido ficam guardados por 5 anos, prazo das obrigações fiscais. Dados de ofertas ficam até você pedir a remoção. (Texto de demonstração.)",
      sharing: [
        "Operadora de pagamento, para autorizar a cobrança.",
        "Entregador ou serviço de entrega, para levar o pedido até você.",
        "Autoridades, quando a lei exigir.",
      ],
      rights: [
        "Confirmar que tratamos seus dados e acessá-los.",
        "Corrigir dados incompletos ou desatualizados.",
        "Pedir anonimização, bloqueio ou eliminação de dados desnecessários.",
        "Pedir a portabilidade dos dados.",
        "Revogar o consentimento e se opor ao tratamento, quando cabível.",
      ],
      controller: { name: "Encarregado de dados do Forno da Vila (fictício)", email: "privacidade@fornodavila.example" },
    },
    cookies: {
      notice:
        "Usamos apenas cookies essenciais para a loja funcionar. Você escolhe se permite também os não essenciais (como medição de audiência), que hoje não usamos. (Texto de demonstração.)",
      version: "1",
    },
  },
};
