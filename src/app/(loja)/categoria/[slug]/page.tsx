import { PagePlaceholder } from "@/components/PagePlaceholder";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PagePlaceholder title="Categoria" note={`Identificador: ${slug}. Conteúdo em uma fatia futura.`} />;
}
