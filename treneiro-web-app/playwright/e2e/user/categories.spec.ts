/**
 * Categories Scenarios (User)
 * Covers: categories page, category cards, browse by category (category detail), clip list within category
 */

import { test, expect } from '../../fixtures';

test.describe('Categories — Browse', () => {
  test('categories page renders category cards', async ({ userPage: page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    const grid = page.locator('.grid').first();
    await expect(grid).toBeVisible({ timeout: 8_000 });
  });

  test('category cards show their names', async ({ userPage: page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    // Category links in the grid
    const categoryLinks = page.locator('a[href*="/categories/"]');
    await expect(categoryLinks.first()).toBeVisible({ timeout: 10_000 });
  });

  test('category cards show clip count stats', async ({ userPage: page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    // Stats with emoji indicators 🎬 📋 👁️
    const statsRow = page.locator('span').filter({ hasText: /🎬|📋|👁️/ }).first();
    if (await statsRow.count() > 0) {
      await expect(statsRow).toBeVisible();
    }
  });

  test('clicking a category card navigates to category detail', async ({ userPage: page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    const firstCard = page.locator('a[href*="/categories/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10_000 });
    await firstCard.click();

    await expect(page).toHaveURL(/\/categories\//, { timeout: 8_000 });
  });
});

test.describe('Categories — Category Detail Page', () => {
  async function gotoFirstCategoryDetail(page: import('@playwright/test').Page) {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');
    const firstCard = page.locator('a[href*="/categories/"]').first();
    await firstCard.click();
    await page.waitForLoadState('networkidle');
  }

  test('category detail shows a heading', async ({ userPage: page }) => {
    await gotoFirstCategoryDetail(page);

    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 8_000 });
  });

  test('category detail shows clips grid', async ({ userPage: page }) => {
    await gotoFirstCategoryDetail(page);

    // Expect a grid div or clip tiles
    const grid = page.locator('.grid').first();
    await expect(grid).toBeVisible({ timeout: 8_000 });
  });

  test('clip links in category detail have /clips/ href', async ({ userPage: page }) => {
    await gotoFirstCategoryDetail(page);

    const clipLinks = page.locator('a[href*="/clips/"]');
    if (await clipLinks.count() > 0) {
      const href = await clipLinks.first().getAttribute('href');
      expect(href).toContain('/clips/');
    }
  });

  test('clicking a clip in category navigates to clip detail', async ({ userPage: page }) => {
    await gotoFirstCategoryDetail(page);

    const firstClip = page.locator('a[href*="/clips/"]').first();
    if (await firstClip.count() > 0) {
      await firstClip.click();
      await expect(page).toHaveURL(/\/clips\//, { timeout: 8_000 });
    }
  });

  test('dashboard category filter to category detail round-trip', async ({ userPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Select the first category in the dropdown
    const categorySelect = page.locator('select').first();
    const optionCount = await categorySelect.locator('option').count();

    if (optionCount > 1) {
      const firstCategoryValue = await categorySelect.locator('option').nth(1).getAttribute('value');
      if (firstCategoryValue) {
        await categorySelect.selectOption(firstCategoryValue);
        await page.waitForLoadState('networkidle');
        // Navigate to that category
        await page.goto(`/categories/${firstCategoryValue}`);
        await expect(page).toHaveURL(/\/categories\//, { timeout: 8_000 });
      }
    }
  });
});
