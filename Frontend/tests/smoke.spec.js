import { test, expect } from "@playwright/test";

test("Front levanta y muestra login", async ({ page }) => {
  await page.goto("/");
  // Ajustá este texto a algo que tengas seguro en Login
  await expect(page.locator("body")).toContainText(/login|ingresar|usuario/i);
});