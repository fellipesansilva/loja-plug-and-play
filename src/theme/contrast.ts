import type { ThemeTokens } from "@/domain/types";

/** Contraste mínimo (WCAG AA) entre texto e fundo: 4,5:1. É o limite que bloqueia salvar o tema no painel. */
export const MIN_TEXT_CONTRAST = 4.5;

type ColorKey = keyof ThemeTokens["colors"];

/** Par de tokens de cor que se encontram na loja: texto (`fg`) sobre fundo (`bg`). Cada preset declara os seus pares. */
export type ContrastPair = readonly [fg: ColorKey, bg: ColorKey];

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** "#rgb" ou "#rrggbb" → [r, g, b] de 0 a 255; null se não for uma cor hexadecimal. */
export function parseHex(color: string): [number, number, number] | null {
  const m = HEX.exec(color.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

/** Luminância relativa (WCAG 2.x). */
export function relativeLuminance(color: string): number {
  const rgb = parseHex(color);
  if (!rgb) throw new Error(`Cor inválida: ${color}`);
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste entre duas cores, de 1 (iguais) a 21 (preto sobre branco). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export type ContrastIssue = { fg: ColorKey; bg: ColorKey; ratio: number; min: number };

/** Pares abaixo do mínimo. Lista vazia = o tema pode ser salvo. Cores que não são hexadecimais (ex.: var(...)) ficam de fora. */
export function contrastIssues(colors: ThemeTokens["colors"], pairs: readonly ContrastPair[], min: number = MIN_TEXT_CONTRAST): ContrastIssue[] {
  const issues: ContrastIssue[] = [];
  for (const [fg, bg] of pairs) {
    if (!parseHex(colors[fg]) || !parseHex(colors[bg])) continue;
    const ratio = contrastRatio(colors[fg], colors[bg]);
    // Arredonda para duas casas antes de comparar: 4,499 aparece como "4,50" e não pode ser reprovado em silêncio nem aprovado por engano.
    if (Math.round(ratio * 100) / 100 < min) issues.push({ fg, bg, ratio, min });
  }
  return issues;
}

/** Cor de texto do botão "Demo" (fundo `secondary`): `text` ou `background`, a que tiver o maior contraste sobre o destaque. Empate ou cor que não é hexadecimal: `text`. */
export type DemoTextKey = "text" | "background";

export function demoButtonTextKey(colors: ThemeTokens["colors"]): DemoTextKey {
  if (!parseHex(colors.secondary) || !parseHex(colors.text) || !parseHex(colors.background)) return "text";
  return contrastRatio(colors.background, colors.secondary) > contrastRatio(colors.text, colors.secondary) ? "background" : "text";
}

/** O par do botão Demo (texto escolhido sobre `secondary`) abaixo do mínimo. `key` fixo serve para provar o botão antigo (sempre `text`). */
export function demoButtonIssues(colors: ThemeTokens["colors"], key: DemoTextKey = demoButtonTextKey(colors), min: number = MIN_TEXT_CONTRAST): ContrastIssue[] {
  return contrastIssues(colors, [[key, "secondary"]], min);
}
