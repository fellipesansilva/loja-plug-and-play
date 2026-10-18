import type { BotConfig, HomeBlock, NewsletterConfig, WhatsappConfig } from "@/domain/types";
import { formatBRL } from "@/lib/money";

/**
 * Textos e dados dos módulos do diferencial (bot, WhatsApp, depoimentos, newsletter) da Trama. Os módulos nascem LIGADOS na Trama
 * (config.modules); o painel (Configurações › Módulos) liga e desliga.
 * Os números das respostas do bot saem dos mesmos valores
 * que a config da loja usa (frete grátis, parcelas, Pix, prazos), passados por quem chama.
 */
type Numbers = {
  freeShippingMin: number;
  maxInstallments: number;
  pixPercent: number;
  regretDays: number;
  defectDays: number;
  economyDays: [number, number];
  expressDays: [number, number];
};

export function tramaBot(n: Numbers): BotConfig {
  return {
    openLabel: "Atendimento",
    title: "Atendimento Trama Studio",
    badge: "Simulação",
    greeting: "Olá! Sou o atendimento simulado da Trama Studio. Escolha um tema ou escreva sua dúvida.",
    inputLabel: "Escreva sua dúvida",
    sendLabel: "Enviar",
    closeLabel: "Fechar atendimento",
    topics: [
      {
        id: "prazo",
        label: "Prazo de entrega",
        keywords: ["prazo", "entrega", "chega", "demora", "quando"],
        answer: `O prazo é de ${n.economyDays[0]} a ${n.economyDays[1]} dias úteis no frete econômico e de ${n.expressDays[0]} a ${n.expressDays[1]} dias úteis no expresso, contados da confirmação do pagamento.`,
      },
      {
        id: "frete",
        label: "Frete",
        keywords: ["frete", "envio", "gratis", "transportadora"],
        answer: `O frete é calculado pelo CEP no carrinho. Pedidos a partir de ${formatBRL(n.freeShippingMin)} têm frete grátis.`,
      },
      {
        id: "troca",
        label: "Troca e devolução",
        keywords: ["troca", "trocar", "devolucao", "devolver", "garantia", "defeito", "arrependimento"],
        answer: `Você pode desistir da compra em até ${n.regretDays} dias após o recebimento. Em caso de defeito, a troca vale por ${n.defectDays} dias.`,
      },
      {
        id: "pagamento",
        label: "Formas de pagamento",
        keywords: ["pagamento", "pagar", "pix", "cartao", "parcelar", "parcela", "parcelas", "boleto"],
        answer: `Aceitamos Pix (${n.pixPercent}% de desconto), cartão de crédito em até ${n.maxInstallments}x e boleto.`,
      },
    ],
    fallback: "Ainda não sei responder a essa pergunta. Este é um atendimento simulado, com respostas prontas.",
    whatsappOffer: "Falar pelo WhatsApp",
  };
}

export const tramaWhatsapp: WhatsappConfig = {
  number: "5511900000000",
  isReal: false,
  openLabel: "WhatsApp",
  title: "Fale com a Trama Studio pelo WhatsApp",
  badge: "Demonstração",
  greeting: "Olá! Gostaria de falar com a Trama Studio.",
  productMessage: "Olá! Tenho interesse em {produto} da Trama Studio. Podem me ajudar?",
  demoNote: "Demonstração: o número é fictício e nada é enviado nem aberto. Copie a mensagem para ver como ela chegaria.",
  copyLabel: "Copiar mensagem",
  copiedLabel: "Mensagem copiada",
  closeLabel: "Fechar WhatsApp",
};

export const tramaNewsletter: NewsletterConfig = {
  title: "Receba as novidades da Trama",
  text: "Lançamentos e ofertas por e-mail, só se você quiser.",
  badge: "Demonstração",
  emailLabel: "Seu e-mail",
  consentLabel: "Aceito receber e-mails da Trama Studio, conforme a",
  submitLabel: "Quero receber",
  privacyLinkLabel: "Política de Privacidade",
  invalidEmail: "Informe um e-mail válido.",
  refusal: "Para receber as novidades, marque a caixa de consentimento. Sem ela, não enviamos nada.",
  success: "Inscrição registrada (demonstração): nenhum e-mail será enviado e o endereço fica só neste navegador.",
};

/** Seção de depoimentos da home (só aparece com o módulo `depoimentos` ligado). Todos fictícios. */
export const tramaTestimonials: Extract<HomeBlock, { type: "testimonials" }> = {
  id: "depoimentos",
  type: "testimonials",
  enabled: true,
  title: "Quem veste, recomenda",
  demoLabel: "Depoimento de demonstração",
  note: "Depoimentos fictícios, escritos para a demonstração da plataforma: nenhum cliente real aparece aqui.",
  items: [
    { id: "dep-1", name: "Marina Alves", city: "Curitiba/PR", text: "O vestido midi de linho é leve e não amassa. Já virou meu preferido do verão." },
    { id: "dep-2", name: "Rafael Nunes", city: "Belo Horizonte/MG", text: "A camisa de linho chegou antes do prazo e o caimento é exatamente o da foto." },
    { id: "dep-3", name: "Helena Prado", city: "Recife/PE", text: "Troquei o tamanho sem burocracia. Atendimento rápido e educado." },
    { id: "dep-4", name: "Tiago Mendes", city: "Porto Alegre/RS", text: "A bolsa tote é bem acabada e coube o notebook. Voltarei a comprar." },
  ],
};
