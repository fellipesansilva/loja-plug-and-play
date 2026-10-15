import type { Addon, Category, Product, Variant } from "@/domain/types";
import { attrs, placeholderImage, product } from "../helpers";
import { categoryImages, productImages } from "./images";

export const categories: Category[] = [
  { id: "pizzas", slug: "pizzas", name: "Pizzas", image: categoryImages["pizzas"] ?? placeholderImage("Pizzas", "d93a16", "Pizzas assadas no forno") },
  { id: "paes", slug: "paes", name: "Pães", image: categoryImages["paes"] ?? placeholderImage("Pães", "d93a16", "Pães frescos") },
  { id: "doces", slug: "doces", name: "Doces", image: categoryImages["doces"] ?? placeholderImage("Doces", "d93a16", "Doces e sobremesas") },
  { id: "bebidas", slug: "bebidas", name: "Bebidas", image: categoryImages["bebidas"] ?? placeholderImage("Bebidas", "d93a16", "Sucos, shakes e cafés") },
];

const C = "d93a16";

/** Variações por tamanho/porção. SKU = `${base}-${code}`. */
function portions(
  base: string,
  list: { label: string; code: string; price?: number; stock: number }[],
): Variant[] {
  return list.map((p) => ({
    id: `${base}-${p.code}`.toLowerCase(),
    sku: `${base}-${p.code}`,
    attributes: { porcao: p.label },
    price: p.price,
    stock: p.stock,
  }));
}

const validade = (v: string) => ["Validade", v] as [string, string];
const dieta = (v: string) => ["Restrição alimentar", v] as [string, string];
const restricoes = (v: string) => ["Restrições", v] as [string, string];

const sorvete: Addon = { id: "sorvete", label: "Bola de sorvete de creme", price: 700 };
const morangos: Addon = { id: "morangos", label: "Morangos frescos", price: 500 };
const caldaExtra: Addon = { id: "calda-extra", label: "Calda quente extra", price: 300 };
const borda: Addon = { id: "borda-catupiry", label: "Borda recheada de catupiry", price: 800 };
const azeitonas: Addon = { id: "azeitonas", label: "Azeitonas pretas", price: 400 };

