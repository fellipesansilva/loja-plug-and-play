import type { Category, Product } from "@/domain/types";
import { categoryImages, productImages } from "./images";
import { attrs, gridVariants, placeholderImage, product } from "../helpers";

export const categories: Category[] = [
  { id: "feminino", slug: "feminino", name: "Feminino", image: categoryImages["feminino"] ?? placeholderImage("Feminino", "8a7f72", "Peças da linha feminina") },
  { id: "masculino", slug: "masculino", name: "Masculino", image: categoryImages["masculino"] ?? placeholderImage("Masculino", "8a7f72", "Peças da linha masculina") },
  { id: "acessorios", slug: "acessorios", name: "Acessórios", image: categoryImages["acessorios"] ?? placeholderImage("Acessórios", "8a7f72", "Bolsas, cintos e acessórios") },
];

const C = "8a7f72";
const sizes = ["P", "M", "G"];
const preto = { name: "Preto", code: "PT" };
const off = { name: "Off-white", code: "OW" };
const areia = { name: "Areia", code: "AR" };
const marinho = { name: "Marinho", code: "MR" };

const catalog: Product[] = [
  product({
    id: "ts-001", name: "Vestido Midi Linho", price: 38990, sku: "TS-VML", categoryId: "feminino", color: C,
    description: "Vestido midi em linho misto com caimento leve e fenda lateral.",
    attributes: attrs({ material: ["Material", "Linho misto"] }),
    variants: gridVariants("TS-VML", sizes, [off, areia], (s, c) => (s === "G" && c === "Areia" ? 0 : 4)),
  }),
  product({
    id: "ts-002", name: "Blusa Cropped Algodão", price: 11990, sku: "TS-BCA", categoryId: "feminino", color: C,
    description: "Blusa cropped em algodão pima, gola redonda.",
    attributes: attrs({ material: ["Material", "Algodão pima"] }),
    variants: gridVariants("TS-BCA", sizes, [preto, off], () => 6),
  }),
  product({
    id: "ts-003", name: "Calça Alfaiataria", price: 29990, sku: "TS-CAF", categoryId: "feminino", color: C,
    description: "Calça de alfaiataria cintura alta, perna reta.",
    attributes: attrs({ material: ["Material", "Poliviscose"] }),
    variants: gridVariants("TS-CAF", sizes, [preto, marinho], () => 3),
  }),
  product({
    id: "ts-004", name: "Saia Plissada", price: 18990, sku: "TS-SPL", categoryId: "feminino", color: C, stock: 9,
    description: "Saia plissada midi com elástico na cintura.",
    attributes: attrs({ modelagem: ["Modelagem", "Elástico na cintura, serve do P ao G"], cor: ["Cor", "Areia"], material: ["Material", "Poliéster"] }),
  }),
  product({
    id: "ts-005", name: "Camisa Oversized", price: 22990, sku: "TS-COV", categoryId: "feminino", color: C, stock: 12,
    description: "Camisa oversized de algodão com bolso.",
    attributes: attrs({ modelagem: ["Modelagem", "Oversized, tamanho único"], cor: ["Cor", "Off-white"], material: ["Material", "Algodão"] }),
  }),
  product({
    id: "ts-006", name: "Cardigan Tricô", price: 27990, sku: "TS-CTR", categoryId: "feminino", color: C, stock: 0,
    description: "Cardigan de tricô macio com botões de madeira. Esgotado.",
    attributes: attrs({ tamanho: ["Tamanho", "M"], cor: ["Cor", "Marinho"], material: ["Material", "Tricô de algodão"] }),
  }),
  product({
    id: "ts-007", name: "Macacão Utilitário", price: 34990, sku: "TS-MUT", categoryId: "feminino", color: C, stock: 5,
    description: "Macacão utilitário com bolsos frontais e cinto.",
    attributes: attrs({ tamanho: ["Tamanho", "M"], cor: ["Cor", "Verde oliva"], material: ["Material", "Sarja"] }),
  }),
  product({
    id: "ts-008", name: "Camiseta Básica Pima", price: 9990, sku: "TS-CBP", categoryId: "masculino", color: C,
    description: "Camiseta básica de algodão pima, corte reto.",
    attributes: attrs({ material: ["Material", "Algodão pima"] }),
    variants: gridVariants("TS-CBP", sizes, [preto, off, marinho], () => 8),
  }),
  product({
    id: "ts-009", name: "Camisa Linho Manga Longa", price: 25990, sku: "TS-CLM", categoryId: "masculino", color: C,
    description: "Camisa de linho manga longa, ideal para o verão.",
    attributes: attrs({ material: ["Material", "Linho"] }),
    variants: gridVariants("TS-CLM", sizes, [off, marinho], () => 2),
  }),
  product({
    id: "ts-010", name: "Calça Chino", price: 24990, sku: "TS-CCH", categoryId: "masculino", color: C, stock: 14,
    description: "Calça chino slim em sarja com elastano.",
    attributes: attrs({ modelagem: ["Modelagem", "Slim, do 40 ao 46"], cor: ["Cor", "Areia"], material: ["Material", "Sarja com elastano"] }),
  }),
  product({
    id: "ts-011", name: "Bermuda Sarja", price: 15990, sku: "TS-BSJ", categoryId: "masculino", color: C, stock: 10,
    description: "Bermuda de sarja com cós ajustável.",
    attributes: attrs({ modelagem: ["Modelagem", "Cós ajustável, do 38 ao 44"], cor: ["Cor", "Marinho"], material: ["Material", "Sarja"] }),
  }),
  product({
    id: "ts-012", name: "Jaqueta Jeans", price: 39990, sku: "TS-JJN", categoryId: "masculino", color: C, stock: 4,
    description: "Jaqueta jeans lavagem média, corte clássico.",
    attributes: attrs({ tamanho: ["Tamanho", "M"], cor: ["Cor", "Azul"], material: ["Material", "Jeans"] }),
  }),
  product({
    id: "ts-013", name: "Polo Piquet", price: 13990, sku: "TS-PPQ", categoryId: "masculino", color: C, stock: 11,
    description: "Polo em malha piquet com gola estruturada.",
    attributes: attrs({ modelagem: ["Modelagem", "Regular, do P ao GG"], cor: ["Cor", "Preto"], material: ["Material", "Piquet de algodão"] }),
  }),
  product({
    id: "ts-014", name: "Bolsa Tote Couro", price: 45990, sku: "TS-BTC", categoryId: "acessorios", color: C, stock: 6,
    description: "Bolsa tote em couro legítimo com forro interno.",
    attributes: attrs({ cor: ["Cor", "Caramelo"], material: ["Material", "Couro"] }),
  }),
  product({
    id: "ts-015", name: "Cinto Couro", price: 12990, sku: "TS-CNT", categoryId: "acessorios", color: C, stock: 20,
    description: "Cinto de couro com fivela metálica fosca.",
    attributes: attrs({ cor: ["Cor", "Preto"], material: ["Material", "Couro"] }),
  }),
  product({
    id: "ts-016", name: "Lenço de Seda", price: 14990, sku: "TS-LSD", categoryId: "acessorios", color: C, stock: 7,
    description: "Lenço estampado em seda pura, 70 × 70 cm.",
    attributes: attrs({ cor: ["Cor", "Estampado"], material: ["Material", "Seda"] }),
  }),
  product({
    id: "ts-017", name: "Chapéu de Palha", price: 11990, sku: "TS-CHP", categoryId: "acessorios", color: C, stock: 8,
    description: "Chapéu de palha de aba média.",
    attributes: attrs({ cor: ["Cor", "Natural"], material: ["Material", "Palha"] }),
  }),
  product({
    id: "ts-018", name: "Brinco Argola", price: 7990, sku: "TS-BAG", categoryId: "acessorios", color: C, stock: 25,
    description: "Brinco argola banhado a ouro 18k.",
    attributes: attrs({ cor: ["Cor", "Dourado"], material: ["Material", "Latão banhado"] }),
  }),
];

/** Produtos com as fotos reais do preset (quem não tiver foto mantém o placeholder gerado por `product()`). */
export const products: Product[] = catalog.map((p) => ({ ...p, images: productImages[p.id] ?? p.images }));
