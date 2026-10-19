/**
 * Primeiro segmento das rotas da loja (produto, carrinho...): nomes que nunca são presets. Quem usa: o proxy (redireciona
 * /carrinho para /<padrão>/carrinho) e o teste que confere o matcher do proxy. Ao criar uma rota nova da loja, inclua o nome aqui
 * e na lista do matcher em src/proxy.ts.
 */
export const STORE_ROUTES: ReadonlySet<string> = new Set([
  "busca",
  "carrinho",
  "condicoes-comerciais",
  "categoria",
  "checkout",
  "meus-cursos",
  "orcamento",
  "pedido",
  "privacidade",
  "necessidade",
  "produto",
  "setor",
  "sobre",
  "trocas-e-devolucoes",
  "painel",
]);
