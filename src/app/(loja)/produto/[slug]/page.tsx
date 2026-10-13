import { PagePlaceholder } from "@/components/PagePlaceholder";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PagePlaceholder title="Produto" note={`Identificador: ${slug}. Conteúdo em uma fatia futura.`} />;
}
