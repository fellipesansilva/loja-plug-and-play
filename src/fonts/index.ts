/**
 * Fontes de cada preset, hospedadas em /public/fonts/<apelido>/ (arquivos woff2 latin, licença OFL, origem Google Fonts).
 * Cada página /<preset> declara só as @font-face e o preload das fontes do próprio preset: a página do Forno não
 * baixa nada da Trama e vice-versa. (next/font não serve aqui: ele coloca as fontes de todos os presets no CSS
 * compartilhado da árvore de rotas.) Ao criar um preset novo, adicione a pasta em public/fonts e uma entrada aqui.
 */
import facesJson from "./faces.json";
import { fallbackFaces } from "./fallbacks.generated";

type FontFace = { family: string; file: string; weight: string; /** Padrão: true. Só as fontes do primeiro uso (título e texto regular) precisam de preload. */ preload?: boolean };
type PresetFonts = {
  faces: FontFace[];
  vars: Record<string, string>;
  /** As @font-face (e o preload) só entram depois que a foto principal da página foi pintada: o texto aparece na fonte reserva, de métricas ajustadas, e a foto não divide a banda com as fontes. */
  afterLcp?: boolean;
};

const LATIN_RANGE =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";

// Os dados vivem em faces.json para o script scripts/font-metrics.mjs ler os mesmos arquivos. `vars`: variável CSS → família.
const data = facesJson as Record<string, PresetFonts>;
export const fontsBySlug: Record<string, PresetFonts> = Object.fromEntries(
  Object.entries(data).map(([slug, f]) => [slug, { faces: f.faces, afterLcp: f.afterLcp, vars: Object.fromEntries(Object.entries(f.vars).map(([k, v]) => [k, `"${v}"`])) }]),
);

/** Endereços dos arquivos de fonte do preset (para o preload). */
export function fontUrlsFor(slug: string): string[] {
  if (fontsBySlug[slug]?.afterLcp) return [];
  return (fontsBySlug[slug]?.faces ?? []).filter((f) => f.preload !== false).map((f) => `/fonts/${slug}/${f.file}`);
}

function facesCss(slug: string): string {
  return (fontsBySlug[slug]?.faces ?? [])
    .map(
      (f) =>
        `@font-face{font-family:"${f.family}";font-style:normal;font-weight:${f.weight};font-display:swap;src:url(/fonts/${slug}/${f.file}) format("woff2");unicode-range:${LATIN_RANGE}}`,
    )
    .join("");
}

/** As @font-face que só entram depois da foto principal (presets com `afterLcp`); vazio nos demais. */
export function deferredFontCssFor(slug: string): string {
  return fontsBySlug[slug]?.afterLcp ? facesCss(slug) : "";
}

/** CSS com as @font-face (menos as adiadas), a fonte reserva e as variáveis de fonte do preset em :root (os tokens do preset referenciam as variáveis). */
export function fontCssFor(slug: string): string {
  const fonts = fontsBySlug[slug];
  if (!fonts) return "";
  const faces = fonts.afterLcp ? "" : facesCss(slug);
  // Fonte reserva com métricas ajustadas (scripts/font-metrics.mjs): enquanto a fonte da loja não chega, o texto ocupa o mesmo espaço
  // que terá depois (size-adjust e overrides), e a troca não desloca o layout.
  const fallbackFamilies = new Set<string>();
  const fallbacks = (fallbackFaces[slug] ?? [])
    .map((f) => {
      fallbackFamilies.add(f.family);
      const src = f.local.map((n) => `local("${n}")`).join(",");
      return `@font-face{font-family:"${f.family} Fallback";font-style:normal;font-weight:${f.weight};src:${src};size-adjust:${f.sizeAdjust}%;ascent-override:${f.ascent}%;descent-override:${f.descent}%;line-gap-override:${f.lineGap}%}`;
    })
    .join("");
  const vars = Object.entries(fonts.vars)
    .map(([name, family]) => {
      const bare = family.replace(/"/g, "");
      return `${name}:${family}${fallbackFamilies.has(bare) ? `,"${bare} Fallback"` : ""}`;
    })
    .join(";");
  return `${faces}${fallbacks}:root{${vars}}`;
}
