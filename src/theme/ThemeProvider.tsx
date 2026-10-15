"use client";

import { useEffect, type ReactNode } from "react";
import { resolvePresetParam } from "@/presets";
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
 * O SSR emite os tokens do preset padrão; um script inline logo após o <style>
 * troca pelos tokens salvos antes da primeira pintura (sem flash). Depois da
 * hidratação, o <style> acompanha o store reativamente.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useDemoStore((s) => s.config.theme);

  useEffect(() => {
    if (EXPOSE_STORE) window.__demoStore = useDemoStore;
    // Link direto (?preset=): aplica o preset (sem resetar se já for o ativo), tira o parâmetro da URL e mostra a página.
    const requested = resolvePresetParam(window.location.search);
    void Promise.resolve(useDemoStore.persist.rehydrate()).then(() => {
      const state = useDemoStore.getState();
      if (requested && state.presetId !== requested) state.applyPreset(requested);
      if (requested) {
        const url = new URL(window.location.href);
        url.searchParams.delete("preset");
        window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
      }
      // Dois quadros depois: o React já trocou o conteúdo para o preset pedido.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => document.documentElement.removeAttribute("data-preset-pending")),
      );
    });
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
