"use client";

import { useDemoStore } from "@/store/demo-store";

/**
 * Título da aba e meta description do preset ativo. O React 19 leva <title> e <meta> para o <head>,
 * então o HTML inicial já sai com o preset padrão e a troca de preset atualiza sem recarregar.
 */
export function PageTitle({ title }: { title: string }) {
  const seo = useDemoStore((s) => s.config.seo);
  return (
    <>
      <title>{seo.titleTemplate.replace("%s", title)}</title>
      <meta name="description" content={seo.description} />
    </>
  );
}
