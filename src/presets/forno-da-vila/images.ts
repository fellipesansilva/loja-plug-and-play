import type { Image } from "@/domain/types";

/**
 * Fotos reais (Unsplash, licença gratuita). Arquivos em public/images/presets/forno-da-vila/ e créditos em
 * IMAGE_CREDITS.md. O texto alternativo descreve o que a foto mostra. Gerado a partir da curadoria de imagens da F1.
 */
export const bannerImage: Image = { src: "/images/presets/forno-da-vila/banner.webp", alt: "Pão de fermentação natural sobre o balcão de uma padaria" };

export const categoryImages: Record<string, Image> = {
  "pratos": { src: "/images/presets/forno-da-vila/lasanha-a-bolonhesa-2.webp", alt: "Lasanha assada em travessa branca com uma porção servida no prato" },
  "doces": { src: "/images/presets/forno-da-vila/bolo-de-cenoura-com-chocolate-1.webp", alt: "Fatia de bolo de cenoura com cobertura cremosa e nozes" },
  "bebidas": { src: "/images/presets/forno-da-vila/categoria-bebidas.webp", alt: "Copos de limonada com rodelas de limão" },
};

/** Fotos por id de produto (a 1ª é a principal). */
export const productImages: Record<string, Image[]> = {
  "fv-001": [
    { src: "/images/presets/forno-da-vila/lasanha-a-bolonhesa-1.webp", alt: "Fatia de lasanha à bolonhesa com folhas de manjericão" },
    { src: "/images/presets/forno-da-vila/lasanha-a-bolonhesa-2.webp", alt: "Lasanha assada em travessa branca com uma porção servida no prato" },
    { src: "/images/presets/forno-da-vila/lasanha-a-bolonhesa-3.webp", alt: "Prato de lasanha com molho e queijo em fundo escuro" },
  ],
  "fv-002": [
    { src: "/images/presets/forno-da-vila/feijoada-completa-1.webp", alt: "Tigela de feijão-preto cozido ao lado de limões" },
    { src: "/images/presets/forno-da-vila/feijoada-completa-2.webp", alt: "Ensopado de carnes em molho escuro com cebolinha, visto de cima" },
    { src: "/images/presets/forno-da-vila/feijoada-completa-3.webp", alt: "Prato com salada, ovo cozido e acompanhamento em molho escuro" },
  ],
  "fv-003": [
    { src: "/images/presets/forno-da-vila/frango-assado-com-batatas-1.webp", alt: "Frango assado com batatas e alecrim em frigideira de ferro" },
  ],
  "fv-004": [
    { src: "/images/presets/forno-da-vila/risoto-de-cogumelos-1.webp", alt: "Risoto de cogumelos com chips de alho e rúcula" },
  ],
  "fv-005": [
    { src: "/images/presets/forno-da-vila/escondidinho-de-carne-seca-1.webp", alt: "Pratos e tigelas de comida caseira com carne desfiada e purê" },
  ],
  "fv-006": [
    { src: "/images/presets/forno-da-vila/strogonoff-de-frango-1.webp", alt: "Prato branco com massa ao molho cremoso de carne" },
  ],
  "fv-007": [
    { src: "/images/presets/forno-da-vila/quiche-lorraine-1.webp", alt: "Tortas salgadas de espinafre assadas em forma" },
  ],
  "fv-008": [
    { src: "/images/presets/forno-da-vila/brigadeiro-gourmet-box-1.webp", alt: "Caixa de bombons e chocolates variados" },
    { src: "/images/presets/forno-da-vila/brigadeiro-gourmet-box-2.webp", alt: "Docinhos de chocolate enrolados em granulado" },
    { src: "/images/presets/forno-da-vila/brigadeiro-gourmet-box-3.webp", alt: "Caixa de bombons decorados com diferentes coberturas" },
  ],
  "fv-009": [
    { src: "/images/presets/forno-da-vila/bolo-de-cenoura-com-chocolate-1.webp", alt: "Fatia de bolo de cenoura com cobertura cremosa e nozes" },
    { src: "/images/presets/forno-da-vila/bolo-de-cenoura-com-chocolate-2.webp", alt: "Fatia de bolo de cenoura em prato com garfo" },
    { src: "/images/presets/forno-da-vila/bolo-de-cenoura-com-chocolate-3.webp", alt: "Bolo de cenoura inteiro com cobertura branca, já fatiado" },
  ],
  "fv-010": [
    { src: "/images/presets/forno-da-vila/torta-de-limao-1.webp", alt: "Torta de limão com merengue maçaricado, já fatiada" },
  ],
  "fv-011": [
    { src: "/images/presets/forno-da-vila/pudim-de-leite-1.webp", alt: "Pudim de leite com calda de caramelo em prato branco" },
  ],
  "fv-012": [
    { src: "/images/presets/forno-da-vila/cookie-red-velvet-1.webp", alt: "Bandeja de docinhos com cobertura de merengue recém-saídos do forno" },
  ],
  "fv-013": [
    { src: "/images/presets/forno-da-vila/pao-de-mel-1.webp", alt: "Bandeja de bombons de chocolate com listras de cobertura" },
  ],
  "fv-014": [
    { src: "/images/presets/forno-da-vila/suco-de-laranja-natural-1.webp", alt: "Copo alto de suco de laranja com fatia de laranja" },
    { src: "/images/presets/forno-da-vila/suco-de-laranja-natural-2.webp", alt: "Copo de suco de laranja ao lado de laranjas cortadas" },
    { src: "/images/presets/forno-da-vila/suco-de-laranja-natural-3.webp", alt: "Copo de suco com canudo e fatia de limão" },
  ],
  "fv-015": [
    { src: "/images/presets/forno-da-vila/limonada-suica-1.webp", alt: "Copo de limonada com fatias de limão sobre tábua de madeira" },
  ],
  "fv-016": [
    { src: "/images/presets/forno-da-vila/cafe-coado-especial-1.webp", alt: "Pó de café em filtro de papel para café coado" },
  ],
  "fv-017": [
    { src: "/images/presets/forno-da-vila/cha-gelado-de-pessego-1.webp", alt: "Copo de chá gelado com fatias de pêssego e gelo, visto de cima" },
  ],
  "fv-018": [
    { src: "/images/presets/forno-da-vila/kombucha-de-gengibre-1.webp", alt: "Kombucha em garrafa de vidro, com a película da fermentação" },
  ],
};
