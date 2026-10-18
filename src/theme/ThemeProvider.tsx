"use client";

import type { ReactNode } from "react";
import { useAfterLcp } from "@/lib/after-lcp";
import { useDemoStore } from "@/store/demo-store";
import { tokensToCss } from "./tokens";

/**
 * Aplica os ThemeTokens do store como CSS variables em :root. O HTML de cada rota /[preset] já sai com o tema e as
 * fontes do preset; o script inline logo após o <style> reaplica antes da primeira pintura os tokens salvos desta
 * loja (se houver edição). Depois da hidratação, o <style> acompanha o store reativamente.
 * `fontCss` e `earlyScript` (do servidor) definem as variáveis de fonte do preset, que os tokens referenciam, e o script de tema salvo. `deferredFontCss` são as @font-face que só
 * entram depois que a foto principal da página foi pintada (a fonte reserva, de métricas ajustadas, cobre o intervalo).
 */
export function ThemeProvider({ fontCss, deferredFontCss = "", earlyScript, children }: { fontCss: string; deferredFontCss?: string; earlyScript: string; children: ReactNode }) {
  const theme = useDemoStore((s) => s.config.theme);
  const afterLcp = useAfterLcp();

  return (
    <>
      <style id="font-vars" dangerouslySetInnerHTML={{ __html: fontCss }} />
      {deferredFontCss && afterLcp && <style id="font-faces" dangerouslySetInnerHTML={{ __html: deferredFontCss }} />}
      <style
        id="theme-tokens"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: tokensToCss(theme) }}
      />
      <script dangerouslySetInnerHTML={{ __html: earlyScript }} />
      {children}
    </>
  );
}
