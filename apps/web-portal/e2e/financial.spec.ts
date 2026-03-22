import { test, expect } from '@playwright/test';

test.describe('Financial Module', () => {
  test.skip(true, 'Requires running backend services');

  test('journal entries page loads', async ({ page }) => {
    await page.goto('/financial/journal-entries');
    await expect(page.locator('h1')).toContainText(/journal/i);
  });

  test('create journal entry', async ({ page }) => {
    await page.goto('/financial/journal-entries/new');
    await page.fill('[name="description"]', 'Test GL Entry');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/financial\/journal-entries/);
  });

  test('general ledger page loads', async ({ page }) => {
    await page.goto('/financial/general-ledger');
    await expect(page.locator('h1')).toContainText(/ledger/i);
  });

  test('procurement page loads', async ({ page }) => {
    await page.goto('/financial/procurement');
    await expect(page.locator('h1')).toContainText(/procurement|purchase/i);
  });
});
