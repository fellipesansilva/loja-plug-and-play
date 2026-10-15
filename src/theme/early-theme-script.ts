import { DEFAULT_PRESET_ID, presets } from "@/presets";
import { STORAGE_KEY, STORAGE_VERSION } from "@/store/storage-key";
import { TOKEN_GROUPS, tokensToCss } from "./tokens";

/** CSS de tokens por id e por apelido de preset: o script aplica o preset do link direto (`?preset=`) antes da 1ª pintura. */
const CSS_BY_PRESET: Record<string, string> = Object.fromEntries(
  presets.flatMap((p) => [p.id, ...(p.shortId ? [p.shortId] : [])].map((key) => [key, tokensToCss(p.config.theme)])),
);

/**
 * Foto principal (banner) da home de cada preset que NÃO é o padrão, por id e por apelido. O HTML do servidor só traz a
 * imagem do preset padrão, então, quando outro preset é pedido, o script pré-carrega a dele em paralelo ao JS.
 */
const BANNER_BY_PRESET: Record<string, string> = Object.fromEntries(
  presets
    .filter((p) => p.id !== DEFAULT_PRESET_ID)
    .flatMap((p) => {
      const banner = p.config.homeBlocks.find((b) => b.enabled && b.type === "banner");
      return banner && banner.type === "banner"
        ? [p.id, ...(p.shortId ? [p.shortId] : [])].map((key) => [key, banner.image.src])
        : [];
    }),
);

/**
 * Script inline executado durante o parse do HTML, antes da primeira pintura:
 * lê o preset salvo e reescreve o <style id="theme-tokens"> com os tokens salvos.
 * Tolerante a localStorage indisponível; ignora estado salvo em versão antiga do formato.
 * Com `?preset=<id|apelido>` válido, usa os tokens desse preset e esconde a página (data-preset-pending) até a vitrine
 * trocar o conteúdo, para a Trama padrão do HTML inicial nunca aparecer. O mesmo vale quando o preset SALVO é diferente do
 * padrão: o HTML do servidor é sempre do preset padrão e o store só lê o localStorage depois de montar (skipHydration),
 * então sem isso o preset padrão apareceria por instantes. O ThemeProvider tira o atributo depois de aplicar o preset.
 * Só na home (`/`) e só para presets diferentes do padrão, injeta `<link rel="preload" as="image">` da foto principal
 * do preset pedido (ou salvo), para ela baixar enquanto o JS carrega. O mapeamento de grupos vem de TOKEN_GROUPS.
 */
export const EARLY_THEME_SCRIPT = `(function(){try{
var B=${JSON.stringify(BANNER_BY_PRESET)};
function pre(k){var u=B[k];if(!u||typeof location==="undefined"||location.pathname!=="/"||!document.head)return;
var l=document.createElement("link");l.rel="preload";l.as="image";l.href=u;l.setAttribute("fetchpriority","high");document.head.appendChild(l);}
var q=/[?&]preset=([^&#]*)/.exec(typeof location!=="undefined"?location.search:"");
if(q){var P=${JSON.stringify(CSS_BY_PRESET)};var key=decodeURIComponent(q[1]).trim().toLowerCase();var css=P[key];
var st=document.getElementById("theme-tokens");
if(css&&st){st.textContent=css;document.documentElement.setAttribute("data-preset-pending","");
setTimeout(function(){document.documentElement.removeAttribute("data-preset-pending")},4000);pre(key);return;}}
var raw=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});if(!raw)return;
var p=JSON.parse(raw);if(p.version!==${STORAGE_VERSION})return;
var t=p.state.config.theme;var el=document.getElementById("theme-tokens");if(!t||!el)return;
var m=${JSON.stringify(TOKEN_GROUPS)};var out=[];
for(var g in m){var o=t[g];for(var k in o){out.push("--t-"+m[g]+"-"+k+":"+o[k]);}}
el.textContent=":root{"+out.join(";")+"}";
if(p.state.presetId&&p.state.presetId!==${JSON.stringify(DEFAULT_PRESET_ID)}&&document.documentElement){
document.documentElement.setAttribute("data-preset-pending","");
setTimeout(function(){document.documentElement.removeAttribute("data-preset-pending")},4000);pre(p.state.presetId);}
}catch(e){}})();`;
