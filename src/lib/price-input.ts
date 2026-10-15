/**
 * Preço digitado em formato brasileiro ("19,90", "1.299,90", "R$ 19,90", "19"). Devolve centavos inteiros, ou null se
 * o texto não for um preço válido (vazio, letras, mais de 2 casas decimais, separador de milhar fora do lugar, zero ou negativo).
 * O ponto só vale como separador de milhar ("1.299,90"); "19.90" é recusado no formulário (use a vírgula).
 */
export function parsePriceBR(text: string): number | null {
  const t = text.trim().replace(/^R\$\s*/i, "");
  if (!/^(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/.test(t)) return null;
  const [intPart, frac = ""] = t.split(",");
  const cents = Number(intPart.replace(/\./g, "")) * 100 + Number(frac.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 && cents <= 100_000_000_00 ? cents : null;
}

/**
 * Preço de planilha (CSV): aceita o formato do formulário e também o ponto decimal ("319.90"), que é o que
 * muitas planilhas e o arquivo de exemplo usam. Com ponto e exatamente 3 dígitos depois ("1.299") vale como milhar.
 */
export function parsePriceCsv(text: string): number | null {
  const t = text.trim().replace(/^R\$\s*/i, "");
  const dotDecimal = /^\d+\.\d{1,2}$/.exec(t);
  if (dotDecimal) return parsePriceBR(t.replace(".", ","));
  return parsePriceBR(t);
}

/** Centavos no campo de edição: 1990 → "19,90" (sem símbolo nem separador de milhar, para editar e salvar de novo). */
export function formatPriceInput(cents: number): string {
  const reais = Math.floor(cents / 100);
  const rest = String(cents % 100).padStart(2, "0");
  return `${reais},${rest}`;
}
