import type { Viewport } from "next";
import { fontVariables } from "@active-fonts";
import "@/theme/theme.css";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { DemoControls } from "@/components/demo/DemoControls";

// Título e description não ficam aqui: vêm do preset ativo (PageTitle, na vitrine) e do layout do painel.
// As fontes são só as do preset deste build (alias "@active-fonts", definido no next.config.ts).

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={fontVariables}>
      <body className="min-h-screen bg-background font-body text-text antialiased">
        <ThemeProvider>
          {children}
          <DemoControls />
        </ThemeProvider>
      </body>
    </html>
  );
}