const catalog: Product[] = [
  // ——— Pizzas
  product({
    id: "fv-001", name: "Pizza Margherita", price: 3990, sku: "FV-MAR", categoryId: "pizzas", color: C,
    badges: ["Nº 1 da semana", "Pronto em 20 min"],
    addons: [borda, azeitonas],
    description: "Massa de longa fermentação, molho de tomate, mussarela de búfala e manjericão fresco.",
    attributes: attrs({ sabor: ["Sabor", "Tomate, mussarela e manjericão"], dieta: dieta("Vegetariano"), validade: validade("Consumir em até 2 dias refrigerada"), restricoes: restricoes("Contém glúten e lactose") }),
    variants: portions("FV-MAR", [
      { label: "Broto (4 fatias)", code: "BRO", stock: 12 },
      { label: "Média (6 fatias)", code: "MED", price: 5490, stock: 10 },
      { label: "Grande (8 fatias)", code: "GRA", price: 6990, stock: 6 },
    ]),
  }),
  product({
    id: "fv-002", name: "Pizza Quatro Queijos", price: 5290, sku: "FV-4QJ", categoryId: "pizzas", color: C,
    description: "Mussarela, provolone, gorgonzola e parmesão gratinados, daquelas que esticam o queijo.",
    attributes: attrs({ sabor: ["Sabor", "Quatro queijos"], dieta: dieta("Vegetariano"), validade: validade("Consumir em até 2 dias refrigerada"), restricoes: restricoes("Contém glúten e lactose") }),
    variants: portions("FV-4QJ", [
      { label: "Média (6 fatias)", code: "MED", stock: 9 },
      { label: "Grande (8 fatias)", code: "GRA", price: 6890, stock: 5 },
    ]),
  }),
  product({
    id: "fv-003", name: "Pizza de Pepperoni", price: 5790, sku: "FV-PEP", categoryId: "pizzas", color: C, stock: 14,
    description: "Pepperoni crocante nas bordas, muita mussarela e orégano.",
    attributes: attrs({ porcao: ["Porção", "Média (6 fatias)"], sabor: ["Sabor", "Pepperoni"], validade: validade("Consumir em até 2 dias refrigerada"), restricoes: restricoes("Contém glúten, lactose e carne suína") }),
  }),
  product({
    id: "fv-004", name: "Pizza Mista", price: 5490, sku: "FV-MIS", categoryId: "pizzas", color: C, stock: 0,
    description: "Calabresa, cogumelos, pimentão e azeitonas. Esgotada por hoje.",
    attributes: attrs({ porcao: ["Porção", "Média (6 fatias)"], sabor: ["Sabor", "Calabresa e cogumelos"], validade: validade("Consumir em até 2 dias refrigerada"), restricoes: restricoes("Contém glúten, lactose e carne suína") }),
  }),
  product({
    id: "fv-005", name: "Pizza de Salame", price: 5590, sku: "FV-SAL", categoryId: "pizzas", color: C, stock: 9,
    description: "Salame italiano em fatias finas, presunto e mussarela derretida.",
    attributes: attrs({ porcao: ["Porção", "Média (6 fatias)"], sabor: ["Sabor", "Salame e presunto"], validade: validade("Consumir em até 2 dias refrigerada"), restricoes: restricoes("Contém glúten, lactose e carne suína") }),
  }),
  // ——— Pães
  product({
    id: "fv-006", name: "Pão de Fermentação Natural", price: 2290, sku: "FV-PFN", categoryId: "paes", color: C,
    description: "Casca crocante e miolo aerado, fermentado por 24 horas e assado na hora.",
    badges: ["Saindo do forno"],
    attributes: attrs({ sabor: ["Sabor", "Tradicional"], dieta: dieta("Vegano"), validade: validade("3 dias em saco de papel"), restricoes: restricoes("Contém glúten") }),
    variants: portions("FV-PFN", [
      { label: "500 g", code: "500", stock: 14 },
      { label: "1 kg", code: "1000", price: 4190, stock: 8 },
    ]),
  }),
  product({
    id: "fv-007", name: "Focaccia de Alecrim", price: 1890, sku: "FV-FOC", categoryId: "paes", color: C, stock: 12,
    description: "Macia por dentro, azeite e alecrim por cima, com azeitonas e tomate.",
    attributes: attrs({ porcao: ["Porção", "300 g"], sabor: ["Sabor", "Alecrim e azeite"], dieta: dieta("Vegano"), validade: validade("2 dias"), restricoes: restricoes("Contém glúten") }),
  }),
  product({
    id: "fv-008", name: "Pão de Queijo (12 unidades)", price: 1990, sku: "FV-PQJ", categoryId: "paes", color: C, stock: 25,
    description: "Crocante por fora, macio e puxa-puxa por dentro, feito com queijo minas.",
    attributes: attrs({ porcao: ["Porção", "12 unidades (360 g)"], sabor: ["Sabor", "Queijo minas"], dieta: dieta("Vegetariano"), validade: validade("2 dias, aqueça antes de servir"), restricoes: restricoes("Contém lactose; sem glúten") }),
  }),
  product({
    id: "fv-009", name: "Croissant de Manteiga", price: 1290, sku: "FV-CRO", categoryId: "paes", color: C, stock: 18,
    description: "Massa folhada de manteiga, dourada e leve, com dezenas de camadas.",
    attributes: attrs({ porcao: ["Porção", "1 unidade (90 g)"], sabor: ["Sabor", "Manteiga"], dieta: dieta("Vegetariano"), validade: validade("1 dia"), restricoes: restricoes("Contém glúten e lactose") }),
  }),
  product({
    id: "fv-010", name: "Baguete Rústica", price: 1090, sku: "FV-BAG", categoryId: "paes", color: C, stock: 15,
    description: "Crosta fina e estalante, ideal para sanduíches e para acompanhar a mesa.",
    attributes: attrs({ porcao: ["Porção", "1 unidade (250 g)"], sabor: ["Sabor", "Tradicional"], dieta: dieta("Vegano"), validade: validade("1 dia"), restricoes: restricoes("Contém glúten") }),
  }),
  product({
    id: "fv-011", name: "Pão de Alho Cremoso", price: 1790, sku: "FV-PAL", categoryId: "paes", color: C, stock: 11,
    description: "Pão fatiado com creme de alho, queijo gratinado e ervas.",
    attributes: attrs({ porcao: ["Porção", "8 fatias"], sabor: ["Sabor", "Alho e queijo"], dieta: dieta("Vegetariano"), validade: validade("2 dias refrigerado"), restricoes: restricoes("Contém glúten e lactose") }),
  }),
  // ——— Doces
  product({
    id: "fv-012", name: "Bolo Vulcão de Chocolate", price: 1690, sku: "FV-VUL", categoryId: "doces", color: C,
    description: "Massa fofa de chocolate com o centro cremoso, servido com calda quente que escorre.",
    badges: ["Nº 1 da casa", "Calda quente"],
    addons: [sorvete, morangos],
    attributes: attrs({ sabor: ["Sabor", "Chocolate belga"], dieta: dieta("Vegetariano"), validade: validade("3 dias refrigerado"), restricoes: restricoes("Contém glúten, ovos e lactose") }),
    variants: portions("FV-VUL", [
      { label: "Fatia", code: "FAT", stock: 20 },
      { label: "Meio bolo", code: "MEI", price: 5990, stock: 8 },
      { label: "Inteiro", code: "INT", price: 10990, stock: 4 },
    ]),
  }),
  product({
    id: "fv-013", name: "Brownie com Calda de Chocolate", price: 1490, sku: "FV-BRW", categoryId: "doces", color: C, stock: 20,
    description: "Brownie denso e úmido de chocolate meio amargo, coberto com calda.",
    addons: [sorvete, caldaExtra],
    attributes: attrs({ porcao: ["Porção", "1 unidade (110 g)"], sabor: ["Sabor", "Chocolate meio amargo"], dieta: dieta("Vegetariano"), validade: validade("5 dias"), restricoes: restricoes("Contém glúten, ovos e lactose") }),
  }),
  product({
    id: "fv-014", name: "Rolinho de Canela", price: 1390, sku: "FV-ROL", categoryId: "doces", color: C, stock: 16,
    description: "Massa macia enrolada com canela e açúcar mascavo, coberta com glacê.",
    attributes: attrs({ porcao: ["Porção", "1 unidade (120 g)"], sabor: ["Sabor", "Canela"], dieta: dieta("Vegetariano"), validade: validade("2 dias"), restricoes: restricoes("Contém glúten, ovos e lactose") }),
  }),
  product({
    id: "fv-015", name: "Cheesecake de Frutas Vermelhas", price: 1890, sku: "FV-CHE", categoryId: "doces", color: C, stock: 10,
    description: "Base crocante, creme de queijo e calda de frutas vermelhas.",
    addons: [caldaExtra],
    attributes: attrs({ porcao: ["Porção", "1 fatia (140 g)"], sabor: ["Sabor", "Frutas vermelhas"], dieta: dieta("Vegetariano"), validade: validade("4 dias refrigerado"), restricoes: restricoes("Contém glúten, ovos e lactose") }),
  }),
  product({
    id: "fv-016", name: "Torta de Limão", price: 1790, sku: "FV-TLI", categoryId: "doces", color: C, stock: 8,
    description: "Base crocante, creme de limão e merengue maçaricado na hora.",
    attributes: attrs({ porcao: ["Porção", "1 fatia (130 g)"], sabor: ["Sabor", "Limão"], dieta: dieta("Vegetariano"), validade: validade("4 dias refrigerada"), restricoes: restricoes("Contém glúten, ovos e lactose") }),
  }),
  // ——— Bebidas
  product({
    id: "fv-017", name: "Suco de Laranja Natural", price: 1290, sku: "FV-SLA", categoryId: "bebidas", color: C,
    description: "Espremido na hora, sem adição de açúcar.",
    attributes: attrs({ sabor: ["Sabor", "Laranja"], dieta: dieta("Vegano"), validade: validade("2 dias refrigerado"), restricoes: restricoes("Sem glúten") }),
    variants: portions("FV-SLA", [
      { label: "300 ml", code: "300", stock: 25 },
      { label: "1 litro", code: "1000", price: 2990, stock: 12 },
    ]),
  }),
  product({
    id: "fv-018", name: "Limonada Suíça", price: 1490, sku: "FV-LIM", categoryId: "bebidas", color: C, stock: 18,
    description: "Limonada cremosa batida com a casca do limão e leite condensado.",
    attributes: attrs({ porcao: ["Porção", "400 ml"], sabor: ["Sabor", "Limão"], dieta: dieta("Vegetariano"), validade: validade("1 dia refrigerada"), restricoes: restricoes("Contém lactose") }),
  }),
  product({
    id: "fv-019", name: "Milk-shake de Morango", price: 1990, sku: "FV-SHK", categoryId: "bebidas", color: C, stock: 12,
    description: "Sorvete de creme batido com morangos de verdade, servido bem gelado.",
    attributes: attrs({ porcao: ["Porção", "400 ml"], sabor: ["Sabor", "Morango"], dieta: dieta("Vegetariano"), validade: validade("Consumir na hora"), restricoes: restricoes("Contém lactose") }),
  }),
  product({
    id: "fv-020", name: "Café Coado Especial", price: 790, sku: "FV-CAF", categoryId: "bebidas", color: C, stock: 40,
    description: "Grãos especiais de torra média, coado na hora.",
    attributes: attrs({ porcao: ["Porção", "250 ml"], sabor: ["Sabor", "Chocolate e caramelo"], dieta: dieta("Vegano"), validade: validade("Consumir na hora"), restricoes: restricoes("Sem glúten") }),
  }),
];

/** Produtos com as fotos reais do preset (quem não tiver foto mantém o placeholder gerado por `product()`). */
export const products: Product[] = catalog.map((p) => ({ ...p, images: productImages[p.id] ?? p.images }));
