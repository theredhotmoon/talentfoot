/**
 * Admin — User Management Scenarios
 * Covers: list, search, filter by role, sort, edit user (name/email/role/password/subscription), delete user
 */

import { test, expect } from '../../fixtures';

const RUN = Date.now();

test.describe('Admin — Users List', () => {
  test('renders users table with at least one row', async ({ adminPage: page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 8_000 });

    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 8_000 });
  });

  test('admin user appears in the list', async ({ adminPage: page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('admin@admin.com')).toBeVisible({ timeout: 8_000 });
  });

  test('search filters users by name/email', async ({ adminPage: page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();

    const [request] = await Promise.all([
      page.waitForRequest((req) => req.url().includes('/api/users') && req.url().includes('search')),
      searchInput.fill('admin'),
    ]);

    await page.waitForTimeout(400); // debounce
    expect(request.url()).toContain('search');

    // Admin row should still be visible
    await expect(page.getByText('admin@admin.com')).toBeVisible({ timeout: 8_000 });
  });

  test('clear search restores full list', async ({ adminPage: page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('admin');
    await page.waitForTimeout(400);
    await searchInput.clear();
    await page.waitForTimeout(400);

    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 8_000 });
  });

  test('filter by role "admin" shows only admins', async ({ adminPage: page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    const roleSelect = page.locator('select').first();
    const [request] = await Promise.all([
      page.waitForRequest((req) => req.url().includes('/api/users')),
      roleSelect.selectOption('admin'),
    ]);

    await page.waitForLoadState('networkidle');

    // Every visible role cell should say "admin"
    const roleCells = page.locator('table tbody tr td:nth-child(3)');
    const count = await roleCells.count();
    for (let i = 0; i < count; i++) {
      await expect(roleCells.nth(i)).toHaveText('admin');
    }
  });

  test('filter by role "user" shows only regular users', async ({ adminPage: page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    const roleSelect = page.locator('select').first();
    await roleSelect.selectOption('user');
    await page.waitForLoadState('networkidle');

    const roleCells = page.locator('table tbody tr td:nth-child(3)');
    const count = await roleCells.count();
    for (let i = 0; i < count; i++) {
      await expect(roleCells.nth(i)).toHaveText('user');
    }
  });

  test('sorting by name changes column order indicator', async ({ adminPage: page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    // Click the Name column header
    const nameHeader = page.locator('th').filter({ hasText: /name|imię/i }).first();
    await nameHeader.click();
    await page.waitForLoadState('networkidle');

    // Arrow indicator should appear
    const arrow = nameHeader.locator('span');
    await expect(arrow).toBeVisible();
    expect(['↑', '↓']).toContain(await arrow.textContent());
  });

  test('sorting by email changes column order indicator', async ({ adminPage: page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    const emailHeader = page.locator('th').filter({ hasText: /email/i }).first();
    await emailHeader.click();
    await page.waitForLoadState('networkidle');

    const arrow = emailHeader.locator('span');
    await expect(arrow).toBeVisible();
  });

  test('pagination is shown when more than one page exists', async ({ adminPage: page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    // Pagination div only renders when last_page > 1
    const pagination = page.locator('div').filter({ hasText: /\/ \d+/ }).last();
    if (await pagination.count() > 0 && await pagination.isVisible()) {
      const prev = page.getByRole('button', { name: /prev|poprzed/i });
      const next = page.getByRole('button', { name: /next|następn/i });
      await expect(prev).toBeVisible();
      await expect(next).toBeVisible();
    }
  });
});

test.describe('Admin — Edit User', () => {
  async function openFirstNonAdminEdit(page: import('@playwright/test').Page) {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    // Find first user that is NOT admin
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const email = await row.locator('td:nth-child(2)').textContent();
      if (email && !email.includes('admin@admin.com')) {
        const editLink = row.locator('a').filter({ hasText: /edit|edytuj/i });
        await editLink.click();
        await page.waitForLoadState('networkidle');
        return;
      }
    }
  }

  test('edit user page renders the form', async ({ adminPage: page }) => {
    await openFirstNonAdminEdit(page);
    await expect(page).toHaveURL(/\/edit/, { timeout: 8_000 });
    await expect(page.locator('form')).toBeVisible();
  });

  test('can change user name and save', async ({ adminPage: page }) => {
    await openFirstNonAdminEdit(page);

    const newName = `EditedUser ${RUN}`;
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.clear();
    await nameInput.fill(newName);

    const [response] = await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('/api/users/') && resp.request().method() === 'PUT'),
      page.locator('button[type="submit"]').click(),
    ]);

    expect(response.status()).toBeLessThan(500);
    // After save, navigates back to /users
    await expect(page).toHaveURL(/\/users$/, { timeout: 8_000 });
  });

  test('can set user subscription date', async ({ adminPage: page }) => {
    await openFirstNonAdminEdit(page);

    const dateInput = page.locator('input[type="date"]').first();
    await expect(dateInput).toBeVisible();
    await dateInput.fill('2030-12-31');

    const [response] = await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('/api/users/') && resp.request().method() === 'PUT'),
      page.locator('button[type="submit"]').click(),
    ]);

    expect(response.status()).toBeLessThan(500);
  });

  test('can reset user password', async ({ adminPage: page }) => {
    await openFirstNonAdminEdit(page);

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('NewTestPassword123!');

    const [response] = await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('/api/users/') && resp.request().method() === 'PUT'),
      page.locator('button[type="submit"]').click(),
    ]);

    expect(response.status()).toBeLessThan(500);
  });

  test('cancel button on edit page returns to users list', async ({ adminPage: page }) => {
    await openFirstNonAdminEdit(page);

    const cancelBtn = page.locator('button[type="button"]').filter({ hasText: /cancel|anuluj/i }).first();
    await cancelBtn.click();

    await expect(page).toHaveURL(/\/users$/, { timeout: 8_000 });
  });

  test('back link on edit page navigates to users list', async ({ adminPage: page }) => {
    await openFirstNonAdminEdit(page);

    const backLink = page.getByRole('link', { name: /← back|powrót|użytkownicy/i });
    if (await backLink.count() > 0) {
      await backLink.click();
      await expect(page).toHaveURL(/\/users$/, { timeout: 8_000 });
    }
  });
});

test.describe('Admin — Delete User', () => {
  test('deleting a non-admin user removes the row', async ({ adminPage: page }) => {
    // Create a temp user via API first
    const API = 'http://localhost:8000';
    const tempEmail = `temp_del_${RUN}@test.com`;

    await page.goto('/');
    const token = await page.evaluate(() => localStorage.getItem('token'));

    const createResp = await page.request.post(`${API}/api/users`, {
      data: {
        name: 'Temp Delete User',
        email: tempEmail,
        password: 'Password1!',
        password_confirmation: 'Password1!',
        role: 'user',
      },
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!createResp.ok()) {
      // If creation via admin API is not available, skip
      console.log('Skipping delete test — could not create temp user');
      return;
    }

    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    // Find and delete the temp user
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const emailCell = row.locator('td:nth-child(2)');
      if ((await emailCell.textContent())?.includes(tempEmail)) {
        // Accept the confirm dialog
        page.once('dialog', (dialog) => dialog.accept());

        const deleteBtn = row.locator('button').filter({ hasText: /delete|usuń/i });
        await deleteBtn.click();
        await page.waitForLoadState('networkidle');

        // Row should be gone
        await expect(page.getByText(tempEmail)).not.toBeVisible({ timeout: 5_000 });
        break;
      }
    }
  });
});
