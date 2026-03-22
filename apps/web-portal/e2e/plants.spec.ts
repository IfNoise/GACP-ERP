import { test, expect } from '@playwright/test';

test.describe('Plant Lifecycle', () => {
  // These tests require authenticated session — use storageState from auth setup
  test.skip(true, 'Requires running backend services');

  test('plant list page loads', async ({ page }) => {
    await page.goto('/plants');
    await expect(page.locator('h1')).toContainText(/plant/i);
  });

  test('navigate to create plant form', async ({ page }) => {
    await page.goto('/plants');
    await page.click('text=New Plant');
    await expect(page).toHaveURL(/\/plants\/new/);
  });

  test('create plant and verify in list', async ({ page }) => {
    await page.goto('/plants/new');
    await page.fill('[name="strain"]', 'Test Strain');
    await page.fill('[name="genetic_origin"]', 'Lab Clone');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/plants\//);
  });

  test('view plant detail with audit trail', async ({ page }) => {
    await page.goto('/plants');
    await page.click('table tbody tr:first-child');
    await expect(page.locator('[data-testid="audit-trail"]')).toBeVisible();
  });
});
