import type { Category, Product } from "@/domain/types";
import { attrs, gridVariants, placeholderImage, product } from "../helpers";

// Órbita é uma marca fictícia de eletrônicos premium (demonstração). Sem fotos: as imagens são placeholders locais até haver foto licenciada
// para a categoria (ver IMAGE_CREDITS.md).
const C = "2a3340";

export const categories: Category[] = [
  { id: "audio", slug: "audio", name: "Áudio", image: placeholderImage("Áudio", C, "Fones, caixas de som e microfones") },
  { id: "vestiveis", slug: "vestiveis", name: "Vestíveis", image: placeholderImage("Vestíveis", C, "Relógios e pulseiras inteligentes") },
  { id: "acessorios", slug: "acessorios", name: "Acessórios", image: placeholderImage("Acessórios", C, "Carregadores, cabos e suportes") },
];

const grafite = { name: "Grafite", code: "GF" };
const prata = { name: "Prata", code: "PR" };
const branco = { name: "Branco", code: "BR" };
const padrao = ["Padrão"];

export const products: Product[] = [
  product({
    id: "orb-001", name: "Fone Órbita Studio ANC", price: 129900, sku: "ORB-FST", categoryId: "audio", color: C,
    description: "Fone over-ear com cancelamento ativo de ruído e até 40 horas de bateria.",
    attributes: attrs({ conexao: ["Conexão", "Bluetooth 5.3"], bateria: ["Bateria", "40 h"] }),
    variants: gridVariants("ORB-FST", ["Lite", "Pro"], [grafite, prata], () => 5),
  }),
  product({
    id: "orb-002", name: "Fone Órbita Air", price: 59900, sku: "ORB-FAR", categoryId: "audio", color: C,
    description: "Fone intra-auricular sem fio com estojo de recarga e resistência à água.",
    attributes: attrs({ conexao: ["Conexão", "Bluetooth 5.3"], bateria: ["Bateria", "28 h com o estojo"] }),
    variants: gridVariants("ORB-FAR", padrao, [grafite, branco], () => 8),
  }),
  product({
    id: "orb-003", name: "Caixa de Som Órbita Pulse", price: 44900, sku: "ORB-CPL", categoryId: "audio", color: C, stock: 14,
    description: "Caixa de som portátil com graves reforçados e proteção contra respingos.",
    attributes: attrs({ conexao: ["Conexão", "Bluetooth 5.3"], bateria: ["Bateria", "18 h"] }),
  }),
  product({
    id: "orb-004", name: "Soundbar Órbita Horizon", price: 189900, sku: "ORB-SHZ", categoryId: "audio", color: C, stock: 6,
    description: "Soundbar 3.1 com subwoofer sem fio e entrada HDMI eARC.",
    attributes: attrs({ conexao: ["Conexão", "HDMI eARC, Bluetooth 5.3"], garantia: ["Garantia", "12 meses"] }),
  }),
  product({
    id: "orb-005", name: "Microfone Órbita Cast USB", price: 34900, sku: "ORB-MCT", categoryId: "audio", color: C, stock: 11,
    description: "Microfone condensador USB com suporte e filtro anti-pop para gravação e chamadas.",
    attributes: attrs({ conexao: ["Conexão", "USB-C"], garantia: ["Garantia", "12 meses"] }),
  }),
  product({
    id: "orb-006", name: "Fone Órbita Sport", price: 27900, sku: "ORB-FSP", categoryId: "audio", color: C, stock: 0,
    description: "Fone esportivo com gancho de orelha e resistência a suor. Esgotado.",
    attributes: attrs({ conexao: ["Conexão", "Bluetooth 5.2"], bateria: ["Bateria", "12 h"] }),
  }),
  product({
    id: "orb-007", name: "Smartwatch Órbita S", price: 119900, sku: "ORB-SWS", categoryId: "vestiveis", color: C,
    description: "Smartwatch com tela AMOLED, GPS e monitoramento de saúde.",
    attributes: attrs({ conexao: ["Conexão", "Bluetooth 5.3, GPS"], bateria: ["Bateria", "7 dias"] }),
    variants: gridVariants("ORB-SWS", ["41mm", "45mm"], [grafite, prata], () => 4),
  }),
  product({
    id: "orb-008", name: "Smartband Órbita Fit", price: 24900, sku: "ORB-SBF", categoryId: "vestiveis", color: C, stock: 20,
    description: "Pulseira inteligente com monitor de sono e frequência cardíaca.",
    attributes: attrs({ conexao: ["Conexão", "Bluetooth 5.2"], bateria: ["Bateria", "14 dias"] }),
  }),
  product({
    id: "orb-009", name: "Smartwatch Órbita S Pro", price: 199900, sku: "ORB-SWP", categoryId: "vestiveis", color: C,
    description: "Smartwatch com caixa de titânio, safira e mapas offline.",
    attributes: attrs({ conexao: ["Conexão", "Bluetooth 5.3, GPS, eSIM"], bateria: ["Bateria", "10 dias"] }),
    variants: gridVariants("ORB-SWP", ["45mm", "49mm"], [grafite, prata], () => 2),
  }),
  product({
    id: "orb-010", name: "Dock de Carga Órbita 3 em 1", price: 34900, sku: "ORB-DCG", categoryId: "vestiveis", color: C, stock: 9,
    description: "Base de carregamento sem fio para celular, relógio e fones.",
    attributes: attrs({ conexao: ["Conexão", "USB-C"], garantia: ["Garantia", "12 meses"] }),
  }),
  product({
    id: "orb-011", name: "Carregador Órbita GaN 65 W", price: 21900, sku: "ORB-CGN", categoryId: "acessorios", color: C, stock: 25,
    description: "Carregador rápido de duas portas com tecnologia GaN, compacto para viagem.",
    attributes: attrs({ conexao: ["Conexão", "USB-C PD"], garantia: ["Garantia", "12 meses"] }),
  }),
  product({
    id: "orb-012", name: "Cabo Órbita USB-C Trançado 2 m", price: 6900, sku: "ORB-CBO", categoryId: "acessorios", color: C, stock: 40,
    description: "Cabo USB-C trançado de 2 metros, carga de até 100 W.",
    attributes: attrs({ conexao: ["Conexão", "USB-C"], garantia: ["Garantia", "12 meses"] }),
  }),
  product({
    id: "orb-013", name: "Power Bank Órbita 20.000 mAh", price: 25900, sku: "ORB-PWB", categoryId: "acessorios", color: C, stock: 13,
    description: "Bateria portátil de 20.000 mAh com duas saídas e visor de carga.",
    attributes: attrs({ conexao: ["Conexão", "USB-C PD, USB-A"], garantia: ["Garantia", "12 meses"] }),
  }),
  product({
    id: "orb-014", name: "Capa Órbita para Notebook 14\"", price: 17900, sku: "ORB-CNB", categoryId: "acessorios", color: C, stock: 18,
    description: "Capa acolchoada com bolso frontal para notebooks de até 14 polegadas.",
    attributes: attrs({ garantia: ["Garantia", "3 meses"] }),
  }),
  product({
    id: "orb-015", name: "Suporte Órbita Stand Alumínio", price: 14900, sku: "ORB-STD", categoryId: "acessorios", color: C, stock: 16,
    description: "Suporte de alumínio ajustável para notebook e tablet.",
    attributes: attrs({ garantia: ["Garantia", "12 meses"] }),
  }),
  product({
    id: "orb-016", name: "Hub Órbita USB-C 7 em 1", price: 31900, sku: "ORB-HUB", categoryId: "acessorios", color: C,
    description: "Hub com HDMI 4K, leitor de cartão, três portas USB-A e entrada de energia.",
    attributes: attrs({ conexao: ["Conexão", "USB-C"], garantia: ["Garantia", "12 meses"] }),
    variants: gridVariants("ORB-HUB", padrao, [grafite, prata], () => 7),
  }),
];
