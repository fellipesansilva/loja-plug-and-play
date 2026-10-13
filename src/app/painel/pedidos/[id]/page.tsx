import { PagePlaceholder } from "@/components/PagePlaceholder";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PagePlaceholder title="Pedido" note={`Identificador: ${id}. Conteúdo em uma fatia futura.`} />;
}
