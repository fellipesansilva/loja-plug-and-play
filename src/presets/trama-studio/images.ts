import type { Image } from "@/domain/types";

/**
 * Fotos reais (Unsplash, licença gratuita). Arquivos em public/images/presets/trama-studio/ e créditos em
 * IMAGE_CREDITS.md. O texto alternativo descreve o que a foto mostra. Gerado a partir da curadoria de imagens da F1.
 */
export const bannerImage: Image = { src: "/images/presets/trama-studio/banner.webp", alt: "Mulher de vestido longo claro em um campo, com luz natural do fim de tarde" };

export const categoryImages: Record<string, Image> = {
  "feminino": { src: "/images/presets/trama-studio/vestido-midi-linho-3.webp", alt: "Vestido branco leve ao vento em uma praia" },
  "masculino": { src: "/images/presets/trama-studio/camisa-linho-manga-longa-1.webp", alt: "Camisa de linho azul-marinho de manga longa, pendurada" },
  "acessorios": { src: "/images/presets/trama-studio/categoria-acessorios.webp", alt: "Detalhe de cinto de couro marrom com fivela prateada" },
};

/** Fotos por id de produto (a 1ª é a principal). */
export const productImages: Record<string, Image[]> = {
  "ts-001": [
    { src: "/images/presets/trama-studio/vestido-midi-linho-1.webp", alt: "Vestido de linho bege sem mangas, visto de frente" },
    { src: "/images/presets/trama-studio/vestido-midi-linho-2.webp", alt: "Vestido solto de linho rosado com mangas bufantes, visto de costas" },
    { src: "/images/presets/trama-studio/vestido-midi-linho-3.webp", alt: "Vestido branco leve ao vento em uma praia" },
  ],
  "ts-002": [
    { src: "/images/presets/trama-studio/blusa-cropped-algodao-1.webp", alt: "Blusa cropped branca de alças usada com calça verde" },
    { src: "/images/presets/trama-studio/blusa-cropped-algodao-2.webp", alt: "Blusa branca de tecido leve, detalhe da frente" },
    { src: "/images/presets/trama-studio/blusa-cropped-algodao-3.webp", alt: "Camiseta branca e saia preta, vistas de costas" },
  ],
  "ts-003": [
    { src: "/images/presets/trama-studio/calca-alfaiataria-1.webp", alt: "Calça de alfaiataria azul-marinho em manequim" },
    { src: "/images/presets/trama-studio/calca-alfaiataria-2.webp", alt: "Calça ampla de linho vermelha" },
    { src: "/images/presets/trama-studio/calca-alfaiataria-3.webp", alt: "Calça de corte reto verde-oliva, vista da cintura para baixo" },
  ],
  "ts-004": [
    { src: "/images/presets/trama-studio/saia-plissada-1.webp", alt: "Saia plissada clara combinada com blusa preta, junto ao mar" },
  ],
  "ts-005": [
    { src: "/images/presets/trama-studio/camisa-oversized-1.webp", alt: "Camisa branca ampla usada com jaqueta preta" },
  ],
  "ts-006": [
    { src: "/images/presets/trama-studio/cardigan-trico-1.webp", alt: "Cardigan de tricô mostarda com botões, detalhe da frente" },
  ],
  "ts-007": [
    { src: "/images/presets/trama-studio/macacao-utilitario-1.webp", alt: "Macacão azul sem mangas em um campo de girassóis" },
  ],
  "ts-008": [
    { src: "/images/presets/trama-studio/camiseta-basica-pima-1.webp", alt: "Camiseta branca de gola redonda pendurada em fundo escuro" },
    { src: "/images/presets/trama-studio/camiseta-basica-pima-2.webp", alt: "Camiseta branca básica em cabide de madeira" },
    { src: "/images/presets/trama-studio/camiseta-basica-pima-3.webp", alt: "Camisetas de várias cores penduradas em arara" },
  ],
  "ts-009": [
    { src: "/images/presets/trama-studio/camisa-linho-manga-longa-1.webp", alt: "Camisa de linho azul-marinho de manga longa, pendurada" },
    { src: "/images/presets/trama-studio/camisa-linho-manga-longa-2.webp", alt: "Detalhe de camisa listrada azul e branca com botões" },
    { src: "/images/presets/trama-studio/camisa-linho-manga-longa-3.webp", alt: "Camisa de linho clara pendurada em varal" },
  ],
  "ts-010": [
    { src: "/images/presets/trama-studio/calca-chino-1.webp", alt: "Calça chino bege, vista da cintura para baixo" },
  ],
  "ts-011": [
    { src: "/images/presets/trama-studio/bermuda-sarja-1.webp", alt: "Homem caminhando na praia de bermuda cinza-claro e camiseta branca" },
  ],
  "ts-012": [
    { src: "/images/presets/trama-studio/jaqueta-jeans-1.webp", alt: "Jaqueta jeans de lavagem clara pendurada em uma porta branca" },
  ],
  "ts-013": [
    { src: "/images/presets/trama-studio/polo-piquet-1.webp", alt: "Camisa polo branca pendurada em cabide" },
  ],
  "ts-014": [
    { src: "/images/presets/trama-studio/bolsa-tote-couro-1.webp", alt: "Bolsa tote de couro caramelo com alças longas" },
  ],
  "ts-015": [
    { src: "/images/presets/trama-studio/cinto-couro-1.webp", alt: "Cintos de couro marrom trançado com fivela metálica" },
  ],
  "ts-016": [
    { src: "/images/presets/trama-studio/lenco-de-seda-1.webp", alt: "Tecido de seda branco com dobras suaves" },
  ],
  "ts-017": [
    { src: "/images/presets/trama-studio/chapeu-de-palha-1.webp", alt: "Chapéus de palha de aba média empilhados" },
  ],
  "ts-018": [
    { src: "/images/presets/trama-studio/brinco-argola-1.webp", alt: "Par de brincos de argola dourados trançados sobre pedras brancas" },
  ],
};
