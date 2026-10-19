import { notFound } from "next/navigation";
import { presetBySlug } from "@/presets";

/** O preset desta URL tem a área do aluno (`modules.cursos`)? Preset desconhecido: não. */
export function hasCursos(slug: string): boolean {
  return presetBySlug(slug)?.config.modules.cursos === true;
}

/** Guarda de rota (servidor): Meus cursos, curso e aula só existem na loja com o módulo `cursos`; nas outras é 404 de verdade. */
export function requireCursos(slug: string): void {
  if (!hasCursos(slug)) notFound();
}
