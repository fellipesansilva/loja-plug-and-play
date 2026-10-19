import type { CursosConfig, Product } from "@/domain/types";

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
 * Problemas dos dados do módulo `cursos` (usado só pelo build, em assertBuildValid (validate-build.ts): fica fora do JavaScript das lojas). Lista vazia = tudo certo.
 * Com o módulo ligado: textos da área do aluno completos e cada curso com instrutor marcado como fictício e aulas válidas.
 * Sem o módulo: nenhum produto pode trazer `course`. (A regra "não coexiste com o modo orçamento" é do validatePreset.)
 */
export function cursosProblems(preset: { config: { modules: { cursos?: boolean }; cursos?: CursosConfig }; products: Product[] }): string[] {
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
