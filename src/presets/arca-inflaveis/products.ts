import type { Category, Product } from "@/domain/types";
import { attrs, slugify } from "../helpers";
import { art, categoryImages } from "./images";

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

/** Loja em orçamento: sem preço (0) e sem estoque (sob encomenda). Descrições escritas para o preset, sem texto de terceiros. */
function item(i: Input): Product {
  return {
    id: i.id,
    slug: slugify(i.name),
    name: i.name,
    price: 0,
    images: [art(i.image, i.alt)],
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
    id: "arc-001",
    name: "Reservatório Flexível Fechado",
    sku: "ARC-RFF-001",
    categoryId: "industria-e-agro",
    image: "reservatorio-flexivel-fechado",
    alt: "Ilustração de um reservatório flexível fechado, em formato de almofada, com válvula de enchimento",
    description:
      "Tanque de lona de PVC com costuras soldadas, fechado, para armazenar água, efluentes ou líquidos de processo. Vazio, dobra e cabe em um caminhão leve, o que ajuda em obras, fazendas e plantas temporárias. Fabricado na medida do volume e do fluido informados.",
    applications: ["Agro e irrigação", "Indústria e saneamento"],
    specs: {
      material: ["Material", "Lona de PVC, 900 g/m²"],
      medidas: ["Medidas", "Sob medida (comprimento × largura × altura)"],
      capacidade: ["Capacidade", "De 1.000 a 200.000 litros"],
      valvula: ["Válvulas", "Enchimento, saída e respiro, em aço inox ou PVC"],
    },
  }),
  item({
    id: "arc-002",
    name: "Reservatório Aberto",
    sku: "ARC-RAB-002",
    categoryId: "industria-e-agro",
    image: "reservatorio-aberto",
    alt: "Ilustração de um reservatório flexível aberto, com bordas infladas e água dentro",
    description:
      "Piscina flexível de bordas infladas, aberta na parte de cima, para reserva de água, tratamento e contenção temporária. Monta em poucos minutos sobre solo nivelado e protegido, e a borda inflada mantém a forma mesmo com o nível baixo.",
    applications: ["Agro e irrigação", "Indústria e saneamento", "Construção e içamento de cargas"],
    specs: {
      material: ["Material", "Lona de PVC reforçada, com borda inflável"],
      medidas: ["Medidas", "Sob medida (diâmetro ou lados × altura)"],
      capacidade: ["Capacidade", "De 500 a 100.000 litros"],
      valvula: ["Válvulas", "Enchimento da borda e dreno de fundo"],
    },
  }),
  item({
    id: "arc-003",
    name: "Bolsa de Içamento",
    sku: "ARC-BIC-003",
    categoryId: "industria-e-agro",
    image: "bolsa-de-icamento",
    alt: "Ilustração de uma bolsa de içamento pendurada por quatro estropos em um gancho",
    description:
      "Bolsa inflável de lona que levanta peças submersas com o ar injetado, sem guindaste sobre a água. Sai com estropos e argola de içamento dimensionados para a carga que o cliente informa, com válvula de alívio para a descida controlada.",
    applications: ["Náutica e demarcação", "Construção e içamento de cargas"],
    specs: {
      material: ["Material", "Tecido de poliéster com cobertura de PVC"],
      medidas: ["Medidas", "Sob medida, conforme a carga"],
      capacidade: ["Capacidade", "De 50 kg a 20 toneladas de empuxo"],
      valvula: ["Válvulas", "Entrada de ar e válvula de alívio"],
    },
  }),
  item({
    id: "arc-004",
    name: "Saco para Teste de Carga",
    sku: "ARC-STC-004",
    categoryId: "industria-e-agro",
    image: "saco-para-teste-de-carga",
    alt: "Ilustração de um saco de água para teste de carga, em formato de pera, com alça superior",
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
    alt: "Ilustração de uma boia esférica de demarcação flutuando na água, com bandeira",
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
    alt: "Ilustração de uma boia cilíndrica inflável com faixas, flutuando na água",
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
    alt: "Ilustração de um pórtico inflável em arco, com faixas de cor de destaque",
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
    image: "blimp",
    alt: "Ilustração de um blimp, balão dirigível inflável, com leme e gôndola",
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
  item({
    id: "arc-009",
    name: "Réplica Inflável",
    sku: "ARC-RIN-009",
    categoryId: "eventos-e-marketing",
    image: "replica-inflavel",
    alt: "Ilustração de uma réplica inflável de uma lata gigante, para ações de marca",
    description:
      "Versão ampliada de um produto ou embalagem do cliente, feita sob medida a partir de fotos e medidas. Usada em pontos de venda, feiras e vitrines. A impressão acompanha as cores da marca e o acabamento é revisado com o cliente antes da produção.",
    applications: ["Publicidade e ações de marca", "Eventos e feiras"],
    specs: {
      material: ["Material", "Poliéster com cobertura de PVC, impressão digital"],
      medidas: ["Medidas", "Sob medida, de 1 a 8 m de altura"],
      capacidade: ["Montagem", "Uma pessoa, com ventilador contínuo"],
      valvula: ["Ar", "Ventilador contínuo de 110 V ou 220 V"],
    },
  }),
  item({
    id: "arc-010",
    name: "Inflável Temático",
    sku: "ARC-ITE-010",
    categoryId: "eventos-e-marketing",
    image: "inflavel-tematico",
    alt: "Ilustração de um inflável temático em formato de foguete, para eventos",
    description:
      "Figura inflável decorativa (foguete, mascote, animal ou o tema que o evento pedir), desenhada a partir de um briefing. Serve para festas, vitrines, escolas e ações promocionais, e é entregue com ventilador, estacas e bolsa de transporte.",
    applications: ["Eventos e feiras", "Publicidade e ações de marca"],
    specs: {
      material: ["Material", "Poliéster com cobertura de PVC"],
      medidas: ["Medidas", "Sob medida, de 2 a 8 m de altura"],
      capacidade: ["Montagem", "Uma pessoa, em cerca de 15 minutos"],
      valvula: ["Ar", "Ventilador contínuo, bolsa de transporte incluída"],
    },
  }),
];
