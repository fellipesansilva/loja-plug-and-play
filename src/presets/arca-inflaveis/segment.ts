import type { CaseStudy, Need, Sector } from "@/domain/types";
import { photo } from "./images";

/** Entradas por necessidade, setor e projetos entregues da Arca. Textos de demonstração (fictícios). */
export const needs: Need[] = [
  {
    slug: "armazenar",
    label: "Armazenar",
    description: "Água, combustível e outros líquidos em reservatório de lona, sem obra civil.",
    image: photo("need-armazenar", "Reservatórios flexíveis bege enfileirados ao lado de um lago em terreno aberto"),
    productIds: ["arc-001", "arc-002"],
  },
  {
    slug: "icar-e-testar",
    label: "Içar e testar",
    description: "Sacos de carga para ensaiar guindastes e bolsas de içamento para erguer cargas submersas.",
    image: photo("need-icar", "Bolsa de içamento amarela dobrada, com alça e cabo, sobre um fundo escuro"),
    productIds: ["arc-004", "arc-003"],
  },
  {
    slug: "sinalizar",
    label: "Sinalizar",
    description: "Boias esféricas e cilíndricas para demarcar áreas, sustentar linhas e conter derrames.",
    image: photo("need-sinalizar", "Barreiras de contenção flutuantes rebocadas em mar aberto por barcos de pesca"),
    productIds: ["arc-005", "arc-006"],
  },
  {
    slug: "divulgar-sua-marca",
    label: "Divulgar sua marca",
    description: "Pórticos e blimps com a sua arte impressa, para largadas, inaugurações e lançamentos.",
    image: photo("need-divulgar", "Arco inflável azul e vermelho com a palavra FINISH, visto de baixo"),
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
    caseId: "case-contencao",
  },
  {
    slug: "defesa-civil-e-incendio",
    label: "Defesa civil e incêndio",
    description: "Reservas de água de emergência montadas em minutos, onde o hidrante não chega.",
    image: photo("setor-defesa-civil", "Tanques portáteis laranja de combate a incêndio armados em uma floresta de pinheiros"),
    productIds: ["arc-001", "arc-002", "arc-006"],
    caseId: "case-defesa-civil",
  },
  {
    slug: "eventos-esportivos",
    label: "Eventos esportivos",
    description: "Pórticos de largada e chegada que montam rápido e voltam na mala.",
    image: photo("setor-eventos-esportivos", "Arco inflável vermelho de largada e chegada em uma praça, com um participante ao fundo"),
    productIds: ["arc-007", "arc-008"],
    caseId: "case-eventos",
  },
  {
    slug: "marketing",
    label: "Marketing",
    description: "Blimps e pórticos com a sua marca, vistos de longe em lançamentos e inaugurações.",
    image: photo("setor-marketing", "Blimp azul, branco e amarelo, visto de baixo, em céu limpo"),
    productIds: ["arc-008", "arc-007"],
    caseId: "case-marketing",
  },
];

/** Projetos de demonstração: clientes, cidades e resultados fictícios. */
export const cases: CaseStudy[] = [
  {
    id: "case-agro",
    title: "Reservatório de irrigação para a safra",
    city: "Ribeirão Preto/SP",
    productId: "arc-001",
    result: "120 mil litros armazenados e instalados em dois dias, sem obra.",
    image: photo("case-agro", "Vista aérea de um reservatório de água de formato irregular, forrado de verde, em meio a campos"),
    sectorSlug: "agro",
  },
  {
    id: "case-icamento",
    title: "Ensaio de ponte rolante de 10 t",
    city: "Santos/SP",
    productId: "arc-004",
    result: "Ponte testada com 12 t de água, sem transportar pesos de concreto.",
    image: photo("case-icamento", "Bolsa bege de içamento sendo manejada por mergulhadores na superfície da água"),
    sectorSlug: "construcao",
  },
  {
    id: "case-eventos",
    title: "Pórtico de largada de meia maratona",
    city: "Curitiba/PR",
    productId: "arc-007",
    result: "Montado por duas pessoas em 25 minutos e reaproveitado em três etapas.",
    image: photo("case-eventos", "Entrada inflável azul com estrelas e a palavra WELCOME, em frente a uma igreja"),
    sectorSlug: "eventos-esportivos",
  },
  {
    id: "case-contencao",
    title: "Barreira de contenção em terminal",
    city: "Macaé/RJ",
    productId: "arc-006",
    result: "40 m de barreira lançados em 30 minutos, em módulos encadeados.",
    image: photo("need-sinalizar", "Barreiras de contenção flutuantes rebocadas em mar aberto"),
    sectorSlug: "oleo-e-gas",
  },
  {
    id: "case-defesa-civil",
    title: "Reserva de água para brigada de incêndio",
    city: "Campos do Jordão/SP",
    productId: "arc-001",
    result: "Reserva de 20 mil litros montada em duas horas, perto da frente de trabalho.",
    image: photo("setor-defesa-civil", "Tanques portáteis laranja armados em uma floresta de pinheiros"),
    sectorSlug: "defesa-civil-e-incendio",
  },
  {
    id: "case-marketing",
    title: "Blimp de inauguração de loja",
    city: "Goiânia/GO",
    productId: "arc-008",
    result: "Blimp de 6 m montado em 20 minutos e visto a mais de 500 m.",
    image: photo("setor-marketing", "Blimp azul, branco e amarelo em céu limpo"),
    sectorSlug: "marketing",
  },
];
