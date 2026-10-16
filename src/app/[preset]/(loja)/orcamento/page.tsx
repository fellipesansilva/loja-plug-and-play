import { PagePlaceholder } from "@/components/PagePlaceholder";
import { requireMode } from "@/lib/quote-mode";

export default async function Page({ params }: { params: Promise<{ preset: string }> }) {
  const { preset } = await params;
  requireMode(preset, "quote");
  return <PagePlaceholder title="Lista de orçamento" />;
}
