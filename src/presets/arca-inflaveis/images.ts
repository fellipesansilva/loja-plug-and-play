import type { Image, ImageSource } from "@/domain/types";

/**
 * Fotos reais (Unsplash, Pexels e Wikimedia Commons) com o mesmo tratamento de "ensaio de marca": recorte 4:3
 * com o produto centralizado, balanço de branco levemente frio, contraste e nitidez moderados, saturação contida e um
 * véu azul-petróleo nas sombras. Arquivos em public/images/presets/arca-inflaveis/; autores e licenças em IMAGE_CREDITS.md.
 */
const DIR = "/images/presets/arca-inflaveis";

export const photo = (file: string, alt: string): Image => ({
  src: `${DIR}/${file}.webp`,
  alt,
});

const candidates = (prefix: string, widths: number[], ext: "avif" | "webp") =>
  widths.map((width) => ({ src: `${DIR}/${prefix}-${width}.${ext}`, width }));

const bannerSources: ImageSource[] = [
  {
    media: "(max-width: 767px)",
    sizes: "100vw",
    avif: candidates("banner-m", [480, 640, 768, 960], "avif"),
    webp: candidates("banner-m", [480, 640, 768, 960], "webp"),
  },
  {
    media: "(min-width: 768px)",
    sizes: "100vw",
    avif: candidates("banner-d", [1280, 1920], "avif"),
    webp: candidates("banner-d", [1280, 1920], "webp"),
  },
];

export const bannerImage: Image = {
  src: `${DIR}/banner.webp`,
  alt: "Fileira de pessoas esticando um grande reservatório flexível bege em terreno aberto, o que dá a escala do produto",
  /** Recortes responsivos (celular 3:4 e desktop 16:9) em AVIF e WebP; `src` é o reserva (WebP de desktop). */
  sources: bannerSources,
  preload: true,
};

export const categoryImages: Record<string, Image> = {
  "industria-e-agro": photo("categoria-industria-e-agro", "Tanque de água redondo sobre um reboque, em um campo rural"),
  "eventos-e-marketing": photo(
    "categoria-eventos-e-marketing",
    "Entrada inflável azul com estrelas e a palavra WELCOME, em frente a uma igreja, com visitantes ao redor",
  ),
};
