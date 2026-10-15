import { ProductView } from "@/components/store/ProductView";
import { presets } from "@/presets";

// Pré-gera todos os produtos de todos os presets; o preset vem do segmento pai.
// Produtos e categorias criados no painel só existem no navegador: um endereço fora da lista pré-gerada (dentro de um preset válido)
// renderiza a tela e ela mostra o aviso de item não encontrado.
export const dynamicParams = true;

export function generateStaticParams() {
  return presets.flatMap((p) => p.products.map((x) => ({ preset: p.shortId, slug: x.slug })));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductView slug={slug} />;
}
