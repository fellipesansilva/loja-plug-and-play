import { Suspense } from "react";
import { CategoryView } from "@/components/store/CategoryView";
import { presets } from "@/presets";

// Produtos e categorias criados no painel só existem no navegador: um endereço fora da lista pré-gerada (dentro de um preset válido)
// renderiza a tela e ela mostra o aviso de item não encontrado.
export const dynamicParams = true;

export function generateStaticParams() {
  return presets.flatMap((p) => p.categories.map((c) => ({ preset: p.shortId, slug: c.slug })));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Suspense fallback={<h1 className="mx-auto w-full max-w-page px-md py-lg text-2xl">Carregando…</h1>}>
      <CategoryView slug={slug} />
    </Suspense>
  );
}
