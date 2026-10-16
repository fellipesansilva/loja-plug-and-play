import { notFound } from "next/navigation";
import { SegmentPageView } from "@/components/store/SegmentPageView";
import { presetBySlug, presets } from "@/presets";

// Necessidades vêm do preset (não são criadas no painel): fora da lista, 404 de verdade.
export const dynamicParams = false;

export function generateStaticParams() {
  return presets.flatMap((p) => (p.config.needs ?? []).map((n) => ({ preset: p.shortId, slug: n.slug })));
}

export default async function Page({ params }: { params: Promise<{ preset: string; slug: string }> }) {
  const { preset, slug } = await params;
  if (!presetBySlug(preset)?.config.needs?.some((n) => n.slug === slug)) notFound();
  return <SegmentPageView kind="necessidade" slug={slug} />;
}
