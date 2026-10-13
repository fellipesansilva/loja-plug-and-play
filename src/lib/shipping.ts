import type { Modules, Money, ShippingConfig } from "@/domain/types";

export type ShippingQuoteOption = {
  id: string;
  label: string;
  /** Preço em centavos; 0 = grátis. */
  price: Money;
  free: boolean;
  /** Texto do prazo: "5 a 8 dias úteis" ou "hoje". */
  deadline: string;
};

export type ShippingQuote =
  | { status: "invalid" }
  | {
      status: "ok";
      /** CEP dentro da cobertura de entrega do preset. */
      covered: boolean;
      options: ShippingQuoteOption[];
      /** Retirada no local (módulo ligado): sempre presente, mesmo fora da cobertura. */
      pickup: { address: string } | null;
      /** Centavos que faltam para o frete grátis (módulo ligado, cobertura ok e abaixo do mínimo). */
      missingForFree: Money | null;
    };

/** Aceita "00000000" ou "00000-000". Devolve só os 8 dígitos, ou null se inválido. */
export function normalizeCep(input: string): string | null {
  const text = input.trim();
  return /^\d{5}-?\d{3}$/.test(text) ? text.replace("-", "") : null;
}

/** Máscara de digitação: "01310100" → "01310-100". */
export function maskCep(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

/** Fator de preço e dias a mais por região (1º dígito do CEP). */
function region(cep: string): { factor: number; extraDays: number } {
  const d = Number(cep[0]);
  if (d <= 3) return { factor: 1, extraDays: 0 };
  if (d <= 6) return { factor: 1.3, extraDays: 2 };
  return { factor: 1.6, extraDays: 4 };
}

export type ShippingInput = {
  cep: string;
  /** Preço do item (centavos), para a regra de frete grátis. */
  itemPrice: Money;
  shipping: ShippingConfig;
  modules: Modules;
  /** Endereço da loja, exibido na retirada. */
  storeAddress: string;
};

/** Simulação determinística: o mesmo CEP e o mesmo preço sempre dão o mesmo resultado. */
export function quoteShipping(input: ShippingInput): ShippingQuote {
  const cep = normalizeCep(input.cep);
  if (!cep) return { status: "invalid" };

  const { shipping, modules, itemPrice } = input;
  const pickup = modules.retiradaLocal ? { address: input.storeAddress } : null;
  const covered =
    shipping.coverage === "national" || shipping.coverage.cepPrefixes.some((p) => cep.startsWith(p));
  if (!covered) return { status: "ok", covered: false, options: [], pickup, missingForFree: null };

  const { factor, extraDays } = region(cep);
  const free = modules.freteGratis;
  const freeEligible = !!free?.enabled && itemPrice >= free.minValue;
  const cheapest = [...shipping.options].sort((x, y) => x.basePrice - y.basePrice)[0]?.id;

  const options = shipping.options.map<ShippingQuoteOption>((o) => {
    const isFree = freeEligible && o.id === cheapest;
    return {
      id: o.id,
      label: o.label,
      price: isFree ? 0 : Math.round(o.basePrice * factor),
      free: isFree,
      deadline:
        o.days === "same-day" ? "hoje" : `${o.days[0] + extraDays} a ${o.days[1] + extraDays} dias úteis`,
    };
  });

  const missingForFree = free?.enabled && !freeEligible ? free.minValue - itemPrice : null;
  return { status: "ok", covered: true, options, pickup, missingForFree };
}
