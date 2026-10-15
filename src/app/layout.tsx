import type { Viewport } from "next";
import "@/theme/theme.css";

// Raiz mínima: o tema, as fontes e o store vêm do layout de cada preset (src/app/[preset]/layout.tsx).
// Título e description vêm do preset da página (PageTitle, na vitrine) e do layout do painel.

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-body text-text antialiased">{children}</body>
    </html>
  );
}
