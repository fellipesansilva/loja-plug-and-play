/**
 * Módulo de fontes de cada preset. O next.config.ts usa isto para apontar o alias "@active-fonts" ao módulo do preset do
 * build (NEXT_PUBLIC_PRESET), de modo que só as fontes dele entram no build. Sem dependências: roda no next.config.
 * Ao criar um preset novo, acrescente aqui o id/apelido dele e crie src/fonts/<nome>.ts.
 */
export const FONT_MODULE_BY_PRESET: Record<string, string> = {
  trama: "trama",
  "trama-studio": "trama",
  forno: "forno",
  "forno-da-vila": "forno",
};

/** Caminho (relativo à raiz do projeto) do módulo de fontes para o valor de NEXT_PUBLIC_PRESET; vazio ou desconhecido = Trama. */
export function fontModulePath(preset: string | undefined): string {
  const name = FONT_MODULE_BY_PRESET[preset?.trim().toLowerCase() ?? ""] ?? "trama";
  return `./src/fonts/${name}.ts`;
}
