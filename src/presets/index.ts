import type { Preset } from "@/domain/types";
import { tramaStudio } from "./trama-studio";
import { fornoDaVila } from "./forno-da-vila";

/** Registro de presets. Para adicionar um novo, crie a pasta e registre aqui. */
export const presets: readonly Preset[] = [tramaStudio, fornoDaVila];

/** Preset usado quando o build não define NEXT_PUBLIC_PRESET. */
export const FALLBACK_PRESET_ID = tramaStudio.id;

export function getPreset(id: string): Preset | undefined {
  return presets.find((p) => p.id === id);
}

/** Resolve um id completo ("forno-da-vila") ou apelido ("forno") para o id do preset, sem diferenciar maiúsculas. */
export function resolvePresetKey(key: string | null | undefined): string | null {
  const wanted = key?.trim().toLowerCase();
  if (!wanted) return null;
  return presets.find((p) => p.id === wanted || p.shortId === wanted)?.id ?? null;
}

/**
 * Preset de um build: valor de NEXT_PUBLIC_PRESET (id ou apelido). Vazio = Trama.
 * Um valor desconhecido derruba o build, para uma variável errada não publicar a loja errada.
 */
export function resolveBuildPreset(value: string | undefined): string {
  if (!value?.trim()) return FALLBACK_PRESET_ID;
  const id = resolvePresetKey(value);
  if (!id) {
    const valid = presets.map((p) => p.shortId ?? p.id).join(", ");
    throw new Error(`NEXT_PUBLIC_PRESET="${value}" não é um preset conhecido. Use um de: ${valid}.`);
  }
  return id;
}

/** Preset deste build: o store, o tema e o HTML do servidor já nascem nele (cada preset é um build/loja próprio). */
export const ACTIVE_PRESET_ID: string = resolveBuildPreset(process.env.NEXT_PUBLIC_PRESET);
export const ACTIVE_PRESET: Preset = getPreset(ACTIVE_PRESET_ID)!;
