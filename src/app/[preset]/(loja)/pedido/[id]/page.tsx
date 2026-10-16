import { OrderView } from "@/components/store/OrderView";
import { requireMode } from "@/lib/quote-mode";

export default async function Page({ params }: { params: Promise<{ preset: string; id: string }> }) {
  const { preset, id } = await params;
  requireMode(preset, "sales");
  return <OrderView id={id} />;
}
