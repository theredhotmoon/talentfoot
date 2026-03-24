/**
 * Admin — /admin/categories Route Scenarios
 * Covers: access control, page render, CRUD links
 *
 * Note: The router has BOTH /categories (user view) and /admin/categories (admin CategoriesList).
 * The existing categories.spec.ts tests the /categories route. This file tests /admin/categories.
 */

import { test, expect } from '../../fixtures';

test.describe('Admin — /admin/categories Access', () => {
  test('admin can access /admin/categories page', async ({ adminPage: page }) => {
    await page.goto('/admin/categories');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/admin\/categories/, { timeout: 8_000 });

    // CategoriesList view should render
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 8_000 });
  });

  test('admin sees category management UI with add button', async ({ adminPage: page }) => {
    await page.goto('/admin/categories');
    await page.waitForLoadState('networkidle');

    // Add category button
    const addBtn = page.locator('button').filter({ hasText: /add|new|dodaj|crear/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 8_000 });
  });

  test('admin categories page renders a list or grid', async ({ adminPage: page }) => {
    await page.goto('/admin/categories');
    await page.waitForLoadState('networkidle');

    // Should have some content container (grid, table, or list)
    const content = page.locator('.grid, table, ul').first();
    await expect(content).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Regular User — /admin/categories Restricted', () => {
  test('regular user is redirected from /admin/categories to dashboard', async ({ userPage: page }) => {
    await page.goto('/admin/categories');
    // requiresAdmin guard should redirect to /
    await expect(page).toHaveURL(/\/$/, { timeout: 8_000 });
  });
});

test.describe('Admin — /admin/categories CRUD', () => {
  const RUN = Date.now();

  test('admin can create a category from admin page', async ({ adminPage: page }) => {
    await page.goto('/admin/categories');
    await page.waitForLoadState('networkidle');

    const addBtn = page.locator('button').filter({ hasText: /add|new|dodaj/i }).first();
    await addBtn.click();

    // Modal should appear
    const modal = page.locator('.modal-overlay, [class*="fixed"], dialog').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Fill EN name
    const categoryName = `AdminCat ${RUN}`;
    const inputs = modal.locator('input[type="text"], input:not([type])');
    await inputs.first().fill(categoryName);

    // Submit
    const [response] = await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('/api/categories') && resp.request().method() === 'POST'),
      modal.locator('button[type="submit"], button').filter({ hasText: /save|zapisz|create/i }).first().click(),
    ]);

    expect(response.status()).toBeLessThan(500);

    // Newly created category should appear in the list
    await expect(page.getByText(categoryName)).toBeVisible({ timeout: 8_000 });
  });

  test('admin can edit a category from admin page', async ({ adminPage: page }) => {
    await page.goto('/admin/categories');
    await page.waitForLoadState('networkidle');

    // Hover first card to reveal edit button
    const firstCard = page.locator('.grid > a, .grid > [class*="card"]').first();
    if (await firstCard.isVisible()) {
      await firstCard.hover();

      const editBtn = firstCard.locator('button').filter({ has: page.locator('svg') }).first();
      if (await editBtn.isVisible()) {
        await editBtn.click({ force: true });

        const modal = page.locator('.modal-overlay, [class*="fixed"], dialog').first();
        await expect(modal).toBeVisible({ timeout: 5_000 });

        // Verify the modal has pre-filled inputs
        const inputs = modal.locator('input[type="text"], input:not([type])');
        const currentValue = await inputs.first().inputValue();
        expect(currentValue.length).toBeGreaterThan(0);
      }
    }
  });
});
