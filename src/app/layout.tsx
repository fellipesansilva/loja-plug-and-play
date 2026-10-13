import type { Viewport } from "next";
import { Bodoni_Moda, Bricolage_Grotesque, Manrope } from "next/font/google";
import "@/theme/theme.css";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { DemoControls } from "@/components/demo/DemoControls";

// Título e description não ficam aqui: vêm do preset ativo (PageTitle, na vitrine) e do layout do painel.

// Fontes expostas como CSS variables; cada preset escolhe qual usar nos seus tokens.
const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-bodoni-moda",
});
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

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${bodoni.variable} ${bricolage.variable} ${manrope.variable}`}>
      <body className="min-h-screen bg-background font-body text-text antialiased">
        <ThemeProvider>
          {children}
          <DemoControls />
        </ThemeProvider>
      </body>
    </html>
  );
}
