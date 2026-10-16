import { notFound } from "next/navigation";
import { SegmentPageView } from "@/components/store/SegmentPageView";
import { presetBySlug, presets } from "@/presets";

// Setores vêm do preset (não são criados no painel): fora da lista, 404 de verdade.
export const dynamicParams = false;

export function generateStaticParams() {
  return presets.flatMap((p) => (p.config.sectors ?? []).map((s) => ({ preset: p.shortId, slug: s.slug })));
}

export default async function Page({ params }: { params: Promise<{ preset: string; slug: string }> }) {
  const { preset, slug } = await params;
  if (!presetBySlug(preset)?.config.sectors?.some((s) => s.slug === slug)) notFound();
  return <SegmentPageView kind="setor" slug={slug} />;
}
