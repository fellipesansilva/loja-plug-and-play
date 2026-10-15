import { ACTIVE_PRESET } from "@/presets";

/**
 * Chave do estado salvo, separada por preset (ex.: `loja-demo-v1-forno`): carrinho e pedidos de uma loja nunca
 * aparecem na outra, mesmo que as duas rodem no mesmo domínio (testes locais).
 */
export function storageKeyFor(presetKey: string): string {
  return `loja-demo-v1-${presetKey}`;
}

export const STORAGE_KEY = storageKeyFor(ACTIVE_PRESET.shortId ?? ACTIVE_PRESET.id);

/** Versão do formato persistido. Subir ao mudar o formato (estado antigo é descartado). */
export const STORAGE_VERSION = 4;
