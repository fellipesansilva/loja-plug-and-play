/** Consentimento de cookies: o que é gravado, por loja, e como ler. Sem dependência de React (testável sozinho). */

export type ConsentChoice = "accepted" | "rejected";
export type ConsentRecord = { choice: ConsentChoice; at: string; version: string };

/** Chave do localStorage da escolha de cookies, separada por preset (como o estado da loja). */
export const consentKey = (slug: string): string => `loja-consent-v1-${slug}`;

/** Atributo que o script inline põe em <html> quando já existe escolha válida; o CSS esconde o aviso por ele. */
export const CONSENT_SET_ATTR = "data-consent-set";

/**
 * Script inline executado durante o parse do HTML, antes da primeira pintura (mesmo mecanismo do tema). O aviso de
 * cookies já vem no HTML do servidor, visível; este script só o esconde (por CSS, via atributo em <html>) quando
 * este navegador já tem uma escolha válida para a versão atual do texto. Sem JS, o aviso continua visível.
 */
export function earlyConsentScript(slug: string, version: string): string {
  return `(function(){try{
var raw=localStorage.getItem(${JSON.stringify(consentKey(slug))});if(!raw)return;
var r=JSON.parse(raw);
if((r.choice==="accepted"||r.choice==="rejected")&&r.version===${JSON.stringify(version)}&&typeof r.at==="string"&&!isNaN(Date.parse(r.at)))document.documentElement.setAttribute("${CONSENT_SET_ATTR}","1");
}catch(e){}})();`;
}

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
