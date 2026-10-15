import type { Preset } from "@/domain/types";
import { tramaStudio } from "./trama-studio";
import { fornoDaVila } from "./forno-da-vila";

/** Registro de presets. Para adicionar um novo, crie a pasta e registre aqui. */
export const presets: readonly Preset[] = [tramaStudio, fornoDaVila];

export function getPreset(id: string): Preset | undefined {
  return presets.find((p) => p.id === id);
}

/** Preset de uma URL: o primeiro segmento do endereço (`/forno/...`) é o `shortId` do preset. */
export function presetBySlug(slug: string | null | undefined): Preset | undefined {
  return slug ? presets.find((p) => p.shortId === slug) : undefined;
}

/** Resolve o id completo ("forno-da-vila") ou o apelido da URL ("forno") para o id do preset, sem diferenciar maiúsculas. */
export function resolvePresetKey(key: string | null | undefined): string | null {
  const wanted = key?.trim().toLowerCase();
  if (!wanted) return null;
  return presets.find((p) => p.id === wanted || p.shortId === wanted)?.id ?? null;
}
