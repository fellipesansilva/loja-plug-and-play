import type { StoreConfig } from "@/domain/types";

export const config: StoreConfig = {
  name: "Trama Studio",
  logo: "/placeholder?l=Trama%20Studio&c=2f2a26",
  legal: {
    document: "00.000.000/0001-00 (fictício, apenas demonstração)",
    address: "Rua Exemplo, 123 — São Paulo/SP (endereço fictício)",
    contact: "contato@trama.example · (11) 0000-0000",
  },
  theme: {
    colors: {
      primary: "#2f2a26",
      secondary: "#a68a64",
      background: "#faf8f5",
      surface: "#ffffff",
      text: "#1f1b18",
      muted: "#6f6860",
      border: "#e4ded6",
      success: "#3f7d58",
      warning: "#b7791f",
      danger: "#b4443c",
    },
    fonts: {
      heading: "Georgia, 'Times New Roman', serif",
      body: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    },
    radii: { sm: "2px", md: "4px", lg: "8px" },
    spacing: { xs: "0.25rem", sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2.5rem" },
  },
  modules: {
    retiradaLocal: false,
    freteGratis: { enabled: true, minValue: 19900 },
    parcelamento: { enabled: true, maxInstallments: 6 },
    boleto: true,
    cupom: true,
    assistenteVirtual: false,
  },
  policies: {
    exchange:
      "Você pode solicitar a troca ou devolução em até 7 dias após o recebimento, com a peça sem uso e com etiqueta. (Texto de demonstração.)",
    privacy:
      "Coletamos apenas os dados necessários para processar seu pedido. Esta é uma loja de demonstração: nenhum dado real é enviado a servidores.",
    about:
      "A Trama Studio é uma marca fictícia de moda atemporal, criada para demonstrar a plataforma de loja virtual plug and play.",
  },
};
