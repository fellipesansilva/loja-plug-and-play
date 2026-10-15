import { presets } from "@/presets";
import { STORAGE_KEY, STORAGE_VERSION } from "@/store/storage-key";
import { TOKEN_GROUPS, tokensToCss } from "./tokens";

/** CSS de tokens por id e por apelido de preset: o script aplica o preset do link direto (`?preset=`) antes da 1ª pintura. */
const CSS_BY_PRESET: Record<string, string> = Object.fromEntries(
  presets.flatMap((p) => [p.id, ...(p.shortId ? [p.shortId] : [])].map((key) => [key, tokensToCss(p.config.theme)])),
);

/**
 * Script inline executado durante o parse do HTML, antes da primeira pintura:
 * lê o preset salvo e reescreve o <style id="theme-tokens"> com os tokens salvos.
 * Tolerante a localStorage indisponível; ignora estado salvo em versão antiga do formato.
 * Com `?preset=<id|apelido>` válido, usa os tokens desse preset e esconde a página (data-preset-pending) até a vitrine
 * trocar o conteúdo, para a Trama padrão do HTML inicial nunca aparecer. O mapeamento de grupos vem de TOKEN_GROUPS.
 */
export const EARLY_THEME_SCRIPT = `(function(){try{
var q=/[?&]preset=([^&#]*)/.exec(typeof location!=="undefined"?location.search:"");
if(q){var P=${JSON.stringify(CSS_BY_PRESET)};var css=P[decodeURIComponent(q[1]).trim().toLowerCase()];
var st=document.getElementById("theme-tokens");
if(css&&st){st.textContent=css;document.documentElement.setAttribute("data-preset-pending","");
setTimeout(function(){document.documentElement.removeAttribute("data-preset-pending")},4000);return;}}
var raw=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});if(!raw)return;
var p=JSON.parse(raw);if(p.version!==${STORAGE_VERSION})return;
var t=p.state.config.theme;var el=document.getElementById("theme-tokens");if(!t||!el)return;
var m=${JSON.stringify(TOKEN_GROUPS)};var out=[];
for(var g in m){var o=t[g];for(var k in o){out.push("--t-"+m[g]+"-"+k+":"+o[k]);}}
el.textContent=":root{"+out.join(";")+"}";
}catch(e){}})();`;
