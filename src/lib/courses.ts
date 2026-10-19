import type { Course, CursosConfig, Lesson, Order, Product } from "@/domain/types";

/** Produto digital com conteúdo de curso (módulo `cursos`). */
export type CourseProduct = Product & { course: Course };

export const isCourse = (p: Product): p is CourseProduct => p.type === "digital" && p.course !== undefined;

/** Progresso do aluno neste navegador: id do curso (produto) → ids das aulas concluídas. */
export type Progress = Record<string, string[]>;

export const totalMinutes = (course: Course): number => course.lessons.reduce((sum, l) => sum + l.minutes, 0);

/** "2 h 40 min", "3 h" ou "45 min": a carga horária do curso é a soma das aulas. */
export function formatWorkload(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Acesso ao curso conforme o pedido: liberado (pago ou entregue), aguardando pagamento ou cancelado (inclui pagamento recusado). */
export type CourseAccess = { status: "liberado" | "aguardando" | "cancelado"; orderId: string };

const hasItem = (o: Order, productId: string) => o.items.some((i) => i.productId === productId);

/**
 * Acesso do aluno ao curso, pelos pedidos deste navegador (do mais recente ao mais antigo, como o estado guarda). Um pedido pago ou
 * entregue libera; sem nenhum, vale o motivo do pedido mais recente (aguardando pagamento ou cancelado). Sem pedido do curso: null.
 */
export function accessFor(orders: Order[], productId: string): CourseAccess | null {
  const mine = orders.filter((o) => hasItem(o, productId));
  const paid = mine.find((o) => o.status === "pago" || o.status === "entregue");
  if (paid) return { status: "liberado", orderId: paid.id };
  const last = mine[0];
  if (!last) return null;
  return { status: last.status === "cancelado" ? "cancelado" : "aguardando", orderId: last.id };
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

/** Marca a aula como concluída (idempotente). Aula que não existe no curso não muda nada. */
export function withLessonDone(progress: Progress | undefined, product: CourseProduct, lessonId: string): Progress {
  const current = progress ?? {};
  if (!product.course.lessons.some((l) => l.id === lessonId)) return current;
  const done = current[product.id] ?? [];
  return done.includes(lessonId) ? current : { ...current, [product.id]: [...done, lessonId] };
}

const filled = (v: unknown): boolean => typeof v === "string" && v.trim().length > 0;

const CURSOS_TEXTS: (keyof CursosConfig)[] = [
  "myCoursesLabel",
  "intro",
  "empty",
  "emptyCtaLabel",
  "accessLabel",
  "demoLabel",
  "demoNote",
  "completeLabel",
  "completedLabel",
  "lockedAwaiting",
  "lockedCanceled",
  "progressLabel",
  "syllabusTitle",
  "instructorLabel",
  "workloadLabel",
  "demoBadge",
];

/**
 * Problemas do módulo `cursos` (usado pelo validatePreset, que derruba o build). Lista vazia = tudo certo.
 * Com o módulo ligado: textos da área do aluno completos, venda ligada (não é modo orçamento) e cada curso com instrutor marcado como
 * fictício e aulas válidas. Sem o módulo: nenhum produto pode trazer `course`.
 */
export function cursosProblems(preset: { config: { modules: { cursos?: boolean; orcamento?: { enabled: boolean } }; cursos?: CursosConfig }; products: Product[] }): string[] {
  const out: string[] = [];
  const need = (ok: boolean, field: string, why: string) => {
    if (!ok) out.push(`${field}: ${why}`);
  };
  const { modules, cursos } = preset.config;
  const withCourse = preset.products.filter((p) => p.course !== undefined);
  if (modules.cursos !== true) {
    need(withCourse.length === 0, "config.modules.cursos", `há produto com curso (${withCourse.map((p) => p.id).join(", ")}) e o módulo cursos está desligado`);
    return out;
  }
  need(modules.orcamento?.enabled !== true, "config.modules.cursos", "o módulo cursos vende pelo carrinho e não pode coexistir com o modo orçamento");
  need(!!cursos && CURSOS_TEXTS.every((k) => filled(cursos[k])), "config.cursos", "informe todos os textos da área do aluno");
  need(!!cursos && cursos.lockedAwaiting.includes("{pedido}") && cursos.lockedCanceled.includes("{pedido}"), "config.cursos", "os motivos de bloqueio precisam conter {pedido}");
  need(withCourse.length > 0, "products", "o módulo cursos precisa de ao menos um curso (produto digital com course)");
  for (const p of withCourse) {
    const c = p.course!;
    need(p.type === "digital", `products.${p.id}.type`, "curso é produto digital");
    need(filled(c.instructor) && filled(c.instructorNote), `products.${p.id}.course`, "informe o instrutor e a nota sobre ele");
    need(/fictíci/i.test(c.instructorNote ?? ""), `products.${p.id}.course.instructorNote`, "o instrutor da demonstração precisa estar marcado como fictício");
    need(c.lessons.length >= 2, `products.${p.id}.course.lessons`, "informe 2 ou mais aulas");
    const ids = c.lessons.map((l) => l.id);
    need(new Set(ids).size === ids.length && ids.every(filled), `products.${p.id}.course.lessons`, "ids de aula vazios ou repetidos");
    for (const l of c.lessons) {
      need(filled(l.title) && l.text.length > 0 && l.text.every(filled), `products.${p.id}.course.lessons.${l.id}`, "informe título e texto da aula");
      need(Number.isInteger(l.minutes) && l.minutes > 0, `products.${p.id}.course.lessons.${l.id}.minutes`, "a duração é em minutos inteiros e positivos");
    }
  }
  return out;
}
