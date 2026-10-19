/**
 * Textos e links da landing da Better Studio (/better). Prévia para validação interna: os trechos entre colchetes são
 * placeholders que o sócio ainda vai preencher ([N] de 3 vagas, [CONDIÇÕES DE CANCELAMENTO DO CONTRATO], [CNPJ]).
 */
export const BRAND = "Better Studio";

/** Todos os contatos desta prévia levam ao Instagram da Better. */
export const CONTACT_URL = "https://instagram.com/betterstudio.br";
export const CONTACT_HANDLE = "@betterstudio.br";

export const PREVIEW_BANNER = "Prévia para validação interna · preços, prazos e condições em definição · não publicar";

export const NAV = [
  { href: "#demos", label: "Demonstrações" },
  { href: "#como", label: "Como funciona" },
  { href: "#planos", label: "Planos" },
  { href: "#duvidas", label: "Dúvidas" },
] as const;

export const WHATSAPP_CTA = "Falar no WhatsApp";

export const HERO = {
  tag: "Lojas virtuais para pequenos e médios negócios",
  title: "Sua loja virtual em até 7 dias úteis. Sem comissão sobre as suas vendas.",
  lead: "Loja com a sua marca, Pix, cartão, frete por CEP e assistente virtual. Feita para vender no celular, com uma pessoa de verdade cuidando de tudo.",
  primaryCta: "Ver lojas de demonstração",
  note: "Prazo contado a partir do recebimento de todo o material da loja.",
};

export type Demo = { slug: "trama" | "forno" | "orbita" | "faisca" | "arca"; kind: string; name: string; text: string; art: string };

export const DEMOS_INTRO = {
  title: "Veja funcionando antes de decidir",
  text: "Cinco lojas de demonstração, cinco nichos, incluindo fabricante com pedido de orçamento. A mesma base vira uma loja diferente para cada negócio, só com configuração.",
  open: "Abrir loja →",
};

/** As cinco lojas da demonstração, por links internos diretos (/trama, /forno, /orbita, /faisca, /arca), sem ?preset=. */
export const DEMOS: Demo[] = [
  { slug: "trama", kind: "Moda", name: "Trama Studio", text: "Grade de tamanhos e cores, parcelamento e trocas.", art: "TRAMA" },
  { slug: "forno", kind: "Alimentação", name: "Forno da Vila", text: "Cardápio, adicionais, retirada e pedido pelo chat.", art: "forno.da vila" },
  { slug: "orbita", kind: "Eletrônicos", name: "Órbita", text: "Visual premium, desconto no Pix e especificações técnicas.", art: "órbita" },
  { slug: "faisca", kind: "Cursos online", name: "Faísca", text: "Venda de cursos com acesso imediato e aula grátis.", art: "faísca" },
  { slug: "arca", kind: "Fabricante sob medida", name: "Arca Infláveis", text: "Sem preço na vitrine: lista de orçamento, configurador do produto e envio por formulário ou WhatsApp.", art: "ARCA" },
];

export const HOW = {
  title: "Como funciona",
  steps: [
    { when: "Antes de começar", title: "Reunião e material", text: "Uma conversa de 1 hora e um checklist simples: logo, planilha de produtos, fotos e dados da empresa. O prazo começa quando o material chega." },
    { when: "Dias 1 a 4", title: "Montagem e testes", text: "Sua marca, produtos, frete, pagamentos e domínio configurados. Testamos uma compra real antes de mostrar para você." },
    { when: "Dias 5 e 6", title: "Sua revisão", text: "Você navega pela loja e pede ajustes. Uma rodada completa de ajustes está inclusa." },
    { when: "Dia 7", title: "Loja no ar", text: "Treinamento de 1 hora no painel e publicação. A partir daqui, você já pode vender." },
  ],
};

export const COMPARE = {
  title: "Por que não uma plataforma pronta?",
  us: "Better Studio",
  them: "Plataforma pronta",
  rows: [
    { label: "Comissão da plataforma sobre as vendas", us: "Nenhuma", them: "Varia conforme o plano" },
    { label: "Quem monta a loja", us: "Nós, com você", them: "Você mesmo" },
    { label: "Atendimento", us: "Uma pessoa, pelo WhatsApp", them: "Central de ajuda" },
    { label: "Assistente virtual de vendas", us: "Disponível", them: "Por aplicativo de terceiros" },
  ],
};

export const PLANS_INTRO = {
  title: "Planos",
  text: "Pagamentos caem direto na sua conta. Domínio registrado no seu nome.",
};

export const FOUNDERS = {
  title: "Clientes fundadores: 35% off no setup",
  text: "[N] de 3 vagas restantes. Em troca, pedimos um depoimento e a permissão para mostrar a sua loja como case.",
  cta: "Garantir minha vaga",
};

export const FAQ = {
  title: "Dúvidas frequentes",
  items: [
    {
      q: "Quanto tempo leva para a loja ficar pronta?",
      a: "Até 7 dias úteis para uma loja com até 50 produtos, contados a partir do recebimento de todo o material. Lojas de moda, alimentação e eletrônicos levam 1 dia útil a mais, pela grade de variações, pelo cardápio ou pela ficha técnica. Cada bloco de até 100 produtos extras soma 1 dia útil, e personalizações sob medida têm prazo combinado no orçamento. A revisão depende da sua resposta: cada dia de espera adia a entrega em 1 dia.",
    },
    { q: "Quem recebe o dinheiro das vendas?", a: "Você. Os pagamentos caem direto na sua conta do meio de pagamento, sem passar por nós." },
    { q: "O domínio fica no meu nome?", a: "Sim. O endereço da loja é registrado no seu CPF ou CNPJ." },
    { q: "Consigo cadastrar produtos sozinho?", a: "Sim, pelo painel ou por uma planilha modelo. O treinamento está incluso." },
    { q: "E se eu quiser cancelar a Loja Completa?", a: "[CONDIÇÕES DE CANCELAMENTO DO CONTRATO]" },
  ],
};

export const FOOTER = {
  cnpj: "[CNPJ]",
  privacy: "Privacidade",
};
