import { test, expect } from "@playwright/test";

test("Login y entra al dashboard", async ({ page }) => {
  await page.goto("/");

  // Espera a que haya algún input (pantalla lista)
  await page.waitForSelector("input");

  // USER: intenta varios patrones comunes
  const user = page.locator(
    'input[name="username"], input[name="user"], input[name="email"], input[type="email"], input[placeholder*="usuario" i], input[placeholder*="email" i], input[placeholder*="correo" i]'
  ).first();

  const pass = page.locator(
    'input[name="password"], input[type="password"], input[placeholder*="contraseña" i], input[placeholder*="password" i]'
  ).first();

  await user.fill("admin");
  await pass.fill("admin123");

  // Botón
  await page
    .locator('button:has-text("Ingresar"), button:has-text("Login"), button[type="submit"]')
    .first()
    .click();

  // Validación (ajustá al texto que aparece post-login)
  await expect(page.locator("body")).toContainText(/panel admin|dashboard admin|panel/i);
});