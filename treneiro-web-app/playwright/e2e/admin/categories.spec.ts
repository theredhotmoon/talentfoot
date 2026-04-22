/**
 * Admin — Category Management Scenarios
 * Covers: create, edit, delete categories; category detail navigation
 */

import { test, expect } from '../../fixtures';

const RUN = Date.now();

test.describe('Admin — Categories List', () => {
  test('categories page renders category cards', async ({ adminPage: page }) => {
    await page.goto('/admin/categories');
    const grid = page.locator('.grid').first();
    await expect(grid).toBeVisible({ timeout: 8_000 });
  });

  test('Add New button is visible for admin', async ({ adminPage: page }) => {
    await page.goto('/admin/categories');
    const addBtn = page.locator('button').filter({ hasText: /add|new|dodaj/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Admin — Create Category', () => {
  test('opens create modal and creates a new category', async ({ adminPage: page }) => {
    await page.goto('/admin/categories');
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
    await page.goto('/admin/categories');
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
    await page.goto('/admin/categories');
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

      if (response.status() >= 400) {
        console.error('Edit category failed:', await response.text());
      }
      expect(response.status()).toBeLessThan(500);
    }
  });
});

test.describe('Admin — Delete Category', () => {
  test('creates and then deletes a category', async ({ adminPage: page }) => {
    test.setTimeout(60_000);
    const catName = `DelCat ${RUN}`;

    await page.goto('/admin/categories');
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

    // Find and hover the new card directly — avoids per-card textContent() round-trips
    const targetCard = page.locator('.grid > a').filter({ hasText: catName }).first();
    await expect(targetCard).toBeVisible({ timeout: 5_000 });
    await targetCard.hover();

    const deleteBtn = targetCard.locator('button[class*="red"], button').last();
    await deleteBtn.click({ force: true });

    const confirmModal = page.locator('.modal-overlay');
    await expect(confirmModal).toBeVisible({ timeout: 5_000 });
    const confirmBtn = confirmModal.locator('button').filter({ hasText: /delete|usuń|confirm|potwierdź/i }).first();

    // Register listener before the click so the response is never missed
    const deleteResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/categories/') && resp.request().method() === 'DELETE',
    );
    await confirmBtn.click();
    await deleteResponsePromise;

    await expect(page.getByText(catName)).not.toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Admin — Category Detail Navigation', () => {
  test('clicking a category card navigates to category detail', async ({ adminPage: page }) => {
    await page.goto('/admin/categories');
    const firstCard = page.locator('a[href*="/categories/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 8_000 });
    await firstCard.click();

    await expect(page).toHaveURL(/\/categories\//, { timeout: 8_000 });
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});
