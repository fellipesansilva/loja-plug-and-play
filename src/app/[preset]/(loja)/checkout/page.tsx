import { CheckoutView } from "@/components/store/CheckoutView";
import { requireMode } from "@/lib/quote-mode";

export default async function Page({ params }: { params: Promise<{ preset: string }> }) {
  const { preset } = await params;
  requireMode(preset, "sales");
  return <CheckoutView />;
}
