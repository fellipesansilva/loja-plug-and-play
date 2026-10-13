import { STORAGE_KEY } from "@/store/storage-key";

/**
 * Script inline executado durante o parse do HTML, antes da primeira pintura:
 * lê o preset salvo e reescreve o <style id="theme-tokens"> com os tokens salvos.
 * Tolerante a localStorage indisponível. Deve manter o mesmo mapeamento de tokens.ts
 * (garantido por early-theme-script.test.ts).
 */
export const EARLY_THEME_SCRIPT = `(function(){try{
var raw=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});if(!raw)return;
var t=JSON.parse(raw).state.config.theme;var el=document.getElementById("theme-tokens");if(!t||!el)return;
var m={colors:"color",fonts:"font",radii:"radius",spacing:"space"};var out=[];
for(var g in m){var o=t[g];for(var k in o){out.push("--t-"+m[g]+"-"+k+":"+o[k]);}}
el.textContent=":root{"+out.join(";")+"}";
}catch(e){}})();`;
