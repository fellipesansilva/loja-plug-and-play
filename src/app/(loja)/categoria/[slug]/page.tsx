import { Suspense } from "react";
import { CategoryView } from "@/components/store/CategoryView";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Suspense fallback={<h1 className="mx-auto w-full max-w-5xl px-md py-lg text-2xl">Carregando…</h1>}>
      <CategoryView slug={slug} />
    </Suspense>
  );
}
