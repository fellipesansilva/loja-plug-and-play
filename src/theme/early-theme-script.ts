import { getPreset } from "@/presets";
import { STORAGE_VERSION, storageKeyFor } from "@/store/storage-key";
import { TOKEN_GROUPS } from "./tokens";

/**
 * Script inline executado durante o parse do HTML, antes da primeira pintura. Cada página já nasce no preset da rota
 * (o HTML do servidor é dele); o script só reaplica os tokens de tema salvos desta loja (edições), tolerando
 * localStorage indisponível e ignorando estado salvo em versão antiga do formato ou de outro preset.
 * O mapeamento de grupos vem de TOKEN_GROUPS. A página nunca é escondida.
 */
export function earlyThemeScript(presetId: string): string {
  const preset = getPreset(presetId);
  if (!preset) throw new Error(`Preset desconhecido: ${presetId}`);
  return `(function(){try{
var raw=localStorage.getItem(${JSON.stringify(storageKeyFor(preset.shortId))});if(!raw)return;
var p=JSON.parse(raw);if(p.version!==${STORAGE_VERSION}||p.state.presetId!==${JSON.stringify(preset.id)})return;
var t=p.state.config.theme;var el=document.getElementById("theme-tokens");if(!t||!el)return;
var m=${JSON.stringify(TOKEN_GROUPS)};var out=[];
for(var g in m){var o=t[g];for(var k in o){out.push("--t-"+m[g]+"-"+k+":"+o[k]);}}
el.textContent=":root{"+out.join(";")+"}";
}catch(e){}})();`;
}
