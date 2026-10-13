import type { Preset } from "@/domain/types";
import { tramaStudio } from "./trama-studio";
import { fornoDaVila } from "./forno-da-vila";

/** Registro de presets. Para adicionar um novo, crie a pasta e registre aqui. */
export const presets: readonly Preset[] = [tramaStudio, fornoDaVila];

export const DEFAULT_PRESET_ID = tramaStudio.id;

export function getPreset(id: string): Preset | undefined {
  return presets.find((p) => p.id === id);
}
