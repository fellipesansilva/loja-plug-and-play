import { LessonView } from "@/components/store/StudentArea";
import { requireCursos } from "@/lib/cursos-mode";
import { presets } from "@/presets";

export const dynamicParams = true;

export function generateStaticParams() {
  return presets
    .filter((p) => p.config.modules.cursos)
    .flatMap((p) => p.products.flatMap((x) => (x.course ? x.course.lessons.map((l) => ({ preset: p.shortId, slug: x.slug, lessonId: l.id })) : [])));
}

export default async function Page({ params }: { params: Promise<{ preset: string; slug: string; lessonId: string }> }) {
  const { preset, slug, lessonId } = await params;
  requireCursos(preset);
  return <LessonView slug={slug} lessonId={lessonId} />;
}
