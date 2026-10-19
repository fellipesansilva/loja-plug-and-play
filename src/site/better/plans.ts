import type { Money } from "@/domain/types";
import { formatBRLCompact } from "@/lib/money";

/**
 * Planos e preços da Better Studio (prévia de validação: valores, prazos e condições ainda em definição).
 * Todos os valores em centavos (Money), formatados por src/lib/money.ts. Os textos que citam preço saem das funções abaixo.
 */
export const PRICES = {
  /** Loja Pronta: pagamento único "a partir de". */
  prontaFrom: 179000,
  /** Hospedagem e domínio da Loja Pronta, por ano. */
  prontaHostingPerYear: 39000,
  /** Produto acima do limite incluso na Loja Pronta. */
  extraProduct: 400,
  /** Loja Completa: setup e mensalidade. */
  completaSetup: 89000,
  completaMonthly: 14900,
  /** Assistente virtual (bot): setup e mensalidade. */
  botSetup: 69000,
  botMonthly: 7900,
  /** Personalização sob medida: a partir de. */
  customFrom: 49000,
} as const satisfies Record<string, Money>;

export const INCLUDED_PRODUCTS = 50;
export const CONTRACT_MONTHS = 12;

export const money = (cents: Money): string => formatBRLCompact(cents);

export type Plan = {
  id: "pronta" | "completa";
  name: string;
  tagline: string;
  /** Linha acima do preço ("a partir de", "setup de R$ 890 +"). */
  priceLabel: string;
  price: Money;
  /** Sufixo ao lado do preço ("/mês"); vazio no pagamento único. */
  priceSuffix: string;
  note: string;
  features: string[];
  cta: string;
  /** Selo no canto do cartão ("Recomendado"). */
  badge?: string;
};

export const plans: Plan[] = [
  {
    id: "pronta",
    name: "Loja Pronta",
    tagline: "Pague uma vez e cuide da loja você mesmo.",
    priceLabel: "a partir de",
    price: PRICES.prontaFrom,
    priceSuffix: "",
    note: `+ hospedagem e domínio por ${money(PRICES.prontaHostingPerYear)}/ano`,
    features: [
      "Loja com a sua marca em até 7 dias úteis",
      `Até ${INCLUDED_PRODUCTS} produtos cadastrados (${money(PRICES.extraProduct)} por produto adicional)`,
      "Pix, cartão e boleto na sua conta",
      "Frete por CEP e retirada",
      "Páginas legais (CDC e LGPD)",
      "Treinamento e 30 dias de suporte",
    ],
    cta: "Quero a Loja Pronta",
  },
  {
    id: "completa",
    name: "Loja Completa",
    tagline: "A gente cuida da loja junto com você.",
    priceLabel: `setup de ${money(PRICES.completaSetup)} +`,
    price: PRICES.completaMonthly,
    priceSuffix: "/mês",
    note: `hospedagem e domínio inclusos · contrato de ${CONTRACT_MONTHS} meses`,
    features: ["Tudo da Loja Pronta", "Suporte contínuo e até 2 h/mês de ajustes", "Atualizações e novos recursos do modelo", "Backups e monitoramento"],
    cta: "Quero a Loja Completa",
    badge: "Recomendado",
  },
];

export type Addon = { name: string; detail: string };

export const addons: Addon[] = [
  { name: "Assistente virtual (bot)", detail: `${money(PRICES.botSetup)} de setup + ${money(PRICES.botMonthly)}/mês` },
  { name: "Botão de WhatsApp", detail: "Incluso nos dois planos" },
  { name: "Personalização sob medida", detail: `A partir de ${money(PRICES.customFrom)}` },
];
