import { Bricolage_Grotesque, Manrope } from "next/font/google";

// Fontes do build do Forno da Vila (títulos Bricolage Grotesque, texto Manrope), expostas como CSS variables usadas nos
// tokens do preset. Cada build carrega só as fontes do seu preset (ver src/fonts/select.ts): o build da Trama não baixa a Bricolage.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["800"],
  display: "swap",
  variable: "--font-bricolage",
});
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-manrope",
});

export const fontVariables = `${bricolage.variable} ${manrope.variable}`;
