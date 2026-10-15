"use client";

import type { ReactNode } from "react";
import { useDemoStore } from "@/store/demo-store";
import { earlyThemeScript } from "./early-theme-script";
import { tokensToCss } from "./tokens";

/**
 * Aplica os ThemeTokens do store como CSS variables em :root. O HTML de cada rota /[preset] já sai com o tema e as
 * fontes do preset; o script inline logo após o <style> reaplica antes da primeira pintura os tokens salvos desta
 * loja (se houver edição). Depois da hidratação, o <style> acompanha o store reativamente.
 * `fontCss` (do servidor) define as variáveis de fonte do preset, que os tokens referenciam.
 */
export function ThemeProvider({ fontCss, children }: { fontCss: string; children: ReactNode }) {
  const theme = useDemoStore((s) => s.config.theme);
  const presetId = useDemoStore((s) => s.presetId);

  return (
    <>
      <style id="font-vars" dangerouslySetInnerHTML={{ __html: fontCss }} />
      <style
        id="theme-tokens"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: tokensToCss(theme) }}
      />
      <script dangerouslySetInnerHTML={{ __html: earlyThemeScript(presetId) }} />
      {children}
    </>
  );
}
