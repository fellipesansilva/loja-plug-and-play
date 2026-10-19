import type { Preset } from "@/domain/types";
import { tramaStudio } from "./trama-studio";
import { fornoDaVila } from "./forno-da-vila";
import { arcaInflaveis } from "./arca-inflaveis";
import { faisca } from "./faisca";
import { fictitiousPreset } from "./fictitious";
import { assertBuildValid } from "./validate-build";

/**
 * Registro de presets (só no servidor: o cliente recebe os dados do preset da rota como props do layout e nunca importa este arquivo).
 * Para adicionar um novo, crie a pasta e registre aqui. O preset fictício só entra com FICTITIOUS_PRESET=1 (teste de guarda do bundle).
 */
export const presets: readonly Preset[] = [tramaStudio, fornoDaVila, arcaInflaveis, faisca, ...(process.env.FICTITIOUS_PRESET === "1" ? [fictitiousPreset] : [])];

// Preset sem os dados de conformidade (identificação, arrependimento, privacidade, cookies) derruba o build.
for (const preset of presets) assertBuildValid(preset);

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
