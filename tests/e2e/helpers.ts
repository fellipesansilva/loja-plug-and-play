import { expect, test as base, type APIRequestContext, type Page } from "@playwright/test";

/** Ids dos presets. Os dois projetos do Playwright apontam para o MESMO servidor; cada um testa o seu prefixo (/trama, /forno). */
export const TRAMA = "trama-studio";
export const FORNO = "forno-da-vila";

export const NAME: Record<string, string> = { [TRAMA]: "Trama Studio", [FORNO]: "Forno da Vila" };
export const SHORT: Record<string, string> = { [TRAMA]: "trama", [FORNO]: "forno" };
/** Porta do servidor de teste (3000 é de outro projeto; nunca usar). */
export const PORT = 3411;
export const ORIGIN = `http://localhost:${PORT}`;
/** Endereço da home de cada loja. */
export const URL_OF: Record<string, string> = { [TRAMA]: `${ORIGIN}/trama`, [FORNO]: `${ORIGIN}/forno` };

/** Preset contra o qual o teste está rodando (metadata do projeto do Playwright). */
export function currentPreset(): string {
  return base.info().project.metadata.preset as string;
}

/** Prefixa caminhos da loja com o preset do projeto: "/carrinho" → "/forno/carrinho". Endereços completos não mudam. */
export function inStore(url: string, preset: string = currentPreset()): string {
  if (!url.startsWith("/")) return url;
  const slug = SHORT[preset];
  if (url === "/") return `/${slug}`;
  if (url === `/${slug}` || url.startsWith(`/${slug}/`) || url.startsWith(`/${slug}?`)) return url;
  return `/${slug}${url}`;
}

/**
 * `test` com page.goto e request.get que já entram na loja do projeto: os specs escrevem "/carrinho" e a requisição
 * vai para "/<preset>/carrinho". Para testar o endereço cru (redirecionamentos, 404) use `raw(page)` / `rawRequest`.
 */
export const test = base.extend<{ page: Page; request: APIRequestContext; seedConsent: boolean }>({
  // Por padrão a escolha de cookies já vem gravada (recusada), para o aviso não ficar na frente dos testes de outras telas.
  // Os testes do aviso usam `test.use({ seedConsent: false })` para a primeira visita de verdade.
  seedConsent: [true, { option: true }],
  page: async ({ page, seedConsent }, provide) => {
    if (seedConsent) {
      await page.addInitScript(
        ([key, version]) => {
          try {
            if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ choice: "rejected", at: "2026-01-01T00:00:00.000Z", version }));
          } catch {}
        },
        [consentStorageKey(), "1"],
      );
    }
    const goto = page.goto.bind(page);
    page.goto = ((url: string, options?: Parameters<Page["goto"]>[1]) => goto(inStore(url), options)) as Page["goto"];
    await provide(page);
  },
  request: async ({ request }, provide) => {
    const get = request.get.bind(request);
    request.get = ((url: string, options?: Parameters<APIRequestContext["get"]>[1]) => get(inStore(url), options)) as APIRequestContext["get"];
    await provide(request);
  },
});
export { expect };

/** Chave do localStorage da escolha de cookies da loja deste projeto. */
export const consentStorageKey = (preset: string = currentPreset()): string => `loja-consent-v1-${SHORT[preset]}`;

/** Chave do localStorage da loja deste projeto (separada por preset). */
export const storageKey = (preset: string = currentPreset()): string => `loja-demo-v1-${SHORT[preset]}`;

/**
 * Abre uma rota da loja e espera a hidratação. O teste é escrito para um preset: no outro projeto ele é pulado
 * (cada preset é uma loja própria; o teste de uma não roda na outra).
 */
export async function openAs(page: Page, preset: string, route = "/") {
  base.skip(currentPreset() !== preset, `só roda na loja ${SHORT[preset]}`);
  await page.goto(route);
  // espera a hidratação terminar (cliques em links logo após o carregamento podem ser perdidos)
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => !!window.__demoStore);
  await expect(page.getByTestId("store-name")).toHaveAccessibleName(NAME[preset]);
}

/** Nome da loja deste projeto (para testes que valem para qualquer preset). */
export const storeName = (): string => NAME[currentPreset()];
