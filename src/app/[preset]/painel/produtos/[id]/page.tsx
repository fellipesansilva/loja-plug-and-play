import { PagePlaceholder } from "@/components/PagePlaceholder";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PagePlaceholder title="Produto" note={`Identificador: ${id}. Conteúdo em uma fatia futura.`} />;
}
