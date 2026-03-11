import { test, expect } from "@playwright/test";

// use stubbed responses to simulate notifications behavior

test("Worker sees notification badge and can open center", async ({ page }) => {
  // stub notifications GET to return one unread
  await page.route('**/worker/notifications*', async (route) => {
    const url = route.request().url();
    const params = new URL(url).searchParams;
    if (params.get('markRead') === '1') {
      // marking read, return empty list
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ notifications: [] }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          notifications: [
            { id: 123, message: 'Tienes una tarea nueva', read: 0, created_at: new Date().toISOString() },
          ],
        }),
      });
    }
  });

  // stub patch for marking read
  let patched = false;
  await page.route('**/worker/notifications/*/read', async (route) => {
    patched = true;
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  // bypass authentication by setting localStorage token and user
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user', JSON.stringify({ role: 'OPERARIO', username: 'testuser2' }));
  });
  // navigate to worker area directly
  await page.goto('/worker');
  await expect(page).toHaveURL(/worker/i);

  // notification bell should appear with badge
  const bell = page.locator('button[aria-label="Ver notificaciones"]');
  await expect(bell).toBeVisible();
  await expect(bell.locator('.badge')).toHaveText('1');

  // open modal
  await bell.click();
  await expect(page.locator('text=Notificaciones')).toBeVisible();
  await expect(page.locator('li')).toContainText('Tienes una tarea nueva');

  // click mark read inside list
  await page.locator('button:has-text("Marcar leído")').click();
  expect(patched).toBeTruthy();
});
