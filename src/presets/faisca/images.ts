import type { Image, ImageSource } from "@/domain/types";

/**
 * Fotos reais (Unsplash, licença gratuita), uma por curso e por categoria, mais o banner da home. Arquivos em
 * public/images/presets/faisca/; autor, licença e endereço de cada foto em IMAGE_CREDITS.md. O texto alternativo descreve o que a foto mostra.
 */
const DIR = "/images/presets/faisca";

const photo = (file: string, alt: string): Image => ({ src: `${DIR}/${file}.webp`, alt });

const candidates = (prefix: string, widths: number[], ext: "avif" | "webp") => widths.map((width) => ({ src: `${DIR}/${prefix}-${width}.${ext}`, width }));

const bannerSources: ImageSource[] = [
  { media: "(max-width: 767px)", sizes: "100vw", avif: candidates("banner-m", [480, 640, 768, 960], "avif"), webp: candidates("banner-m", [480, 640, 768, 960], "webp") },
  { media: "(min-width: 768px)", sizes: "100vw", avif: candidates("banner-d", [1280, 1920], "avif"), webp: candidates("banner-d", [1280, 1920], "webp") },
];

export const bannerImage: Image = {
  src: `${DIR}/banner.webp`,
  alt: "Mulher de óculos mordendo um lápis, concentrada diante de um notebook, com lápis de cor em um pote à frente",
  /** Recortes responsivos (celular 3:4 e desktop 16:9) em AVIF e WebP; `src` é o reserva (WebP de desktop). A foto da home é a do LCP: pré-carregada. */
  sources: bannerSources,
  preload: true,
};

export const categoryImages: Record<string, Image> = {
  criatividade: photo("categoria-criatividade", "Caderno de desenho em espiral em branco ao lado de aquarelas e pincéis sobre uma mesa de madeira"),
  tecnologia: photo("categoria-tecnologia", "Notebook com código na tela e uma caneca de café sobre uma mesa de madeira"),
  "carreira-e-dinheiro": photo("categoria-carreira-e-dinheiro", "Planilhas de orçamento impressas e uma caneta dourada sobre uma mesa clara"),
};

/** Foto de cada curso, por id de produto. */
export const productImages: Record<string, Image[]> = {
  "fs-001": [photo("fotografia-com-o-celular-1", "Mão segurando um celular que fotografa um lago cercado de montanhas, com o céu refletido na água")],
  "fs-002": [photo("desenho-do-zero-1", "Caderno de desenho de espiral aberto com o esboço de uma borboleta, ao lado de folhas secas sobre madeira")],
  "fs-003": [photo("violao-para-iniciantes-1", "Pessoa tocando violão perto de uma janela, em foto de perto do braço e do corpo do instrumento")],
  "fs-004": [photo("logica-de-programacao-1", "Notebook aberto com código na tela, fones de ouvido, celular e bloco de notas sobre uma mesa de madeira")],
  "fs-005": [photo("planilhas-que-trabalham-por-voce-1", "Notebook mostrando um painel com gráficos de área e de barras sobre uma mesa de vidro")],
  "fs-006": [photo("financas-pessoais-sem-complicacao-1", "Pote de vidro com moedas e uma plantinha brotando, sobre uma mesa de madeira")],
  "fs-007": [photo("ingles-para-viagens-1", "Câmera analógica, passaporte e folhas secas sobre um mapa-múndi colorido")],
};
