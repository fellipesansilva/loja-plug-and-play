import { OrderDetail } from "@/components/painel/OrderDetail";
import { requireMode } from "@/lib/quote-mode";

export default async function Page({ params }: { params: Promise<{ preset: string; id: string }> }) {
  const { preset, id } = await params;
  requireMode(preset, "sales");
  return <OrderDetail id={decodeURIComponent(id)} />;
}
