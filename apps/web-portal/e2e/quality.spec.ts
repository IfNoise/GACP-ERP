import { test, expect } from '@playwright/test';

test.describe('Quality Workflows', () => {
  test.skip(true, 'Requires running backend services');

  test('deviation list page loads', async ({ page }) => {
    await page.goto('/quality/deviations');
    await expect(page.locator('h1')).toContainText(/deviation/i);
  });

  test('create deviation and submit', async ({ page }) => {
    await page.goto('/quality/deviations/new');
    await page.fill('[name="title"]', 'Test Deviation');
    await page.fill('[name="description"]', 'Automated test deviation');
    await page.selectOption('[name="severity"]', 'MAJOR');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/quality\/deviations\//);
  });

  test('CAPA list page loads', async ({ page }) => {
    await page.goto('/quality/capas');
    await expect(page.locator('h1')).toContainText(/capa/i);
  });

  test('change control workflow page loads', async ({ page }) => {
    await page.goto('/quality/change-controls');
    await expect(page.locator('h1')).toContainText(/change control/i);
  });

  test('validation protocols page loads', async ({ page }) => {
    await page.goto('/quality/validation-protocols');
    await expect(page.locator('h1')).toContainText(/validation/i);
  });
});
