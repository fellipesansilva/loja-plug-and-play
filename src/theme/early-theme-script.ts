import { STORAGE_KEY, STORAGE_VERSION } from "@/store/storage-key";
import { TOKEN_GROUPS } from "./tokens";

/**
 * Script inline executado durante o parse do HTML, antes da primeira pintura:
 * lê o preset salvo e reescreve o <style id="theme-tokens"> com os tokens salvos.
 * Tolerante a localStorage indisponível; ignora estado salvo em versão antiga do formato.
 * O mapeamento de grupos vem de TOKEN_GROUPS (mesmo de tokens.ts).
 */
export const EARLY_THEME_SCRIPT = `(function(){try{
var raw=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});if(!raw)return;
var p=JSON.parse(raw);if(p.version!==${STORAGE_VERSION})return;
var t=p.state.config.theme;var el=document.getElementById("theme-tokens");if(!t||!el)return;
var m=${JSON.stringify(TOKEN_GROUPS)};var out=[];
for(var g in m){var o=t[g];for(var k in o){out.push("--t-"+m[g]+"-"+k+":"+o[k]);}}
el.textContent=":root{"+out.join(";")+"}";
}catch(e){}})();`;
