import type { Preset } from "@/domain/types";
import { cursosProblems } from "@/lib/courses-validate";
import { validatePreset } from "./validate";

/**
 * Validação do BUILD (só no servidor, pelo registro de presets): as regras do navegador (validatePreset, que o painel também aplica) mais a
 * conferência dos dados dos cursos (textos da área do aluno e aulas), que fica fora do JavaScript das lojas. Preset inválido derruba o build.
 */
export function assertBuildValid(preset: Preset): void {
  const problems = [...validatePreset(preset), ...cursosProblems(preset)];
  if (problems.length > 0) {
    throw new Error(`Preset "${preset.id}" inválido:\n- ${problems.join("\n- ")}`);
  }
}
