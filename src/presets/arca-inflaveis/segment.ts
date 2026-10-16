import type { CaseStudy, Need, Sector } from "@/domain/types";
import { photo } from "./images";

/** Entradas por necessidade, setor e projetos entregues da Arca. Textos de demonstração (fictícios). */
export const needs: Need[] = [
  {
    slug: "armazenar",
    label: "Armazenar",
    description: "Água, combustível e outros líquidos em reservatório de lona, sem obra civil.",
    productIds: ["arc-001", "arc-002"],
  },
  {
    slug: "icar-e-testar",
    label: "Içar e testar",
    description: "Sacos de carga para ensaiar guindastes e bolsas de içamento para erguer cargas submersas.",
    productIds: ["arc-004", "arc-003"],
  },
  {
    slug: "sinalizar",
    label: "Sinalizar",
    description: "Boias esféricas e cilíndricas para demarcar áreas, sustentar linhas e conter derrames.",
    productIds: ["arc-005", "arc-006"],
  },
  {
    slug: "divulgar-sua-marca",
    label: "Divulgar sua marca",
    description: "Pórticos e blimps com a sua arte impressa, para largadas, inaugurações e lançamentos.",
    productIds: ["arc-007", "arc-008"],
  },
];

export const sectors: Sector[] = [
  {
    slug: "agro",
    label: "Agro",
    description: "Água para irrigação e criação, armazenada onde a lavoura precisa.",
    image: photo("setor-agro", "Vista aérea de um grande reservatório de irrigação revestido, cercado de lavouras"),
    productIds: ["arc-001", "arc-002", "arc-005"],
    caseId: "case-agro",
  },
  {
    slug: "construcao",
    label: "Construção",
    description: "Ensaio de carga para guindastes e pontes rolantes, e içamento de peças pesadas.",
    image: photo("setor-construcao", "Carga suspensa por um guindaste ao lado de um edifício em construção, contra o céu azul"),
    productIds: ["arc-004", "arc-003"],
    caseId: "case-icamento",
  },
  {
    slug: "oleo-e-gas",
    label: "Óleo e gás",
    description: "Teste de carga, barreiras de contenção e armazenamento em operações offshore e onshore.",
    image: photo("setor-oleo-e-gas", "Plataformas de petróleo no mar, com barco de apoio e céu com nuvens"),
    productIds: ["arc-004", "arc-003", "arc-006", "arc-001"],
    caseId: "case-icamento",
  },
  {
    slug: "defesa-civil-e-incendio",
    label: "Defesa civil e incêndio",
    description: "Reservas de água de emergência montadas em minutos, onde o hidrante não chega.",
    image: photo("setor-defesa-civil", "Tanques portáteis laranja de combate a incêndio armados em uma floresta de pinheiros"),
    productIds: ["arc-001", "arc-002", "arc-006"],
    caseId: "case-agro",
  },
  {
    slug: "eventos-esportivos",
    label: "Eventos esportivos",
    description: "Pórticos de largada e chegada que montam rápido e voltam na mala.",
    image: photo("setor-eventos-esportivos", "Arco inflável azul com a palavra START, visto de baixo, diante de pinheiros"),
    productIds: ["arc-007", "arc-008"],
    caseId: "case-eventos",
  },
  {
    slug: "marketing",
    label: "Marketing",
    description: "Blimps e pórticos com a sua marca, vistos de longe em lançamentos e inaugurações.",
    image: photo("setor-marketing", "Blimp azul e amarelo, visto de baixo, em céu azul"),
    productIds: ["arc-008", "arc-007"],
    caseId: "case-eventos",
  },
];

/** Projetos de demonstração: clientes, cidades e resultados fictícios. Cada projeto tem foto própria, que não aparece em outro lugar. */
export const cases: CaseStudy[] = [
  {
    id: "case-agro",
    title: "Reserva de água para a lavoura e a brigada",
    city: "Ribeirão Preto/SP",
    productId: "arc-001",
    result: "120 mil litros armazenados em dois dias, sem obra, para irrigação e reserva de incêndio.",
    image: photo("case-agro", "Vista aérea de um reservatório de água de formato irregular, de água verde, em meio a campos"),
    sectorSlug: "agro",
  },
  {
    id: "case-icamento",
    title: "Ensaio de guindaste de 20 t",
    city: "Santos/SP",
    productId: "arc-004",
    result: "Guindaste testado com 22 t de água, sem transportar pesos de concreto.",
    image: photo("case-icamento", "Guindastes de torre amarelos em uma obra, com os braços estendidos contra o céu claro"),
    sectorSlug: "construcao",
  },
  {
    id: "case-eventos",
    title: "Pórtico de largada de meia maratona",
    city: "Curitiba/PR",
    productId: "arc-007",
    result: "Montado por duas pessoas em 25 minutos e reaproveitado em três etapas.",
    image: photo("case-eventos", "Arco inflável azul e vermelho com a palavra FINISH, visto de baixo contra o céu"),
    sectorSlug: "eventos-esportivos",
  },
];
