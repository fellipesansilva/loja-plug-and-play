import { notFound } from "next/navigation";
import { preload } from "react-dom";
import { DemoControls } from "@/components/demo/DemoControls";
import { deferredFontCssFor, fontCssFor, fontUrlsFor } from "@/fonts";
import { presetBySlug, presets } from "@/presets";
import { PresetProvider } from "@/store/PresetProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";

/** Todos os presets são gerados no mesmo build: /trama/..., /forno/... Cada página já nasce no preset dela. */
export function generateStaticParams() {
  return presets.map((p) => ({ preset: p.shortId }));
}

export default async function PresetLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ preset: string }>;
}) {
  const { preset: slug } = await params;
  const preset = presetBySlug(slug);
  // Preset desconhecido no endereço (/orbita, /xyz) é 404 de verdade: o status sai antes de qualquer conteúdo.
  if (!preset) notFound();
  const fontCss = fontCssFor(preset.shortId);
  for (const href of fontUrlsFor(preset.shortId)) preload(href, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });

  return (
    <PresetProvider presetId={preset.id}>
      <ThemeProvider fontCss={fontCss} deferredFontCss={deferredFontCssFor(preset.shortId)}>
        {children}
        <DemoControls />
      </ThemeProvider>
    </PresetProvider>
  );
}
