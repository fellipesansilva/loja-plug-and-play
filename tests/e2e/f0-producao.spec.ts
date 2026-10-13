import { expect, test } from "@playwright/test";

const PROD = "http://localhost:3412";

test("build de produção não expõe window.__demoStore", async ({ page }) => {
  await page.goto(PROD + "/");
  await expect(page.getByTestId("store-name")).toHaveText("Trama Studio");
  // aguarda a hidratação concluir (o botão Demo é interativo)
  await page.getByRole("button", { name: "Demo", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Controles da demo" })).toBeVisible();
  expect(await page.evaluate(() => "__demoStore" in window)).toBe(false);
});
