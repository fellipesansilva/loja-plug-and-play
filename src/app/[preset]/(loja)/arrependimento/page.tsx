import { PageFallback } from "@/components/store/PageFallback";
import { Suspense } from "react";
import { RegretView } from "@/components/store/RegretView";
import { requireMode } from "@/lib/quote-mode";

export default async function Page({ params }: { params: Promise<{ preset: string }> }) {
  const { preset } = await params;
  requireMode(preset, "sales");
  return (
    <Suspense fallback={<PageFallback title="Carregando…" />}>
      <RegretView />
    </Suspense>
  );
}
