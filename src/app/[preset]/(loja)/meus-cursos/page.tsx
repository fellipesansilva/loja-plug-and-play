import { MyCoursesView } from "@/components/store/StudentArea";
import { requireCursos } from "@/lib/cursos-mode";

export default async function Page({ params }: { params: Promise<{ preset: string }> }) {
  const { preset } = await params;
  requireCursos(preset);
  return <MyCoursesView />;
}
