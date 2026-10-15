import { presetBySlug, presets } from "@/presets";

/**
 * Preset padrão da demonstração: para onde vai a raiz "/" e todo link antigo sem preset (/carrinho → /trama/carrinho).
 * Vem da configuração (variável de ambiente DEFAULT_PRESET, lida no servidor), não do código das telas.
 * Sem a variável, vale o primeiro preset do registro. Valor desconhecido derruba o build/servidor.
 */
export function resolveDefaultPresetSlug(value: string | undefined): string {
  const wanted = value?.trim().toLowerCase();
  if (!wanted) return presets[0].shortId;
  const preset = presetBySlug(wanted);
  if (!preset) {
    throw new Error(`DEFAULT_PRESET="${value}" não é um preset conhecido. Use um de: ${presets.map((p) => p.shortId).join(", ")}.`);
  }
  return preset.shortId;
}

export const DEFAULT_PRESET_SLUG: string = resolveDefaultPresetSlug(process.env.DEFAULT_PRESET);
