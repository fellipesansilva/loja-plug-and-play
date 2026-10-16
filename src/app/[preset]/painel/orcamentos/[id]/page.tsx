import { QuoteDetail } from "@/components/painel/QuoteDetail";
import { requireMode } from "@/lib/quote-mode";

export default async function Page({ params }: { params: Promise<{ preset: string; id: string }> }) {
  const { preset, id } = await params;
  requireMode(preset, "quote");
  return <QuoteDetail id={decodeURIComponent(id)} />;
}
