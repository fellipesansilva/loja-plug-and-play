"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { stripPresetPrefix } from "@/lib/preset-href";
import { useAfterLcp } from "@/lib/after-lcp";
import { useDemoStore } from "@/store/demo-store";
import { usePreset } from "@/store/PresetProvider";

// Cada módulo é um pedaço de código à parte: só é baixado se o preset liga o módulo e só depois que a foto principal foi pintada
// (useAfterLcp). Preset que não liga o módulo nunca pede o arquivo.
const Bot = dynamic(() => import("./Bot"), { ssr: false });
const WhatsappButton = dynamic(() => import("./WhatsappButton"), { ssr: false });

/**
 * Botões flutuantes da vitrine (bot e WhatsApp), no canto esquerdo: o canto direito é do botão Demo. Sobem na página do produto para
 * não cobrir a barra fixa de compra nem o botão do carrinho.
 */
export function StoreExtras() {
  const bot = useDemoStore((s) => s.config.modules.bot === true);
  const whatsapp = useDemoStore((s) => s.config.modules.whatsapp === true);
  const ready = useAfterLcp();
  const { slug } = usePreset();
  const path = stripPresetPrefix(slug, usePathname());
  const aboveBuyBar = path.startsWith("/produto/");
  if (!ready || (!bot && !whatsapp)) return null;
  return (
    <div
      data-testid="extras-dock"
      className={`fixed left-md z-40 flex flex-col items-start gap-sm ${aboveBuyBar ? "bottom-[calc(6rem+var(--cookie-banner-h,0px))]" : "bottom-[calc(1rem+var(--cookie-banner-h,0px))]"}`}
    >
      {bot && <Bot />}
      {whatsapp && <WhatsappButton />}
    </div>
  );
}
