import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_PRESET_SLUG } from "@/config";
import { STORE_ROUTES } from "@/lib/store-routes";
import { getPreset, presetBySlug, resolvePresetKey } from "@/presets";

/**
 * Redirecionamentos legados, iguais na Vercel e em `next start`:
 *   /                      -> /<padrão>
 *   /?preset=forno         -> /forno
 *   /<caminho>?preset=forno -> /forno/<caminho> (demais parâmetros preservados)
 *   /<caminho> (sem preset) -> /<padrão>/<caminho>
 * Preset desconhecido no primeiro segmento (/orbita, /xyz) passa direto e cai no 404 de verdade da rota.
 * Só o primeiro segmento decide: nomes de rotas da loja (produto, carrinho...) nunca são presets.
 */

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const [first = ""] = url.pathname.split("/").filter(Boolean);
  const requested = url.searchParams.get("preset");
  const fromQuery = requested ? resolvePresetKey(requested) : null;

  if (requested !== null) url.searchParams.delete("preset");

  // Primeiro segmento já é um preset: ?preset= extra só é descartado se for o mesmo; senão a rota vale.
  if (presetBySlug(first)) {
    if (requested === null) return NextResponse.next();
    return NextResponse.redirect(url, 308);
  }

  const isLegacyPath = first === "" || STORE_ROUTES.has(first);
  if (!isLegacyPath) return NextResponse.next(); // /xyz: 404 real

  const slug = (fromQuery && getPreset(fromQuery)?.shortId) || DEFAULT_PRESET_SLUG;
  url.pathname = url.pathname === "/" ? `/${slug}` : `/${slug}${url.pathname}`;
  return NextResponse.redirect(url, 308);
}

/**
 * O proxy só roda onde pode haver redirecionamento: "/", as rotas da loja sem preset (/carrinho, /produto/x...) e qualquer
 * caminho com ?preset=. As páginas /<preset>/..., os arquivos estáticos e as imagens ficam de fora (cada requisição no proxy é uma
 * função a mais antes do cache da Vercel). A lista de rotas repete STORE_ROUTES: o matcher precisa ser literal; o teste confere.
 */
export const config = {
  matcher: [
    "/",
    "/(busca|carrinho|condicoes-comerciais|categoria|checkout|meus-cursos|orcamento|pedido|privacidade|necessidade|produto|setor|sobre|trocas-e-devolucoes|painel)",
    "/(busca|carrinho|condicoes-comerciais|categoria|checkout|meus-cursos|orcamento|pedido|privacidade|necessidade|produto|setor|sobre|trocas-e-devolucoes|painel)/:path*",
    { source: "/((?!_next/|api/|placeholder|favicon.ico|.*\\..*).*)", has: [{ type: "query", key: "preset" }] },
  ],
};
