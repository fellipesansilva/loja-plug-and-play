import type { Category, Product } from "@/domain/types";
import { attrs, slugify } from "../helpers";
import { photo } from "./images";

// Sem foto de categoria: a Arca entra por necessidade e setor (config.needs e config.sectors), não por tiles de categoria.
export const categories: Category[] = [
  { id: "industria-e-agro", slug: "industria-e-agro", name: "Indústria e agro" },
  { id: "eventos-e-marketing", slug: "eventos-e-marketing", name: "Eventos e marketing" },
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

type Extra = Pick<Product, "sectorSlugs" | "benefits">;

/** Setores (config.sectors) e benefícios com número de cada produto. Números de demonstração, não vinculam a empresa. */
const extras: Record<string, Extra> = {
  "arc-001": {
    sectorSlugs: ["agro", "oleo-e-gas", "defesa-civil-e-incendio"],
    benefits: [
      { value: "5 a 500 m³", label: "de capacidade, em um só reservatório" },
      { value: "2 h", label: "para instalar e começar a encher" },
      { value: "25 kg", label: "por reservatório de 10 m³, vazio" },
    ],
  },
  "arc-002": {
    sectorSlugs: ["agro", "defesa-civil-e-incendio"],
    benefits: [
      { value: "10 a 1.000 m³", label: "de capacidade, em lona sobre vala" },
      { value: "1 dia", label: "para forrar e encher a vala" },
      { value: "1,2 kg", label: "por m² de lona, para transportar" },
    ],
  },
  "arc-003": {
    sectorSlugs: ["construcao", "oleo-e-gas"],
    benefits: [
      { value: "50 kg a 25 t", label: "de empuxo por bolsa" },
      { value: "15 min", label: "para fixar e começar a içar" },
      { value: "8 kg", label: "a bolsa de 500 kg, dobrada" },
    ],
  },
  "arc-004": {
    sectorSlugs: ["construcao", "oleo-e-gas"],
    benefits: [
      { value: "500 kg a 35 t", label: "de carga de ensaio por saco" },
      { value: "20 min", label: "para montar e encher o ensaio" },
      { value: "12 kg", label: "o saco de 5 t, vazio" },
    ],
  },
  "arc-005": {
    sectorSlugs: ["agro", "oleo-e-gas", "defesa-civil-e-incendio"],
    benefits: [
      { value: "40 cm a 1,5 m", label: "de diâmetro, em cores vivas" },
      { value: "5 min", label: "para encher e lançar" },
      { value: "2 kg", label: "a boia de 60 cm, vazia" },
    ],
  },
  "arc-006": {
    sectorSlugs: ["oleo-e-gas", "defesa-civil-e-incendio"],
    benefits: [
      { value: "5 m", label: "por módulo, encadeável" },
      { value: "30 min", label: "para lançar 40 m de barreira" },
      { value: "6 kg", label: "por metro de módulo, vazio" },
    ],
  },
  "arc-007": {
    sectorSlugs: ["eventos-esportivos", "marketing"],
    benefits: [
      { value: "3 a 12 m", label: "de vão, com sua marca impressa" },
      { value: "10 min", label: "para uma pessoa montar" },
      { value: "40 kg", label: "o pórtico de 6 m, na mala" },
    ],
  },
  "arc-008": {
    sectorSlugs: ["marketing", "eventos-esportivos"],
    benefits: [
      { value: "3 a 10 m", label: "de comprimento, visível de longe" },
      { value: "20 min", label: "para duas pessoas montarem" },
      { value: "15 kg", label: "o blimp de 6 m, vazio" },
    ],
  },
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
    ...extras[i.id],
  };
}

export const products: Product[] = [
  item({
    id: "arc-001",
    name: "Reservatório Flexível Fechado",
    sku: "ARC-RFF-001",
    categoryId: "industria-e-agro",
    image: "reservatorio-flexivel-fechado",
    alt: "Reservatório flexível verde-escuro, em forma de almofada, apoiado no chão ao lado de uma pista",
    description:
      "Reservatório de lona que armazena água, combustível ou outros líquidos sem obra civil. Chega dobrado, é aberto sobre um terreno nivelado e enche pela válvula, com saída para mangote. Quando não é mais necessário, esvazia e volta para a caixa.",
    applications: ["Agro e irrigação", "Indústria e saneamento"],
    specs: {
      material: ["Material", "Poliéster com cobertura de PVC, costuras soldadas"],
      medidas: ["Medidas", "Sob medida, conforme o volume"],
      capacidade: ["Capacidade", "De 5 a 500 m³"],
      valvula: ["Válvulas", "Enchimento, saída para mangote e respiro"],
    },
  }),
  item({
    id: "arc-002",
    name: "Reservatório Aberto",
    sku: "ARC-RAB-002",
    categoryId: "industria-e-agro",
    image: "reservatorio-aberto",
    alt: "Lona azul-acinzentada estendida em uma vala retangular escavada em um campo gramado, antes de ser enchida",
    description:
      "Lona impermeável para forrar uma vala ou um tanque escavado e transformá-lo em reservatório de água, para irrigação, piscicultura ou reserva contra incêndio. Vem soldada no tamanho da vala, com ancoragem na borda.",
    applications: ["Agro e irrigação", "Indústria e saneamento"],
    specs: {
      material: ["Material", "PVC de alta resistência, soldado em fábrica"],
      medidas: ["Medidas", "Sob medida, conforme a vala"],
      capacidade: ["Capacidade", "De 10 a 1.000 m³"],
      valvula: ["Ancoragem", "Borda reforçada, com valeta de fixação"],
    },
  }),
  item({
    id: "arc-003",
    name: "Bolsa de Içamento",
    sku: "ARC-BIC-003",
    categoryId: "industria-e-agro",
    image: "bolsa-de-icamento",
    alt: "Bolsa de içamento amarela, em formato de gota, aberta no chão com alça e cabo azul",
    description:
      "Bolsa que se enche de ar para dar empuxo e erguer ou recolocar cargas submersas, com a força do ar e não do guindaste. Usada em resgate, obras portuárias e recuperação de equipamentos, vem com alças de içamento e válvula de alívio.",
    applications: ["Construção e içamento de cargas", "Náutica e demarcação"],
    specs: {
      material: ["Material", "Poliéster com cobertura de PVC, alças costuradas"],
      medidas: ["Medidas", "Conforme o empuxo desejado"],
      capacidade: ["Empuxo", "De 50 kg a 25 toneladas"],
      valvula: ["Válvulas", "Enchimento e alívio de pressão"],
    },
  }),
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
    alt: "Entrada inflável azul com estrelas e a palavra WELCOME, em frente a uma igreja, com visitantes ao redor",
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
