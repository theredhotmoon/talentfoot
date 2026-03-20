/**
 * Admin — Category Management Scenarios
 * Covers: create, edit, delete categories; category detail navigation
 */

import { test, expect } from '../../fixtures';

const RUN = Date.now();

test.describe('Admin — Categories List', () => {
  test('categories page renders category cards', async ({ adminPage: page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    const grid = page.locator('.grid').first();
    await expect(grid).toBeVisible({ timeout: 8_000 });
  });

  test('Add New button is visible for admin', async ({ adminPage: page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    const addBtn = page.locator('button').filter({ hasText: /add|new|dodaj/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Admin — Create Category', () => {
  test('opens create modal and creates a new category', async ({ adminPage: page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    const addBtn = page.locator('button').filter({ hasText: /add|new|dodaj/i }).first();
    await addBtn.click();

    // Modal should appear — EditCategoryModal
    const modal = page.locator('.modal-overlay, [class*="fixed"], dialog').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Fill in EN name (first text input in modal)
    const enName = `TestCat ${RUN}`;
    const inputs = modal.locator('input[type="text"], input:not([type])');
    await inputs.first().fill(enName);

    // Submit
    const [response] = await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('/api/categories') && resp.request().method() === 'POST'),
      modal.locator('button[type="submit"], button').filter({ hasText: /save|zapisz|create/i }).first().click(),
    ]);

    expect(response.status()).toBeLessThan(500);

    // New category should appear in the list
    await expect(page.getByText(enName)).toBeVisible({ timeout: 8_000 });
  });

  test('cancel button closes modal without creating', async ({ adminPage: page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    const addBtn = page.locator('button').filter({ hasText: /add|new|dodaj/i }).first();
    await addBtn.click();

    const modal = page.locator('.modal-overlay, [class*="fixed"], dialog').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    const cancelBtn = modal.locator('button').filter({ hasText: /cancel|anuluj/i }).first();
    if (await cancelBtn.count() > 0) {
      await cancelBtn.click();
      await expect(modal).not.toBeVisible({ timeout: 5_000 });
    }
  });
});

test.describe('Admin — Edit Category', () => {
  test('edit category modal opens on hover+click of edit icon', async ({ adminPage: page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    // Hover the first card to reveal the edit button
    const firstCard = page.locator('.grid > a, .grid > [class*="card"]').first();
    await firstCard.hover();

    // Edit button (pencil icon) inside the card
    const editBtn = firstCard.locator('button').filter({ has: page.locator('svg') }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click({ force: true });

      const modal = page.locator('.modal-overlay, [class*="fixed"], dialog').first();
      await expect(modal).toBeVisible({ timeout: 5_000 });

      // Change the EN name
      const inputs = modal.locator('input[type="text"], input:not([type])');
      const updatedName = `EditedCat ${RUN}`;
      await inputs.first().fill(updatedName);

      const [response] = await Promise.all([
        page.waitForResponse((resp) => resp.url().includes('/api/categories/') && resp.request().method() === 'PUT'),
        modal.locator('button[type="submit"], button').filter({ hasText: /save|zapisz|update/i }).first().click(),
      ]);

      expect(response.status()).toBeLessThan(500);
    }
  });
});

test.describe('Admin — Delete Category', () => {
  test('creates and then deletes a category', async ({ adminPage: page }) => {
    const catName = `DelCat ${RUN}`;

    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    // Create first
    const addBtn = page.locator('button').filter({ hasText: /add|new|dodaj/i }).first();
    await addBtn.click();

    const modal = page.locator('.modal-overlay, [class*="fixed"], dialog').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    const inputs = modal.locator('input[type="text"], input:not([type])');
    await inputs.first().fill(catName);

    await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('/api/categories') && resp.request().method() === 'POST'),
      modal.locator('button[type="submit"], button').filter({ hasText: /save|zapisz|create/i }).first().click(),
    ]);

    await expect(page.getByText(catName)).toBeVisible({ timeout: 8_000 });

    // Now find and hover its card to reveal delete
    const cards = page.locator('.grid > a');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const text = await card.textContent();
      if (text?.includes(catName)) {
        await card.hover();
        const deleteBtn = card.locator('button[class*="red"], button').last();
        page.once('dialog', (dialog) => dialog.accept());
        await Promise.all([
          page.waitForResponse((resp) => resp.url().includes('/api/categories/') && resp.request().method() === 'DELETE'),
          deleteBtn.click({ force: true }),
        ]);
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(catName)).not.toBeVisible({ timeout: 8_000 });
        break;
      }
    }
  });
});

test.describe('Admin — Category Detail Navigation', () => {
  test('clicking a category card navigates to category detail', async ({ adminPage: page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    const firstCard = page.locator('a[href*="/categories/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 8_000 });
    await firstCard.click();

    await expect(page).toHaveURL(/\/categories\//, { timeout: 8_000 });
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});
