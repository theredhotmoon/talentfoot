/**
 * Admin — Tag Management Scenarios
 * Covers: list tags, create tag (EN/PL/ES names), delete tag via API, admin sees Add button
 */

import { test, expect } from '../../fixtures';

const RUN = Date.now();
const API = 'http://localhost:8000';

test.describe('Admin — Tags List', () => {
  test('tags page renders the grid', async ({ adminPage: page }) => {
    await page.goto('/tags');
    const grid = page.locator('.grid').first();
    await expect(grid).toBeVisible({ timeout: 8_000 });
  });

  test('admin sees the Add Tag button', async ({ adminPage: page }) => {
    await page.goto('/tags');
    const addBtn = page.locator('button').filter({ hasText: /add|new|dodaj/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Admin — Create Tag', () => {
  test('creates a new tag with EN name', async ({ adminPage: page }) => {
    const tagName = `TestTag ${RUN}`;

    await page.goto('/tags');
    const addBtn = page.locator('button').filter({ hasText: /add|new|dodaj/i }).first();
    await addBtn.click();

    // Modal opens (class="modal-overlay" in the template)
    const modal = page.locator('.modal-overlay').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Fill EN name (first input in modal)
    const enInput = modal.locator('input').first();
    await enInput.fill(tagName);

    // Save button
    const [response] = await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('/api/tags') && resp.request().method() === 'POST'),
      modal.locator('button').filter({ hasText: /save|zapisz/i }).first().click(),
    ]);

    expect(response.status()).toBeLessThan(500);

    // New tag card should appear
    await expect(page.getByText(tagName)).toBeVisible({ timeout: 8_000 });
  });

  test('creates a tag with all language names (EN, PL, ES)', async ({ adminPage: page }) => {
    const tagEn = `MultiLang ${RUN}`;
    const tagPl = `WieloJęz ${RUN}`;
    const tagEs = `MultiIdi ${RUN}`;

    await page.goto('/tags');
    const addBtn = page.locator('button').filter({ hasText: /add|new|dodaj/i }).first();
    await addBtn.click();

    const modal = page.locator('.modal-overlay').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    const inputs = modal.locator('input');
    await inputs.nth(0).fill(tagEn); // EN
    await inputs.nth(1).fill(tagPl); // PL
    await inputs.nth(2).fill(tagEs); // ES

    const [response] = await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('/api/tags') && resp.request().method() === 'POST'),
      modal.locator('button').filter({ hasText: /save|zapisz/i }).first().click(),
    ]);

    const body = await response.json() as { name?: Record<string, string> };
    expect(body?.name?.en).toBe(tagEn);
    expect(body?.name?.pl).toBe(tagPl);
    expect(body?.name?.es).toBe(tagEs);
  });

  test('cancel closes modal without creating', async ({ adminPage: page }) => {
    await page.goto('/tags');
    const addBtn = page.locator('button').filter({ hasText: /add|new|dodaj/i }).first();
    await addBtn.click();

    const modal = page.locator('.modal-overlay').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    const cancelBtn = modal.locator('button').filter({ hasText: /cancel|anuluj/i }).first();
    await cancelBtn.click();

    await expect(modal).not.toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Admin — Delete Tag', () => {
  test('creates a tag then deletes it via API', async ({ adminPage: page }) => {
    await page.goto('/');
    const token = await page.evaluate(() => localStorage.getItem('token'));

    const tagName = `DelTag ${RUN}`;

    // Create via API
    const createResp = await page.request.post(`${API}/api/tags`, {
      data: { name: { en: tagName, pl: tagName, es: tagName } },
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    expect(createResp.ok()).toBeTruthy();
    const created = await createResp.json() as { id: string };

    // Delete via API
    const deleteResp = await page.request.delete(`${API}/api/tags/${created.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    expect(deleteResp.status()).toBeLessThan(500);

    // Verify tag no longer appears
    await page.goto('/tags');
    await expect(page.getByText(tagName)).not.toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Admin — Tag Detail from Admin', () => {
  test('clicking a tag navigates to tag detail', async ({ adminPage: page }) => {
    // Ensure at least one tag exists
    await page.goto('/');
    const token = await page.evaluate(() => localStorage.getItem('token'));
    await page.request.post(`${API}/api/tags`, {
      data: { name: { en: 'ClickTag', pl: 'ClickTag', es: 'ClickTag' } },
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    });

    await page.goto('/tags');
    const firstLink = page.locator('a[href*="/tags/"]').first();
    await expect(firstLink).toBeVisible({ timeout: 8_000 });
    await firstLink.click();

    await expect(page).toHaveURL(/\/tags\/\w+/, { timeout: 8_000 });
  });
});
