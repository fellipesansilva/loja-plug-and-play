import type { Course, Order, Product } from "@/domain/types";

// Núcleo da área do aluno que o estado das lojas usa (isCourse, acesso e marcar aula): fica à parte de courses.ts para o JavaScript das lojas
// levar só estas poucas funções, e não as listas e os textos da tela do aluno.

/** Produto digital com conteúdo de curso (módulo `cursos`). */
export type CourseProduct = Product & { course: Course };

export const isCourse = (p: Product): p is CourseProduct => p.type === "digital" && p.course !== undefined;

/** Progresso do aluno neste navegador: id do curso (produto) → ids das aulas concluídas. */
export type Progress = Record<string, string[]>;

/** Acesso ao curso conforme o pedido: liberado (pago ou entregue), aguardando pagamento ou cancelado (inclui pagamento recusado). */
export type CourseAccess = { status: "liberado" | "aguardando" | "cancelado"; orderId: string };

/**
 * Acesso do aluno ao curso, pelos pedidos deste navegador (do mais recente ao mais antigo, como o estado guarda). Um pedido pago ou
 * entregue libera; sem nenhum, vale o motivo do pedido mais recente (aguardando pagamento ou cancelado). Sem pedido do curso: null.
 */
export function accessFor(orders: Order[], productId: string): CourseAccess | null {
  const mine = orders.filter((o) => o.items.some((i) => i.productId === productId));
  const paid = mine.find((o) => o.status === "pago" || o.status === "entregue");
  if (paid) return { status: "liberado", orderId: paid.id };
  const last = mine[0];
  if (!last) return null;
  return { status: last.status === "cancelado" ? "cancelado" : "aguardando", orderId: last.id };
}

/** Marca a aula como concluída (idempotente). Aula que não existe no curso não muda nada. */
export function withLessonDone(progress: Progress | undefined, product: CourseProduct, lessonId: string): Progress {
  const current = progress ?? {};
  if (!product.course.lessons.some((l) => l.id === lessonId)) return current;
  const done = current[product.id] ?? [];
  return done.includes(lessonId) ? current : { ...current, [product.id]: [...done, lessonId] };
}
