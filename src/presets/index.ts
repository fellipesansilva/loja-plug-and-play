import type { Preset } from "@/domain/types";
import { tramaStudio } from "./trama-studio";
import { fornoDaVila } from "./forno-da-vila";

/** Registro de presets. Para adicionar um novo, crie a pasta e registre aqui. */
export const presets: readonly Preset[] = [tramaStudio, fornoDaVila];

export const DEFAULT_PRESET_ID = tramaStudio.id;

export function getPreset(id: string): Preset | undefined {
  return presets.find((p) => p.id === id);
}

/**
 * Preset pedido pelo link direto (`?preset=forno` ou `?preset=forno-da-vila`, sem diferenciar maiúsculas).
 * Devolve o id do preset, ou null se o parâmetro não existir ou for desconhecido.
 */
export function resolvePresetParam(search: string): string | null {
  const wanted = new URLSearchParams(search).get("preset")?.trim().toLowerCase();
  if (!wanted) return null;
  return presets.find((p) => p.id === wanted || p.shortId === wanted)?.id ?? null;
}
