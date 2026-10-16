import type { LinhaReservatorio } from "@/domain/types";

/** Sugestão do dimensionador. Volumes e capacidades em litros, sempre inteiros. */
export type Sugestao =
  | { tipo: "sem-consumo" }
  /** Cabe em um reservatório da linha: o menor com capacidade igual ou maior que o necessário. */
  | { tipo: "modelo"; capacidade: number; necessario: number }
  /** Passa da maior capacidade: `quantidade` reservatórios da maior capacidade (ou projeto sob medida). */
  | { tipo: "varios"; capacidade: number; quantidade: number; necessario: number };

/** Volume necessário = consumo diário × dias. Valores inválidos viram 0; sempre inteiro. */
export function volumeNecessario(consumoDiario: number, dias: number): number {
  if (!Number.isFinite(consumoDiario) || !Number.isFinite(dias)) return 0;
  const c = Math.floor(consumoDiario);
  const d = Math.floor(dias);
  return c > 0 && d > 0 ? c * d : 0;
}

/** Sugestão da linha para o volume: menor capacidade que atende; acima da maior, quantos reservatórios da maior (ceil). */
export function sugerir(linha: LinhaReservatorio, consumoDiario: number, dias: number): Sugestao {
  const necessario = volumeNecessario(consumoDiario, dias);
  if (necessario <= 0 || linha.capacidades.length === 0) return { tipo: "sem-consumo" };
  const capacidades = [...linha.capacidades].sort((a, b) => a - b);
  const modelo = capacidades.find((c) => c >= necessario);
  if (modelo !== undefined) return { tipo: "modelo", capacidade: modelo, necessario };
  const maior = capacidades[capacidades.length - 1];
  return { tipo: "varios", capacidade: maior, quantidade: Math.ceil(necessario / maior), necessario };
}

const NUMERO = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

/** 4500 → "4.500" (separador de milhar em português, em qualquer ambiente). */
export function formatarLitros(n: number): string {
  return NUMERO.format(Math.floor(n));
}

/** "1 dia" / "N dias". */
export function textoDias(dias: number): string {
  return `${dias} ${dias === 1 ? "dia" : "dias"}`;
}

/** Observação do item: "5.000 L · para 4.500 L (1.500 L/dia × 3 dias)". */
export function observacaoDimensionador(s: Exclude<Sugestao, { tipo: "sem-consumo" }>, consumoDiario: number, dias: number, unidadeConsumo: string): string {
  return `${formatarLitros(s.capacidade)} L · para ${formatarLitros(s.necessario)} L (${formatarLitros(consumoDiario)} ${unidadeConsumo} × ${textoDias(dias)})`;
}
