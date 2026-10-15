/**
 * Chave do estado salvo, separada por preset (ex.: `loja-demo-v1-forno`): carrinho e pedidos de uma loja nunca
 * aparecem na outra, mesmo estando no mesmo domínio.
 */
export function storageKeyFor(slug: string): string {
  return `loja-demo-v1-${slug}`;
}

/** Versão do formato persistido. Subir ao mudar o formato (estado antigo é descartado). */
export const STORAGE_VERSION = 6;
