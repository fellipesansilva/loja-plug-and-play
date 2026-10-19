import type { Metadata } from "next";
import { preload } from "react-dom";
import { fontCssFor, fontUrlsFor } from "@/fonts";
import "@/theme/better.css";

/**
 * Landing da Better Studio (prévia de validação): rota própria, fora dos presets. Sem PresetProvider, sem store, sem botão Demo e sem
 * aviso de cookies da loja. Fora dos buscadores (noindex, nofollow). Fontes e tema (src/theme/better.css) só carregam aqui.
 */
export const metadata: Metadata = {
  title: "Better Studio · Lojas virtuais",
  description: "Lojas virtuais para pequenos e médios negócios: no ar em até 7 dias úteis, sem comissão sobre as vendas.",
  robots: { index: false, follow: false },
};

export default function BetterLayout({ children }: { children: React.ReactNode }) {
  for (const href of fontUrlsFor("better")) preload(href, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return (
    <>
      <style id="font-vars" dangerouslySetInnerHTML={{ __html: fontCssFor("better") }} />
      <div className="better-site">{children}</div>
    </>
  );
}
