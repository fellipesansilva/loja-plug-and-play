import { ProductEditor } from "@/components/painel/ProductEditor";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductEditor productId={decodeURIComponent(id)} />;
}
