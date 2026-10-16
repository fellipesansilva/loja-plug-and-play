import { CommercialTermsView } from "@/components/store/PolicyPages";
import { requireMode } from "@/lib/quote-mode";

export default async function Page({ params }: { params: Promise<{ preset: string }> }) {
  const { preset } = await params;
  requireMode(preset, "quote");
  return <CommercialTermsView />;
}
