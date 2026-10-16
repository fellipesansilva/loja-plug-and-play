import type { Category, Product } from "@/domain/types";
import { attrs, slugify } from "../helpers";
import { categoryImages, photo } from "./images";

export const categories: Category[] = [
  { id: "industria-e-agro", slug: "industria-e-agro", name: "Indústria e agro", image: categoryImages["industria-e-agro"] },
  { id: "eventos-e-marketing", slug: "eventos-e-marketing", name: "Eventos e marketing", image: categoryImages["eventos-e-marketing"] },
];

type Input = {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  image: string;
  alt: string;
  description: string;
  applications: string[];
  specs: Record<string, [label: string, value: string]>;
};

/** Loja em orçamento: sem preço (0) e sem estoque (sob encomenda). Descrições escritas para o preset, sem texto de terceiros; só entram produtos com foto real. */
function item(i: Input): Product {
  return {
    id: i.id,
    slug: slugify(i.name),
    name: i.name,
    price: 0,
    images: [photo(i.image, i.alt)],
    description: i.description,
    sku: i.sku,
    stock: 0,
    categoryId: i.categoryId,
    attributes: attrs(i.specs),
    variants: [],
    applications: i.applications,
  };
}

export const products: Product[] = [
  item({
    id: "arc-004",
    name: "Saco para Teste de Carga",
    sku: "ARC-STC-004",
    categoryId: "industria-e-agro",
    image: "saco-para-teste-de-carga",
    alt: "Bolsa de água amarela, em formato de pera, pendurada por um guindaste ao lado de uma plataforma offshore, em um teste de carga",
    description:
      "Saco que se enche de água para simular peso em ensaios de guindastes, talhas, pontes e plataformas. A carga é ajustada pelo volume de água, e o saco esvazia no próprio local, sem pesos de concreto para transportar.",
    applications: ["Construção e içamento de cargas", "Indústria e saneamento"],
    specs: {
      material: ["Material", "Poliéster com cobertura de PVC, alças costuradas"],
      medidas: ["Medidas", "Sob medida, conforme a carga de ensaio"],
      capacidade: ["Capacidade", "De 500 kg a 35 toneladas"],
      valvula: ["Válvulas", "Enchimento e esvaziamento rápido"],
    },
  }),
  item({
    id: "arc-005",
    name: "Boia de Demarcação",
    sku: "ARC-BDM-005",
    categoryId: "industria-e-agro",
    image: "boia-de-demarcacao",
    alt: "Boia de sinalização vermelha flutuando sozinha em mar aberto, sob céu cinza",
    description:
      "Boia esférica para sinalizar áreas de trabalho, raias, tanques de piscicultura e limites de balneabilidade. Cores vivas, olhal de fundeio e haste opcional para bandeira ou refletivo. Pode levar a marca do cliente impressa.",
    applications: ["Náutica e demarcação", "Eventos e feiras"],
    specs: {
      material: ["Material", "Lona de PVC resistente a raios UV"],
      medidas: ["Medidas", "Diâmetros de 40 cm a 1,5 m"],
      capacidade: ["Flutuação", "Conforme o diâmetro e a carga de fundeio"],
      valvula: ["Válvulas", "Válvula de enchimento de baixo perfil"],
    },
  }),
  item({
    id: "arc-006",
    name: "Boia Cilíndrica",
    sku: "ARC-BCL-006",
    categoryId: "industria-e-agro",
    image: "boia-cilindrica",
    alt: "Fileira de boias amarelas alinhadas em diagonal sobre a água calma",
    description:
      "Boia em formato de cilindro para sustentar tubulações flutuantes, cabos e barreiras de contenção. Mais estável que a esférica em correnteza leve, e entregue com argolas nas pontas para encadear vários módulos.",
    applications: ["Náutica e demarcação", "Indústria e saneamento"],
    specs: {
      material: ["Material", "Lona de PVC com faixas de cor"],
      medidas: ["Medidas", "Sob medida (diâmetro × comprimento)"],
      capacidade: ["Flutuação", "Conforme o diâmetro e o comprimento"],
      valvula: ["Válvulas", "Duas válvulas de enchimento, uma em cada ponta"],
    },
  }),
  item({
    id: "arc-007",
    name: "Pórtico Inflável",
    sku: "ARC-PIN-007",
    categoryId: "eventos-e-marketing",
    image: "portico-inflavel",
    alt: "Arco inflável azul e vermelho com a palavra FINISH, visto de baixo contra o céu",
    description:
      "Arco inflável para largadas, chegadas e entradas de evento, com faixas laterais e espaço para a marca. Fica de pé com um ventilador contínuo e vem com estacas e sacos de lastro para fixar em grama ou asfalto.",
    applications: ["Eventos e feiras", "Publicidade e ações de marca"],
    specs: {
      material: ["Material", "Poliéster com cobertura de PVC, impressão digital"],
      medidas: ["Medidas", "Vão de 3 a 12 m, altura de 2,5 a 6 m"],
      capacidade: ["Montagem", "Uma pessoa, em cerca de 10 minutos"],
      valvula: ["Ar", "Ventilador contínuo de 110 V ou 220 V"],
    },
  }),
  item({
    id: "arc-008",
    name: "Blimp Inflável",
    sku: "ARC-BLI-008",
    categoryId: "eventos-e-marketing",
    image: "blimp-inflavel",
    alt: "Blimp azul, branco e amarelo visto de baixo, voando em céu limpo",
    description:
      "Balão em formato de dirigível, cheio de ar, para ficar preso no solo ou em telhados e chamar a atenção em lançamentos e inaugurações. A arte da marca é impressa no corpo, e o modelo vai com cabos de ancoragem e ventilador próprio.",
    applications: ["Publicidade e ações de marca", "Eventos e feiras"],
    specs: {
      material: ["Material", "Poliéster com cobertura de PVC, estampa digital"],
      medidas: ["Medidas", "Comprimento de 3 a 10 m"],
      capacidade: ["Montagem", "Duas pessoas, em cerca de 20 minutos"],
      valvula: ["Ar", "Ventilador contínuo, com cabos de ancoragem"],
    },
  }),
];
