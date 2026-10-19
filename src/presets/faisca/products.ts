import type { Category, Product } from "@/domain/types";
import { attrs, placeholderImage, slugify } from "../helpers";
import { courses } from "./courses";
import { categoryImages, productImages } from "./images";

const C = "3b2fb5";

export const categories: Category[] = [
  { id: "criatividade", slug: "criatividade", name: "Criatividade", image: categoryImages["criatividade"] ?? placeholderImage("Criatividade", C, "Cursos de criatividade") },
  { id: "tecnologia", slug: "tecnologia", name: "Tecnologia", image: categoryImages["tecnologia"] ?? placeholderImage("Tecnologia", C, "Cursos de tecnologia") },
  { id: "carreira-e-dinheiro", slug: "carreira-e-dinheiro", name: "Carreira e dinheiro", image: categoryImages["carreira-e-dinheiro"] ?? placeholderImage("Carreira e dinheiro", C, "Cursos de carreira, dinheiro e idiomas") },
];

type CursoInput = { id: string; name: string; price: number; sku: string; categoryId: string; nivel: string; description: string; badges?: string[] };

/** Curso = produto digital (sem estoque nem frete) com o conteúdo em `course`. */
function curso(input: CursoInput): Product {
  const course = courses[input.id];
  if (!course) throw new Error(`Curso sem conteúdo no preset: ${input.id}`);
  return {
    id: input.id,
    slug: slugify(input.name),
    type: "digital",
    name: input.name,
    price: input.price,
    images: productImages[input.id] ?? [placeholderImage(input.name, C)],
    description: input.description,
    sku: input.sku,
    stock: 0,
    categoryId: input.categoryId,
    attributes: attrs({ nivel: ["Nível", input.nivel] }),
    variants: [],
    ...(input.badges ? { badges: input.badges } : {}),
    course,
  };
}

export const products: Product[] = [
  curso({
    id: "fs-001", name: "Fotografia com o Celular", price: 12900, sku: "FS-FOTO", categoryId: "criatividade", nivel: "Iniciante",
    badges: ["Mais vendido"],
    description: "Luz, enquadramento e edição leve para fazer fotos melhores com o aparelho que você já tem no bolso.",
  }),
  curso({
    id: "fs-002", name: "Desenho do Zero", price: 14900, sku: "FS-DESE", categoryId: "criatividade", nivel: "Iniciante",
    description: "Formas, proporção, luz e sombra: aprenda a desenhar o que você vê, com poucos materiais e quinze minutos por dia.",
  }),
  curso({
    id: "fs-003", name: "Violão para Iniciantes", price: 16900, sku: "FS-VIOL", categoryId: "criatividade", nivel: "Iniciante",
    description: "Afinação, primeiros acordes, ritmo e a sua primeira música, em um plano de prática que cabe na rotina.",
  }),
  curso({
    id: "fs-004", name: "Lógica de Programação", price: 19900, sku: "FS-LOGI", categoryId: "tecnologia", nivel: "Iniciante",
    badges: ["Novo"],
    description: "Variáveis, decisões, repetições e funções, sem linguagem difícil: a base para aprender qualquer tecnologia depois.",
  }),
  curso({
    id: "fs-005", name: "Planilhas que Trabalham por Você", price: 13900, sku: "FS-PLAN", categoryId: "tecnologia", nivel: "Intermediário",
    description: "Fórmulas, buscas, gráficos e tabelas para automatizar a rotina e entender os seus números.",
  }),
  curso({
    id: "fs-006", name: "Finanças Pessoais sem Complicação", price: 11900, sku: "FS-FINA", categoryId: "carreira-e-dinheiro", nivel: "Iniciante",
    badges: ["Mais vendido"],
    description: "Diagnóstico, orçamento, reserva de emergência e saída das dívidas, em passos curtos e práticos.",
  }),
  curso({
    id: "fs-007", name: "Inglês para Viagens", price: 15900, sku: "FS-INGL", categoryId: "carreira-e-dinheiro", nivel: "Iniciante",
    description: "Frases e vocabulário para aeroporto, hotel, restaurante e imprevistos, com treino de fala em cada aula.",
  }),
];
