"use client";

import { usePathname } from "next/navigation";
import { stripPresetPrefix } from "@/lib/preset-href";
import { usePreset } from "@/store/PresetProvider";
import { PainelSidebar } from "./PainelSidebar";

/** Faixa fixa em todas as telas do painel: aqui nada é real e não há login. */
function DemoBanner() {
  return (
    <div
      data-testid="painel-demo-banner"
      className="sticky top-0 z-40 bg-text px-md py-xs text-center text-sm font-bold text-background"
    >
      Painel de demonstração
    </div>
  );
}

export function PainelShell({ children }: { children: React.ReactNode }) {
  const { slug } = usePreset();
  const pathname = stripPresetPrefix(slug, usePathname());
  // A tela de login não exibe o menu lateral.
  if (pathname === "/painel/login") {
    return (
      <>
        <DemoBanner />
        <main>{children}</main>
      </>
    );
  }
  return (
    <>
      <DemoBanner />
      <div className="flex min-h-screen flex-col md:flex-row">
        <PainelSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </>
  );
}
