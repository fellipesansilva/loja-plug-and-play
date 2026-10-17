import { imageOriginals } from "./image-originals.generated";

/** Larguras (px) das versões menores de cada foto (scripts/image-variants.mjs): <nome>-360.webp e <nome>-640.webp. */
export const IMAGE_VARIANT_WIDTHS = [360, 640] as const;

/** Variante de densidade alta (celular de densidade 2 ou mais): <nome>-960.webp, gerada por scripts/image-variants.mjs só para foto pesada. */
export const IMAGE_VARIANT_HI_WIDTH = 960;

const PRESET_PHOTO = /^(\/images\/presets\/[^/]+\/(?!banner)[^/]+?)\.webp$/;
const VARIANT_FILE = /-(360|640|960)\.webp$/;

/**
 * srcset da foto de um preset (arquivo em /images/presets/<loja>/<nome>.webp, fora os banners): o navegador baixa a versão que cobre o espaço
 * exibido. Miniaturas de 100 px e cards de 200 px não precisam do arquivo de 150 KB. Fotos enviadas pelo painel (data:) não têm versões.
 */
export function imageSrcSet(src: string): string | undefined {
  const m = PRESET_PHOTO.exec(src);
  if (!m || VARIANT_FILE.test(src)) return undefined;
  return IMAGE_VARIANT_WIDTHS.map((w) => `${m[1]}-${w}.webp ${w}w`).join(", ");
}

/** Só vale trocar o original por uma variante quando ele é pesado: foto de até 64 KB (ex.: a Trama, 25 KB) segue com o arquivo original. */
export const IMAGE_VARIANT_MIN_BYTES = 64 * 1024;

/** Corte entre celular e telas largas: o mesmo de `md` no Tailwind e do layout em duas colunas da página de produto. */
export const PHONE_MEDIA = "(max-width: 767px)";
export const WIDE_MEDIA = "(min-width: 768px)";

// Layout da galeria na página de produto (medido no DOM em 360 a 1920 px, nas três lojas): em telas largas é a coluna esquerda de uma
// grade de 2 colunas dentro de `max-w-page` (75rem, theme.css), com `px-md` (1rem de cada lado) e `gap-lg` (1,5rem) entre as colunas;
// no celular é a largura da janela menos o recuo lateral da página (`gutterRem`: 0 na Trama e no Forno, 2 na Arca).
const PAGE_MAX_REM = 75;
const PAGE_SIDE_PADDING_REM = 1;
const COLUMN_GAP_REM = 1.5;

export type LcpSource = { media: string; srcSet: string; sizes: string };
/** `src` é o original; `fallback` é o que vai no atributo src da <img> (a maior variante), para nenhum caminho do navegador baixar o original no celular. */
export type LcpPlan = { src: string; fallback: string; phone: LcpSource; wide: LcpSource };

/**
 * Plano da foto do LCP da galeria: `srcset` e `sizes` do celular e das telas largas.
 * - Celular: só as variantes (360, 640 e 960); o original nunca é baixado. Densidade 1 usa a de 640 (380 px de tela); densidade 2 ou mais usa a
 *   de 960 (760 px físicos, com folga). Em original mais estreito que 960 px (Trama, 900 px) a "de 960" tem a largura do original: o manifesto
 *   guarda a largura real do arquivo (`w960`).
 * - Telas largas (a partir de 768 px): variantes de 360 e 640 e o original com a sua largura real, para a tela de densidade alta continuar nítida.
 * Devolve null (a foto segue como está, sem variantes) quando não é foto de preset, não consta no manifesto ou é leve.
 */
export function lcpImagePlan(src: string, gutterRem = 0): LcpPlan | null {
  const m = PRESET_PHOTO.exec(src);
  const original = imageOriginals[src];
  if (!m || VARIANT_FILE.test(src) || !original || original.bytes < IMAGE_VARIANT_MIN_BYTES) return null;
  const variants = IMAGE_VARIANT_WIDTHS.filter((w) => w < original.width).map((w) => ({ url: `${m[1]}-${w}.webp`, w }));
  if (variants.length === 0) return null;
  const hi = original.w960 ? { url: `${m[1]}-${IMAGE_VARIANT_HI_WIDTH}.webp`, w: original.w960 } : null;
  const phoneList = hi && hi.w > variants[variants.length - 1].w ? [...variants, hi] : variants;
  const toSet = (list: { url: string; w: number }[]) => list.map((v) => `${v.url} ${v.w}w`).join(", ");
  const columnRem = 2 * PAGE_SIDE_PADDING_REM + COLUMN_GAP_REM;
  return {
    src,
    fallback: phoneList[phoneList.length - 1].url,
    phone: { media: PHONE_MEDIA, srcSet: toSet(phoneList), sizes: gutterRem > 0 ? `calc(100vw - ${gutterRem}rem)` : "100vw" },
    wide: { media: WIDE_MEDIA, srcSet: toSet([...variants, { url: src, w: original.width }]), sizes: `calc((min(100vw, ${PAGE_MAX_REM}rem) - ${columnRem}rem) / 2)` },
  };
}

/** Preloads do plano: um por faixa, com o MESMO srcset, sizes e media do <picture> (o navegador junta tudo num download só). */
export function lcpPreloads(plan: LcpPlan): { imageSrcSet: string; imageSizes: string; media: string }[] {
  return [plan.phone, plan.wide].map((s) => ({ imageSrcSet: s.srcSet, imageSizes: s.sizes, media: s.media }));
}
