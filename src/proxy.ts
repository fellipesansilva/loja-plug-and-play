import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_PRESET_SLUG } from "@/config";
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
const STORE_ROUTES = new Set([
  "busca",
  "carrinho",
  "condicoes-comerciais",
  "categoria",
  "checkout",
  "orcamento",
  "pedido",
  "privacidade",
  "produto",
  "sobre",
  "trocas-e-devolucoes",
  "painel",
]);

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

export const config = {
  matcher: ["/((?!_next/|api/|placeholder|favicon.ico|.*\\..*).*)"],
};
