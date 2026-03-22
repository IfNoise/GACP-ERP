import { test, expect } from '@playwright/test';

test.describe('Training Module', () => {
  test.skip(true, 'Requires running backend services');

  test('training sessions page loads', async ({ page }) => {
    await page.goto('/workforce/training');
    await expect(page.locator('h1')).toContainText(/training/i);
  });

  test('schedule new training session', async ({ page }) => {
    await page.goto('/workforce/training/new');
    await page.fill('[name="title"]', 'Test Training');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/workforce\/training/);
  });

  test('employee list page loads', async ({ page }) => {
    await page.goto('/workforce/employees');
    await expect(page.locator('h1')).toContainText(/employee/i);
  });

  test('task management page loads', async ({ page }) => {
    await page.goto('/workforce/tasks');
    await expect(page.locator('h1')).toContainText(/task/i);
  });
});
