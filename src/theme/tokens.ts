import type { ThemeTokens } from "@/domain/types";

/** Converte ThemeTokens em um mapa de CSS variables (prefixo `--t-`). */
export function tokensToCssVars(tokens: ThemeTokens): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [k, v] of Object.entries(tokens.colors)) vars[`--t-color-${k}`] = v;
  for (const [k, v] of Object.entries(tokens.fonts)) vars[`--t-font-${k}`] = v;
  for (const [k, v] of Object.entries(tokens.radii)) vars[`--t-radius-${k}`] = v;
  for (const [k, v] of Object.entries(tokens.spacing)) vars[`--t-space-${k}`] = v;
  return vars;
}

export function tokensToCss(tokens: ThemeTokens): string {
  const body = Object.entries(tokensToCssVars(tokens))
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  return `:root{${body}}`;
}
