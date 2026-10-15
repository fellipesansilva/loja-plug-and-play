import { expect, test } from "@playwright/test";

// Build de produção "puro" (Trama, sem NEXT_PUBLIC_EXPOSE_STORE), na porta 3413: ver playwright.config.ts.
const PROD = "http://localhost:3413";

test("build de produção não expõe window.__demoStore", async ({ page }) => {
  test.skip(test.info().project.metadata.preset !== "trama-studio", "um projeto basta para conferir o build de produção");
  await page.goto(PROD + "/");
  await expect(page.getByTestId("store-name")).toHaveText("Trama Studio");
  // aguarda a hidratação concluir (o botão Demo é interativo)
  await page.getByRole("button", { name: "Demo", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Controles da demo" })).toBeVisible();
  expect(await page.evaluate(() => "__demoStore" in window)).toBe(false);
});
