import { ProductView } from "@/components/store/ProductView";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductView slug={slug} />;
}
