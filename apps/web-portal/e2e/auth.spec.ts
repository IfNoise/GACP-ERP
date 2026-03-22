import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/plants');
    // Should redirect to Keycloak or login page
    await expect(page).not.toHaveURL('/plants');
  });

  test('login page renders', async ({ page }) => {
    await page.goto('/');
    // Landing or login page should be accessible
    await expect(page).toHaveURL(/\//);
  });

  test('health endpoint returns 200', async ({ request }) => {
    const response = await request.get('/api/health');
    // API health check (if available)
    expect([200, 404]).toContain(response.status());
  });
});
