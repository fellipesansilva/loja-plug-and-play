import type { Category, Product, Variant } from "@/domain/types";
import { categoryImages, productImages } from "./images";
import { attrs, placeholderImage, product } from "../helpers";

export const categories: Category[] = [
  { id: "pratos", slug: "pratos", name: "Pratos", image: categoryImages["pratos"] ?? placeholderImage("Pratos", "c9722f", "Pratos prontos do dia a dia") },
  { id: "doces", slug: "doces", name: "Doces", image: categoryImages["doces"] ?? placeholderImage("Doces", "c9722f", "Doces e sobremesas artesanais") },
  { id: "bebidas", slug: "bebidas", name: "Bebidas", image: categoryImages["bebidas"] ?? placeholderImage("Bebidas", "c9722f", "Sucos, chás e cafés") },
];

const C = "c9722f";

/** Variações por peso/porção. SKU = `${base}-${code}`. */
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

const catalog: Product[] = [
  product({
    id: "fv-001", name: "Lasanha à Bolonhesa", price: 4290, sku: "FV-LAS", categoryId: "pratos", color: C,
    description: "Massa fresca, molho bolonhesa caseiro e queijo gratinado.",
    attributes: attrs({ sabor: ["Sabor", "Bolonhesa"], validade: validade("3 dias refrigerada"), restricoes: ["Restrições", "Contém glúten e lactose"] }),
    variants: portions("FV-LAS", [
      { label: "1 pessoa (400 g)", code: "400", stock: 12 },
      { label: "2 pessoas (800 g)", code: "800", price: 7990, stock: 8 },
      { label: "Família (1,5 kg)", code: "1500", price: 13990, stock: 4 },
    ]),
  }),
  product({
    id: "fv-002", name: "Feijoada Completa", price: 5490, sku: "FV-FEI", categoryId: "pratos", color: C,
    description: "Feijão preto com carnes selecionadas, acompanha arroz e couve.",
    attributes: attrs({ sabor: ["Sabor", "Tradicional"], validade: validade("4 dias refrigerada"), restricoes: ["Restrições", "Contém carne suína"] }),
    variants: portions("FV-FEI", [
      { label: "1 pessoa (500 g)", code: "500", stock: 10 },
      { label: "3 pessoas (1,5 kg)", code: "1500", price: 13990, stock: 6 },
    ]),
  }),
  product({
    id: "fv-003", name: "Frango Assado com Batatas", price: 4990, sku: "FV-FRA", categoryId: "pratos", color: C, stock: 9,
    description: "Coxa e sobrecoxa assadas com batatas rústicas e ervas.",
    attributes: attrs({ porcao: ["Peso/porção", "600 g"], sabor: ["Sabor", "Ervas finas"], validade: validade("3 dias refrigerado"), dieta: ["Restrição alimentar", "Sem glúten"], restricoes: ["Restrições", "Sem glúten"] }),
  }),
  product({
    id: "fv-004", name: "Risoto de Cogumelos", price: 4690, sku: "FV-RIS", categoryId: "pratos", color: C, stock: 7,
    description: "Arroz arbóreo cremoso com mix de cogumelos e parmesão.",
    attributes: attrs({ porcao: ["Peso/porção", "400 g"], sabor: ["Sabor", "Cogumelos"], validade: validade("2 dias refrigerado"), dieta: ["Restrição alimentar", "Vegetariano"], restricoes: ["Restrições", "Contém lactose"] }),
  }),
  product({
    id: "fv-005", name: "Escondidinho de Carne Seca", price: 4490, sku: "FV-ESC", categoryId: "pratos", color: C, stock: 11,
    description: "Purê de mandioca com carne seca desfiada e queijo coalho.",
    attributes: attrs({ porcao: ["Peso/porção", "450 g"], sabor: ["Sabor", "Carne seca"], validade: validade("3 dias refrigerado"), restricoes: ["Restrições", "Contém lactose"] }),
  }),
  product({
    id: "fv-006", name: "Strogonoff de Frango", price: 3990, sku: "FV-STR", categoryId: "pratos", color: C, stock: 14,
    description: "Strogonoff cremoso de frango, acompanha arroz branco.",
    attributes: attrs({ porcao: ["Peso/porção", "500 g"], sabor: ["Sabor", "Frango"], validade: validade("3 dias refrigerado"), restricoes: ["Restrições", "Contém lactose"] }),
  }),
  product({
    id: "fv-007", name: "Quiche Lorraine", price: 3690, sku: "FV-QUI", categoryId: "pratos", color: C, stock: 0,
    description: "Massa amanteigada com bacon, queijo e creme. Esgotada.",
    attributes: attrs({ porcao: ["Peso/porção", "350 g"], sabor: ["Sabor", "Bacon e queijo"], validade: validade("2 dias refrigerada"), restricoes: ["Restrições", "Contém glúten e lactose"] }),
  }),
  product({
    id: "fv-008", name: "Brigadeiro Gourmet Box", price: 2990, sku: "FV-BRI", categoryId: "doces", color: C,
    description: "Brigadeiros de chocolate belga enrolados à mão.",
    attributes: attrs({ sabor: ["Sabor", "Chocolate belga"], validade: validade("10 dias em local fresco"), restricoes: ["Restrições", "Contém lactose"] }),
    variants: portions("FV-BRI", [
      { label: "6 unidades (120 g)", code: "6", stock: 20 },
      { label: "12 unidades (240 g)", code: "12", price: 5490, stock: 15 },
      { label: "24 unidades (480 g)", code: "24", price: 9990, stock: 5 },
    ]),
  }),
  product({
    id: "fv-009", name: "Bolo de Cenoura com Chocolate", price: 3490, sku: "FV-BCC", categoryId: "doces", color: C,
    description: "Bolo fofinho de cenoura com cobertura cremosa de chocolate.",
    attributes: attrs({ sabor: ["Sabor", "Cenoura com chocolate"], validade: validade("5 dias refrigerado"), restricoes: ["Restrições", "Contém glúten, ovos e lactose"] }),
    variants: portions("FV-BCC", [
      { label: "500 g", code: "500", stock: 9 },
      { label: "1 kg", code: "1000", price: 6290, stock: 6 },
    ]),
  }),
  product({
    id: "fv-010", name: "Torta de Limão", price: 3890, sku: "FV-TLI", categoryId: "doces", color: C, stock: 6,
    description: "Base crocante, creme de limão e merengue maçaricado.",
    attributes: attrs({ porcao: ["Peso/porção", "400 g (4 fatias)"], sabor: ["Sabor", "Limão"], validade: validade("4 dias refrigerada"), restricoes: ["Restrições", "Contém glúten, ovos e lactose"] }),
  }),
  product({
    id: "fv-011", name: "Pudim de Leite", price: 2790, sku: "FV-PUD", categoryId: "doces", color: C, stock: 13,
    description: "Pudim cremoso de leite condensado com calda de caramelo.",
    attributes: attrs({ porcao: ["Peso/porção", "300 g"], sabor: ["Sabor", "Leite condensado"], validade: validade("5 dias refrigerado"), restricoes: ["Restrições", "Contém ovos e lactose"] }),
  }),
  product({
    id: "fv-012", name: "Cookie Red Velvet", price: 1290, sku: "FV-COO", categoryId: "doces", color: C, stock: 30,
    description: "Cookie macio de red velvet com gotas de chocolate branco.",
    attributes: attrs({ porcao: ["Peso/porção", "80 g"], sabor: ["Sabor", "Red velvet"], validade: validade("7 dias"), restricoes: ["Restrições", "Contém glúten, ovos e lactose"] }),
  }),
  product({
    id: "fv-013", name: "Pão de Mel", price: 990, sku: "FV-PDM", categoryId: "doces", color: C, stock: 24,
    description: "Pão de mel recheado com doce de leite e coberto com chocolate.",
    attributes: attrs({ porcao: ["Peso/porção", "70 g"], sabor: ["Sabor", "Doce de leite"], validade: validade("10 dias"), restricoes: ["Restrições", "Contém glúten e lactose"] }),
  }),
  product({
    id: "fv-014", name: "Suco de Laranja Natural", price: 1290, sku: "FV-SLA", categoryId: "bebidas", color: C,
    description: "Suco espremido na hora, sem adição de açúcar.",
    attributes: attrs({ sabor: ["Sabor", "Laranja"], validade: validade("2 dias refrigerado"), dieta: ["Restrição alimentar", "Vegano"], restricoes: ["Restrições", "Sem glúten"] }),
    variants: portions("FV-SLA", [
      { label: "300 ml", code: "300", stock: 25 },
      { label: "1 litro", code: "1000", price: 2990, stock: 12 },
    ]),
  }),
  product({
    id: "fv-015", name: "Limonada Suíça", price: 1490, sku: "FV-LIM", categoryId: "bebidas", color: C, stock: 18,
    description: "Limonada cremosa batida com leite condensado.",
    attributes: attrs({ porcao: ["Peso/porção", "400 ml"], sabor: ["Sabor", "Limão"], validade: validade("1 dia refrigerada"), restricoes: ["Restrições", "Contém lactose"] }),
  }),
  product({
    id: "fv-016", name: "Café Coado Especial", price: 1190, sku: "FV-CAF", categoryId: "bebidas", color: C, stock: 40,
    description: "Café especial coado, grãos de torra média.",
    attributes: attrs({ porcao: ["Peso/porção", "250 ml"], sabor: ["Sabor", "Chocolate e caramelo"], validade: validade("Consumir no dia"), dieta: ["Restrição alimentar", "Vegano"], restricoes: ["Restrições", "Sem glúten"] }),
  }),
  product({
    id: "fv-017", name: "Chá Gelado de Pêssego", price: 1390, sku: "FV-CHA", categoryId: "bebidas", color: C, stock: 16,
    description: "Chá preto gelado com pêssego e hortelã.",
    attributes: attrs({ porcao: ["Peso/porção", "500 ml"], sabor: ["Sabor", "Pêssego"], validade: validade("3 dias refrigerado"), dieta: ["Restrição alimentar", "Vegano"], restricoes: ["Restrições", "Sem glúten"] }),
  }),
  product({
    id: "fv-018", name: "Kombucha de Gengibre", price: 1690, sku: "FV-KOM", categoryId: "bebidas", color: C, stock: 10,
    description: "Bebida fermentada artesanal com gengibre.",
    attributes: attrs({ porcao: ["Peso/porção", "300 ml"], sabor: ["Sabor", "Gengibre"], validade: validade("30 dias refrigerada"), dieta: ["Restrição alimentar", "Vegano"], restricoes: ["Restrições", "Sem glúten"] }),
  }),
];

/** Produtos com as fotos reais do preset (quem não tiver foto mantém o placeholder gerado por `product()`). */
export const products: Product[] = catalog.map((p) => ({ ...p, images: productImages[p.id] ?? p.images }));
