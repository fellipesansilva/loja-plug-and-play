import type { StoreConfig } from "@/domain/types";
import { bannerImage } from "./images";

export const config: StoreConfig = {
  name: "Forno da Vila",
  logo: "/placeholder?l=Forno%20da%20Vila&c=b4441f",
  seo: {
    titleTemplate: "%s · Forno da Vila",
    description: "Comida caseira, doces e bebidas feitos todos os dias. Peça online e receba em casa ou retire na loja.",
  },
  layout: { search: "bar", categoryTile: "circle" },
  homeBlocks: [
    {
      id: "banner",
      type: "banner",
      enabled: true,
      image: bannerImage,
      eyebrow: "Feito hoje",
      title: "Comida de casa, do nosso forno para a sua mesa",
      subtitle: "Peça até as 10h e receba hoje.",
      ctaLabel: "Ver pratos",
      ctaHref: "/categoria/pratos",
    },
    {
      id: "categorias",
      type: "categories",
      enabled: true,
      title: "O que você procura?",
      categoryIds: ["pratos", "doces", "bebidas"],
    },
    {
      id: "destaques",
      type: "featured",
      enabled: true,
      title: "Mais pedidos",
      linkLabel: "Ver todos",
      linkHref: "/categoria/pratos",
      productIds: ["fv-001", "fv-002", "fv-007", "fv-008", "fv-009", "fv-014", "fv-012", "fv-013"],
    },
  ],
  attributeDefs: [
    { key: "porcao", label: "Porção", selector: "list", filterable: false, highlight: false },
    { key: "dieta", label: "Restrição alimentar", selector: "pill", filterable: true, highlight: true },
    { key: "sabor", label: "Sabor", selector: "pill", filterable: false, highlight: false },
    { key: "validade", label: "Validade", selector: "pill", filterable: false, highlight: false },
    { key: "restricoes", label: "Restrições", selector: "pill", filterable: false, highlight: false },
  ],
  shipping: {
    options: [
      { id: "economico", label: "Econômico", basePrice: 990, days: [1, 2] },
      { id: "expresso", label: "Expresso", basePrice: 1690, days: "same-day" },
    ],
    coverage: { cepPrefixes: ["0"] },
  },
  legal: {
    document: "00.000.000/0001-00 (fictício, apenas demonstração)",
    address: "Praça Exemplo, 45 — São Paulo/SP (endereço fictício)",
    contact: "pedidos@fornodavila.example · (11) 0000-0000",
  },
  theme: {
    colors: {
      primary: "#b4441f",
      secondary: "#e8a838",
      background: "#fff7ec",
      surface: "#ffffff",
      text: "#2b1a10",
      muted: "#6a4a35",
      border: "#f1e3d0",
      success: "#2f5a22",
      warning: "#c98a12",
      danger: "#c0392b",
      announcementBg: "#f2b544",
      announcementText: "#2b1a10",
    },
    fonts: {
      heading: "var(--font-bricolage), 'Trebuchet MS', 'Segoe UI', sans-serif",
      body: "var(--font-manrope), system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      headingWeight: "800",
    },
    radii: { sm: "12px", md: "16px", lg: "20px", button: "999px" },
    ratios: { product: "1 / 1" },
    logo: { transform: "none", tracking: "0", weight: "800", color: "var(--t-color-primary)" },
    spacing: { xs: "0.25rem", sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2.5rem" },
  },
  modules: {
    retiradaLocal: true,
    freteGratis: { enabled: true, minValue: 8000 },
    parcelamento: { enabled: false, maxInstallments: 1 },
    boleto: false,
    cupom: true,
    assistenteVirtual: false,
  },
  policies: {
    regret:
      "Direito de arrependimento: você pode desistir da compra em até 7 dias após o recebimento (CDC, art. 49). Para alimentos, o produto deve estar lacrado e conservado conforme a embalagem.",
    exchange:
      "Você pode desistir da compra em até 7 dias após o recebimento (CDC, art. 49). Por se tratar de alimentos perecíveis, o produto deve estar lacrado e conservado conforme a embalagem. Em caso de problema com o produto, fale conosco em até 24 horas. (Texto de demonstração.)",
    privacy:
      "Usamos seus dados apenas para entregar o pedido. Esta é uma loja de demonstração: nenhum dado real é enviado a servidores.",
    about:
      "O Forno da Vila é uma cozinha artesanal fictícia, criada para demonstrar a plataforma de loja virtual plug and play.",
  },
};
