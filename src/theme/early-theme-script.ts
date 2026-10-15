import { DEMO_URLS } from "@/lib/demo-urls";
import { ACTIVE_PRESET_ID, presets } from "@/presets";
import { STORAGE_KEY, STORAGE_VERSION } from "@/store/storage-key";
import { TOKEN_GROUPS } from "./tokens";

/**
 * Link antigo com ?preset=<id|apelido>: id ou apelido de OUTRO preset → URL da loja dele (NEXT_PUBLIC_DEMO_URLS).
 * Sem URL configurada para aquele preset, o parâmetro é ignorado.
 */
export const REDIRECT_BY_PRESET: Record<string, string> = Object.fromEntries(
  presets
    .filter((p) => p.id !== ACTIVE_PRESET_ID && DEMO_URLS[p.id])
    .flatMap((p) => [p.id, ...(p.shortId ? [p.shortId] : [])].map((key) => [key, DEMO_URLS[p.id]])),
);

/**
 * Script inline executado durante o parse do HTML, antes da primeira pintura. Cada build é de um preset só, então o
 * HTML do servidor já é dele; o script faz duas coisas:
 * 1. Link antigo `?preset=<outro preset>`: redireciona para a URL da loja desse preset (mantendo caminho, demais
 *    parâmetros e âncora). Sem URL configurada, ou para o próprio preset, ignora o parâmetro.
 * 2. Reaplica os tokens de tema salvos desta loja (edições), tolerando localStorage indisponível e ignorando estado
 *    salvo em versão antiga do formato ou de outro preset. O mapeamento de grupos vem de TOKEN_GROUPS.
 * A página nunca é escondida.
 */
export const EARLY_THEME_SCRIPT = `(function(){try{
var q=/[?&]preset=([^&#]*)/.exec(typeof location!=="undefined"?location.search:"");
if(q){var R=${JSON.stringify(REDIRECT_BY_PRESET)};var to=R[decodeURIComponent(q[1]).trim().toLowerCase()];
if(to&&new URL(to).origin!==location.origin){var sp=new URLSearchParams(location.search);sp.delete("preset");
var rest=sp.toString();location.replace(to+location.pathname+(rest?"?"+rest:"")+location.hash);return;}}
var raw=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});if(!raw)return;
var p=JSON.parse(raw);if(p.version!==${STORAGE_VERSION}||p.state.presetId!==${JSON.stringify(ACTIVE_PRESET_ID)})return;
var t=p.state.config.theme;var el=document.getElementById("theme-tokens");if(!t||!el)return;
var m=${JSON.stringify(TOKEN_GROUPS)};var out=[];
for(var g in m){var o=t[g];for(var k in o){out.push("--t-"+m[g]+"-"+k+":"+o[k]);}}
el.textContent=":root{"+out.join(";")+"}";
}catch(e){}})();`;
