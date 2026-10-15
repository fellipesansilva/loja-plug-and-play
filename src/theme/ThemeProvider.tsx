"use client";

import { useEffect, type ReactNode } from "react";
import { useDemoStore } from "@/store/demo-store";
import { EARLY_THEME_SCRIPT } from "./early-theme-script";
import { tokensToCss } from "./tokens";

declare global {
  interface Window {
    /** Exposto apenas fora de produção (ou com NEXT_PUBLIC_EXPOSE_STORE=1) para testes E2E. */
    __demoStore?: typeof useDemoStore;
  }
}

const EXPOSE_STORE =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_EXPOSE_STORE === "1";

/**
 * Aplica os ThemeTokens do store como CSS variables em :root.
 * Cada build é de um preset só: o store, o tema e o HTML do servidor já nascem nele. O script inline logo
 * após o <style> reaplica antes da primeira pintura os tokens salvos desta loja (se houver edição) e trata o
 * link antigo `?preset=`. Depois da hidratação, o <style> acompanha o store reativamente.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useDemoStore((s) => s.config.theme);

  useEffect(() => {
    if (EXPOSE_STORE) window.__demoStore = useDemoStore;
    // Hidratação manual (no cliente, após montar) do estado salvo desta loja (carrinho, pedidos, edições).
    void useDemoStore.persist.rehydrate();
  }, []);

  return (
    <>
      <style
        id="theme-tokens"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: tokensToCss(theme) }}
      />
      <script dangerouslySetInnerHTML={{ __html: EARLY_THEME_SCRIPT }} />
      {children}
    </>
  );
}
