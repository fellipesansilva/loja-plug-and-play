import type { Image, ImageSource } from "@/domain/types";

/**
 * Fotos reais (Unsplash e Pexels, licenças gratuitas), uma por produto e por categoria, mais o banner da home. Arquivos em
 * public/images/presets/orbita/; autor, licença e endereço de cada foto em IMAGE_CREDITS.md. Nenhuma foto mostra logo, nome ou
 * produto de marca real. O texto alternativo descreve o que a foto mostra.
 */
const DIR = "/images/presets/orbita";

const photo = (file: string, alt: string): Image => ({ src: `${DIR}/${file}.webp`, alt });

const candidates = (prefix: string, widths: number[], ext: "avif" | "webp") => widths.map((width) => ({ src: `${DIR}/${prefix}-${width}.${ext}`, width }));

const bannerSources: ImageSource[] = [
  { media: "(max-width: 767px)", sizes: "100vw", avif: candidates("banner-m", [480, 640, 768, 960], "avif"), webp: candidates("banner-m", [480, 640, 768, 960], "webp") },
  { media: "(min-width: 768px)", sizes: "100vw", avif: candidates("banner-d", [1280, 1920], "avif"), webp: candidates("banner-d", [1280, 1920], "webp") },
];

export const bannerImage: Image = {
  src: `${DIR}/banner.webp`,
  alt: "Fone de ouvido preto em pé sobre fundo amarelo, visto de frente",
  /** Recortes responsivos (celular 3:4 e desktop 16:9) em AVIF e WebP; `src` é o reserva (WebP de desktop). A foto da home é a do LCP: pré-carregada. */
  sources: bannerSources,
  preload: true,
};

export const categoryImages: Record<string, Image> = {
  audio: photo("categoria-audio", "Mesa de som com muitos controles deslizantes e botões, sob luz rosa e azul"),
  vestiveis: photo("categoria-vestiveis", "Pessoa tocando a tela de um smartwatch preto no pulso"),
  acessorios: photo("categoria-acessorios", "Conector USB-C de um cabo claro sobre fundo preto"),
};

/** Foto de cada produto, por id (a 1ª é a principal). */
export const productImages: Record<string, Image[]> = {
  "orb-001": [
    photo("fone-orbita-studio-anc-1", "Fone de ouvido over-ear preto sobre fundo amarelo, visto de cima"),
    photo("fone-orbita-studio-anc-2", "Fone de ouvido over-ear preto sobre fundo escuro, visto de cima"),
  ],
  "orb-002": [
    photo("fone-orbita-air-1", "Fone sem fio intra-auricular preto ao lado do estojo de recarga aberto, sob luz vermelha e azul"),
    photo("fone-orbita-air-2", "Par de fones sem fio pretos em frente ao estojo de recarga, sobre fundo vermelho"),
  ],
  "orb-003": [photo("caixa-de-som-orbita-pulse-1", "Caixa de som portátil branca com alça de couro sobre uma mesa de madeira")],
  "orb-004": [photo("soundbar-orbita-horizon-1", "Soundbar escura sob a TV, sobre um móvel de madeira")],
  "orb-005": [photo("microfone-orbita-cast-usb-1", "Microfone condensador preto com suporte anti-vibração e braço articulado, sobre fundo cinza")],
  "orb-006": [photo("fone-orbita-sport-1", "Mulher de tranças ajustando um fone intra-auricular preto na orelha")],
  "orb-007": [
    photo("smartwatch-orbita-s-1", "Smartwatch de tela quadrada com pulseira branca mostrando as 07:20"),
    photo("smartwatch-orbita-s-2", "Mulher de cachecol tocando um smartwatch claro no pulso, ao ar livre"),
  ],
  "orb-008": [photo("smartband-orbita-fit-1", "Pulso com uma pulseira inteligente preta em um campo, com montanhas ao fundo")],
  "orb-009": [
    photo("smartwatch-orbita-s-pro-1", "Smartwatch redondo de caixa escura no pulso, com o mostrador em preto e laranja"),
    photo("smartwatch-orbita-s-pro-2", "Mãos segurando um smartwatch redondo de caixa azul-escura e pulseira perfurada"),
  ],
  "orb-010": [photo("base-de-carga-orbita-sem-fio-1", "Base de carga sem fio redonda e branca sobre uma mesa de madeira")],
  "orb-011": [photo("carregador-orbita-gan-65-w-1", "Carregador de parede branco com cabo, sobre fundo amarelo")],
  "orb-012": [photo("cabo-orbita-usb-c-trancado-2-m-1", "Cabo USB-C trançado preto enrolado, com conectores dourados")],
  "orb-013": [photo("power-bank-orbita-20000-mah-1", "Bateria portátil de metal escuro com um cabo USB-C, sobre mármore")],
  "orb-014": [photo("capa-orbita-para-notebook-1", "Capa acolchoada cinza com um caderno e uma carteira rosa, sobre uma cadeira de madeira")],
  "orb-015": [photo("suporte-orbita-stand-aluminio-1", "Suporte de alumínio preto para celular e tablet, sobre fundo lilás")],
  "orb-016": [
    photo("hub-orbita-usb-7-portas-1", "Hub USB preto com sete portas e chaves individuais, sobre fundo branco"),
    photo("hub-orbita-usb-7-portas-2", "Detalhe do hub USB preto com um cabo trançado ligado a uma das portas"),
  ],
};
