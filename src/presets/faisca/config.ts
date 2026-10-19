import type { StoreConfig } from "@/domain/types";
import { bannerImage } from "./images";

// Valores que a config repete (uma fonte só).
const MAX_INSTALLMENTS = 6;
const PIX_PERCENT = 5;
const REGRET_DAYS = 7;
const DEFECT_DAYS = 90;

const FONT_SORA = "var(--font-sora), 'Trebuchet MS', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const FONT_MANROPE = "var(--font-manrope), system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

export const config: StoreConfig = {
  name: "Faísca",
  cartLabel: "Carrinho",
  orderPrefix: "FS",
  logo: "/placeholder?l=Fa%C3%ADsca&c=3b2fb5",
  seo: {
    titleTemplate: "%s · Faísca",
    description: "Cursos online curtos, aula a aula, com área do aluno: fotografia, desenho, violão, programação, planilhas, finanças e inglês.",
  },
  layout: { search: "bar", categoryTile: "rect", listing: "grid", product: "classic" },
  wordmark: { text: "faísca.", accent: "." },
  homeBlocks: [
    {
      id: "banner",
      type: "banner",
      enabled: true,
      image: bannerImage,
      eyebrow: "Cursos online · demonstração",
      title: "Acenda uma ideia nova esta semana",
      subtitle: "Cursos curtos, aula a aula, para estudar no seu ritmo.",
      ctaLabel: "Ver os cursos",
      ctaHref: "/categoria/criatividade",
    },
    {
      id: "categorias",
      type: "categories",
      enabled: true,
      title: "Escolha uma área",
      deferImages: true,
      categoryIds: ["criatividade", "tecnologia", "carreira-e-dinheiro"],
    },
    {
      id: "cursos",
      type: "featured",
      enabled: true,
      title: "Todos os cursos",
      deferImages: true,
      linkLabel: "Ver criatividade",
      linkHref: "/categoria/criatividade",
      productIds: ["fs-001", "fs-004", "fs-006", "fs-002", "fs-003", "fs-005", "fs-007"],
    },
    {
      id: "como-funciona",
      type: "process",
      enabled: true,
      tone: "dark",
      eyebrow: "Como funciona",
      title: "Do pedido à primeira aula em minutos",
      highlight: { step: 3, label: "Acesso liberado" },
      steps: [
        { title: "Escolha o curso", text: "Veja a ementa, a carga horária e o instrutor antes de decidir." },
        { title: "Pague", text: "Pix, cartão ou boleto. Nesta demonstração nenhum pagamento real é feito." },
        { title: "Acesse", text: "Com o pagamento aprovado, o botão Acessar curso aparece na confirmação do pedido." },
        { title: "Estude e conclua", text: "Marque cada aula como concluída e acompanhe o seu progresso em Meus cursos." },
      ],
    },
    {
      id: "chamada",
      type: "cta",
      enabled: true,
      title: "Comece por uma aula curta",
      text: "Cada curso tem aulas de 12 a 30 minutos, para caber na sua semana.",
      ctaLabel: "Ver tecnologia",
      ctaHref: "/categoria/tecnologia",
    },
  ],
  attributeDefs: [{ key: "nivel", label: "Nível", selector: "pill", filterable: true, highlight: true, summary: true }],
  shipping: { options: [], coverage: "national" },
  legal: {
    name: "Faísca Educação Digital Ltda. (fictícia)",
    document: "00.000.000/0001-00 (fictício, apenas demonstração)",
    address: "Rua Exemplo, 456 — Belo Horizonte/MG (endereço fictício)",
    email: "contato@faisca.example",
    phone: "(31) 0000-0000",
  },
  theme: {
    colors: {
      primary: "#3b2fb5",
      secondary: "#ffb020",
      background: "#fbf8f3",
      surface: "#ffffff",
      text: "#17142b",
      muted: "#5d5a73",
      border: "#e4dfd6",
      success: "#1f7a4d",
      warning: "#a05a00",
      danger: "#b3261e",
      announcementBg: "#3b2fb5",
      announcementText: "#ffffff",
      highlightBg: "#ffb020",
      highlightText: "#17142b",
      footerBg: "#17142b",
      footerText: "#e8e4f5",
    },
    fonts: { heading: FONT_SORA, body: FONT_MANROPE, headingWeight: "700", headingTracking: "-0.02em" },
    radii: { sm: "0.375rem", md: "0.625rem", lg: "1rem", xl: "1.5rem", sheet: "1.5rem", button: "999px" },
    ratios: { product: "4 / 3" },
    logo: { transform: "none", tracking: "-0.02em", weight: "800", color: "var(--t-color-primary)", accent: "var(--t-color-secondary)" },
    spacing: { xs: "0.25rem", sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2.5rem" },
  },
  // Opções que o painel oferece em Configurações › Tema (aprovadas aqui; nunca cor livre). A primeira de cada lista é a do tema acima.
  themeChoices: {
    primary: [
      { id: "indigo", label: "Índigo", value: "#3b2fb5" },
      { id: "esmeralda", label: "Esmeralda", value: "#0f6b52" },
      { id: "magenta", label: "Magenta", value: "#a3195b" },
      { id: "grafite", label: "Grafite", value: "#2a2d3a" },
    ],
    accent: [
      { id: "ambar", label: "Âmbar", value: "#ffb020" },
      { id: "coral", label: "Coral", value: "#ff7a59" },
      { id: "menta", label: "Menta", value: "#5fd3a0" },
      { id: "lilas", label: "Lilás", value: "#b9a6ff" },
    ],
    fonts: {
      heading: [
        { id: "sora", label: "Sora (geométrica)", value: FONT_SORA },
        { id: "manrope", label: "Manrope (neutra)", value: FONT_MANROPE },
      ],
      body: [{ id: "manrope", label: "Manrope", value: FONT_MANROPE }],
    },
    // Texto sobre fundo: cada par precisa de 4,5:1 (WCAG AA).
    contrastPairs: [
      ["announcementText", "announcementBg"],
      ["highlightText", "highlightBg"],
      ["background", "primary"],
      ["primary", "background"],
      ["text", "secondary"],
      ["footerText", "footerBg"],
    ],
  },
  modules: {
    retiradaLocal: false,
    parcelamento: { enabled: true, maxInstallments: MAX_INSTALLMENTS, minInstallment: 2000 },
    boleto: true,
    cartao: { enabled: true },
    descontoPix: { enabled: true, percent: PIX_PERCENT },
    cupom: true,
    assistenteVirtual: false,
    // Área do aluno simulada: Meus cursos, curso, aula e progresso (só neste preset).
    cursos: true,
  },
  cursos: {
    myCoursesLabel: "Meus cursos",
    intro: "Os cursos comprados neste navegador. Nesta demonstração não há login: o acesso e o progresso ficam só aqui.",
    empty: "Você ainda não comprou nenhum curso neste navegador.",
    emptyCtaLabel: "Ver os cursos",
    accessLabel: "Acessar curso",
    demoLabel: "Aula de demonstração",
    demoNote: "Nesta demonstração não há vídeo: cada aula mostra esta capa e o texto da aula.",
    completeLabel: "Marcar como concluída",
    completedLabel: "Aula concluída",
    lockedAwaiting: "Curso bloqueado: o pagamento do pedido {pedido} ainda não foi aprovado.",
    lockedCanceled: "Curso bloqueado: o pedido {pedido} foi cancelado ou o pagamento não foi aprovado.",
    progressLabel: "Progresso",
    syllabusTitle: "Ementa",
    instructorLabel: "Instrutor",
    workloadLabel: "Carga horária",
    demoBadge: "Curso de demonstração",
  },
  policies: {
    regret: "Direito de arrependimento: você pode desistir da compra do curso em até 7 dias após a compra, com reembolso integral.",
    regretDays: REGRET_DAYS,
    regretConditions: "Para produto digital, o prazo conta a partir da compra e o acesso ao curso é encerrado com o reembolso. (Texto de demonstração, sujeito a revisão jurídica.)",
    defect: {
      durability: "durable",
      days: DEFECT_DAYS,
      conditions:
        "Se o conteúdo do curso apresentar falha de acesso ou defeito, avise em até 90 dias: corrigimos o acesso ou devolvemos o valor. (Texto de demonstração, sujeito a revisão jurídica.)",
    },
    digital:
      "Cursos são produtos digitais: o acesso é liberado logo após a confirmação do pagamento, sem entrega física. O direito de arrependimento de 7 dias vale a partir da compra, com reembolso integral, e o acesso é encerrado com o reembolso. (Texto de demonstração, marcado para revisão jurídica antes de qualquer uso real.)",
    about:
      "A Faísca é uma marca fictícia de cursos online, criada para demonstrar a plataforma de loja virtual plug and play com uma área do aluno simulada. Os instrutores, os cursos e as aulas são de demonstração.",
    privacy: {
      dataCollected: [
        "Nome, e-mail, celular (opcional) e CPF, informados no checkout.",
        "Itens, valores e forma de pagamento do pedido (nunca o número completo do cartão nem o CVV).",
        "Cursos comprados e aulas concluídas, guardados só neste navegador.",
        "Sua escolha sobre cookies e sobre o recebimento de ofertas.",
      ],
      purpose:
        "Processar o pedido, liberar o acesso ao curso, emitir a nota fiscal, atender você após a compra e cumprir obrigações legais. Só enviamos ofertas se você marcar essa opção. (Texto de demonstração.)",
      retention:
        "Dados do pedido ficam guardados por 5 anos, prazo das obrigações fiscais. O progresso nos cursos fica no seu navegador até você apagá-lo. (Texto de demonstração.)",
      sharing: ["Operadora de pagamento, para autorizar a cobrança.", "Autoridades, quando a lei exigir."],
      rights: [
        "Confirmar que tratamos seus dados e acessá-los.",
        "Corrigir dados incompletos ou desatualizados.",
        "Pedir anonimização, bloqueio ou eliminação de dados desnecessários.",
        "Pedir a portabilidade dos dados.",
        "Revogar o consentimento e se opor ao tratamento, quando cabível.",
      ],
      controller: { name: "Encarregado de dados da Faísca (fictício)", email: "privacidade@faisca.example" },
    },
    cookies: {
      notice:
        "Usamos apenas cookies essenciais para a loja funcionar. Você escolhe se permite também os não essenciais (como medição de audiência), que hoje não usamos. (Texto de demonstração.)",
      version: "1",
    },
  },
};
