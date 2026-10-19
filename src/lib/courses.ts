import type { Course, CursosConfig, Lesson, Order, Product } from "@/domain/types";
import { accessFor, isCourse, type CourseAccess, type CourseProduct, type Progress } from "./course-access";

export { accessFor, isCourse, withLessonDone, type CourseAccess, type CourseProduct, type Progress } from "./course-access";

export const totalMinutes = (course: Course): number => course.lessons.reduce((sum, l) => sum + l.minutes, 0);

/** "2 h 40 min", "3 h" ou "45 min": a carga horária do curso é a soma das aulas. */
export function formatWorkload(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Cursos que este navegador comprou (qualquer status de pedido), na ordem do pedido mais recente. */
export function purchasedCourses(orders: Order[], products: Product[]): { product: CourseProduct; access: CourseAccess }[] {
  const out: { product: CourseProduct; access: CourseAccess }[] = [];
  const seen = new Set<string>();
  for (const o of orders) {
    for (const item of o.items) {
      if (seen.has(item.productId)) continue;
      const product = products.find((p) => p.id === item.productId);
      if (!product || !isCourse(product)) continue;
      const access = accessFor(orders, product.id);
      if (!access) continue;
      seen.add(product.id);
      out.push({ product, access });
    }
  }
  return out;
}

/** Motivo do bloqueio, com o número do pedido (texto do preset). Acesso liberado: vazio. */
export function lockedReason(access: CourseAccess, texts: Pick<CursosConfig, "lockedAwaiting" | "lockedCanceled">): string {
  if (access.status === "liberado") return "";
  const text = access.status === "aguardando" ? texts.lockedAwaiting : texts.lockedCanceled;
  return text.replaceAll("{pedido}", access.orderId);
}

/** Aulas concluídas deste curso (só ids que existem na ementa). */
export function completedLessons(progress: Progress | undefined, product: CourseProduct): string[] {
  const done = new Set(progress?.[product.id] ?? []);
  return product.course.lessons.filter((l) => done.has(l.id)).map((l) => l.id);
}

/** Progresso em % (0 a 100, inteiro), pelo número de aulas concluídas. */
export function progressPercent(progress: Progress | undefined, product: CourseProduct): number {
  const total = product.course.lessons.length;
  return total === 0 ? 0 : Math.round((completedLessons(progress, product).length / total) * 100);
}

/** Próxima aula a assistir: a primeira não concluída; undefined se concluiu todas. */
export function nextLesson(progress: Progress | undefined, product: CourseProduct): Lesson | undefined {
  const done = new Set(completedLessons(progress, product));
  return product.course.lessons.find((l) => !done.has(l.id));
}
