import type { StoreConfig } from "@/domain/types";
import { formatBRL } from "@/lib/money";
import { placeholderImage } from "../helpers";

// Órbita: marca FICTÍCIA de eletrônicos premium, criada para demonstrar a plataforma (nada aqui é de uma empresa real).
// Os números que as respostas do bot repetem (frete grátis, parcelas, prazos) saem das constantes abaixo, as mesmas dos módulos.
const FREE_SHIPPING_MIN = 29900;
const MAX_INSTALLMENTS = 10;
const PIX_PERCENT = 8;
const REGRET_DAYS = 7;
const DEFECT_DAYS = 90;
const WHATSAPP_NUMBER = "5511900000000";
const ECONOMY_DAYS: [number, number] = [4, 7];
const EXPRESS_DAYS: [number, number] = [1, 3];

export const bannerImage = placeholderImage("Órbita", "8ab4ff", "Fones, relógio e caixa de som Órbita sobre fundo escuro");

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
    {
      id: "depoimentos",
      type: "testimonials",
      enabled: true,
      title: "Quem usa, recomenda",
      demoLabel: "Depoimento de demonstração",
      note: "Depoimentos fictícios, escritos para a demonstração da plataforma: nenhum cliente real aparece aqui.",
      items: [
        { id: "dep-1", name: "Marina Alves", city: "Curitiba/PR", text: "O cancelamento de ruído do Studio ANC mudou meu trabalho em casa. A bateria dura a semana inteira." },
        { id: "dep-2", name: "Rafael Nunes", city: "Belo Horizonte/MG", text: "O Smartwatch S é leve, a tela é nítida e o GPS acerta a corrida de primeira." },
        { id: "dep-3", name: "Helena Prado", city: "Recife/PE", text: "Chegou antes do prazo e bem embalado. O carregador GaN substituiu três na minha mochila." },
        { id: "dep-4", name: "Tiago Mendes", city: "Porto Alegre/RS", text: "Troquei de modelo no prazo e a loja resolveu tudo sem burocracia." },
      ],
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
      heading: "var(--font-manrope), system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      body: "var(--font-barlow), system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
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
  modules: {
    retiradaLocal: false,
    freteGratis: { enabled: true, minValue: FREE_SHIPPING_MIN },
    parcelamento: { enabled: true, maxInstallments: MAX_INSTALLMENTS, minInstallment: 2000 },
    boleto: true,
    cartao: { enabled: true },
    descontoPix: { enabled: true, percent: PIX_PERCENT },
    cupom: true,
    assistenteVirtual: false,
    bot: true,
    whatsapp: true,
    depoimentos: true,
    newsletter: true,
  },
  bot: {
    openLabel: "Atendimento",
    title: "Atendimento Órbita",
    badge: "Simulação",
    greeting: "Olá! Sou o atendimento simulado da Órbita. Escolha um tema ou escreva sua dúvida.",
    inputLabel: "Escreva sua dúvida",
    sendLabel: "Enviar",
    closeLabel: "Fechar atendimento",
    topics: [
      {
        id: "prazo",
        label: "Prazo de entrega",
        keywords: ["prazo", "entrega", "chega", "demora", "quando"],
        answer: `O prazo é de ${ECONOMY_DAYS[0]} a ${ECONOMY_DAYS[1]} dias úteis no frete econômico e de ${EXPRESS_DAYS[0]} a ${EXPRESS_DAYS[1]} dias úteis no expresso, contados da confirmação do pagamento.`,
      },
      {
        id: "frete",
        label: "Frete",
        keywords: ["frete", "envio", "gratis", "transportadora"],
        answer: `O frete é calculado pelo CEP no carrinho. Pedidos a partir de ${formatBRL(FREE_SHIPPING_MIN)} têm frete grátis.`,
      },
      {
        id: "troca",
        label: "Troca e garantia",
        keywords: ["troca", "trocar", "devolucao", "devolver", "garantia", "defeito", "arrependimento"],
        answer: `Você pode desistir da compra em até ${REGRET_DAYS} dias após o recebimento. Em caso de defeito, a troca vale por ${DEFECT_DAYS} dias.`,
      },
      {
        id: "pagamento",
        label: "Formas de pagamento",
        keywords: ["pagamento", "pagar", "pix", "cartao", "parcelar", "parcela", "parcelas", "boleto"],
        answer: `Aceitamos Pix (${PIX_PERCENT}% de desconto), cartão de crédito em até ${MAX_INSTALLMENTS}x sem juros e boleto.`,
      },
    ],
    fallback: "Ainda não sei responder a essa pergunta. Este é um atendimento simulado, com respostas prontas.",
    whatsappOffer: "Falar pelo WhatsApp",
  },
  whatsapp: {
    number: WHATSAPP_NUMBER,
    isReal: false,
    openLabel: "WhatsApp",
    title: "Fale com a Órbita pelo WhatsApp",
    badge: "Demonstração",
    greeting: "Olá! Gostaria de falar com a Órbita.",
    productMessage: "Olá! Tenho interesse em {produto} da Órbita. Podem me ajudar?",
    demoNote: "Demonstração: o número é fictício e nada é enviado nem aberto. Copie a mensagem para ver como ela chegaria.",
    copyLabel: "Copiar mensagem",
    copiedLabel: "Mensagem copiada",
    closeLabel: "Fechar WhatsApp",
  },
  newsletter: {
    title: "Receba as novidades da Órbita",
    text: "Lançamentos e ofertas por e-mail, só se você quiser.",
    badge: "Demonstração",
    emailLabel: "Seu e-mail",
    consentLabel: "Aceito receber e-mails da Órbita, conforme a",
    submitLabel: "Quero receber",
    privacyLinkLabel: "Política de Privacidade",
    invalidEmail: "Informe um e-mail válido.",
    refusal: "Para receber as novidades, marque a caixa de consentimento. Sem ela, não enviamos nada.",
    success: "Inscrição registrada (demonstração): nenhum e-mail será enviado e o endereço fica só neste navegador.",
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
    about: "A Órbita é uma marca fictícia de eletrônicos premium, criada para demonstrar a plataforma de loja virtual plug and play.",
    privacy: {
      dataCollected: [
        "Nome, e-mail, celular e CPF, informados no checkout.",
        "Endereço de entrega.",
        "Itens, valores e forma de pagamento do pedido (nunca o número completo do cartão nem o CVV).",
        "Sua escolha sobre cookies, sobre o recebimento de ofertas e o e-mail da newsletter, se você se inscrever.",
      ],
      purpose:
        "Processar e entregar o pedido, emitir a nota fiscal, atender você após a compra e cumprir obrigações legais. Só enviamos ofertas e novidades se você marcar essa opção. (Texto de demonstração.)",
      retention:
        "Dados do pedido ficam guardados por 5 anos, prazo das obrigações fiscais. Dados de ofertas e da newsletter ficam até você pedir a remoção. (Texto de demonstração.)",
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
