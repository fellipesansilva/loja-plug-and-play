import { CourseAreaView } from "@/components/store/StudentArea";
import { requireCursos } from "@/lib/cursos-mode";
import { presets } from "@/presets";

// Pré-gera os cursos das lojas com área do aluno; o acesso (pedido pago) é conferido no navegador.
export const dynamicParams = true;

export function generateStaticParams() {
  return presets.filter((p) => p.config.modules.cursos).flatMap((p) => p.products.filter((x) => x.course).map((x) => ({ preset: p.shortId, slug: x.slug })));
}

export default async function Page({ params }: { params: Promise<{ preset: string; slug: string }> }) {
  const { preset, slug } = await params;
  requireCursos(preset);
  return <CourseAreaView slug={slug} />;
}
