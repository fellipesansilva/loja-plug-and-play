/** Consentimento de cookies: o que é gravado, por loja, e como ler. Sem dependência de React (testável sozinho). */

export type ConsentChoice = "accepted" | "rejected";
export type ConsentRecord = { choice: ConsentChoice; at: string; version: string };

/** Chave do localStorage da escolha de cookies, separada por preset (como o estado da loja). */
export const consentKey = (slug: string): string => `loja-consent-v1-${slug}`;

export function serializeConsent(choice: ConsentChoice, version: string, now: Date = new Date()): string {
  const record: ConsentRecord = { choice, at: now.toISOString(), version };
  return JSON.stringify(record);
}

/**
 * Lê a escolha gravada. Devolve null (= perguntar de novo) se não há nada, se o JSON está quebrado
 * ou se foi dada para outra versão do texto do aviso.
 */
export function parseConsent(raw: string | null | undefined, version: string): ConsentRecord | null {
  if (!raw) return null;
  try {
    const r = JSON.parse(raw) as Partial<ConsentRecord>;
    if ((r.choice !== "accepted" && r.choice !== "rejected") || r.version !== version) return null;
    if (typeof r.at !== "string" || Number.isNaN(Date.parse(r.at))) return null;
    return { choice: r.choice, at: r.at, version: r.version };
  } catch {
    return null;
  }
}
