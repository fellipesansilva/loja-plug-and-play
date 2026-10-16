import type { Image } from "@/domain/types";

/**
 * Ilustrações originais em SVG (vetores simples, na paleta do preset), em public/images/presets/arca-inflaveis/.
 * Não são fotos: o preset não usa imagem de terceiros. Créditos e justificativa em IMAGE_CREDITS.md.
 */
const DIR = "/images/presets/arca-inflaveis";

export const art = (file: string, alt: string): Image => ({ src: `${DIR}/${file}.svg`, alt });

export const bannerImage: Image = art(
  "banner",
  "Ilustração de um blimp, um pórtico inflável e um reservatório flexível sobre fundo azul-petróleo",
);

export const categoryImages: Record<string, Image> = {
  "industria-e-agro": art("industria-e-agro", "Ilustração de um reservatório flexível em uma propriedade rural"),
  "eventos-e-marketing": art("eventos-e-marketing", "Ilustração de um pórtico inflável e um blimp em um evento ao ar livre"),
};
