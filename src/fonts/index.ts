/**
 * Fontes de cada preset, hospedadas em /public/fonts/<apelido>/ (arquivos woff2 latin, licença OFL, origem Google Fonts).
 * Cada página /<preset> declara só as @font-face e o preload das fontes do próprio preset: a página do Forno não
 * baixa nada da Trama e vice-versa. (next/font não serve aqui: ele coloca as fontes de todos os presets no CSS
 * compartilhado da árvore de rotas.) Ao criar um preset novo, adicione a pasta em public/fonts e uma entrada aqui.
 */
type FontFace = { family: string; file: string; weight: string; /** Padrão: true. Só as fontes do primeiro uso (título e texto regular) precisam de preload. */ preload?: boolean };
type PresetFonts = { faces: FontFace[]; vars: Record<string, string> };

const LATIN_RANGE =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";

export const fontsBySlug: Record<string, PresetFonts> = {
  trama: {
    faces: [
      { family: "Bodoni Moda", file: "bodoni-moda-latin.woff2", weight: "400 600" },
      { family: "Manrope", file: "manrope-latin.woff2", weight: "400 700" },
    ],
    vars: { "--font-bodoni-moda": '"Bodoni Moda"', "--font-manrope": '"Manrope"' },
  },
  forno: {
    faces: [
      { family: "Bricolage Grotesque", file: "bricolage-grotesque-latin.woff2", weight: "800" },
      { family: "Manrope", file: "manrope-latin.woff2", weight: "400 700" },
    ],
    vars: { "--font-bricolage": '"Bricolage Grotesque"', "--font-manrope": '"Manrope"' },
  },
  arca: {
    faces: [
      { family: "Barlow Condensed", file: "barlow-condensed-700.woff2", weight: "700" },
      { family: "Barlow", file: "barlow-400.woff2", weight: "400" },
      { family: "Barlow", file: "barlow-500.woff2", weight: "500", preload: false },
      { family: "Barlow", file: "barlow-700.woff2", weight: "700", preload: false },
    ],
    vars: { "--font-barlow-condensed": '"Barlow Condensed"', "--font-barlow": '"Barlow"' },
  },
};

/** Endereços dos arquivos de fonte do preset (para o preload). */
export function fontUrlsFor(slug: string): string[] {
  return (fontsBySlug[slug]?.faces ?? []).filter((f) => f.preload !== false).map((f) => `/fonts/${slug}/${f.file}`);
}

/** CSS com as @font-face e as variáveis de fonte do preset em :root (os tokens do preset referenciam as variáveis). */
export function fontCssFor(slug: string): string {
  const fonts = fontsBySlug[slug];
  if (!fonts) return "";
  const faces = fonts.faces
    .map(
      (f) =>
        `@font-face{font-family:"${f.family}";font-style:normal;font-weight:${f.weight};font-display:swap;src:url(/fonts/${slug}/${f.file}) format("woff2");unicode-range:${LATIN_RANGE}}`,
    )
    .join("");
  const vars = Object.entries(fonts.vars)
    .map(([name, family]) => `${name}:${family}`)
    .join(";");
  return `${faces}:root{${vars}}`;
}
