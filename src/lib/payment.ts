import type { Order } from "@/domain/types";
import { onlyDigits } from "./validation";

/** Único cartão aceito na demonstração. */
export const TEST_CARD_NUMBER = "4111111111111111";
export const CARD_DECLINED_MESSAGE = "Cartão recusado (demonstração)";
export const CARD_DEMO_WARNING = "Ambiente de demonstração: não use um cartão real";
export const PIX_EXPIRES_MINUTES = 30;
export const BOLETO_DUE_BUSINESS_DAYS = 3;

export function cardBrand(number: string): string {
  const d = onlyDigits(number);
  if (/^4/.test(d)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  return "Cartão";
}

export type CardInput = { number: string; cvv: string; installments: number };
export type CardResult =
  | { ok: true; payment: Order["payment"] }
  | { ok: false; error: string };

/**
 * Simula a autorização do cartão: só o número de teste é aprovado.
 * O retorno guarda apenas bandeira e últimos 4 dígitos: o número completo e o CVV nunca saem desta função.
 */
export function processCard(input: CardInput): CardResult {
  const digits = onlyDigits(input.number);
  if (digits !== TEST_CARD_NUMBER) return { ok: false, error: CARD_DECLINED_MESSAGE };
  return {
    ok: true,
    payment: {
      method: "cartao",
      installments: input.installments,
      brand: cardBrand(digits),
      last4: digits.slice(-4),
    },
  };
}

/** Soma dias úteis (segunda a sexta) a uma data. */
export function addBusinessDays(from: Date, days: number): Date {
  const date = new Date(from);
  let left = days;
  while (left > 0) {
    date.setDate(date.getDate() + 1);
    const weekday = date.getDay();
    if (weekday !== 0 && weekday !== 6) left--;
  }
  return date;
}

/** Vencimento do boleto (AAAA-MM-DD): 3 dias úteis a partir de hoje. */
export function boletoDueDate(now: Date = new Date()): string {
  const due = addBusinessDays(now, BOLETO_DUE_BUSINESS_DAYS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}`;
}

/** Código Pix copia-e-cola FICTÍCIO (identificado como demonstração). */
export function fakePixCode(orderId: string): string {
  return `00020126DEMONSTRACAO0014BR.GOV.BCB.PIX0136${onlyDigits(orderId).padStart(8, "0")}-0000-0000-0000-DEMO5204000053039865802BR5909LOJA DEMO6009SAO PAULO62070503***6304DEMO`;
}

/** Linha digitável de boleto FICTÍCIA. */
export function fakeBoletoLine(orderId: string): string {
  const id = onlyDigits(orderId).padStart(6, "0").slice(-6);
  return `00000.00000 00000.${id} 00000.000000 0 00000000000000`;
}

/** Próximo número de pedido: prefixo + (maior número já usado com esse prefixo + 1). */
export function nextOrderId(prefix: string, orders: Pick<Order, "id">[]): string {
  const used = orders
    .filter((o) => o.id.startsWith(`${prefix}-`))
    .map((o) => Number(o.id.slice(prefix.length + 1)))
    .filter((n) => Number.isFinite(n));
  return `${prefix}-${(used.length ? Math.max(...used) : 1000) + 1}`;
}

export const ORDER_STATUS_LABEL: Record<Order["status"], string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  em_separacao: "Em separação",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};
