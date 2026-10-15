import { resolvePresetKey } from "@/presets";

/**
 * URLs das lojas (uma por preset), vindas da configuração do build: NEXT_PUBLIC_DEMO_URLS =
 * {"trama":"https://loja-trama.exemplo","forno":"https://loja-forno.exemplo"} (JSON; chaves por id ou apelido).
 * Entradas inválidas (JSON quebrado, preset desconhecido, URL que não é http/https) são ignoradas.
 * Devolve id do preset → URL sem a barra final.
 */
export function parseDemoUrls(raw: string | undefined): Record<string, string> {
  if (!raw?.trim()) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  const urls: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    const id = resolvePresetKey(key);
    if (!id || typeof value !== "string") continue;
    try {
      const url = new URL(value.trim());
      if (url.protocol === "http:" || url.protocol === "https:") urls[id] = url.href.replace(/\/+$/, "");
    } catch {
      // URL inválida: ignora
    }
  }
  return urls;
}

/** URLs configuradas neste build. */
export const DEMO_URLS: Record<string, string> = parseDemoUrls(process.env.NEXT_PUBLIC_DEMO_URLS);
