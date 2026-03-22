import { test, expect } from '@playwright/test';

test.describe('IoT Dashboard', () => {
  test.skip(true, 'Requires running backend services');

  test('IoT dashboard page loads', async ({ page }) => {
    await page.goto('/iot');
    await expect(page.locator('h1')).toContainText(/iot|sensor|dashboard/i);
  });

  test('sensor data displays in table', async ({ page }) => {
    await page.goto('/iot');
    await expect(page.locator('table')).toBeVisible();
  });

  test('threshold management page loads', async ({ page }) => {
    await page.goto('/iot/thresholds');
    await expect(page.locator('h1')).toContainText(/threshold/i);
  });

  test('alert history page loads', async ({ page }) => {
    await page.goto('/iot/alerts');
    await expect(page.locator('h1')).toContainText(/alert/i);
  });
});
