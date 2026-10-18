import type { Preset } from "@/domain/types";
import { tramaStudio } from "./trama-studio";

/**
 * Preset fictício que só existe para o teste de guarda do bundle (src/presets/bundle-guard.test.ts): com FICTITIOUS_PRESET=1 ele entra
 * no registro, e o teste confere que isso não aumenta o JavaScript das outras lojas (cada loja recebe só os dados do próprio preset,
 * pelo servidor). Sem a variável, o registro e a produção não o conhecem.
 */
export const FICTITIOUS_MARKER = "Fantasma Teste XYZ";

export const fictitiousPreset: Preset = {
  ...structuredClone(tramaStudio),
  id: "fantasma-teste",
  shortId: "fantasma",
  config: { ...structuredClone(tramaStudio.config), name: FICTITIOUS_MARKER },
};
