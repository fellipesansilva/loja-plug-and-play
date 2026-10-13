import type { StoreConfig } from "@/domain/types";

export const config: StoreConfig = {
  name: "Forno da Vila",
  logo: "/placeholder?l=Forno%20da%20Vila&c=b5441f",
  legal: {
    document: "00.000.000/0001-00 (fictício, apenas demonstração)",
    address: "Praça Exemplo, 45 — Curitiba/PR (endereço fictício)",
    contact: "pedidos@fornodavila.example · (41) 0000-0000",
  },
  theme: {
    colors: {
      primary: "#b5441f",
      secondary: "#e8a838",
      background: "#fff8ee",
      surface: "#fffdf8",
      text: "#3b2418",
      muted: "#7d6556",
      border: "#f0dcc3",
      success: "#4f8a3c",
      warning: "#c98a12",
      danger: "#c0392b",
    },
    fonts: {
      heading: "'Trebuchet MS', 'Segoe UI', sans-serif",
      body: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    },
    radii: { sm: "6px", md: "12px", lg: "20px" },
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
    exchange:
      "Por se tratar de alimentos, não há troca por arrependimento. Em caso de problema com o produto, fale conosco em até 24 horas. (Texto de demonstração.)",
    privacy:
      "Usamos seus dados apenas para entregar o pedido. Esta é uma loja de demonstração: nenhum dado real é enviado a servidores.",
    about:
      "O Forno da Vila é uma cozinha artesanal fictícia, criada para demonstrar a plataforma de loja virtual plug and play.",
  },
};
