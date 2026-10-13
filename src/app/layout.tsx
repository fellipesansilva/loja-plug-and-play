import type { Metadata, Viewport } from "next";
import "@/theme/theme.css";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { DemoControls } from "@/components/demo/DemoControls";

export const metadata: Metadata = {
  title: "Loja Plug and Play — demonstração",
  description: "Mockup navegável de e-commerce reutilizável, configurado por presets.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-background font-body text-text antialiased">
        <ThemeProvider>
          {children}
          <DemoControls />
        </ThemeProvider>
      </body>
    </html>
  );
}
