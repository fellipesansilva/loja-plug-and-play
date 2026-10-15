import type { Image } from "@/domain/types";

/**
 * Fotos reais (Unsplash, licença gratuita). Arquivos em public/images/presets/forno-da-vila/ e créditos em
 * IMAGE_CREDITS.md. O texto alternativo descreve o que a foto mostra. Gerado a partir da curadoria de imagens da F1.
 */
export const bannerImage: Image = { src: "/images/presets/forno-da-vila/banner.webp", alt: "Mão levantando uma fatia de pizza de pepperoni com queijo derretido esticando" };

export const categoryImages: Record<string, Image> = {
  "pizzas": { src: "/images/presets/forno-da-vila/categoria-pizzas.webp", alt: "Pizza de pepperoni inteira sobre tábua de madeira, vista de cima" },
  "paes": { src: "/images/presets/forno-da-vila/categoria-paes.webp", alt: "Baguete sobre tábua de madeira redonda" },
  "doces": { src: "/images/presets/forno-da-vila/categoria-doces.webp", alt: "Fatia de cheesecake com calda de frutas vermelhas" },
  "bebidas": { src: "/images/presets/forno-da-vila/categoria-bebidas.webp", alt: "Copos de limonada com rodelas de limão" },
};

/** Fotos por id de produto (a 1ª é a principal). */
export const productImages: Record<string, Image[]> = {
  "fv-001": [
    { src: "/images/presets/forno-da-vila/pizza-margherita-1.webp", alt: "Mão levantando uma fatia de pizza margherita com tomate e manjericão" },
    { src: "/images/presets/forno-da-vila/pizza-margherita-2.webp", alt: "Pizza margherita com queijo esticando ao tirar uma fatia" },
    { src: "/images/presets/forno-da-vila/pizza-margherita-3.webp", alt: "Pizza margherita assando em forno a lenha, com chamas ao fundo" },
  ],
  "fv-002": [
    { src: "/images/presets/forno-da-vila/pizza-quatro-queijos-1.webp", alt: "Fatia de pizza de queijos levantada com espátula, com o queijo esticando" },
    { src: "/images/presets/forno-da-vila/pizza-quatro-queijos-2.webp", alt: "Pizza de queijos fatiada com tomates-cereja e alecrim sobre tábua de madeira" },
    { src: "/images/presets/forno-da-vila/pizza-quatro-queijos-3.webp", alt: "Queijo derretido esticando ao levantar uma fatia de pizza" },
  ],
  "fv-003": [
    { src: "/images/presets/forno-da-vila/pizza-de-pepperoni-1.webp", alt: "Close de pizza de pepperoni com queijo derretido" },
  ],
  "fv-004": [
    { src: "/images/presets/forno-da-vila/pizza-mista-1.webp", alt: "Pizza com calabresa, cogumelos, pimentão e azeitonas, vista de cima" },
  ],
  "fv-005": [
    { src: "/images/presets/forno-da-vila/pizza-de-salame-1.webp", alt: "Pizza de salame e presunto sobre mesa de madeira escura, vista de cima" },
  ],
  "fv-006": [
    { src: "/images/presets/forno-da-vila/pao-de-fermentacao-natural-1.webp", alt: "Pão de fermentação natural fatiado, com miolo aerado" },
    { src: "/images/presets/forno-da-vila/pao-de-fermentacao-natural-2.webp", alt: "Duas fatias de pão rústico sobre uma travessa de madeira" },
    { src: "/images/presets/forno-da-vila/pao-de-fermentacao-natural-3.webp", alt: "Pães de fermentação natural com casca enfarinhada sobre pano de juta" },
  ],
  "fv-007": [
    { src: "/images/presets/forno-da-vila/focaccia-de-alecrim-1.webp", alt: "Focaccias empilhadas com alecrim, azeitonas e tomate" },
  ],
  "fv-008": [
    { src: "/images/presets/forno-da-vila/pao-de-queijo-1.webp", alt: "Pães de queijo dourados em um prato, ao lado de uma xícara de café" },
  ],
  "fv-009": [
    { src: "/images/presets/forno-da-vila/croissant-de-manteiga-1.webp", alt: "Croissants dourados assados em uma assadeira" },
  ],
  "fv-010": [
    { src: "/images/presets/forno-da-vila/baguete-rustica-1.webp", alt: "Duas baguetes embrulhadas em papel e barbante" },
  ],
  "fv-011": [
    { src: "/images/presets/forno-da-vila/pao-de-alho-cremoso-1.webp", alt: "Fatias de pão de alho gratinadas com queijo e ervas sobre tábua de madeira" },
  ],
  "fv-012": [
    { src: "/images/presets/forno-da-vila/bolo-vulcao-de-chocolate-1.webp", alt: "Bolo vulcão de chocolate com o centro derretido e uma bola de sorvete" },
    { src: "/images/presets/forno-da-vila/bolo-vulcao-de-chocolate-2.webp", alt: "Bolo de chocolate inteiro com calda escorrendo e cerejas" },
    { src: "/images/presets/forno-da-vila/bolo-vulcao-de-chocolate-3.webp", alt: "Fatias empilhadas de bolo de chocolate denso em um prato" },
  ],
  "fv-013": [
    { src: "/images/presets/forno-da-vila/brownie-com-calda-1.webp", alt: "Calda de chocolate escorrendo sobre brownies empilhados" },
  ],
  "fv-014": [
    { src: "/images/presets/forno-da-vila/rolinho-de-canela-1.webp", alt: "Rolinhos de canela com glacê em uma assadeira" },
  ],
  "fv-015": [
    { src: "/images/presets/forno-da-vila/cheesecake-frutas-vermelhas-1.webp", alt: "Fatia de cheesecake com calda de frutas vermelhas sendo servida com uma colher" },
  ],
  "fv-016": [
    { src: "/images/presets/forno-da-vila/torta-de-limao-1.webp", alt: "Torta de limão com merengue maçaricado, já fatiada" },
  ],
  "fv-017": [
    { src: "/images/presets/forno-da-vila/suco-de-laranja-natural-1.webp", alt: "Copo alto de suco de laranja com fatia de laranja" },
    { src: "/images/presets/forno-da-vila/suco-de-laranja-natural-2.webp", alt: "Copo de suco de laranja ao lado de laranjas cortadas" },
    { src: "/images/presets/forno-da-vila/suco-de-laranja-natural-3.webp", alt: "Copo de suco de laranja com canudo e fatia de limão" },
  ],
  "fv-018": [
    { src: "/images/presets/forno-da-vila/limonada-suica-1.webp", alt: "Copo de limonada com fatias de limão sobre tábua de madeira" },
  ],
  "fv-019": [
    { src: "/images/presets/forno-da-vila/milk-shake-de-morango-1.webp", alt: "Milk-shake de morango em copo alto, decorado com morangos" },
  ],
  "fv-020": [
    { src: "/images/presets/forno-da-vila/cafe-coado-especial-1.webp", alt: "Café coado sendo servido em uma caneca" },
  ],
};
