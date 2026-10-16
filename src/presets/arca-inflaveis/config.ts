import type { StoreConfig } from "@/domain/types";
import { bannerImage } from "./images";
import { cases, needs, sectors } from "./segment";

/** Arca Infláveis: fabricante fictício sob medida (loja em modo orçamento, sem preço, carrinho nem checkout). */
export const config: StoreConfig = {
  name: "Arca Infláveis",
  orderPrefix: "ARC",
  logo: "/placeholder?l=Arca%20Inflaveis&c=0f4c5c",
  seo: {
    titleTemplate: "%s · Arca Infláveis",
    description: "Boias, sacos para teste de carga e infláveis promocionais sob medida. Monte sua lista e peça um orçamento.",
  },
  layout: {
    search: "bar",
    categoryTile: "rect",
    listing: "grid",
    product: "classic",
  },
  homeBlocks: [
    {
      id: "banner",
      type: "banner",
      enabled: true,
      image: bannerImage,
      eyebrow: "Fabricante sob medida",
      title: "Reservatórios, bolsas e infláveis na medida do seu projeto",
      subtitle: "Conte a aplicação, aprove a prévia sem custo e receba o produto pronto.",
      ctaLabel: "Pedir orçamento",
      ctaHref: "/orcamento",
      secondaryCtaLabel: "Ver produtos",
      secondaryCtaHref: "/categoria/industria-e-agro",
    },
    {
      id: "necessidades",
      type: "needs",
      enabled: true,
      tone: "light",
      eyebrow: "Por necessidade",
      title: "O que você precisa fazer?",
    },
    {
      id: "setores",
      type: "sectors",
      enabled: true,
      tone: "dark",
      eyebrow: "Por setor",
      title: "Quem usa Arca",
    },
    {
      id: "destaques",
      type: "featured",
      enabled: true,
      title: "Mais pedidos",
      linkLabel: "Ver todos os produtos",
      linkHref: "/categoria/industria-e-agro",
      productIds: ["arc-001", "arc-004", "arc-007", "arc-006"],
    },
    {
      id: "numeros",
      type: "stats",
      enabled: true,
      tone: "dark",
      items: [
        { value: "12 anos", label: "fabricando sob medida" },
        { value: "850", label: "projetos entregues" },
        { value: "22", label: "estados atendidos" },
        { value: "18 dias", label: "de prazo médio" },
      ],
      note: "Números fictícios, apenas para demonstração.",
    },
    {
      id: "cases",
      type: "cases",
      enabled: true,
      tone: "light",
      eyebrow: "Projetos entregues",
      title: "Do pedido à obra",
      caseIds: ["case-agro", "case-icamento", "case-eventos"],
      note: "Projetos de demonstração: clientes, cidades e resultados são fictícios.",
    },
    {
      id: "processo",
      type: "process",
      enabled: true,
      tone: "dark",
      eyebrow: "Sob medida",
      title: "Como fazemos o seu produto",
      highlight: { step: 3, label: "Prévia gratuita" },
      steps: [
        {
          title: "Briefing",
          text: "Você conta a aplicação, as medidas e o prazo, por formulário ou WhatsApp.",
        },
        {
          title: "Projeto",
          text: "Nosso time desenha o produto e define material, válvulas e acessórios.",
        },
        {
          title: "Prévia aprovada",
          text: "Você vê a prévia do produto e só seguimos com a sua aprovação. Sem custo.",
        },
        {
          title: "Fabricação e entrega",
          text: "Produzimos, testamos a pressão e despachamos para o seu endereço.",
        },
      ],
    },
    {
      id: "chamada-final",
      type: "cta",
      enabled: true,
      tone: "light",
      title: "Tem um projeto em mente?",
      text: "Monte a lista com os produtos e descreva a aplicação. A prévia é por nossa conta.",
      ctaLabel: "Pedir orçamento",
      ctaHref: "/orcamento",
    },
  ],
  needs,
  sectors,
  cases,
  attributeDefs: [
    {
      key: "material",
      label: "Material",
      selector: "pill",
      filterable: false,
      highlight: false,
    },
    {
      key: "medidas",
      label: "Medidas",
      selector: "pill",
      filterable: false,
      highlight: false,
    },
    {
      key: "capacidade",
      label: "Capacidade",
      selector: "pill",
      filterable: false,
      highlight: false,
    },
    {
      key: "valvula",
      label: "Válvulas",
      selector: "pill",
      filterable: false,
      highlight: false,
    },
  ],
  // Sem venda online: não há opções de frete a calcular (o frete é FOB, combinado no orçamento).
  shipping: { options: [], coverage: "national" },
  legal: {
    name: "Arca Infláveis Indústria Ltda. (fictícia)",
    document: "00.000.000/0001-00 (fictício, apenas demonstração)",
    address: "Av. Exemplo, 1000 — Distrito Industrial, Campinas/SP (endereço fictício)",
    email: "orcamentos@arcainflaveis.example",
    phone: "(19) 0000-0000",
  },
  quote: {
    listLabel: "Lista de orçamento",
    listGender: "f",
    addLabel: "Adicionar ao orçamento",
    intro:
      "Monte a lista com os produtos de interesse e descreva em cada item as medidas, a cor e a aplicação. Depois envie: respondemos com a proposta comercial.",
    applications: [
      "Agro e irrigação",
      "Indústria e saneamento",
      "Construção e içamento de cargas",
      "Náutica e demarcação",
      "Eventos e feiras",
      "Publicidade e ações de marca",
      "Outra aplicação",
    ],
    whatsapp: { number: "5519900000000", isReal: false },
  },
  theme: {
    colors: {
      primary: "#0f4c5c",
      secondary: "#f2b705",
      background: "#f4f8f9",
      surface: "#ffffff",
      text: "#12262d",
      muted: "#566b72",
      border: "#d3e0e4",
      success: "#2e7d4f",
      warning: "#b7791f",
      danger: "#b4443c",
      announcementBg: "#0f4c5c",
      announcementText: "#ffffff",
      highlightBg: "#f2b705",
      highlightText: "#12262d",
      footerBg: "#e8f0f2",
      footerText: "#3f565d",
    },
    fonts: {
      heading: "var(--font-barlow-condensed), 'Arial Narrow', 'Segoe UI', sans-serif",
      body: "var(--font-barlow), system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      headingWeight: "700",
      headingTracking: "0.01em",
    },
    radii: {
      sm: "4px",
      md: "6px",
      lg: "8px",
      xl: "12px",
      sheet: "8px",
      button: "4px",
    },
    ratios: { product: "4 / 3" },
    logo: {
      transform: "uppercase",
      tracking: "0.08em",
      weight: "700",
      color: "var(--t-color-text)",
      accent: "var(--t-color-primary)",
    },
    spacing: {
      xs: "0.25rem",
      sm: "0.5rem",
      md: "1rem",
      lg: "1.5rem",
      xl: "2.5rem",
    },
  },
  modules: {
    orcamento: { enabled: true },
    retiradaLocal: false,
    freteGratis: { enabled: false, minValue: 0 },
    parcelamento: { enabled: false, maxInstallments: 1 },
    boleto: false,
    cartao: { enabled: false },
    descontoPix: { enabled: false, percent: 0 },
    cupom: false,
    assistenteVirtual: false,
  },
  policies: {
    // Loja em orçamento: não há venda ao consumidor pela loja, então não há arrependimento nem troca por arrependimento.
    defect: {
      durability: "durable",
      days: 90,
      conditions:
        "Garantia de 90 dias contra defeito de fabricação (costuras, soldas e válvulas), contados do recebimento. Não cobre furos por uso, pressão acima da indicada nem contato com produtos químicos que não constem do pedido. (Texto de demonstração.)",
    },
    commercial: {
      production:
        "Prazo de produção sob consulta: depende do modelo, das medidas e da fila de fabricação, e vem na proposta. (Texto de demonstração.)",
      freight:
        "Frete FOB: o transporte sai da nossa fábrica por conta do comprador, na transportadora que ele escolher ou na que indicarmos. (Texto de demonstração.)",
    },
    about:
      "A Arca Infláveis é um fabricante fictício de boias, sacos para teste de carga e infláveis promocionais, criado para demonstrar a loja em modo orçamento da plataforma de loja virtual plug and play.",
    privacy: {
      dataCollected: [
        "Nome, empresa (opcional), e-mail, WhatsApp, cidade e UF de entrega, informados no pedido de orçamento.",
        "Aplicação e mensagem escritas por você, e as observações de cada item da lista.",
        "Sua escolha sobre cookies.",
      ],
      purpose:
        "Responder ao pedido de orçamento, enviar a proposta comercial e dar seguimento à negociação. Não enviamos ofertas sem que você peça. (Texto de demonstração.)",
      retention:
        "Pedidos de orçamento ficam guardados por até 2 anos, para consulta de propostas anteriores. Depois disso são apagados. (Texto de demonstração.)",
      sharing: ["Transportadoras, quando a proposta é aceita e a entrega é combinada.", "Autoridades, quando a lei exigir."],
      rights: [
        "Confirmar que tratamos seus dados e acessá-los.",
        "Corrigir dados incompletos ou desatualizados.",
        "Pedir anonimização, bloqueio ou eliminação de dados desnecessários.",
        "Pedir a portabilidade dos dados.",
        "Revogar o consentimento e se opor ao tratamento, quando cabível.",
      ],
      controller: {
        name: "Encarregado de dados da Arca Infláveis (fictício)",
        email: "privacidade@arcainflaveis.example",
      },
    },
    cookies: {
      notice:
        "Usamos apenas cookies essenciais para a loja funcionar. Você escolhe se permite também os não essenciais (como medição de audiência), que hoje não usamos. (Texto de demonstração.)",
      version: "1",
    },
  },
};
