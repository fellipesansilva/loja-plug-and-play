export const onlyDigits = (text: string): string => text.replace(/\D/g, "");

/** CPF válido: 11 dígitos, não todos iguais, dígitos verificadores corretos. */
export function isValidCpf(input: string): boolean {
  const cpf = onlyDigits(input);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const check = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return check(9) === Number(cpf[9]) && check(10) === Number(cpf[10]);
}

export function maskCpf(input: string): string {
  const d = onlyDigits(input).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

/** Celular/telefone brasileiro: (11) 91234-5678 ou (11) 1234-5678. */
export function maskPhone(input: string): string {
  const d = onlyDigits(input).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  const area = `(${d.slice(0, 2)}) `;
  const rest = d.slice(2);
  return d.length <= 10 ? `${area}${rest.slice(0, 4)}${rest.length > 4 ? `-${rest.slice(4)}` : ""}` : `${area}${rest.slice(0, 5)}-${rest.slice(5)}`;
}

export function isValidPhone(input: string): boolean {
  const d = onlyDigits(input);
  return d.length === 10 || (d.length === 11 && d[2] === "9");
}

export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.trim());
}

/** Número do cartão em grupos de 4 (até 16 dígitos). */
export function maskCardNumber(input: string): string {
  return onlyDigits(input).slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** Validade em MM/AA. */
export function maskExpiry(input: string): string {
  const d = onlyDigits(input).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

/** MM/AA com mês de 01 a 12 e que não esteja vencida (vale até o fim do mês). */
export function isValidExpiry(input: string, now: Date = new Date()): boolean {
  const m = /^(\d{2})\/(\d{2})$/.exec(input);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  return new Date(year, month, 1) > now;
}

export const isValidCvv = (input: string): boolean => /^\d{3,4}$/.test(input);

export const isValidCep = (input: string): boolean => onlyDigits(input).length === 8;

/** Prefixos 01–05 (São Paulo): a "busca de CEP" simulada devolve cidade e UF. */
export function simulateCepLookup(cep: string): { city: string; state: string } | null {
  const d = onlyDigits(cep);
  if (d.length !== 8) return null;
  return /^0[1-5]/.test(d) ? { city: "São Paulo", state: "SP" } : null;
}
