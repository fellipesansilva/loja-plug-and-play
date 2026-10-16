import type { QuoteContact, QuoteRequest, QuoteRequestItem, QuoteStatus } from "@/domain/types";
import { products } from "./products";

function line(productId: string, qty: number, note: string): QuoteRequestItem {
  const p = products.find((x) => x.id === productId);
  if (!p) throw new Error(`Produto inexistente no preset: ${productId}`);
  return { productId: p.id, name: p.name, sku: p.sku, qty, note };
}

function quote(id: string, createdAt: string, status: QuoteStatus, items: QuoteRequestItem[], contact: QuoteContact, steps: [QuoteStatus, string][]): QuoteRequest {
  return { id, createdAt, status, items, contact, history: [{ status: "nova", at: createdAt }, ...steps.map(([s, at]) => ({ status: s, at }))] };
}

/** Solicitações de exemplo (pessoas e empresas fictícias), em status variados. */
export const quotes: QuoteRequest[] = [
  quote(
    "ORC-20260318-K7Q2X",
    "2026-03-18T10:15:00-03:00",
    "nova",
    [line("arc-001", 2, "Para água de irrigação, 20.000 litros cada. Terreno plano, acesso por caminhão."), line("arc-005", 6, "Cor laranja, 60 cm, com olhal.")],
    {
      name: "Marina Teixeira (demo)",
      company: "Fazenda Boa Água (fictícia)",
      email: "marina@example.com",
      whatsapp: "(19) 90000-0101",
      city: "Ribeirão Preto",
      state: "SP",
      application: "Agro e irrigação",
      message: "Preciso do prazo de produção e das condições de frete até a fazenda.",
    },
    [],
  ),
  quote(
    "ORC-20260316-M4N8B",
    "2026-03-16T15:40:00-03:00",
    "em_analise",
    [line("arc-007", 1, "Vão de 8 m, azul e amarelo, com a marca da prova na faixa de cima.")],
    {
      name: "Rafael Moura (demo)",
      company: "Corrida da Cidade (fictícia)",
      email: "rafael@example.com",
      whatsapp: "(11) 90000-0102",
      city: "São Paulo",
      state: "SP",
      application: "Eventos e feiras",
      message: "Evento em 45 dias. Precisamos de estacas para asfalto.",
    },
    [["em_analise", "2026-03-17T09:05:00-03:00"]],
  ),
  quote(
    "ORC-20260312-T9C3D",
    "2026-03-12T11:00:00-03:00",
    "orcamento_enviado",
    [line("arc-004", 3, "Ensaio de ponte rolante de 10 t, três sacos de 3,5 t."), line("arc-003", 1, "Içar um conjunto de 800 kg, 4 m de profundidade.")],
    {
      name: "Helena Prado (demo)",
      company: "Metalúrgica Prado (fictícia)",
      email: "helena@example.com",
      whatsapp: "(41) 90000-0103",
      city: "Curitiba",
      state: "PR",
      application: "Construção e içamento de cargas",
      message: "",
    },
    [["em_analise", "2026-03-13T08:30:00-03:00"], ["orcamento_enviado", "2026-03-14T16:20:00-03:00"]],
  ),
  quote(
    "ORC-20260305-P2L6V",
    "2026-03-05T09:25:00-03:00",
    "ganho",
    [line("arc-008", 1, "Blimp de 6 m para a inauguração, azul-petróleo e amarelo."), line("arc-010", 2, "Mascote da loja, 3 m de altura.")],
    {
      name: "Otávio Reis (demo)",
      company: "Supermercado Central (fictício)",
      email: "otavio@example.com",
      whatsapp: "(31) 90000-0104",
      city: "Belo Horizonte",
      state: "MG",
      application: "Publicidade e ações de marca",
      message: "Inauguração marcada para o mês que vem.",
    },
    [["em_analise", "2026-03-06T10:00:00-03:00"], ["orcamento_enviado", "2026-03-08T14:10:00-03:00"], ["ganho", "2026-03-11T11:45:00-03:00"]],
  ),
  quote(
    "ORC-20260302-W8H1Z",
    "2026-03-02T13:50:00-03:00",
    "perdido",
    [line("arc-002", 1, "Piscina de contenção de 8 m de diâmetro.")],
    {
      name: "Sérgio Lacerda (demo)",
      email: "sergio@example.com",
      whatsapp: "(21) 90000-0105",
      city: "Niterói",
      state: "RJ",
      application: "Indústria e saneamento",
      message: "",
    },
    [["em_analise", "2026-03-03T09:00:00-03:00"], ["perdido", "2026-03-09T17:30:00-03:00"]],
  ),
];
