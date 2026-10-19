import type { StoreConfig } from "@/domain/types";
import { bannerImage } from "./images";

// Órbita: marca FICTÍCIA de eletrônicos premium, criada para demonstrar a plataforma (nada aqui é de uma empresa real).
// Os valores que a config repete (frete grátis, parcelas, desconto no Pix, prazos) saem das constantes abaixo (uma fonte só).
const FREE_SHIPPING_MIN = 29900;
const MAX_INSTALLMENTS = 10;
const PIX_PERCENT = 8;
const REGRET_DAYS = 7;
const DEFECT_DAYS = 90;
const ECONOMY_DAYS: [number, number] = [4, 7];
const EXPRESS_DAYS: [number, number] = [1, 3];

const FONT_MANROPE = "var(--font-manrope), system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const FONT_BARLOW = "var(--font-barlow), system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

export const config: StoreConfig = {
  name: "Órbita",
  cartLabel: "Carrinho",
  cartGender: "m",
  orderPrefix: "OR",
  logo: "/placeholder?l=%C3%93rbita&c=8ab4ff",
  seo: {
    titleTemplate: "%s · Órbita",
    description: "Áudio, vestíveis e acessórios premium com entrega para todo o Brasil, parcelamento em até 10 vezes e garantia de 12 meses.",
  },
  layout: { search: "bar", categoryTile: "rect", listing: "grid", product: "classic" },
  homeBlocks: [
    {
      id: "banner",
      type: "banner",
      enabled: true,
      variant: "card",
      image: bannerImage,
      eyebrow: "Nova linha Studio",
      title: "Som e tecnologia em outra órbita",
      subtitle: "Fones, relógios e acessórios com acabamento premium.",
      ctaLabel: "Ver áudio",
      ctaHref: "/categoria/audio",
      secondaryCtaLabel: "Ver vestíveis",
      secondaryCtaHref: "/categoria/vestiveis",
    },
    {
      id: "categorias",
      type: "categories",
      enabled: true,
      title: "Compre por categoria",
      categoryIds: ["audio", "vestiveis", "acessorios"],
      deferImages: true,
    },
    {
      id: "destaques",
      type: "featured",
      enabled: true,
      title: "Mais vendidos",
      linkLabel: "Ver todos",
      linkHref: "/categoria/audio",
      productIds: ["orb-001", "orb-007", "orb-002", "orb-011"],
      deferImages: true,
    },
    { id: "frete-gratis", type: "shippingProgress", enabled: true },
  ],
  attributeDefs: [
    { key: "tamanho", label: "Modelo", selector: "pill", filterable: true, highlight: false, variant: true },
    {
      key: "cor",
      label: "Cor",
      selector: "swatch",
      filterable: true,
      highlight: false,
      variant: true,
      swatches: { Grafite: "#2b2f36", Prata: "#c9ced6", Branco: "#f2f2f2" },
    },
    { key: "conexao", label: "Conexão", selector: "pill", filterable: false, highlight: false, summary: true },
    { key: "bateria", label: "Bateria", selector: "pill", filterable: false, highlight: false },
    { key: "voltagem", label: "Voltagem", selector: "pill", filterable: true, highlight: false },
    { key: "garantia", label: "Garantia", selector: "pill", filterable: false, highlight: false },
  ],
  shipping: {
    options: [
      { id: "economico", label: "Econômico", basePrice: 1990, days: ECONOMY_DAYS },
      { id: "expresso", label: "Expresso", basePrice: 3490, days: EXPRESS_DAYS },
    ],
    coverage: "national",
  },
  legal: {
    name: "Órbita Eletrônicos Ltda. (fictícia)",
    document: "00.000.000/0001-00 (fictício, apenas demonstração)",
    address: "Rua Exemplo, 456 — São Paulo/SP (endereço fictício)",
    email: "contato@orbita.example",
    phone: "(11) 0000-0000",
  },
  theme: {
    colors: {
      primary: "#8ab4ff",
      secondary: "#ffb454",
      background: "#0e1116",
      surface: "#161b22",
      text: "#eef1f5",
      muted: "#9aa4b2",
      border: "#262d38",
      success: "#4cc38a",
      warning: "#f0b429",
      danger: "#ff6b6b",
      announcementBg: "#8ab4ff",
      announcementText: "#0e1116",
      highlightBg: "#ffb454",
      highlightText: "#0e1116",
      footerBg: "#0a0d12",
      footerText: "#9aa4b2",
    },
    fonts: {
      heading: FONT_MANROPE,
      body: FONT_BARLOW,
      headingWeight: "700",
      headingTracking: "-0.02em",
    },
    radii: { sm: "8px", md: "14px", lg: "20px", xl: "28px", sheet: "24px", button: "999px" },
    ratios: { product: "1 / 1" },
    logo: {
      transform: "uppercase",
      tracking: "0.22em",
      weight: "700",
      color: "var(--t-color-text)",
      accent: "var(--t-color-primary)",
    },
    spacing: { xs: "0.25rem", sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2.5rem" },
  },
  // Opções que o painel oferece em Configurações › Tema (aprovadas aqui; nunca cor livre). A primeira de cada lista é a do tema acima.
  themeChoices: {
    primary: [
      { id: "azul", label: "Azul", value: "#8ab4ff" },
      { id: "menta", label: "Menta", value: "#7ee0c3" },
      { id: "lilas", label: "Lilás", value: "#c9a6ff" },
      { id: "coral", label: "Coral", value: "#ff9a8a" },
    ],
    accent: [
      { id: "ambar", label: "Âmbar", value: "#ffb454" },
      { id: "limao", label: "Limão", value: "#d4e86b" },
      { id: "rosa", label: "Rosa", value: "#ff8fb8" },
      { id: "ceu", label: "Céu", value: "#7fd6ff" },
    ],
    fonts: {
      heading: [
        { id: "manrope", label: "Manrope", value: FONT_MANROPE },
        { id: "barlow", label: "Barlow", value: FONT_BARLOW },
      ],
      body: [
        { id: "barlow", label: "Barlow", value: FONT_BARLOW },
        { id: "manrope", label: "Manrope", value: FONT_MANROPE },
      ],
    },
    // Texto sobre fundo: cada par precisa de 4,5:1 (WCAG AA). No tema escuro as cores de destaque são claras e levam texto escuro.
    contrastPairs: [
      ["announcementText", "announcementBg"],
      ["highlightText", "highlightBg"],
      ["background", "primary"],
      ["primary", "background"],
      ["text", "background"],
      ["muted", "background"],
      ["footerText", "footerBg"],
    ],
  },
  modules: {
    retiradaLocal: false,
    freteGratis: { enabled: true, minValue: FREE_SHIPPING_MIN },
    parcelamento: { enabled: true, maxInstallments: MAX_INSTALLMENTS, minInstallment: 2000 },
    boleto: true,
    cartao: { enabled: true },
    descontoPix: { enabled: true, percent: PIX_PERCENT },
    cupom: true,
    assistenteVirtual: false,
    // Módulos do diferencial (bot, WhatsApp, depoimentos, newsletter): desligados na Órbita.
    bot: false,
    whatsapp: false,
    depoimentos: false,
    newsletter: false,
  },
  policies: {
    regret: `Direito de arrependimento: você pode desistir da compra em até ${REGRET_DAYS} dias após o recebimento.`,
    regretDays: REGRET_DAYS,
    regretConditions: "O produto deve estar sem sinais de uso, na embalagem original e com todos os acessórios. (Texto de demonstração.)",
    defect: {
      durability: "durable",
      days: DEFECT_DAYS,
      conditions: `Se o produto apresentar defeito, avise em até ${DEFECT_DAYS} dias após o recebimento: trocamos por outro igual ou devolvemos o valor, e o frete da devolução é por nossa conta. (Texto de demonstração.)`,
    },
    about: "A Órbita é uma marca fictícia de eletrônicos premium, criada para demonstrar a plataforma de loja virtual plug and play. As fotos são de bancos gratuitos e não mostram marcas reais.",
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
      sharing: ["Operadora de pagamento, para autorizar a cobrança.", "Transportadora, para entregar o pedido.", "Autoridades, quando a lei exigir."],
      rights: [
        "Confirmar que tratamos seus dados e acessá-los.",
        "Corrigir dados incompletos ou desatualizados.",
        "Pedir anonimização, bloqueio ou eliminação de dados desnecessários.",
        "Pedir a portabilidade dos dados.",
        "Revogar o consentimento e se opor ao tratamento, quando cabível.",
      ],
      controller: { name: "Encarregado de dados da Órbita (fictício)", email: "privacidade@orbita.example" },
    },
    cookies: {
      notice:
        "Usamos apenas cookies essenciais para a loja funcionar. Você escolhe se permite também os não essenciais (como medição de audiência), que hoje não usamos. (Texto de demonstração.)",
      version: "1",
    },
  },
};
