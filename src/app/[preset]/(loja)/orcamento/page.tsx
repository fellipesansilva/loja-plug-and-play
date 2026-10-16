import { QuoteListView } from "@/components/store/QuoteListView";
import { requireMode } from "@/lib/quote-mode";

export default async function Page({ params }: { params: Promise<{ preset: string }> }) {
  const { preset } = await params;
  requireMode(preset, "quote");
  return <QuoteListView />;
}
