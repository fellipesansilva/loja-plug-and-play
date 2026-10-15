import {
  isValidCep,
  isValidCvv,
  isValidEmail,
  isValidExpiry,
  isValidCpf,
  isValidPhone,
  onlyDigits,
} from "./validation";

export type Errors = Record<string, string>;

export type Identification = { name: string; email: string; phone: string; cpf: string; marketing: boolean };
export type AddressForm = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
};
export type CardForm = { number: string; name: string; expiry: string; cvv: string; installments: number };

/** Ordem dos campos na tela: o foco vai para o primeiro inválido nesta ordem. */
export const IDENTIFICATION_FIELDS = ["name", "email", "phone", "cpf"] as const;
export const ADDRESS_FIELDS = ["cep", "street", "number", "district", "city", "state"] as const;
export const CARD_FIELDS = ["cardNumber", "cardName", "cardExpiry", "cardCvv"] as const;

export function validateIdentification(v: Identification): Errors {
  const errors: Errors = {};
  if (v.name.trim().split(/\s+/).filter(Boolean).length < 2) errors.name = "Informe nome e sobrenome";
  if (!isValidEmail(v.email)) errors.email = "E-mail inválido";
  if (!isValidPhone(v.phone)) errors.phone = "Celular inválido";
  if (!isValidCpf(v.cpf)) errors.cpf = "CPF inválido";
  return errors;
}

export function validateAddress(v: AddressForm): Errors {
  const errors: Errors = {};
  if (!isValidCep(v.cep)) errors.cep = "CEP inválido";
  if (!v.street.trim()) errors.street = "Informe a rua";
  if (!v.number.trim()) errors.number = "Informe o número";
  if (!v.district.trim()) errors.district = "Informe o bairro";
  if (!v.city.trim()) errors.city = "Informe a cidade";
  if (!/^[A-Za-zÀ-ÿ]{2}$/.test(v.state.trim())) errors.state = "UF inválida";
  return errors;
}

/** Validação de formato do cartão. A autorização (só o cartão de teste passa) é feita em `processCard`. */
export function validateCard(v: CardForm, now: Date = new Date()): Errors {
  const errors: Errors = {};
  if (onlyDigits(v.number).length !== 16) errors.cardNumber = "Número do cartão inválido";
  if (v.name.trim().length < 2) errors.cardName = "Informe o nome impresso no cartão";
  if (!isValidExpiry(v.expiry, now)) errors.cardExpiry = "Validade inválida";
  if (!isValidCvv(v.cvv)) errors.cardCvv = "CVV inválido";
  return errors;
}

/** Primeiro campo com erro, na ordem da tela. */
export function firstInvalid(errors: Errors, order: readonly string[]): string | null {
  return order.find((field) => errors[field]) ?? null;
}

export function composeAddress(v: AddressForm): string {
  const line = `${v.street.trim()}, ${v.number.trim()}${v.complement.trim() ? ` (${v.complement.trim()})` : ""}`;
  return `${line} — ${v.district.trim()}, ${v.city.trim()}/${v.state.trim().toUpperCase()}, CEP ${v.cep}`;
}
