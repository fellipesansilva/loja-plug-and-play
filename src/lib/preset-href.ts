/**
 * Prefixa um caminho interno com o segmento do preset: "/carrinho" → "/forno/carrinho", "/" → "/forno".
 * Não mexe em âncoras ("#topo"), endereços externos ("https://…"), caminhos relativos nem em caminhos que já
 * começam pelo prefixo. Query e âncora do caminho são preservadas.
 */
export function prefixHref(slug: string, href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  if (href === `/${slug}` || href.startsWith(`/${slug}/`) || href.startsWith(`/${slug}?`) || href.startsWith(`/${slug}#`)) {
    return href;
  }
  if (href === "/" || href.startsWith("/?") || href.startsWith("/#")) return `/${slug}${href.slice(1)}`;
  return `/${slug}${href}`;
}

/** O inverso, para decidir "em que tela estou": "/forno/painel/produtos" → "/painel/produtos". */
export function stripPresetPrefix(slug: string, pathname: string): string {
  if (pathname === `/${slug}`) return "/";
  return pathname.startsWith(`/${slug}/`) ? pathname.slice(slug.length + 1) : pathname;
}
