import { Suspense } from "react";
import { RegretView } from "@/components/store/RegretView";
import { requireMode } from "@/lib/quote-mode";

export default async function Page({ params }: { params: Promise<{ preset: string }> }) {
  const { preset } = await params;
  requireMode(preset, "sales");
  return (
    <Suspense fallback={<h1 className="mx-auto w-full max-w-5xl px-md py-lg text-2xl">Carregando…</h1>}>
      <RegretView />
    </Suspense>
  );
}
