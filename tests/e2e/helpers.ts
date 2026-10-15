import { expect, test, type Page } from "@playwright/test";

/** Ids dos presets. Cada preset é um build (e um projeto do Playwright) próprio: ver playwright.config.ts. */
export const TRAMA = "trama-studio";
export const FORNO = "forno-da-vila";

export const NAME: Record<string, string> = { [TRAMA]: "Trama Studio", [FORNO]: "Forno da Vila" };
export const SHORT: Record<string, string> = { [TRAMA]: "trama", [FORNO]: "forno" };
/** Portas dos builds de teste (3000 é de outro projeto; nunca usar). */
export const PORT: Record<string, number> = { [TRAMA]: 3411, [FORNO]: 3412 };
export const URL_OF: Record<string, string> = {
  [TRAMA]: `http://localhost:${PORT[TRAMA]}`,
  [FORNO]: `http://localhost:${PORT[FORNO]}`,
};

/** Preset do build contra o qual o teste está rodando (metadata do projeto do Playwright). */
export function currentPreset(): string {
  return test.info().project.metadata.preset as string;
}

/** Chave do localStorage da loja deste build (separada por preset). */
export const storageKey = (preset: string = currentPreset()): string => `loja-demo-v1-${SHORT[preset]}`;

/**
 * Abre uma rota da loja deste build e espera a hidratação. O teste é escrito para um preset: nos outros builds ele é
 * pulado (cada preset é uma loja própria, não dá para "trocar" de preset dentro da mesma loja).
 */
export async function openAs(page: Page, preset: string, route = "/") {
  test.skip(currentPreset() !== preset, `só roda no build ${SHORT[preset]}`);
  await page.goto(route);
  // espera a hidratação terminar (cliques em links logo após o carregamento podem ser perdidos)
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => !!window.__demoStore);
  await expect(page.getByTestId("store-name")).toHaveAccessibleName(NAME[preset]);
}

/** Nome da loja deste build (para testes que valem para qualquer preset). */
export const storeName = (): string => NAME[currentPreset()];
