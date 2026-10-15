import { Bodoni_Moda, Manrope } from "next/font/google";

// Fontes do build da Trama (títulos Bodoni Moda, texto Manrope), expostas como CSS variables usadas nos tokens do preset.
// Cada build carrega só as fontes do seu preset (ver src/fonts/select.ts): o build do Forno não baixa a Bodoni.
const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-bodoni-moda",
});
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-manrope",
});

export const fontVariables = `${bodoni.variable} ${manrope.variable}`;
