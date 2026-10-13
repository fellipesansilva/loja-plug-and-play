import type { ThemeTokens } from "@/domain/types";

/** Grupo de ThemeTokens → prefixo da CSS variable (`--t-<prefixo>-<chave>`). Manter igual a early-theme-script.ts. */
export const TOKEN_GROUPS = {
  colors: "color",
  fonts: "font",
  radii: "radius",
  spacing: "space",
  ratios: "ratio",
  logo: "logo",
} as const satisfies Record<keyof ThemeTokens, string>;

/** Converte ThemeTokens em um mapa de CSS variables (prefixo `--t-`). */
export function tokensToCssVars(tokens: ThemeTokens): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [group, prefix] of Object.entries(TOKEN_GROUPS)) {
    const values = tokens[group as keyof ThemeTokens] as Record<string, string>;
    for (const [k, v] of Object.entries(values)) vars[`--t-${prefix}-${k}`] = v;
  }
  return vars;
}

export function tokensToCss(tokens: ThemeTokens): string {
  const body = Object.entries(tokensToCssVars(tokens))
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  return `:root{${body}}`;
}
